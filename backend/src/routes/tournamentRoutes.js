const express = require('express');

const router = express.Router();

const tournamentController = require('../controllers/tournamentController');
const participantController = require('../controllers/participantController');

const {
  authenticate,
  authorize,
} = require('../middleware/auth');

/*
|--------------------------------------------------------------------------
| PUBLIC TOURNAMENT ROUTES
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tournaments
 * Get all tournaments
 */
router.get(
  '/',
  tournamentController.getTournaments
);

/**
 * GET /api/tournaments/:tournamentId/participants
 * Get tournament participants
 *
 * IMPORTANT:
 * This must come BEFORE /:id.
 */
router.get(
  '/:tournamentId/participants',
  tournamentController.getParticipants
);

/**
 * GET /api/tournaments/:tournamentId/groups
 * Get tournament groups
 */
router.get(
  '/:tournamentId/groups',
  participantController.getGroups
);

/**
 * GET /api/tournaments/:tournamentId/bracket
 * Get tournament bracket
 */
router.get(
  '/:tournamentId/bracket',
  tournamentController.getBracket
);

/**
 * GET /api/tournaments/:tournamentId/leaderboard
 * Get tournament leaderboard
 */
router.get(
  '/:tournamentId/leaderboard',
  tournamentController.getLeaderboard
);

/**
 * GET /api/tournaments/:id
 * Get single tournament
 *
 * Keep this AFTER the more specific routes above.
 */
router.get(
  '/:id',
  tournamentController.getTournament
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED PARTICIPANT ROUTES
|--------------------------------------------------------------------------
*/

/**
 * POST /api/tournaments/:tournamentId/join
 * Join a tournament
 */
router.post(
  '/:tournamentId/join',
  authenticate,
  tournamentController.joinTournament
);

/**
 * PATCH /api/tournaments/:tournamentId
 * Update a tournament (Admin only)
 */
router.patch(
  '/:tournamentId',
  authenticate,
  authorize('ADMIN'),
  tournamentController.updateTournament
);

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

/**
 * POST /api/tournaments
 * Create a new tournament (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  tournamentController.createTournament
);

/**
 * POST /api/tournaments/:tournamentId/start
 * Start tournament and generate Groups A-D
 */
router.post(
  '/:tournamentId/start',
  authenticate,
  authorize('ADMIN'),
  tournamentController.startTournament
);

/**
 * POST /api/tournaments/:tournamentId/advance
 * Advance tournament to the next stage.
 *
 * Body:
 * {
 *   "stage": "group-stage"
 * }
 *
 * Supported:
 * group-stage
 * qf
 * sf
 * complete
 */
router.post(
  '/:tournamentId/advance',
  authenticate,
  authorize('ADMIN'),
  tournamentController.advanceTournament
);

module.exports = router;