const cron = require('node-cron');
const User = require('../models/user');
const { getSportsNewsFromSerpApi } = require('../services/sportsService');
const {shortlistTopArticles, selectBestNewsWithGemini} = require('../services/newsFilterService');
const { generateSearchQueryWithGemini } = require('../services/queryGenerator');
const {summarizeArticleFromUrl} = require('../services/summarizeArticles');
const {fetchImageForArticle,getImageFromPage} = require('../services/newsImage');
const twilio = require('twilio');
const axios=require('axios');
const FROM_WHATSAPP = 'whatsapp:+14155238886';
require('dotenv').config({ path: '../.env' });
//const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
require('dotenv').config({ path: '../.env' });

// exports.runDailySportsNewsJob = async () => {
//   try {
//     const users = await User.find({ category: 'sports' });

//     for (const user of users) {
//       const { subcategory, tags, specificInstructions, aiGeneratedAnswers } = user.preferences.sports;
//       console.log(subcategory, tags, specificInstructions, aiGeneratedAnswers," User Preferences");
//       let generatedQuery;
//       try {
//         // Step 1: Generate a search query using Gemini
//         generatedQuery = await generateSearchQueryWithGemini({
//           category: 'sports',
//           subcategory,
//           tags,
//           instructions: specificInstructions,
//           aiAnswers: aiGeneratedAnswers,
//         });

//         console.log("Generated Query:", generatedQuery);
//       } catch (err) {
//         generatedQuery = `${subcategory} ${tags?.join(' ') || ''} latest highlights`.trim();
//       }

//       // Step 2: Fetch sports news articles using SerpAPI
//       const articles = await getSportsNewsFromSerpApi(generatedQuery);
//       console.log(`Found ${articles.length} articles for user ${user.email}`);
//       if (!articles?.length) continue;

//       // Step 3: Filter top articles
//       const topArticles = shortlistTopArticles(articles, sportsPrefs, 10);
//       console.log(`Shortlisted ${topArticles.length} top articles for user ${user.email}`);
//       if (!topArticles.length) continue;
//       // Step 4: Let Gemini pick the best one
//       const { bestArticle, reason } = await selectBestNewsWithGemini(topArticles, sportsPrefs);

//       // Step 5: Store this article in the user's history
//       user.newsHistory.push({
//         title: bestArticle.title,
//         url: bestArticle.url || '',
//         date: new Date(),
//         reason,
//       });

//       await user.save();

      
//     }

//     console.log("✅ Sports news sent to all users.");
//   } catch (error) {
//     console.error("❌ Error in sports news cron job:", error.message);
//   }
// };

// Schedule job: runs every day at 5:00 AM IST
// cron.schedule('0 5 * * *', () => {
//   console.log("⏰ Running Sports News Job at 5 AM");
//   runDailySportsNewsJob();
// }, {
//   timezone: "Asia/Kolkata"
// });


