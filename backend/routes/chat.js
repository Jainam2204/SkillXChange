const express = require('express');
const router = express.Router();
const getChatUserList  = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');
const checkBanned = require("../middleware/checkBanned");

router.get('/connections', auth,checkBanned, getChatUserList);

module.exports = router;
