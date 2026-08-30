const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Contest = require("../models/Contest");
const Result = require("../models/Result");
const Match = require("../models/Match");
const contestService = require("./contestService");

const groups = ["A", "B", "C", "D"];

const setParticipant = (id, status, currentRound) =>
  Participant.findByIdAndUpdate(id, { status, currentRound }, { new: true });

const finishedContests = async (tournamentId, round, count) => {
  const contests = await Contest.find({ tournamentId, stage: round });
  await Promise.all(contests.map(contestService.updateContestStatus));
  if (contests.length !== count || contests.some((contest) => contest.status !== "FINISHED")) {
    throw new Error(`All ${count} ${round} contests must be finished`);
  }
  return contests;
};

const resultForMatch = async (match) => {
  if (!match.contest) throw new Error(`Match ${match.matchNumber} has no contest`);
  const results = await Result.find({ contestId: match.contest, participantId: { $in: match.participants } }).sort({ rank: 1 });
  if (results.length !== 2) throw new Error(`Match ${match.matchNumber} requires results for both participants`);
  return results;
};

const createMatches = (tournamentId, round, pairs) =>
  Promise.all(
    pairs.map((participants, index) =>
      Match.create({ tournament: tournamentId, round, matchNumber: index + 1, participants })
    )
  );

const advanceGroupStage = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "GROUP_STAGE") throw new Error("Invalid tournament state for advancing from group stage");
  
  const contests = await finishedContests(tournamentId, "GROUP_STAGE", 4);
  const byGroup = new Map(contests.map((contest) => [contest.group, contest]));
  if (groups.some((group) => !byGroup.has(group))) throw new Error("All four group contests must exist");
  
  const qualifiers = {};
  for (const group of groups) {
    const members = await Participant.find({ tournamentId, group });
    const results = await Result.find({ contestId: byGroup.get(group)._id, participantId: { $in: members.map((member) => member._id) } }).sort({ rank: 1 });
    if (members.length !== 5 || results.length < 2) throw new Error(`Group ${group} needs five participants and at least two results`);
    
    qualifiers[group] = results.slice(0, 2).map((result) => result.participantId);
    await Promise.all(
      members.map((member) =>
        setParticipant(
          member._id,
          qualifiers[group].some((id) => id.equals(member._id)) ? "ADVANCED" : "ELIMINATED",
          qualifiers[group].some((id) => id.equals(member._id)) ? "QUARTER_FINAL" : "ELIMINATED"
        )
      )
    );
  }
  
  const matches = await createMatches(tournamentId, "QUARTER_FINAL", [
    [qualifiers.A[0], qualifiers.B[1]],
    [qualifiers.C[0], qualifiers.D[1]],
    [qualifiers.B[0], qualifiers.A[1]],
    [qualifiers.D[0], qualifiers.C[1]],
  ]);
  
  tournament.status = "QUARTER_FINAL";
  tournament.currentStage = "QUARTER_FINAL";
  await tournament.save();
  return { qualifiers: Object.values(qualifiers).flat(), matches };
};

const advanceKnockout = async (tournamentId, round, nextRound, contestCount) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== round) throw new Error(`Invalid tournament state for ${round}`);
  
  await finishedContests(tournamentId, round, contestCount);
  const matches = await Match.find({ tournament: tournamentId, round }).sort({ matchNumber: 1 });
  if (matches.length !== contestCount) throw new Error(`All ${contestCount} ${round} matchups must exist`);
  
  const winners = [];
  for (const match of matches) {
    const results = await resultForMatch(match);
    const winner = results[0].participantId;
    match.winner = winner;
    await match.save();
    winners.push(winner);
    
    await Promise.all(
      match.participants.map((participant) =>
        setParticipant(
          participant,
          participant.equals(winner) ? "ADVANCED" : "ELIMINATED",
          participant.equals(winner) ? nextRound : "ELIMINATED"
        )
      )
    );
  }
  
  const pairs = round === "QUARTER_FINAL"
    ? [[winners[0], winners[1]], [winners[2], winners[3]]]
    : [[winners[0], winners[1]]];
    
  const nextMatches = await createMatches(tournamentId, nextRound, pairs);
  tournament.status = nextRound;
  tournament.currentStage = nextRound;
  await tournament.save();
  return { winners, matches: nextMatches };
};

const completeTournament = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "FINAL") throw new Error("Invalid tournament state for completion");
  
  await finishedContests(tournamentId, "FINAL", 1);
  const match = await Match.findOne({ tournament: tournamentId, round: "FINAL" });
  if (!match) throw new Error("Final matchup does not exist");
  
  const results = await resultForMatch(match);
  const champion = results[0].participantId;
  match.winner = champion;
  await match.save();
  
  await Promise.all(
    match.participants.map((participant) =>
      setParticipant(
        participant,
        participant.equals(champion) ? "CHAMPION" : "ELIMINATED",
        participant.equals(champion) ? "CHAMPION" : "ELIMINATED"
      )
    )
  );
  
  tournament.status = "COMPLETED";
  await tournament.save();
  return champion;
};

module.exports = {
  advanceGroupStage,
  advanceQuarterFinal: (id) => advanceKnockout(id, "QUARTER_FINAL", "SEMI_FINAL", 4),
  advanceSemiFinal: (id) => advanceKnockout(id, "SEMI_FINAL", "FINAL", 2),
  completeTournament,
};
