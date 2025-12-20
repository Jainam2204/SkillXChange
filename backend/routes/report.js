const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');
const checkBanned = require("../middleware/checkBanned");

router.post("/",auth,checkBanned, reportController.reportUser);
router.get("/has-reported/:reportedUserId", auth , checkBanned,reportController.hasReportedUser);
router.get("/my-stats", auth,checkBanned, reportController.getMyReportStats);
module.exports = router;