exports.runDailySportsNewsJob = async (req,res) => {
  try {
    //const users = await User.find({ category: 'sports' });

    //for (const user of users) {
    const { preferences } = req.body;
    const userPhoneNumber='+919798537736';
      const { subcategory, tags, specificInstructions, aiGeneratedAnswers } = req.body.preferences.sports;
      console.log(subcategory, tags, specificInstructions, aiGeneratedAnswers," User Preferences");
      let generatedQuery;
      try {

        // Step 1: Generate a search query using Gemini
        // generatedQuery = await generateSearchQueryWithGemini({
        //   category: 'sports',
        //   subcategory,
        //   tags,
        //   instructions: specificInstructions,
        //   aiAnswers: aiGeneratedAnswers,
        // });

        //console.log("Generated Query:", generatedQuery);
      } catch (err) {
       // generatedQuery = `${subcategory} ${tags?.join(' ') || ''} latest highlights`.trim();
      }

      // Step 2: Fetch sports news articles using SerpAPI
      const articles = await getSportsNewsFromSerpApi(subcategory);
      console.log(`Found ${articles.length} articles for user `);
      //console.log("Articles:", articles);
      //if (!articles?.length) continue;

      // Step 3: Filter top articles
      const topArticles = shortlistTopArticles(articles, subcategory, 10);
      console.log(`Shortlisted ${topArticles.length} top articles for user `);
      //if (!topArticles.length) continue;
      //console.log("Top Articles:", topArticles);

      // Step 4: Let Gemini pick the best one
      const { bestArticle, reason } = await selectBestNewsWithGemini(topArticles, preferences);
      console.log("Best Article:", bestArticle, "Reason:", reason);

      //step-5 : summarize the news article
      const summary = await summarizeArticleFromUrl(bestArticle.url);
      console.log("Summary:", summary);

      //const images=await fetchImageForArticle(bestArticle.title);
      const imageUrl = await getImageFromPage(bestArticle.url);
      console.log("Image:", imageUrl);
      
      // Step 5: Store this article in the user's history
      // user.newsHistory.push({
      //   title: bestArticle.title,
      //   url: bestArticle.url || '',
      //   date: new Date(),
      //   reason,
      // });

      // await user.save();
      const response = await this.sendNewsUpdate(userPhoneNumber, bestArticle.title, summary,bestArticle.url,imageUrl);
      console.log(response,"Response from Twilio");

      return res.status(200).json({
        message: "Sports news fetched successfully",
        bestArticle,
        reason,
        summary
      });

      
    //}

    console.log("✅ Sports news sent to all users.");
  } catch (error) {
    console.error("❌ Error in sports news cron job:", error.message);
    return res.status(500).json({
      message: "Error fetching sports news",
      error: error.message,
    });
  }
};

 // Twilio sandbox sender or approved number



const cronJobs = new Map(); // Store cron jobs by user ID



// Expose a function to reschedule for a single user
const rescheduleUserJob = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.preferredTime) return;

  // Cancel existing job
  if (cronJobs.has(userId)) {
    cronJobs.get(userId).destroy();
    cronJobs.delete(userId);
  }

  const [hour, minute] = user.preferredTime.split(':').map(Number);
  const cronExpression = `${minute} ${hour} * * *`;

  const job = cron.schedule(cronExpression, async () => {
    console.log(`Running sports news job for ${user.phoneNumber} at ${user.preferredTime} ${user.timezone}`);
    await runDailySportsNewsJobForUser(user);
  }, {
    timezone: user.timezone || 'UTC',
  });

  cronJobs.set(userId, job);
  console.log(`Rescheduled sports news for ${user.phoneNumber} at ${user.preferredTime} ${user.timezone}`);
};



const moment = require('moment-timezone');

exports.runDailySportsNewsJobForUser = async (user) => {
  try {
    const { preferences, whatsappNumber } = user;
    const { subcategory, tags, instructionTags, favPlayers,favTeams, aiGeneratedAnswers } = preferences.sports;
    console.log(subcategory, tags,favPlayers, instructionTags, aiGeneratedAnswers, `User Preferences for ${whatsappNumber}`);

    // Step 1: Fetch sports news articles using SerpAPI
    const articles = await getSportsNewsFromSerpApi(subcategory);
    console.log(`Found ${articles.length} articles for user ${whatsappNumber}`);
    if (!articles?.length) return;

    // Step 2: Filter top articles
    const topArticles = shortlistTopArticles(articles, subcategory, 10);
    console.log(`Shortlisted ${topArticles.length} top articles for user ${whatsappNumber}`);
    if (!topArticles.length) return;

    // Step 3: Let Gemini pick the best one
    const { bestArticle, reason } = await selectBestNewsWithGemini(topArticles, preferences);
    console.log("Best Article:", bestArticle, "Reason:", reason);

    // Step 4: Summarize the news article
    const summary = await summarizeArticleFromUrl(bestArticle.url);
    console.log("Summary:", summary);

    // Step 5: Fetch image
    const imageUrl = await getImageFromPage(bestArticle.url);
    console.log("Image:", imageUrl);

    // Step 6: Store this article in the user's history
    user.newsHistory.push({
      title: bestArticle.title,
      url: bestArticle.url || '',
      date: new Date(),
      reason,
    });
    await user.save();

    // Step 7: Send news update via Twilio
    const response = await sendNewsUpdate('9142437079', bestArticle.title, summary, bestArticle.url, imageUrl);
    console.log(response, `Response from Twilio for ${whatsappNumber}`);

    const emailResponse=await sendEmail(user.email, bestArticle.title, summary);
    console.log(emailResponse, `Email sent to ${user.email}`);

    console.log(`✅ Sports news sent to ${whatsappNumber}.`);
  } catch (error) {
    console.error(`❌ Error in sports news job for ${user.whatsappNumber}:`, error.message);
  }
};

