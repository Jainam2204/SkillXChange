const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createOrder,
  verifyPayment,
  getSubscriptionStatus,
} = require("../controllers/subscriptioncontroller");
const checkBanned = require("../middleware/checkBanned");
router.post("/create-order", authMiddleware,checkBanned, createOrder);
router.post("/verify-payment", authMiddleware, checkBanned,verifyPayment);
router.get("/status/:userId", authMiddleware, checkBanned,getSubscriptionStatus);

module.exports = router;
