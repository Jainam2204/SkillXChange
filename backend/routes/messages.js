const express = require("express");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { uploadLimiter } = require("../middleware/rateLimiter");
const messageController = require("../controllers/messageController");
const checkBanned = require("../middleware/checkBanned");
const router = express.Router();

router.get("/:userId", auth, checkBanned, messageController.getMessages);
router.post("/", auth, checkBanned, uploadLimiter, upload.single("file"), messageController.sendMessage);
router.get("/download/:messageId", auth, checkBanned, messageController.downloadFile);

module.exports = router;
