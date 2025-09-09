const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roomName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "ended"],
    default: "active",
  },
});

module.exports = mongoose.model("Meeting", meetingSchema);
