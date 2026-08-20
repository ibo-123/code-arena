const express = require("express");

const {
  joinTournament,
  getParticipants,
  getGroups,
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

router.get("/:id/groups", getGroups);

module.exports = router;
