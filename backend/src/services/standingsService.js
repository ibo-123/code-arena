// backend/src/services/standingsService.js
const Result = require("../models/Result");
const Participant = require("../models/Participant");
const VideoSubmission = require("../models/VideoSubmission");
const Contest = require("../models/Contest");

// ------------------------------------------------------------
// Config — flip to true to require approved videos
// ------------------------------------------------------------
const REQUIRE_APPROVED_VIDEO = false;

/**
 * Calculate standings for a tournament group.
 *
 * Sums every Result for the group's participants across all
 * published contests in this tournament. Ranking:
 *   1. score DESC
 *   2. solved DESC
 *   3. penalty ASC
 */
const calculateGroupStandings = async (tournamentId, group) => {
  // Find all approved participants in the group
  const participants = await Participant.find({
    tournamentId,
    group,
    registrationStatus: "APPROVED",
    status: { $ne: "ELIMINATED" },
  }).populate("user", "name username codeforcesUsername");

  if (participants.length === 0) return [];

  // Get all published contests for this tournament
  const contests = await Contest.find({
    tournamentId,
    published: true,
  }).select("_id");

  if (contests.length === 0) return [];

  const contestIds = contests.map((c) => c._id);

  // Bulk-load all results for these participants + contests (1 query)
  const participantIds = participants.map((p) => p._id);

  const results = await Result.find({
    contestId: { $in: contestIds },
    participantId: { $in: participantIds },
  }).lean();

  // Optional: load approved videos in one query
  let approvedVideoSet = null;
  if (REQUIRE_APPROVED_VIDEO) {
    const approved = await VideoSubmission.find({
      contestId: { $in: contestIds },
      participantId: { $in: participantIds },
      status: "APPROVED",
    })
      .select("contestId participantId")
      .lean();

    approvedVideoSet = new Set(
      approved.map((v) => `${v.participantId}:${v.contestId}`)
    );
  }

  // Aggregate per participant
  const standings = participants.map((participant) => {
    let score = 0;
    let solved = 0;
    let penalty = 0;
    let contestCount = 0;

    for (const result of results) {
      if (String(result.participantId) !== String(participant._id)) continue;

      // Optional gate
      if (
        REQUIRE_APPROVED_VIDEO &&
        !approvedVideoSet.has(
          `${result.participantId}:${result.contestId}`
        )
      ) {
        continue;
      }

      score += result.points || 0;
      solved += result.solvedCount || 0;
      penalty += result.penalty || 0;
      contestCount++;
    }

    return {
      participantId: participant._id,
      username: participant.user?.username || "Unknown",
      name: participant.user?.name || "Unknown",
      codeforcesUsername: participant.user?.codeforcesUsername || "",
      group: participant.group,
      seed: participant.seed,
      score,
      solved,
      penalty,
      contestCount,
      status: participant.status,
      currentStage: participant.currentStage,
    };
  });

  // Sort: score DESC → solved DESC → penalty ASC → seed ASC
  standings.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.solved !== b.solved) return b.solved - a.solved;
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    return (a.seed || 9999) - (b.seed || 9999);
  });

  standings.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return standings;
};

/**
 * Calculate global tournament leaderboard.
 *
 * Sums every Result for every approved participant across all
 * published contests in the tournament.
 */
const calculateTournamentLeaderboard = async (tournamentId) => {
  const participants = await Participant.find({
    tournamentId,
    registrationStatus: "APPROVED",
  }).populate("user", "name username codeforcesUsername");

  if (participants.length === 0) return [];

  const contests = await Contest.find({
    tournamentId,
    published: true,
  }).select("_id");

  if (contests.length === 0) {
    return participants.map((p, i) => ({
      participantId: p._id,
      username: p.user?.username || "Unknown",
      name: p.user?.name || "Unknown",
      codeforcesUsername: p.user?.codeforcesUsername || "",
      group: p.group,
      seed: p.seed,
      score: 0,
      solved: 0,
      penalty: 0,
      validContests: 0,
      contestCount: 0,
      rank: i + 1,
      status: p.status,
      currentStage: p.currentStage,
      isEliminated: p.status === "ELIMINATED",
      hasAdvanced: p.status === "ADVANCED" || p.status === "CHAMPION",
    }));
  }

  const contestIds = contests.map((c) => c._id);
  const participantIds = participants.map((p) => p._id);

  const results = await Result.find({
    contestId: { $in: contestIds },
    participantId: { $in: participantIds },
  }).lean();

  let approvedVideoSet = null;
  if (REQUIRE_APPROVED_VIDEO) {
    const approved = await VideoSubmission.find({
      contestId: { $in: contestIds },
      participantId: { $in: participantIds },
      status: "APPROVED",
    })
      .select("contestId participantId")
      .lean();

    approvedVideoSet = new Set(
      approved.map((v) => `${v.participantId}:${v.contestId}`)
    );
  }

  const leaderboard = participants.map((participant) => {
    let score = 0;
    let solved = 0;
    let penalty = 0;
    let validContests = 0;

    for (const result of results) {
      if (String(result.participantId) !== String(participant._id)) continue;

      if (
        REQUIRE_APPROVED_VIDEO &&
        !approvedVideoSet.has(
          `${result.participantId}:${result.contestId}`
        )
      ) {
        continue;
      }

      score += result.points || 0;
      solved += result.solvedCount || 0;
      penalty += result.penalty || 0;
      validContests++;
    }

    return {
      participantId: participant._id,
      username: participant.user?.username || "Unknown",
      name: participant.user?.name || "Unknown",
      codeforcesUsername: participant.user?.codeforcesUsername || "",
      group: participant.group,
      seed: participant.seed,
      score,
      solved,
      penalty,
      validContests,
      contestCount: validContests,
      status: participant.status,
      currentStage: participant.currentStage,
      isEliminated: participant.status === "ELIMINATED",
      hasAdvanced:
        participant.status === "ADVANCED" ||
        participant.status === "CHAMPION",
    };
  });

  leaderboard.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.solved !== b.solved) return b.solved - a.solved;
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    return (a.seed || 9999) - (b.seed || 9999);
  });

  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
};

/**
 * Get a participant's detailed status.
 */
const getParticipantStatus = async (tournamentId, participantId) => {
  const participant = await Participant.findOne({
    _id: participantId,
    tournamentId,
  }).populate("user", "name username codeforcesUsername");

  if (!participant) return null;

  const standings = await calculateTournamentLeaderboard(tournamentId);
  const participantStanding = standings.find(
    (s) => String(s.participantId) === String(participantId)
  );

  let groupStanding = null;
  if (participant.group) {
    const groupStandings = await calculateGroupStandings(
      tournamentId,
      participant.group
    );
    groupStanding = groupStandings.find(
      (s) => String(s.participantId) === String(participantId)
    );
  }

  return {
    participant,
    standing: participantStanding || null,
    groupStanding: groupStanding || null,
    isEliminated: participant.status === "ELIMINATED",
    hasAdvanced:
      participant.status === "ADVANCED" ||
      participant.status === "CHAMPION",
    isChampion: participant.status === "CHAMPION",
  };
};

module.exports = {
  calculateGroupStandings,
  calculateTournamentLeaderboard,
  getParticipantStatus,
};