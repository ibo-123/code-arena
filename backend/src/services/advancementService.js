const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Contest = require("../models/Contest");
const Result = require("../models/Result");
const Match = require("../models/Match");
const contestService = require("./contestService");

// Helper: generate group labels A, B, C, ...
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
  Participant.findByIdAndUpdate(id, { status, currentStage }, { new: true });

const finishedContests = async (tournamentId, stage, expectedCount) => {
  const contests = await Contest.find({ tournamentId, stage });
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
        .map((c) => c.codeforcesContestId)
        .join(", ")} not finished`
    );
  }
  return contests;
};

// ============================================================
// NEW — Compute the winner from a contest's results
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

  // Compare solved, then penalty
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

  // Equal solved AND equal penalty → tie
  return { winner: null, tie: true, results };
};

// ============================================================
// UPDATED — resultForMatch
// ============================================================
// Priority:
//   1. If match.winner is already set → use it
//   2. Otherwise, compute from the linked contest's results
// ============================================================
const resultForMatch = async (match) => {
  // Winner already decided (auto or manual)
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

// --- Main advancement functions ---

const advanceGroupStage = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "GROUP_STAGE") {
    throw new Error("Tournament is not in GROUP_STAGE");
  }

  const numGroups = tournament.numberOfGroups || 4;
  const qualifiersPerGroup = tournament.qualifiersPerGroup || 2;
  const groupLabels = generateGroupLabels(numGroups);

  const contests = await finishedContests(
    tournamentId,
    "GROUP_STAGE",
    numGroups
  );
  const contestByGroup = {};
  contests.forEach((c) => {
    contestByGroup[c.group] = c;
  });

  for (const group of groupLabels) {
    if (!contestByGroup[group]) {
      throw new Error(`Missing contest for group ${group}`);
    }
  }

  const qualifiers = {};
  const allQualifiers = [];

  for (const group of groupLabels) {
    const members = await Participant.find({ tournamentId, group });
    const contest = contestByGroup[group];
    const results = await Result.find({
      contestId: contest._id,
      participantId: { $in: members.map((m) => m._id) },
    }).sort({ rank: 1 });

    if (members.length !== tournament.participantsPerGroup) {
      throw new Error(
        `Group ${group} has ${members.length} participants, expected ${tournament.participantsPerGroup}`
      );
    }
    if (results.length < qualifiersPerGroup) {
      throw new Error(
        `Not enough results for group ${group} to determine qualifiers`
      );
    }

    const groupQualifiers = results
      .slice(0, qualifiersPerGroup)
      .map((r) => r.participantId);
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

  const matches = await Match.find({ tournament: tournamentId, stage }).sort({
    matchNumber: 1,
  });
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

const completeTournament = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
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

module.exports = {
  advanceGroupStage,
  advanceQuarterFinal,
  advanceSemiFinal,
  completeTournament,
  // Export for reuse in controllers
  computeWinnerFromContest,
};