const reportService = require("../services/reportService");

exports.reportUser = async (req, res) => {
  try {
    const reportedUserId = req.body.reportedUserId;
const reporterId =
  (req.user && (req.user._id || req.user.id)) || req.body.reporterId;
const reason = req.body.reason;
    
    if (!reporterId || !reportedUserId || !reason) {
      return res
        .status(400)
        .json({ message: "Reporter, reported user and reason are required" });
    }

    const result = await reportService.reportUser({
      reporterId,
      reportedUserId,
      reason,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.hasReportedUser = async (req, res) => {
  try {
    const query = req.query;
    const reportedUserId = req.params.reportedUserId;
    const result = await reportService.hasReportedUser(query, reportedUserId);
    res.json(result);
  } catch (err) {
    console.error("hasReportedUser controller error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
exports.getMyReportStats = async (req, res) => {
  try {
    const userId = req.user._id; // coming from auth middleware

    const stats = await reportService.getMyReportStats(userId);

    return res.status(200).json(stats);
  } catch (err) {
    console.error("getMyReportStats error:", err);

    return res.status(500).json({
      message: err.message || "Failed to fetch report stats",
    });
  }
};