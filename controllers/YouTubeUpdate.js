import { checkNewVideos } from "../services/VideoUploaded";


async function YoutubeUpdate(user) {
  const userId = user._id;
    console.log(`🔍 Starting YouTube update for user: ${userId}`);
    
    try {
        const youtube= user.preferences?.youtube;
        const lastUpdate = youtube?.lastUpdate

        const lastUpdateMs = youtube.lastUpdate instanceof Date ? custom.lastUpdate.getTime()
        : Number(custom.lastUpdate) || 0;
        console.log(`📝 User preferences: type=${type}, instructions=${specificInstructions}, lastUpdate=${lastUpdateMs}`);
        const nowMs = Date.now();
        const timeSinceLastUpdate = nowMs - lastUpdateMs;

         console.log(`🕒 Last update timestamp: ${lastUpdateMs}`);
         console.log(`🕒 Current timestamp: ${nowMs}`);
         console.log(`⏳ Time since last update (ms): ${timeSinceLastUpdate}`);
         console.log(`⚡ One week (ms): ${ONE_WEEK_MS}`);

         if (timeSinceLastUpdate < ONE_WEEK_MS) {
            console.log(`⏳ Too soon to send ${type} again for user ${user._id}. Skipping.`);
            return { skipped: true };
         }


        if (!youtube || !youtube.favoriteChannels || !youtube.topicsOfInterest) {
            console.log(`❌ No valid YouTube preferences found for user: ${userId}`);
            return { skipped: true };
        }
        console.log(`🔍 User YouTube preferences:`, youtube);
        const favoriteChannels = youtube.favoriteChannels;
        const topicsOfInterest = youtube.topicsOfInterest;
        const preferredVideoDuration = youtube.preferredVideoDuration || 'any'; 
        const specificInstructions = youtube.specificInstructions || '';

        const latestVideo= await checkNewVideos(favoriteChannels);
        console.log(`🔍 Latest video check result:`, latestVideo);
        return;

    } catch (error) {
        console.error(`❌ Error during YouTube update for user ${userId}:`, error);
        return { error: error.message };
    }
}