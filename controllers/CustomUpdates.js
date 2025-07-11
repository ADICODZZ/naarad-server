const { generateRecipe } = require('../services/customNewsAgents/RecipeAgent');
const { generateMotivationalQuote } = require('../services/customNewsAgents/MotivationalQuoteAgent');
const { generateDailyHistoryFacts } = require('../services/customNewsAgents/DailyHistoryFacts');
const { generateWordOfDay } = require('../services/customNewsAgents/WordOfDayAgent');
const emailjs = require('emailjs-com');

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendEmail({ to_email, subject, message }) {
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

module.exports = { sendEmail };


const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const UserModel = require('../models/user'); // Adjust the path as needed

async function customUpdate(user) {
  console.log(`🔍 Starting customUpdate for user: ${user._id}`);

  const custom = user.preferences.custom || {};

console.log(`🔍 User custom preferences:`, custom);

const type = custom.type || 'New Recipes Weekly';
const specificInstructions =
  Array.isArray(custom.specificInstructions) && custom.specificInstructions.length > 0
    ? custom.specificInstructions
    : ['Indian cuisine'];
const lastUpdate = custom.lastUpdate || 0;
const previousMessages = custom.previousMessages || [];
const userId = user._id;


  console.log(
    `📝 User preferences: type=${type}, instructions=${specificInstructions}, lastUpdate=${lastUpdate}`
  );

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const lastUpdateMs = lastUpdate;
const nowMs = Date.now();

const timeSinceLastUpdate = nowMs - lastUpdateMs;

console.log(`📆 Last update date: ${lastUpdate}`);
console.log(`🕒 Last update timestamp: ${lastUpdateMs}`);
console.log(`🕒 Current timestamp: ${nowMs}`);
console.log(`⏳ Time since last update (ms): ${timeSinceLastUpdate}`);
console.log(`⚡ One week (ms): ${ONE_WEEK_MS}`);
console.log(
  `✅ Condition (timeSinceLastUpdate < ONE_WEEK_MS): ${timeSinceLastUpdate < ONE_WEEK_MS}`
);

if (timeSinceLastUpdate <= ONE_WEEK_MS) {
  console.log(`⏳ Too soon to send ${type} again for user ${userId}. Skipping.`);
  return { skipped: true };
}


  let content = '';
  let subject = '';

  try {
    console.log(`🔄 Generating content for type: ${type}…`);
    switch (type) {
      case 'New Recipes Weekly':
        content = await generateRecipe(specificInstructions, previousMessages);
        subject = 'Your Weekly Recipe Update';
        break;

      case 'Motivational Quotes':
        content = await generateMotivationalQuote(specificInstructions, previousMessages);
        subject = 'Quote of the Day';
        break;

      case 'Daily History Facts':
        content = await generateDailyHistoryFacts(specificInstructions, previousMessages);
        subject = 'History Fact of the Day';
        break;

      case 'Word of The Day':
        content = await generateWordOfDay(specificInstructions, previousMessages);
        subject = 'Word of the Day';
        break;

      case 'Stock Market Movers':
        console.warn(
          '⚠️ Using RecipeAgent for Stock Market Movers — consider replacing with a dedicated agent.'
        );
        content = await generateRecipe(specificInstructions);
        subject = 'Your Weekly Stock Market Movers';
        break;

      default:
        throw new Error(`Unsupported type: ${type}`);
    }

    console.log(`✅ Content generated for ${type}:`, content);

    const emailResponse = await sendEmail({
      to_email: user.email,
      subject,
      message: content
    });

    if (!emailResponse.success) {
      throw emailResponse.error;
    }

    // Update user document with lastUpdate and append to previousMessages
    const now = Date.now();
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          'preferences.custom.lastUpdate': now
        },
        $push: {
          'preferences.custom.previousMessages': content
        }
      }
    );

    console.log(`✅ Custom update sent & saved for user ${userId}, type: ${type}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Error sending custom update for user ${userId}:`, error);
    return { success: false, error };
  }
}


module.exports = {
  customUpdate,
  sendEmail,
};
