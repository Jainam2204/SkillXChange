
module.exports = function checkBanned(req, res, next) {
  if (req.user && req.user.isBanned) {
    return res.status(403).json({
      code: "USER_BANNED",
      message: "Your account has been banned. Please use a different account.",
    });
  }
  next();
};
