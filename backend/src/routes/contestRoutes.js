const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contestController');
const { authenticate } = require('../middleware/auth');

// ============================================
// PARTICIPANT-FACING (auth required)
// ============================================
// GET /api/contests/tournaments/:tournamentId/my-contests
// Returns PUBLISHED contests visible to the authenticated participant.
// - QUALIFICATION contests → all approved participants
// - GROUP_STAGE contests → only participants in that group
router.get(
        '/tournaments/:tournamentId/my-contests',
        authenticate,
        contestController.getParticipantContests
);

// ============================================
// PUBLIC / LEGACY ROUTES (kept as-is)
// ============================================
router.get('/tournaments/:tournamentId/contests', contestController.getContests);
router.get('/tournaments/:tournamentId/contests/:contestId', contestController.getContest);
router.get('/tournaments/:tournamentId/contests/:contestId/leaderboard', contestController.getLeaderboard);
router.get('/tournaments/:tournamentId/contests/:contestId/results', contestController.getResults);

module.exports = router;