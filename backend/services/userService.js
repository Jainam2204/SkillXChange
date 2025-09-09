const User = require("../models/User");
const ConnectionRequest = require("../models/ConnectionRequest");
const Subscription = require("../models/Subscription");
const Notification = require("../models/Notification");
const Report = require("../models/Report");
const sendEmail = require("../utils/sendEmail");

exports.findSuggestions = async (userId) => {
  const loggedInUser = await User.findById(userId);
  if (!loggedInUser) throw new Error("User not found");

  const allUsers = await User.find({ _id: { $ne: userId } });
  return allUsers.filter(
    (user) =>
      user.skillsHave.some((s) => loggedInUser.skillsWant.includes(s)) &&
      user.skillsWant.some((s) => loggedInUser.skillsHave.includes(s))
  );
};

exports.getProfile = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new Error("User not found");
  return user;
};

exports.sendConnectionRequest = async ({ senderId, receiverId }) => {
  const sender = await User.findById(senderId);
  const activePlan = await Subscription.findOne({ userId: senderId, status: "active" });

  if (sender.freeConnectionLeft <= 0 && !activePlan) {
    throw new Error("Free tier used. Purchase a plan to continue");
  }

  const existing = await ConnectionRequest.findOne({ senderId, receiverId, status: "pending" });
  if (existing) throw new Error("Connection request already sent");

  const receiver = await User.findById(receiverId);
  const newRequest = new ConnectionRequest({ senderId, receiverId });
  await newRequest.save();

  await sendEmail(
    receiver.email,
    "New Connection Request",
    `${sender.name} (${sender.email}) sent you a connection request on SkillSwap.`
  );

  return { message: "Connection request sent" };
};

exports.acceptConnectionRequest = async ({ senderId, receiverId }) => {
  const request = await ConnectionRequest.findOne({ senderId, receiverId, status: "pending" });
  if (!request) throw new Error("Request not found");

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  const senderPlan = await Subscription.findOne({ userId: senderId, status: "active" });
  const receiverPlan = await Subscription.findOne({ userId: receiverId, status: "active" });

  if ((!senderPlan && sender.freeConnectionLeft <= 0) || (!receiverPlan && receiver.freeConnectionLeft <= 0)) {
    throw new Error("One or both users have no connections left");
  }

  if ((senderPlan && senderPlan.connectionsLeft <= 0) || (receiverPlan && receiverPlan.connectionsLeft <= 0)) {
    throw new Error("One or both users have reached their limit");
  }

  if (!senderPlan) {
    sender.freeConnectionLeft -= 1;
    await sender.save();
  } else {
    senderPlan.connectionsLeft -= 1;
    await senderPlan.save();
  }

  if (!receiverPlan) {
    receiver.freeConnectionLeft -= 1;
    await receiver.save();
  } else {
    receiverPlan.connectionsLeft -= 1;
    await receiverPlan.save();
  }

  request.status = "accepted";
  await request.save();

  return { message: "Connection request accepted" };
};

exports.rejectConnectionRequest = async ({ senderId, receiverId }) => {
  const result = await ConnectionRequest.deleteOne({ senderId, receiverId, status: "pending" });
  if (!result.deletedCount) throw new Error("Request not found");
  return { message: "Connection request rejected" };
};

exports.getRequestStatus = async ({ senderId, receiverId }) => {
  let request = await ConnectionRequest.findOne({ senderId, receiverId });
  if (!request) request = await ConnectionRequest.findOne({ senderId: receiverId, receiverId: senderId });
  if (!request) throw new Error("Request not found");

  if (request.status === "pending") {
    if (request.senderId.toString() === senderId) return { status: "pending" };
    else return { status: "received" };
  }

  return { status: request.status };
};

exports.createNotification = async (data) => {
  const newNotification = new Notification(data);
  await newNotification.save();
  return { success: true, message: "Notification sent" };
};

exports.getNotifications = async (userId) => {
  const notifications = await Notification.find({ receiverId: userId, isSeen: false }).sort({ createdAt: -1 });
  return { success: true, notifications };
};

exports.markNotificationAsRead = async ({ notificationId }) => {
  if (!notificationId) throw new Error("Notification ID is required");
  await Notification.findByIdAndUpdate(notificationId, { isSeen: true });
  return { success: true, message: "Notification marked as read" };
};

exports.searchUsers = async (userId, skill) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new Error("User not found");

  return await User.find({
    _id: { $ne: userId },
    skillsHave: { $in: [skill] },
    skillsWant: { $in: currentUser.skillsHave || [] },
  });
};

exports.getUniqueSkills = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  return user.skillsWant || [];
};

exports.getConnectedUsers = async (userId) => {
  const connections = await ConnectionRequest.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
    status: "accepted",
  });

  const ids = connections.map((c) =>
    c.senderId.toString() === userId.toString() ? c.receiverId : c.senderId
  );

  return await User.find({ _id: { $in: ids } }, "name email skillsHave skillsWant");
};

exports.reportUser = async ({ reporterId, reportedUserId, reason }) => {
  if (reporterId === reportedUserId) throw new Error("You cannot report yourself");

  const reporter = await User.findById(reporterId);
  const reported = await User.findById(reportedUserId);

  const existing = await Report.findOne({ reporterId, reportedUserId });
  if (existing) throw new Error("You have already reported this user");

  const report = new Report({ reporterId, reportedUserId, reason });
  await report.save();

  const totalReports = await Report.countDocuments({ reportedUserId });
  if (totalReports >= 5) {
    await User.findByIdAndUpdate(reportedUserId, { isBanned: true });
  }

  await sendEmail(
    reported.email,
    "You’ve been reported on SkillSwap",
    `Hello ${reported.name},\n\nYou’ve been reported for: "${reason}". Our team will review this.\n\n- SkillXChange Team`
  );

  return { message: "Report submitted successfully" };
};

exports.hasReportedUser = async (query, reportedUserId) => {
  const { reporterId } = query;
  if (!reporterId) throw new Error("Missing reporter ID");

  const existing = await Report.findOne({ reporter: reporterId, reportedUser: reportedUserId });
  return { hasReported: !!existing };
};