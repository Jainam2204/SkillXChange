const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createMeeting, getMeeting } = require("../controllers/meetingController");
const checkBanned = require("../middleware/checkBanned");
const router = express.Router();

router.post("/", authMiddleware,checkBanned, createMeeting);

router.get("/:id", authMiddleware,checkBanned, getMeeting);

module.exports = router;



