const jwt = require("jsonwebtoken");

const meetAuth = (userId, userName, roomName, userEmail) => {

  console.log("meetAuth called with:", userId, userName, roomName, userEmail);
  const payload = {
    context: {
      user: {
        name: userName,
        email: userEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`,
        moderator: true,
      },
    },
    aud: "jitsi",
    iss: "chat",
    sub: "meet.jit.si",
    room: roomName,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return jwt.sign(payload, process.env.JITSI_SECRET, { algorithm: "HS256" });
};

module.exports = meetAuth;