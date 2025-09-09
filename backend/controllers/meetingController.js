const meetingService = require("../services/meetingService");

exports.createMeeting = async (req, res) => {
  try {
    const { creatorId, partnerId, roomName } = req.body;
    const meeting = await meetingService.createMeeting(creatorId, partnerId, roomName);
    res.status(201).json(meeting);
  } catch (error) {
    console.error("Error creating meeting:", error.message);
    res.status(500).json({ message: "Error creating meeting" });
  }
}

exports.generateMeetingToken = (req, res) => {
  try {
    const { userId, roomName } = req.body;
    const token = meetingService.generateMeetingToken(userId, roomName);
    res.json({ token });
  } catch (err) {
    console.error("Error generating token:", err.message);
    res.status(500).json({ error: "Failed to generate token" });
  }
}

exports.getActiveMeeting = async (req, res) => {
  try {
    const { userId } = req.params;
    const meeting = await meetingService.getActiveMeeting(userId);

    if (!meeting) {
      return res.status(404).json({ message: "No active meeting" });
    }

    res.status(200).json(meeting);
  } catch (err) {
    console.error("Error retrieving meeting:", err.message);
    res.status(500).json({ message: "Error retrieving meeting" });
  }
}

exports.endMeeting = async (req, res) => {
  try {
    const { roomName } = req.body;
    await meetingService.endMeeting(roomName);
    res.status(200).json({ message: "Meeting ended" });
  } catch (error) {
    console.error("Error ending meeting:", error.message);
    res.status(500).json({ message: "Error ending meeting" });
  }
}