async function sendEmail( to_email, subject, message ) {
  const mailOptions = {
    from: `"Update Bot" <${process.env.GMAIL_USER}>`,
    to: to_email,
    subject,
    text: message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent!", info.response);
    return { success: true, info };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return { success: false, error };
  }
}


// Schedule jobs for all users
const scheduleSportsNewsJobs = async () => {
  try {
    const users = await User.find({ category: 'sports' });
    console.log(`Found ${users.length} users for sports news scheduling.`);
    console.log("Users:", users);

    for (const user of users) {
      const { preferredTime, timezone } = user.frequencyTiming;
      console.log(`User ${user.phoneNumber} has preferred time ${preferredTime} and timezone ${timezone}.`);
      if (!preferredTime) {
        //console.log(`Skipping user ${user.phoneNumber}: No preferred time set.`);
        continue;
      }

      // Parse preferred time (e.g., "08:00" -> { hour: 8, minute: 0 })
// Parse preferredTime (handle both HH:mm and 12-hour formats like "12:00 AM")
      let parsedTime = moment(preferredTime, ['HH:mm', 'h:mm A', 'h:mm a'], true);
      if (!parsedTime.isValid()) {
        console.log(`Skipping user: Invalid preferredTime format (${preferredTime})`);
        continue;
      }

      // Convert to 24-hour format
      const hour = parsedTime.format('HH');
      const minute = parsedTime.format('mm');
      console.log(`Parsed preferred time for user : ${hour}:${minute}`);

      // Create cron expression
      const cronExpression = `${minute} ${hour} * * *`;
      console.log(`Cron expression for : ${cronExpression}`); // e.g., "0 8 * * *" for 8:00 AM
      cron.schedule(cronExpression, async () => {
      console.log(`Running sports news job for  at ${preferredTime} ${timezone}`);
        await runDailySportsNewsJobForUser(user);
      }, {
        timezone: timezone || 'IST', // Use user's timezone or default to UTC
      });

      console.log(`Scheduled sports news for ${user.phoneNumber} at ${preferredTime} ${timezone}`);
    }

    console.log('✅ All sports news jobs scheduled.');
  } catch (error) {
    console.error('❌ Error scheduling sports news jobs:', error.message);
  }
};

const sendNewsUpdate = async (userPhoneNumber, newsTitle, newsContent,url,imageUrl) => {
  try {
    //const { userPhoneNumber, newsTitle, newsContent } = req.body;

    if (!userPhoneNumber || !newsTitle || !newsContent) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    //shortening article uri
    const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    console.log(response.data,"response.data");
    const newUrl=response.data;

    
    // Format message
    const emoji = '📰'; // use 🏏 for cricket, ⚽ for football, etc., dynamically if you like
    const messageBody = `${emoji} *${newsTitle}*\n\n${newsContent} \n\nRead full article here:${newUrl}`;
    console.log(messageBody,"Message Body");

    // Send WhatsApp message
    const message = await client.messages.create({
      from: FROM_WHATSAPP,
      to: `whatsapp:${"+91"+userPhoneNumber}`, // Must be opted in (e.g., +91XXXXXXXXXX)
      body: messageBody,
      mediaUrl:imageUrl||null
    });

    console.log('✅ WhatsApp message sent:', message.sid);

    return message;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    return null;
  }
};

module.exports = { scheduleSportsNewsJobs };

