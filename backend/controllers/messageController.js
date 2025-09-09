const messageService = require("../services/messageService");

let users = {};

exports.handleConnection = (io, socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", async (userId) => {
    socket.join(userId);
    users[userId] = socket.id;
    console.log(`User ${userId} joined their room`);

    const unreadMessages = await messageService.getUnreadMessages(userId);

    for (const msg of unreadMessages) {
      io.to(userId).emit("receiveMessage", msg);
      await messageService.markMessageAsRead(msg._id);
    }
  });

  socket.on("sendMessage", async ({ sender, receiver, message }) => {
    if (!sender || !receiver || !message) return;

    const newMessage = await messageService.saveMessage({
      sender,
      receiver,
      message,
      isRead: users[receiver] ? true : false,
    });

    io.to(sender).emit("receiveMessage", newMessage);
    if (users[receiver]) io.to(receiver).emit("receiveMessage", newMessage);
  });

  socket.on("disconnect", () => {
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
};

exports.sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver || !text) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const message = await messageService.sendMessage(sender, receiver, text);
    res.status(201).json({ message: "Message sent", data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

exports.getUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await messageService.getUserMessages(userId);
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching user messages:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

exports.getChatHistory = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const result = await messageService.getChatHistory(user1, user2);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

exports.markAsRead = async (req, res) => {
  try {
    const { receiver, sender } = req.params;
    await messageService.markMessagesAsRead(receiver, sender);
    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await messageService.deleteMessage(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

exports.deleteConversation = async (req, res) =>{
  try {
    const { user1, user2 } = req.params;
    await messageService.deleteConversation(user1, user2);
    res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}