const cron = require('node-cron');
const User = require('../models/user');
const { getSportsNewsFromSerpApi } = require('../services/sportsService');
const {shortlistTopArticles, selectBestNewsWithGemini} = require('../services/newsFilterService');
const { generateSearchQueryWithGemini } = require('../services/queryGenerator');
const {summarizeArticleFromUrl} = require('../services/summarizeArticles');
const {fetchImageForArticle,getImageFromPage} = require('../services/newsImage');
const twilio = require('twilio');
const axios = require('axios');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');

const FROM_WHATSAPP = 'whatsapp:+14155238886';
require('dotenv').config({ path: '../.env' });

// Initialize Twilio client
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const cronJobs = new Map(); // Store cron jobs by user ID

// Main function you want to import
async function runDailySportsNewsJobForUser(user) {
  const userId = user._id;
  console.log(`🔍 Starting daily sports news job for user: ${userId}`);
  
  try {
    const { preferences, whatsappNumber } = user;
    const { subcategory, tags, instructionTags, favPlayers, favTeams, aiGeneratedAnswers } = preferences.sports;
    console.log(subcategory, tags, favPlayers, instructionTags, aiGeneratedAnswers, `User Preferences for ${whatsappNumber}`);

    // Step 1: Fetch sports news articles using SerpAPI
    const articles = await getSportsNewsFromSerpApi(subcategory);
    console.log(`Found ${articles.length} articles for user ${whatsappNumber}`);
    if (!articles?.length) return;

    // Step 2: Filter top articles
    const topArticles = shortlistTopArticles(articles, subcategory, 10);
    console.log(`Shortlisted ${topArticles.length} top articles for user ${whatsappNumber}`);
    console.log(topArticles, "Top Articles");
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

    const emailResponse = await sendEmail(user.email, bestArticle.title, summary);
    console.log(emailResponse, `Email sent to ${user.email}`);

    console.log(`✅ Sports news sent to ${whatsappNumber}.`);
  } catch (error) {
    console.error(`❌ Error in sports news job for ${user.whatsappNumber}:`, error.message);
  }
}



// Other functions
const runDailyNewsJobForUser = async (user) => {
  try {
    const { preferences, whatsappNumber } = user;
    const { tags, newsSources, newsdepth, newsFormatPreference, newsFrequency, instructionTags, aiGeneratedAnswers } = preferences.news;
    console.log(tags, newsSources, newsdepth, newsFormatPreference, newsFrequency, instructionTags, aiGeneratedAnswers, `User Preferences for ${whatsappNumber}`);

    // Create a search query from news tags and sources
    const searchQuery = tags?.join(' ') || 'latest news';
    const articles = await getGeneralNewsFromSerpApi(searchQuery, newsSources);
    console.log(`Found ${articles.length} articles for user ${whatsappNumber}`);
    if (!articles?.length) return;

    const topArticles = shortlistTopArticles(articles, searchQuery, 10);
    console.log(`Shortlisted ${topArticles.length} top articles for user ${whatsappNumber}`);
    if (!topArticles.length) return;

    const { bestArticle, reason } = await selectBestNewsWithGemini(topArticles, preferences);
    console.log("Best Article:", bestArticle, "Reason:", reason);

    const summary = await summarizeArticleFromUrl(bestArticle.url);
    console.log("Summary:", summary);

    const imageUrl = await getImageFromPage(bestArticle.url);
    console.log("Image:", imageUrl);

    user.newsHistory.push({
      title: bestArticle.title,
      url: bestArticle.url || '',
      date: new Date(),
      reason,
    });
    await user.save();

    const response = await sendNewsUpdate('9142437079', bestArticle.title, summary, bestArticle.url, imageUrl);
    console.log(response, `Response from Twilio for ${whatsappNumber}`);

    const emailResponse = await sendGeneralNewsEmail(user.email, bestArticle.title, summary);
    console.log(emailResponse, `Email sent to ${user.email}`);

    console.log(`✅ General news sent to ${whatsappNumber}.`);
  } catch (error) {
    console.error(`❌ Error in general news job for ${user.whatsappNumber}:`, error.message);
  }
};


async function sendEmail(to_email, subject, message) {
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

async function sendAllNewsEmail(to_email, subject, message) {
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



const sendNewsUpdate = async (userPhoneNumber, newsTitle, newsContent, url, imageUrl) => {
  try {
    if (!userPhoneNumber || !newsTitle || !newsContent) {
      throw new Error('Missing required fields.');
    }

    // Shortening article URL
    const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    console.log(response.data, "response.data");
    const newUrl = response.data;

    // Format message
    const emoji = '📰';
    const messageBody = `${emoji} *${newsTitle}*\n\n${newsContent} \n\nRead full article here:${newUrl}`;
    console.log(messageBody, "Message Body");

    // Send WhatsApp message
    const message = await client.messages.create({
      from: FROM_WHATSAPP,
      to: `whatsapp:${"+91" + userPhoneNumber}`,
      body: messageBody,
      mediaUrl: imageUrl || null
    });

    console.log('✅ WhatsApp message sent:', message.sid);
    return message;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    return null;
  }
};

// EXPORT ALL FUNCTIONS AT THE END - THIS IS THE FIX
module.exports = {
  runDailySportsNewsJobForUser,
  runDailyNewsJobForUser,
  sendNewsUpdate,
  sendEmail,
  sendAllNewsEmail
};