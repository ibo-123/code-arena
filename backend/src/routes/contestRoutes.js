const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contestController');

// Public routes (no authentication)
router.get('/tournaments/:tournamentId/contests', contestController.getContests);
router.get('/tournaments/:tournamentId/contests/:contestId', contestController.getContest);
router.get('/tournaments/:tournamentId/contests/:contestId/leaderboard', contestController.getLeaderboard);
router.get('/tournaments/:tournamentId/contests/:contestId/results', contestController.getResults);

module.exports = router;