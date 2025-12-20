const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { 
useValidation
} = require("../utils/validators");
const { 
    register,
    login,
    me,
    verifyEmail,
    logoutUser
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", useValidation("register") ,register);
router.post("/login", useValidation("login") , login);
router.get("/me", authMiddleware, me);
router.post("/verify", useValidation("verification"), verifyEmail);
router.post("/logout", logoutUser);
module.exports = router;