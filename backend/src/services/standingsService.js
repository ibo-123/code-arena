const Result = require("../models/Result");
const Participant = require("../models/Participant");
const VideoSubmission = require("../models/VideoSubmission");
const Contest = require("../models/Contest");

/**
 * Calculate standings for a tournament group
 * Only includes results from contests where all participants have APPROVED video submissions
 */
const calculateGroupStandings = async (tournamentId, group) => {
  // Find all approved participants in the group
  const participants = await Participant.find({
    tournamentId,
    group,
    registrationStatus: "APPROVED",
    status: { $ne: "ELIMINATED" },
  }).populate("user", "name username codeforcesUsername");

  if (participants.length === 0) {
    return [];
  }

  // Get all contests for this tournament
  const contests = await Contest.find({
    tournamentId,
    published: true,
  });

  // For each participant, calculate their total score
  const standings = [];

  for (const participant of participants) {
    let totalPoints = 0;
    let totalPenalty = 0;
    let totalSolved = 0;

    for (const contest of contests) {
      // Check if participant has APPROVED video submission for this contest
      const videoSubmission = await VideoSubmission.findOne({
        contestId: contest._id,
        participantId: participant._id,
        status: "APPROVED",
      });

      if (!videoSubmission) {
        // Skip this contest - results don't count without approved video
        continue;
      }

      // Get the result for this participant in this contest
      const result = await Result.findOne({
        contestId: contest._id,
        participantId: participant._id,
      });

      if (result) {
        totalPoints += result.points || 0;
        totalPenalty += result.penalty || 0;
        totalSolved += result.solvedCount || 0;
      }
    }

    standings.push({
      participantId: participant._id,
      username: participant.user?.username || "Unknown",
      name: participant.user?.name || "Unknown",
      codeforcesUsername: participant.user?.codeforcesUsername || "",
      group: participant.group,
      seed: participant.seed,
      score: totalPoints,
      solved: totalSolved,
      penalty: totalPenalty,
      status: participant.status,
      currentStage: participant.currentStage,
    });
  }

  // Sort standings: by score (desc), then solved (desc), then penalty (asc)
  standings.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.solved !== b.solved) return b.solved - a.solved;
    return a.penalty - b.penalty;
  });

  // Assign ranks
  standings.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return standings;
};

/**
 * Calculate global tournament leaderboard
 */
const calculateTournamentLeaderboard = async (tournamentId) => {
  const participants = await Participant.find({
    tournamentId,
    registrationStatus: "APPROVED",
  }).populate("user", "name username codeforcesUsername");

  if (participants.length === 0) {
    return [];
  }

  const contests = await Contest.find({
    tournamentId,
    published: true,
  });

  const leaderboard = [];

  for (const participant of participants) {
    let totalPoints = 0;
    let totalPenalty = 0;
    let totalSolved = 0;
    let validContests = 0;

    for (const contest of contests) {
      const videoSubmission = await VideoSubmission.findOne({
        contestId: contest._id,
        participantId: participant._id,
        status: "APPROVED",
      });

      if (!videoSubmission) continue;

      const result = await Result.findOne({
        contestId: contest._id,
        participantId: participant._id,
      });

      if (result) {
        totalPoints += result.points || 0;
        totalPenalty += result.penalty || 0;
        totalSolved += result.solvedCount || 0;
        validContests++;
      }
    }

    leaderboard.push({
      participantId: participant._id,
      username: participant.user?.username || "Unknown",
      name: participant.user?.name || "Unknown",
      codeforcesUsername: participant.user?.codeforcesUsername || "",
      group: participant.group,
      seed: participant.seed,
      score: totalPoints,
      solved: totalSolved,
      penalty: totalPenalty,
      validContests,
      status: participant.status,
      currentStage: participant.currentStage,
      isEliminated: participant.status === "ELIMINATED",
      hasAdvanced: participant.status === "ADVANCED" || participant.status === "CHAMPION",
    });
  }

  // Sort: by score (desc), then solved (desc), then penalty (asc)
  leaderboard.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.solved !== b.solved) return b.solved - a.solved;
    return a.penalty - b.penalty;
  });

  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
};

/**
 * Get a participant's detailed status
 */
const getParticipantStatus = async (tournamentId, participantId) => {
  const participant = await Participant.findOne({
    _id: participantId,
    tournamentId,
  }).populate("user", "name username codeforcesUsername");

  if (!participant) {
    return null;
  }

  const standings = await calculateTournamentLeaderboard(tournamentId);
  const participantStanding = standings.find(
    s => s.participantId.toString() === participantId.toString()
  );

  // Get group standings
  let groupStanding = null;
  if (participant.group) {
    const groupStandings = await calculateGroupStandings(tournamentId, participant.group);
    groupStanding = groupStandings.find(
      s => s.participantId.toString() === participantId.toString()
    );
  }

  return {
    participant,
    standing: participantStanding || null,
    groupStanding: groupStanding || null,
    isEliminated: participant.status === "ELIMINATED",
    hasAdvanced: participant.status === "ADVANCED" || participant.status === "CHAMPION",
    isChampion: participant.status === "CHAMPION",
  };
};

module.exports = {
  calculateGroupStandings,
  calculateTournamentLeaderboard,
  getParticipantStatus,
};