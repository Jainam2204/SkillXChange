const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController")

const router = express.Router();

router.get("/suggestions", authMiddleware, userController.getSuggestions);
router.get("/profile/:id", userController.getProfile);
router.post("/connect/request", userController.sendConnectionRequest);
router.post("/connect/accept", userController.acceptConnectionRequest);
router.post("/connect/reject", userController.rejectConnectionRequest);
router.get("/request/status", userController.getRequestStatus);
router.post("/notifications", userController.createNotification);
router.get("/notifications/:userId", userController.getNotifications);
router.post("/notifications/read", userController.markNotificationAsRead);
router.get("/search/:userId/:skill", userController.searchUsers);
router.get("/skills/unique/:userId", userController.getUniqueSkills);
router.get("/getusers", authMiddleware, userController.getConnectedUsers);
router.post("/report", userController.reportUser);
router.get("/has-reported/:reportedUserId", userController.hasReportedUser);
// router.put("/update-profile/:id", userController.updateProfile);
// router.get("/:id", userController.getUser);

module.exports = router;