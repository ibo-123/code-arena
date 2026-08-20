const express = require("express");

const {
  createTournament,
  getTournaments,
  getTournament,
  startTournament,
  getBracket,
  getLeaderboard,
  advanceGroupStage,
  advanceQuarterFinal,
  advanceSemiFinal,
  completeTournament,
} = require("../controllers/tournamentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createTournament
);

router.post(
  "/:id/start",
  protect,
  authorize("ADMIN"),
  startTournament
);

router.post("/:id/advance/group-stage", protect, authorize("ADMIN"), advanceGroupStage);
router.post("/:id/advance/quarter-final", protect, authorize("ADMIN"), advanceQuarterFinal);
router.post("/:id/advance/semi-final", protect, authorize("ADMIN"), advanceSemiFinal);
router.post("/:id/complete", protect, authorize("ADMIN"), completeTournament);

router.get("/", getTournaments);

router.get("/:id", getTournament);
router.get("/:id/bracket", getBracket);
router.get("/:id/leaderboard", getLeaderboard);

module.exports = router;
