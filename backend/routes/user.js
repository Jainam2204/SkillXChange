const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const router = express.Router();
const checkBanned = require("../middleware/checkBanned");

router.get("/profile/:id", authMiddleware,checkBanned, userController.getProfile);
router.put("/update-profile/:id", authMiddleware,checkBanned, userController.updateProfile);
router.get("/:id", authMiddleware,checkBanned, userController.getUser);
module.exports = router;