const axios = require("axios");
require('dotenv').config();
const apiKey = process.env.YOUTUBE_API_KEY;
/**
 * Checks if given YouTube channels have uploaded a new video.
 * 
 * @param {string[]} channelNames - Array of YouTube channel names
 * @param {string} apiKey - Your YouTube Data API v3 key
 * @returns {Promise<object[]>} - Array of results: {channelName, latestVideoTitle, publishedAt}
 */
async function checkNewVideos(channelNames) {
  const results = [];

  for (const name of channelNames) {
    try {
      // Step 1: Search for channel by name to get channelId
      const searchResp = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: "snippet",
            q: name,
            type: "channel",
            key: apiKey,
            maxResults: 1
          }
        }
      );

      const channel = searchResp.data.items?.[0];
      if (!channel) {
        results.push({ channelName: name, error: "Channel not found" });
        continue;
      }

      const channelId = channel.id.channelId;

      // Step 2: Get latest videos from uploads playlist
      const playlistResp = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: "snippet",
            channelId: channelId,
            order: "date",
            maxResults: 1,
            key: apiKey
          }
        }
      );

      const latestVideo = playlistResp.data.items?.[0];
      if (!latestVideo) {
        results.push({ channelName: name, error: "No videos found" });
        continue;
      }

      results.push({
        channelName: name,
        latestVideoTitle: latestVideo.snippet.title,
        publishedAt: latestVideo.snippet.publishedAt,
        videoUrl: `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`
      });
    } catch (err) {
      results.push({ channelName: name, error: err.message });
    }
  }

  return results;
}

module.exports = { checkNewVideos };
