const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getLeaderboard,
  syncContestResults,
  getContestResults,
  createContest,
  getContests,
} = require("../controllers/contestController");

// Public routes
router.get("/", getContests);
router.get("/:contestId/leaderboard", getLeaderboard);
router.get("/:contestId/results", getContestResults);

// Admin routes
router.post("/", protect, authorize("ADMIN"), createContest);
router.post("/:contestId/sync", protect, authorize("ADMIN"), syncContestResults);

module.exports = router;
