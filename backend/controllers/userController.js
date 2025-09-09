const userService = require("../services/userService");

exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await userService.findSuggestions(req.user._id);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.sendConnectionRequest = async (req, res) => {
  try {
    const result = await userService.sendConnectionRequest(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.acceptConnectionRequest = async (req, res) => {
  try {
    const result = await userService.acceptConnectionRequest(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.rejectConnectionRequest = async (req, res) => {
  try {
    const result = await userService.rejectConnectionRequest(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getRequestStatus = async (req, res) => {
  try {
    const result = await userService.getRequestStatus(req.query);
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const result = await userService.createNotification(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const result = await userService.getNotifications(req.params.userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const result = await userService.markNotificationAsRead(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { userId, skill } = req.params;
    const result = await userService.searchUsers(userId, skill);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUniqueSkills = async (req, res) => {
  try {
    const result = await userService.getUniqueSkills(req.params.userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConnectedUsers = async (req, res) => {
  try {
    const result = await userService.getConnectedUsers(req.user._id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reportUser = async (req, res) => {
  try {
    const result = await userService.reportUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.hasReportedUser = async (req, res) => {
  try {
    const result = await userService.hasReportedUser(req.query, req.params.reportedUserId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};