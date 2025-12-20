const authService = require("../services/authService");
const { logoutUserService } = require("../services/authService");
const sendEmail = require("../utils/sendEmail"); 
const User = require("../models/User");          

exports.register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(200).json({ message: "Verification email sent.", userId: user._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    const isProduction = process.env.NODE_ENV === "production";

    if (result.unverified) {
      const user = result.user;

      const newCode = String(Math.floor(100000 + Math.random() * 900000));
      user.verificationCode = newCode;
      await user.save();

      try {
        await sendEmail(
          user.email,
          "Verify Your Email",
          `Your new verification code is: ${newCode}`
        );
      } catch (err) {
        console.error("Resend verification email failed:", err.message);
      }

      return res.status(403).json({
        message: "Email not verified. A new verification code has been sent.",
        isVerified: false,
        user: { _id: user._id, email: user.email },
      });
    }

    const { token, user } = result;

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login Success",
      user,
    });

  } catch (error) {
    return res.status(error.status || 400).json({
      message: error.message,
      isVerified: error.isVerified,
      user: error.user
    });
  }
};




exports.me = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const id = req.body.userId;
    const verificationCode = req.body.verificationCode;
    const message = await authService.verifyUserEmail(id, verificationCode);
    res.status(200).json({ message });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.logoutUser = (req, res) => {
  try {
    logoutUserService(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
