const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Contest = require("../models/Contest");
const Result = require("../models/Result");
const Match = require("../models/Match");
const contestService = require("./contestService");

// Helper: generate group labels A, B, C, ...
const generateGroupLabels = (count) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters.slice(0, count).split('');
};

// Helper: create matches for a round from pairs
const createMatches = (tournamentId, round, pairs) =>
  Promise.all(
    pairs.map((participants, index) =>
      Match.create({
        tournament: tournamentId,
        round,
        matchNumber: index + 1,
        participants,
      })
    )
  );

// Helper: set participant status in bulk
const setParticipantStatus = (id, status, currentStage) =>
  Participant.findByIdAndUpdate(id, { status, currentStage }, { new: true });

// Helper: verify that a certain number of contests are FINISHED for a stage
const finishedContests = async (tournamentId, stage, expectedCount) => {
  const contests = await Contest.find({ tournamentId, stage });
  await Promise.all(contests.map(contestService.updateContestStatus));
  if (contests.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} ${stage} contests, found ${contests.length}`);
  } 
  const notFinished = contests.filter(c => c.status !== 'FINISHED');
  if (notFinished.length > 0) {
    throw new Error(`Contest(s) ${notFinished.map(c => c.codeforcesContestId).join(', ')} not finished`);
  }
  return contests;
};

// Helper: get result for a match (top rank among its participants)
const resultForMatch = async (match) => {
  if (!match.contest) throw new Error(`Match ${match.matchNumber} has no contest`);
  const results = await Result.find({
    contestId: match.contest,
    participantId: { $in: match.participants }
  }).sort({ rank: 1 });
  if (results.length !== 2) {
    throw new Error(`Match ${match.matchNumber} requires results for both participants`);
  }
  return results;
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

  // Expect one contest per group (or more – you can decide; for now we assume 1 per group)
  const contests = await finishedContests(tournamentId, "GROUP_STAGE", numGroups);
  // Map group -> contest
  const contestByGroup = {};
  contests.forEach(c => { contestByGroup[c.group] = c; });

  // Verify every group has a contest
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
      participantId: { $in: members.map(m => m._id) }
    }).sort({ rank: 1 });

    if (members.length !== tournament.participantsPerGroup) {
      throw new Error(`Group ${group} has ${members.length} participants, expected ${tournament.participantsPerGroup}`);
    }
    if (results.length < qualifiersPerGroup) {
      throw new Error(`Not enough results for group ${group} to determine qualifiers`);
    }

    const groupQualifiers = results.slice(0, qualifiersPerGroup).map(r => r.participantId);
    qualifiers[group] = groupQualifiers;
    allQualifiers.push(...groupQualifiers);

    // Update participant statuses
    await Promise.all(
      members.map(m =>
        setParticipantStatus(
          m._id,
          groupQualifiers.some(id => id.equals(m._id)) ? "ADVANCED" : "ELIMINATED",
          groupQualifiers.some(id => id.equals(m._id)) ? "QUARTER_FINAL" : "ELIMINATED"
        )
      )
    );
  }

  // Build quarter-final pairings (standard: A1 vs B2, C1 vs D2, B1 vs A2, D1 vs C2, etc.)
  // For simplicity, we assume standard seeding: group winners vs runners-up from adjacent groups.
  // You can customize this based on your needs.
  const groupKeys = groupLabels;
  const pairs = [];
  for (let i = 0; i < groupKeys.length; i += 2) {
    const g1 = groupKeys[i];
    const g2 = groupKeys[i+1];
    if (!g2) break;
    // Winner of g1 vs runner-up of g2, and winner of g2 vs runner-up of g1
    pairs.push([qualifiers[g1][0], qualifiers[g2][1]]);
    pairs.push([qualifiers[g2][0], qualifiers[g1][1]]);
  }

  const matches = await createMatches(tournamentId, "QUARTER_FINAL", pairs);

  tournament.status = "QUARTER_FINAL";
  tournament.currentStage = "QUARTER_FINAL";
  await tournament.save();

  return { qualifiers: allQualifiers, matches };
};

// Generic knockout advancement
const advanceKnockout = async (tournamentId, round, nextRound, expectedMatches) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== round) {
    throw new Error(`Tournament is not in ${round}`);
  }

  // Each match has its own contest – we need to check all are finished
  const matches = await Match.find({ tournament: tournamentId, round }).sort({ matchNumber: 1 });
  if (matches.length !== expectedMatches) {
    throw new Error(`Expected ${expectedMatches} matches, found ${matches.length}`);
  }

  // For each match, check its contest finished and determine winner
  const winners = [];
  for (const match of matches) {
    const results = await resultForMatch(match);
    const winner = results[0].participantId;
    match.winner = winner;
    await match.save();
    winners.push(winner);

    // Update participant statuses
    await Promise.all(
      match.participants.map(p =>
        setParticipantStatus(
          p,
          p.equals(winner) ? "ADVANCED" : "ELIMINATED",
          p.equals(winner) ? nextRound : "ELIMINATED"
        )
      )
    );
  }

  // Build next round pairs (standard: winner1 vs winner2, etc.)
  const pairs = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push([winners[i], winners[i+1]]);
  }

  const nextMatches = await createMatches(tournamentId, nextRound, pairs);

  tournament.status = nextRound;
  tournament.currentStage = nextRound;
  await tournament.save();

  return { winners, matches: nextMatches };
};

const advanceQuarterFinal = (id) => advanceKnockout(id, "QUARTER_FINAL", "SEMI_FINAL", 4);
const advanceSemiFinal = (id) => advanceKnockout(id, "SEMI_FINAL", "FINAL", 2);

const completeTournament = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "FINAL") {
    throw new Error("Tournament is not in FINAL stage");
  }

  // Ensure final contest finished
  await finishedContests(tournamentId, "FINAL", 1);
  const match = await Match.findOne({ tournament: tournamentId, round: "FINAL" });
  if (!match) throw new Error("Final match not found");

  const results = await resultForMatch(match);
  const champion = results[0].participantId;
  match.winner = champion;
  await match.save();

  await Promise.all(
    match.participants.map(p =>
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
};