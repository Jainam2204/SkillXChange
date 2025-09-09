const Message = require("../models/Message");
const User = require("../models/User");

exports.sendMessage = async (sender, receiver, text) => {
  const message = new Message({ sender, receiver, text, isRead: false });
  return await message.save();
}

exports.getUserMessages = async (userId) => {
  return await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  }).sort({ createdAt: 1 });
}

exports.getChatHistory = async (user1, user2) => {
  const messages = await Message.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  }).sort({ createdAt: 1 });

  const selectedUser = await User.findById(user2, "name");

  return { messages, selectedUserName: selectedUser?.name || "Unknown" };
}

exports.markMessagesAsRead = async (receiver, sender) => {
  return await Message.updateMany(
    { receiver, sender, isRead: false },
    { $set: { isRead: true } }
  );
}

exports.deleteMessage = async (messageId) => {
  return await Message.findByIdAndDelete(messageId);
}

exports.deleteConversation = async (user1, user2) => {
  return await Message.deleteMany({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  });
}

exports.saveMessage = async ({ sender, receiver, message, isRead }) => {
  const newMessage = new Message({
    sender,
    receiver,
    message,
    isRead,
    timestamp: new Date(),
  });
  return await newMessage.save();
};

exports.getUnreadMessages = async (userId) => {
  return await Message.find({ receiver: userId, isRead: false });
};

exports.markMessageAsRead = async (messageId) => {
  return await Message.findByIdAndUpdate(messageId, { isRead: true });
};