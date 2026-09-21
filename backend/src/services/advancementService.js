// backend/src/services/advancementService.js
const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Contest = require("../models/Contest");
const Result = require("../models/Result");
const Match = require("../models/Match");
const contestService = require("./contestService");

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const generateGroupLabels = (count) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters.slice(0, count).split("");
};

const createMatches = (tournamentId, stage, pairs) =>
  Promise.all(
    pairs.map((participants, index) =>
      Match.create({
        tournament: tournamentId,
        stage,
        matchNumber: index + 1,
        participants,
      })
    )
  );

const setParticipantStatus = (id, status, currentStage) =>
  Participant.findByIdAndUpdate(
    id,
    { status, currentStage },
    { new: true }
  );

// ------------------------------------------------------------
// Verify that every expected contest exists for a stage and
// that they're all finished.
// ------------------------------------------------------------
const finishedContests = async (tournamentId, stage, expectedCount) => {
  const contests = await Contest.find({ tournamentId, stage });

  // Update each contest's status before checking
  await Promise.all(contests.map(contestService.updateContestStatus));

  if (contests.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} ${stage} contests, found ${contests.length}`
    );
  }

  const notFinished = contests.filter((c) => c.status !== "FINISHED");
  if (notFinished.length > 0) {
    throw new Error(
      `Contest(s) ${notFinished
        .map((c) => c.codeforcesContestId || c.name)
        .join(", ")} not finished`
    );
  }

  return contests;
};

// ============================================================
// Compute the winner from a contest's results
// ============================================================
// Returns:
//   { winner: ObjectId | null, tie: boolean, results: Result[] }
// - If no results for one/both participants → winner=null, tie=false
// - If both have results and are equal on solved + penalty → tie=true
// - Otherwise → winner is the better rank
// ============================================================
const computeWinnerFromContest = async (contestId, participantIds) => {
  if (!contestId) {
    return { winner: null, tie: false, results: [] };
  }

  const results = await Result.find({
    contestId,
    participantId: { $in: participantIds },
  }).sort({ solvedCount: -1, penalty: 1, rank: 1 });

  if (results.length < 2) {
    return { winner: null, tie: false, results };
  }

  const [first, second] = results;
  const firstSolved = first.solvedCount || 0;
  const secondSolved = second.solvedCount || 0;

  if (firstSolved !== secondSolved) {
    return { winner: first.participantId, tie: false, results };
  }

  const firstPenalty = first.penalty || 0;
  const secondPenalty = second.penalty || 0;

  if (firstPenalty !== secondPenalty) {
    return { winner: first.participantId, tie: false, results };
  }

  return { winner: null, tie: true, results };
};

// ============================================================
// resultForMatch
// ============================================================
// Priority:
//   1. If match.winner is already set → use it
//   2. Otherwise, compute from the linked contest's results
// ============================================================
const resultForMatch = async (match) => {
  if (match.winner) {
    return { winner: match.winner, tie: false, results: [] };
  }

  if (!match.contest) {
    throw new Error(`Match ${match.matchNumber} has no contest`);
  }

  const { winner, tie, results } = await computeWinnerFromContest(
    match.contest,
    match.participants
  );

  if (tie) {
    throw new Error(
      `Match ${match.matchNumber} is tied — rematch required before advancing`
    );
  }

  if (!winner) {
    throw new Error(
      `Match ${match.matchNumber} requires results for both participants`
    );
  }

  return { winner, tie: false, results };
};

// ============================================================
// ADVANCE GROUP STAGE
// ============================================================
// Supports multiple contests per group (tournament.groupContests).
// Results across all of a group's contests are summed per
// participant, then ranked to determine qualifiers.
// ============================================================
const advanceGroupStage = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "GROUP_STAGE") {
    throw new Error("Tournament is not in GROUP_STAGE");
  }

  const numGroups = Math.max(1, Number(tournament.numberOfGroups || 4));
  const qualifiersPerGroup = Math.max(
    1,
    Number(tournament.qualifiersPerGroup || 2)
  );
  const contestsPerGroup = Math.max(
    1,
    Number(tournament.groupContests || 1)
  );
  const groupLabels = generateGroupLabels(numGroups);

  // ---- Expect contestsPerGroup contests per group ----
  const expectedContestCount = numGroups * contestsPerGroup;
  const contests = await finishedContests(
    tournamentId,
    "GROUP_STAGE",
    expectedContestCount
  );

  // Group contests by their `group` field
  const contestsByGroup = {};
  for (const c of contests) {
    const key = String(c.group || "").trim().toUpperCase();
    if (!contestsByGroup[key]) contestsByGroup[key] = [];
    contestsByGroup[key].push(c);
  }

  for (const group of groupLabels) {
    const list = contestsByGroup[group] || [];
    if (list.length !== contestsPerGroup) {
      throw new Error(
        `Group ${group} has ${list.length} contests, expected ${contestsPerGroup}`
      );
    }
  }

  const qualifiers = {};
  const allQualifiers = [];

  for (const group of groupLabels) {
    const members = await Participant.find({ tournamentId, group });
    const groupContestIds = (contestsByGroup[group] || []).map((c) => c._id);

    if (members.length !== tournament.participantsPerGroup) {
      throw new Error(
        `Group ${group} has ${members.length} participants, expected ${tournament.participantsPerGroup}`
      );
    }

    // ---- Aggregate results across all of the group's contests ----
    const aggregated = await Result.aggregate([
      {
        $match: {
          contestId: { $in: groupContestIds },
          participantId: { $in: members.map((m) => m._id) },
        },
      },
      {
        $group: {
          _id: "$participantId",
          totalSolved: { $sum: "$solvedCount" },
          totalPoints: { $sum: "$points" },
          totalPenalty: { $sum: "$penalty" },
        },
      },
      // Sort: points DESC → solved DESC → penalty ASC
      { $sort: { totalPoints: -1, totalSolved: -1, totalPenalty: 1 } },
    ]);

    if (aggregated.length < qualifiersPerGroup) {
      throw new Error(
        `Not enough results for group ${group} to determine qualifiers`
      );
    }

    const groupQualifiers = aggregated
      .slice(0, qualifiersPerGroup)
      .map((r) => r._id);

    qualifiers[group] = groupQualifiers;
    allQualifiers.push(...groupQualifiers);

    await Promise.all(
      members.map((m) =>
        setParticipantStatus(
          m._id,
          groupQualifiers.some((id) => id.equals(m._id))
            ? "ADVANCED"
            : "ELIMINATED",
          groupQualifiers.some((id) => id.equals(m._id))
            ? "QUARTER_FINAL"
            : "ELIMINATED"
        )
      )
    );
  }

  // ---- Build quarter-final pairings ----
  // Standard: group winner vs runner-up from adjacent groups
  const groupKeys = groupLabels;
  const pairs = [];
  for (let i = 0; i < groupKeys.length; i += 2) {
    const g1 = groupKeys[i];
    const g2 = groupKeys[i + 1];
    if (!g2) break;
    pairs.push([qualifiers[g1][0], qualifiers[g2][1]]);
    pairs.push([qualifiers[g2][0], qualifiers[g1][1]]);
  }

  const matches = await createMatches(tournamentId, "QUARTER_FINAL", pairs);

  tournament.status = "QUARTER_FINAL";
  tournament.currentStage = "QUARTER_FINAL";
  await tournament.save();

  return { qualifiers: allQualifiers, matches };
};

// ============================================================
// ADVANCE KNOCKOUT (generic — QF → SF, SF → Final)
// ============================================================
const advanceKnockout = async (
  tournamentId,
  stage,
  nextStage,
  expectedMatches
) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== stage) {
    throw new Error(`Tournament is not in ${stage}`);
  }

  // NEW — verify the round's contest is finished before advancing.
  // One contest per knockout round in the V1 model.
  await finishedContests(tournamentId, stage, 1);

  const matches = await Match.find({
    tournament: tournamentId,
    stage,
  }).sort({ matchNumber: 1 });

  if (matches.length !== expectedMatches) {
    throw new Error(
      `Expected ${expectedMatches} matches, found ${matches.length}`
    );
  }

  const winners = [];
  for (const match of matches) {
    const { winner } = await resultForMatch(match);

    match.winner = winner;
    match.status = "COMPLETED";
    await match.save();
    winners.push(winner);

    await Promise.all(
      match.participants.map((p) =>
        setParticipantStatus(
          p,
          p.equals(winner) ? "ADVANCED" : "ELIMINATED",
          p.equals(winner) ? nextStage : "ELIMINATED"
        )
      )
    );
  }

  // Pair winners for next round
  const pairs = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push([winners[i], winners[i + 1]]);
  }

  const nextMatches = await createMatches(tournamentId, nextStage, pairs);

  tournament.status = nextStage;
  tournament.currentStage = nextStage;
  await tournament.save();

  return { winners, matches: nextMatches };
};

const advanceQuarterFinal = (id) =>
  advanceKnockout(id, "QUARTER_FINAL", "SEMI_FINAL", 4);

const advanceSemiFinal = (id) =>
  advanceKnockout(id, "SEMI_FINAL", "FINAL", 2);

// ============================================================
// COMPLETE TOURNAMENT
// ============================================================
const completeTournament = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  // NEW — idempotent: if already completed, return the champion quietly.
  if (tournament.status === "COMPLETED") {
    const finalMatch = await Match.findOne({
      tournament: tournamentId,
      stage: "FINAL",
    }).lean();
    return finalMatch?.winner ?? null;
  }

  if (tournament.status !== "FINAL") {
    throw new Error("Tournament is not in FINAL stage");
  }

  await finishedContests(tournamentId, "FINAL", 1);

  const match = await Match.findOne({
    tournament: tournamentId,
    stage: "FINAL",
  });
  if (!match) throw new Error("Final match not found");

  const { winner: champion } = await resultForMatch(match);

  match.winner = champion;
  match.status = "COMPLETED";
  await match.save();

  await Promise.all(
    match.participants.map((p) =>
      setParticipantStatus(
        p,
        p.equals(champion) ? "CHAMPION" : "ELIMINATED",
        p.equals(champion) ? "CHAMPION" : "ELIMINATED"
      )
    )
  );

  tournament.status = "COMPLETED";
  await tournament.save();

  return champion;
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  advanceGroupStage,
  advanceQuarterFinal,
  advanceSemiFinal,
  completeTournament,
  computeWinnerFromContest,
};