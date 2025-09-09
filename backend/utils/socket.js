const { Server } = require("socket.io");
const { handleConnection } = require("../controllers/messageController");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => handleConnection(io, socket));
};

module.exports = initSocket;