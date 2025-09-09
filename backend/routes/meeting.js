const express = require("express");
const meetingController = require("../controllers/meetingController");

const router = express.Router();

router.post("/create", meetingController.createMeeting);
router.post("/token", meetingController.generateMeetingToken);
router.get("/active/:userId", meetingController.getActiveMeeting);
router.post("/end", meetingController.endMeeting);

module.exports = router;