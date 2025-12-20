const { getUserConnections } = require('../services/connection');

async function getChatUserList(req, res) {
  try {
    const userId = req.user._id;
    const result = await getUserConnections(userId);
    res.json(result);
  } catch (err) {
    console.error('Error in getChatUserList:', err);
    res.status(500).json({ message: 'Failed to fetch chat connections' });
  }
}

module.exports = getChatUserList;
