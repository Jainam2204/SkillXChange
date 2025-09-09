const express = require("express");
const { register, login, getUserProfile, verifyEmail } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getUserProfile);
router.post("/verify", verifyEmail);

module.exports = router;