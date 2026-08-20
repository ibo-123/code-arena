const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getAuditLogs } = require("../controllers/adminController");
const router = express.Router();

router.get("/logs", protect, authorize("ADMIN"), getAuditLogs);
module.exports = router;
