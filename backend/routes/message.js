const express = require("express");
const messageController = require("../controllers/messageController");

const router = express.Router();

router.post("/send", messageController.sendMessage);
router.get("/:userId", messageController.getUserMessages);
router.get("/chat/:user1/:user2", messageController.getChatHistory);
router.put("/markAsRead/:receiver/:sender", messageController.markAsRead);
router.delete("/:messageId", messageController.deleteMessage);
router.delete("/conversation/:user1/:user2", messageController.deleteConversation);

module.exports = router;