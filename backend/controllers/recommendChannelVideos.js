const axios = require('axios');
const dotenv = require("dotenv");

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const CHANNELS = {
  freecodecamp: 'UC8butISFwT-Wl7EV0hUK0BQ',
  netninja: 'UCW5YeuERMmlnqo4oq8vwUpg',
  codewithharry: 'UCeVMnSShP_Iviwkknt83cww',
  traversymedia: 'UC29ju8bIPH5as8OGnQzwJyA',
};

async function recommendVideos (req, res) {
  const { interests = [], channel = 'freecodecamp' } = req.body;
  const channelId = CHANNELS[channel.toLowerCase()];
  if (!channelId) return res.status(400).json({ error: 'Unknown channel' });

  const searchQuery = interests.join(' ') + ' course';

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(
    searchQuery
  )}&maxResults=10&type=video&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await axios.get(url);
    const videos = response.data.items.map((item) => ({
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    res.status(500).json({ error: 'Could not fetch videos' });
  }
};

module.exports = recommendVideos;