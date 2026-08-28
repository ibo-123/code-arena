const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contestController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get(
  '/tournaments/:tournamentId/contests',
  contestController.getContests
);

router.get(
  '/tournaments/:tournamentId/contests/:contestId/leaderboard',
  contestController.getLeaderboard
);

// Admin routes
router.post(
  '/admin/contests/validate/:contestId',
  authenticate,
  authorize('ADMIN'),
  contestController.validateCodeforcesContest
);

router.post(
  '/admin/tournaments/:tournamentId/contests',
  authenticate,
  authorize('ADMIN'),
  contestController.publishContest
);

router.post(
  '/admin/tournaments/:tournamentId/contests/:contestId/sync',
  authenticate,
  authorize('ADMIN'),
  contestController.syncResults
);

module.exports = router;
