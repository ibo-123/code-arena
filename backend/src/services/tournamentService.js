const Participant = require("../models/Participant");
const Match = require("../models/Match");
const Tournament = require("../models/Tournament");

const getBracket = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  const [participants, matches] = await Promise.all([
    Participant.find({ tournament: tournamentId }).populate("user", "name username codeforcesUsername").sort({ seed: 1 }),
    Match.find({ tournament: tournamentId }).populate({ path: "participants", populate: { path: "user", select: "name username codeforcesUsername" } }).populate("contest", "name status codeforcesUrl").populate({ path: "winner", populate: { path: "user", select: "name username" } }).sort({ round: 1, matchNumber: 1 }),
  ]);
  const bracket = { groupStage: { A: [], B: [], C: [], D: [] }, quarterFinal: [], semiFinal: [], final: null, champion: participants.find((participant) => participant.status === "CHAMPION") || null };
  participants.forEach((participant) => { if (participant.group) bracket.groupStage[participant.group].push(participant); });
  matches.forEach((match) => {
    const item = { matchNumber: match.matchNumber, participants: match.participants, contest: match.contest, winner: match.winner };
    if (match.round === "QUARTER_FINAL") bracket.quarterFinal.push(item);
    if (match.round === "SEMI_FINAL") bracket.semiFinal.push(item);
    if (match.round === "FINAL") bracket.final = item;
  });
  return bracket;
};

module.exports = { getBracket };
