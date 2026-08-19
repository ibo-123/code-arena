const express = require("express");

const {
  createTournament,
  getTournaments,
  getTournament,
  startTournament,
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

router.get("/", getTournaments);

router.get("/:id", getTournament);

module.exports = router;