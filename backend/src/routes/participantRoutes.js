const express = require("express");

const {
  joinTournament,
  getParticipants,
} = require("../controllers/participantController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/:id/join",
  protect,
  joinTournament
);

router.get(
  "/:id/participants",
  getParticipants
);

module.exports = router;