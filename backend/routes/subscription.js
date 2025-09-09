const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");

router.post("/create-order", subscriptionController.createOrder);
router.post("/verify-payment", subscriptionController.verifyPayment);
router.get("/status/:userId", subscriptionController.getStatus);

module.exports = router;