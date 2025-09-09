const Meeting = require("../models/Meeting");
const crypto = require("crypto");

const APP_ID = process.env.APP_ID;
const SERVER_SECRET = process.env.SERVER_SECRET;

function generateToken(appId, userId, serverSecret, effectiveTimeInSeconds, payload) {
  const version = 0x04;
  const expiredTime = Math.floor(Date.now() / 1000) + effectiveTimeInSeconds;

  const nonce = crypto.randomBytes(16).toString("hex");
  const data = {
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: Math.floor(Date.now() / 1000),
    expire: expiredTime,
    payload,
  };

  const base64Data = Buffer.from(JSON.stringify(data)).toString("base64");
  const hmac = crypto.createHmac("sha256", serverSecret);
  hmac.update(base64Data);
  const signature = hmac.digest("hex");

  const token = Buffer.from(`${version}${signature}${base64Data}`).toString("base64");
  return token;
}

exports.createMeeting = async (creatorId, partnerId, roomName) => {
  let existing = await Meeting.findOne({ roomName });

  if (existing) {
    if (existing.status === "active") {
      return existing; // return running meeting
    }
  }

  const newMeeting = new Meeting({
    creatorId,
    partnerId,
    roomName,
    status: "active",
  });

  await newMeeting.save();
  return newMeeting;
}

exports.generateMeetingToken = (userId, roomName) => {
  if (!userId || !roomName) {
    throw new Error("userId and roomName are required");
  }

  const effectiveTimeInSeconds = 3600;
  const payload = "";
  return generateToken(APP_ID, userId, SERVER_SECRET, effectiveTimeInSeconds, payload);
}

exports.getActiveMeeting = async (userId) => {
  return await Meeting.findOne({
    $or: [{ creatorId: userId }, { partnerId: userId }],
    status: "active",
  });
}

exports.endMeeting = async (roomName) => {
  return await Meeting.findOneAndUpdate({ roomName }, { status: "ended" });
}