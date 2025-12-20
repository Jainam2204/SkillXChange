const express = require("express");
const { fetchSuggestions,  
    sendRequest,
  acceptRequest,
  rejectRequest,
  requestStatus,
fetchConnections } = require("../controllers/connectioncontroller");
const authMiddleware = require("../middleware/authMiddleware");
const checkBanned = require("../middleware/checkBanned");
const router = express.Router();

router.get("/suggestions", authMiddleware,checkBanned, fetchSuggestions);
router.post("/request", authMiddleware,checkBanned, sendRequest);
router.post("/accept", authMiddleware,checkBanned, acceptRequest);
router.post("/reject", authMiddleware,checkBanned, rejectRequest);
router.get("/status", authMiddleware,checkBanned, requestStatus);
router.get("/connections", authMiddleware, checkBanned,fetchConnections);
module.exports = router;
