const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require('@google/generative-ai');
require("dotenv").config();

//const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Step 1: Scrape Article Content
 */
async function fetchArticleContent(url) {
  try {
    console.log("url to be scraped:", url);
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    console.log($,"$");

    // Basic extraction logic (tweak this per site)
    const paragraphs = $("p").map((i, el) => $(el).text()).get();
    console.log(paragraphs,"paragraphs");
    const cleanText = paragraphs.join("\n").replace(/\s+/g, " ").trim();
    console.log(cleanText,"cleanText");

    return cleanText.slice(0, 4000); // truncate if too long
  } catch (err) {
    console.error("Error fetching article:", err.message);
    return null;
  }
}

const { JSDOM } = require('jsdom');

async function extractWithJsdom(url) {
  const dom = await JSDOM.fromURL(url);
  const document = dom.window.document;
  console.log(document,"document form dom");

  const title = document.querySelector('title')?.textContent;
  const bodyText = document.body.textContent;
  console.log(bodyText,"bodyText from dom");

  return { title, bodyText: bodyText.trim().slice(0, 500) }; // first 500 chars
}


const { Readability } = require('@mozilla/readability');

async function extractWithReadability(url) {
  const dom = await JSDOM.fromURL(url);
  const doc = dom.window.document;

  const reader = new Readability(doc);
  console.log(reader,"reader\n");
  const article = reader.parse();
  console.log(article,"article");

  return article.content;
}


/* Step 2: Summarize using OpenAI*/
async function summarizeContent(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are a helpful assistant summarizing news articles for WhatsApp sharing.
Summarize the following news in 3–4 lines that clearly capture the crux. Make it suitable for sharing on WhatsApp. Keep the tone clear, simple, and readable. Avoid exaggeration. Preserve key facts.

News Content:
"""
${text}
"""
Return only the summary text, with no extra explanations or formatting.
    `.trim();

    const result = await model.generateContent(prompt);

    const summaryText = result?.response?.text?.().trim();

    if (!summaryText) {
      throw new Error("Empty summary returned by Gemini.");
    }

    return summaryText;
  } catch (err) {
    console.error("❌ Error summarizing content:", err.message);
    return "Summary could not be generated at the moment.";
  }
}

/**
 * Pipeline Function
 */
async function summarizeArticleFromUrl(url) {
  //const article = await fetchArticleContent(url);
  //const article=await extractWithJsdom(url);
  const article=await extractWithReadability(url);  
  console.log("\n✅ Article:\n", article);
  if (!article) return;

  const summary = await summarizeContent(article);
  console.log("\n✅ Summary:\n", summary);
  return summary;
}

// 🔁 Test the function
const testUrl =
  "https://sports.ndtv.com/england-vs-india-2025/india-vs-india-a-intra-squad-match-live-score-practice-match-day-1-tour-game-live-updates-shubman-gill-jasprit-bumrah-8657711";

//summarizeArticleFromUrl(testUrl);

module.exports = {summarizeArticleFromUrl};
