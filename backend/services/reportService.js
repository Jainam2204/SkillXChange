const Report = require("../models/Report");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

exports.reportUser = async ({ reporterId, reportedUserId, reason }) => {
  if (String(reporterId) === String(reportedUserId)) {
    throw new Error("You cannot report yourself");
  }

  const reporter = await User.findById(reporterId);
  const reported = await User.findById(reportedUserId);

  if (!reporter || !reported) {
    throw new Error("User not found");
  }

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
    "You’ve been reported on SkillXChange",
    `Hello ${reported.name},\n\nYou’ve been reported for: "${reason}". Our team will review this.\n\n- SkillXChange Team`
  );

  return { message: "Report submitted successfully" };
};

exports.hasReportedUser = async (query, reportedUserId) => {
  const { reporterId } = query;

  if (!reporterId) {
    throw new Error("Missing reporter ID");
  }
  if (!reportedUserId) {
    throw new Error("Missing reported user ID");
  }

  const existing = await Report.findOne({ reporterId, reportedUserId });

  return { hasReported: !!existing };
};
exports.getMyReportStats = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const reportCount = await Report.countDocuments({
    reportedUserId: userId,
  });

  const user = await User.findById(userId).select("isBanned");

  return {
    reportCount,
    isBanned: user?.isBanned || false,
    maxAllowedBeforeBan: 3, 
  };
};
