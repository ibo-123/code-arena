const express = require('express');
const router = express.Router();

// Middleware
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const tournamentController = require('../controllers/tournamentController');
const contestController = require('../controllers/contestController');
const participantController = require('../controllers/participantController');
const auditLogController = require('../controllers/auditLogController');
const matchController = require('../controllers/matchController')
const adminController = require('../controllers/adminController')

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// ============================================
// TOURNAMENT MANAGEMENT
// ============================================
router.post('/tournaments', tournamentController.createTournament);
router.patch('/tournaments/:tournamentId', tournamentController.updateTournament);
router.post('/tournaments/:tournamentId/start', tournamentController.startTournament);
router.post('/tournaments/:tournamentId/advance', tournamentController.advanceTournament);

// ============================================
// CONTEST MANAGEMENT
// ============================================
router.post('/tournaments/:tournamentId/contests/validate/:contestId', contestController.validateCodeforcesContest);
router.post('/tournaments/:tournamentId/contests', contestController.publishContest);
router.get('/tournaments/:tournamentId/contests', contestController.getContests);
router.post('/tournaments/:tournamentId/contests/:contestId/sync', contestController.syncResults);
router.get('/tournaments/:tournamentId/contests/:contestId/leaderboard', contestController.getLeaderboard);

// ============================================
// PARTICIPANT MANAGEMENT (Added manual assignment)
// ============================================
router.get('/tournaments/:tournamentId/participants', participantController.getParticipants);
router.get('/tournaments/:tournamentId/groups', participantController.getGroups);

// New: Update participant group/seed
router.patch('/tournaments/:tournamentId/participants/:participantId', participantController.updateParticipant);

// New: Assign match winner and advance bracket
router.patch('/matches/:matchId', matchController.updateMatchResult);

// ============================================
// STATS & AUDIT
// ============================================
router.get('/stats', adminController.getAdminStats);
router.get('/audit-logs', auditLogController.getAuditLogs);
router.get('/health', (req, res) => res.json({ success: true, message: 'Admin API is healthy' }));

// ============================================
// ADMIN SETTINGS
// ============================================
router.get('/settings', adminController.getAdminSettings);
router.patch('/settings', adminController.updateAdminSettings);

module.exports = router;