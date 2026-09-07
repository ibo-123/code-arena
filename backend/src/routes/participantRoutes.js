const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const standingsController = require('../controllers/standingsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes (but require authentication)
router.post(
  '/:tournamentId/join',
  authenticate,
  participantController.joinTournament
);

router.get(
  '/:tournamentId/my-status',
  authenticate,
  participantController.getMyStatus
);

// Participant status with standings
router.get(
  '/:tournamentId/status',
  authenticate,
  standingsController.getMyParticipantStatus
);

// Admin routes for participant management
router.get(
  '/admin/:tournamentId/participants',
  authenticate,
  authorize('ADMIN'),
  participantController.getParticipants
);

router.patch(
  '/admin/:tournamentId/participants/:participantId/approve',
  authenticate,
  authorize('ADMIN'),
  participantController.approveParticipant
);

router.patch(
  '/admin/:tournamentId/participants/:participantId/reject',
  authenticate,
  authorize('ADMIN'),
  participantController.rejectParticipant
);

router.patch(
  '/admin/:tournamentId/participants/:participantId',
  authenticate,
  authorize('ADMIN'),
  participantController.updateParticipant
);

// Group standings
router.get(
  '/:tournamentId/groups/:groupId/standings',
  authenticate,
  standingsController.getGroupStandings
);

module.exports = router;