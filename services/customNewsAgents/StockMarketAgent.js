const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const SerpApi = require("google-search-results-nodejs");
const { JSDOM } = require('jsdom');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const search = new SerpApi.GoogleSearch(process.env.SERPAPI_API_KEY);
const { Readability } = require('@mozilla/readability');

// helper: Gemini model
const getGeminiModel = () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

exports.generateStockMarketUpdate = async (specificInstructions) => {
  try {
    const model = getGeminiModel();

    //specificInstructions.push("paytm")

    // Build instruction string for fallback
    let fallbackInstruction =
      'top stock market movers and news in India';

    const stockList =
      Array.isArray(specificInstructions) && specificInstructions.length > 0
        ? specificInstructions
        : [fallbackInstruction];

    console.log('✅ Stocks to process:', stockList);

    const summaries = [];

    for (const stock of stockList) {
      console.log(`📈 Processing stock: ${stock}`);

      // 🔷 Step 1: Fetch SERP news for this stock
      const serpResult = await this.getNewsFromSerpApi(stock);

      if (!serpResult || serpResult.length === 0) {
        console.warn(`⚠️ No SERP results for: ${stock}`);
        continue;
      }

      console.log(`🔍 SERP result:`, serpResult);

      const newsResults = extractWithReadability(serpResult[0].link);

      // 🔷 Step 2: Summarize with Gemini
      const summaryPrompt = `Act as a financial news assistant.
      Write a short, engaging WhatsApp message with a nice heading and a crisp summary of the latest stock market news about **${stock}** based on the following news headlines:
      ${newsResults} Also include: price - ${serpResult[0].price} ${serpResult[0].currency}, date: ${serpResult[0].date}. 
      Do NOT add phrases like "Here's your result". 
      Only output the final WhatsApp message for **${stock}**, ready to be sent.
      Use emojis sparingly if appropriate.`;

      const summaryResult = await model.generateContent(summaryPrompt);

      const summaryText =
        summaryResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!summaryText) {
        console.warn(`⚠️ Failed to summarize news for: ${stock}`);
        continue;
      }

      console.log(`✅ Summary for ${stock}:`, summaryText);

      summaries.push(summaryText);
    }

    if (summaries.length === 0) {
      throw new Error('No summaries generated for any stock.');
    }

    // 🔷 Step 3: Combine all summaries into one message
    const combinedPrompt = `
Act as a financial news assistant.

You are given summaries of individual stocks written in a WhatsApp-friendly tone. Your task is to combine these summaries into a single, clear and well-structured WhatsApp message for the user, summarizing today’s stock market highlights.

📝 Guidelines:
- Use *only* the information provided below. Do not assume or invent any additional stocks, news, or details.
- Start with a short, engaging heading for the entire message.
- List each stock’s update clearly, separated by line breaks or bullet points if needed.
- Make the message friendly yet professional.
- Use emojis sparingly and only when appropriate.
- Ensure readability and good flow.

⚠️ Strict instructions:
- Do NOT include any stocks or details that are not explicitly given below.
- Do NOT include framing text like: "Here is your message", "Final output", etc.
- Output *only* the final WhatsApp message, ready to send.

🔷 Data to summarize:
${summaries.join('\n\n')}
`;



    const finalResult = await model.generateContent(combinedPrompt);

    const finalMessage =
      finalResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!finalMessage) {
      throw new Error('Failed to generate final WhatsApp message.');
    }

    console.log('✅ Final WhatsApp message:', finalMessage);

    return finalMessage;
  } catch (error) {
    console.error('❌ Error generating stock market update:', error.message);
    return null;
  }
};


const { getJson } = require("serpapi");
exports.getNewsFromSerpApi = async (query) => {
  const fullQuery = `${query} in India`;
  const apiKey = process.env.SERPAPI_API_KEY || "your_api_key_here";

  console.log(`🔍 Searching Google: "${fullQuery}"`);

  const searchParams = {
    engine: "google_finance",
    q: query,
    //page_token: "KIVu-nictZPdjrI4GMeTPdkrWU8cFXV0dBKyKbUgiigy6OgJQawFQapUBpmzvZe9qr2aLYzO6I5vsm-yW0Ip7dPn4__L88efoR8Ff_36i3c87tlzrZamaZVQSkJcdemu5rAscmsbGrLY9X5PkhCLaRkC1VCh6hivs_e1EiaaPA2xIr9r8ixxXqfhEkova0UWlq-jEgnFhJW8UMRRKXsTmyWXiUIJ-2JTJ2jZxnTINvK-8zgJBtEiM4JSEVG0Vw7DW57Qactqdo1PwW_NHv-psiqObMusqpNU7ZM-OFlWFbNWdVxzdtwE_NsBv5YSJMblF5K71vwcgkAqlvk0569vIPXsx0D5pALt0Tbd6yAqUD4jJfxVZYAu0dN8gc6H9MfREVKlyu2WWszcgQx4zCKlD0dGnmJ_wEu6mI5BBfQJHkknc_69LGK8gP5e65BzXTeDDEziu0wH0KitCRdXqK1i_qnXYpZLDV-6ApW7TlzvmoJE585mMs2icNfe4-28-dYBDwVGl31yZNcc9acEefre8kxQ1apS_YLQGFMuZZ7OAPSl_T0cXAD0hZDXTPjDUMp3ehlfAj3fAL2Uu3G55eJyL_isTbLgl7NcPpRLJ5-lLdwWMCDKD-E4FyvHE3CEfTrN0JkAzC8qCliQQ35jiMk5pQ9FFx-6WoU5gmBiqJIKJBW6eRflSYaFMTpXQhDwB8EtQgDMuyJcj-EP9iVwh5nSSA9O3PXh-MWakaC52oRuJREk3dxcmNHd6qeaz_1_uHq8NZMzV3if621rEmkOL62Za4KMnKuhX7XmmesIKAieuSZXXOFPcEXWKG_N71zTgitvTatgm3M1tv_k-l-1ZoEXf3xu-zTZkm_92obr02LIdCKkM_9oyVJMuo2t5Wmx8WBvdsfnfUzJg-2vn6XG4JitSwfRo2l5TTErO_GxnNI4KPtR2YnWMfXXpV0YU1FwWvG7NyOVXlyJvK129AUN6TFI3JPk4MZ4OfLdKNzoShtnpl3RfNxij748svedxMtmmI3e-gc6kgJFVye-qg48j7Rwo71OcbA7dA9-NBe2o2napHMzmuMFQWqr9zSVtJXmKbbej73jI7XHPaymnfBdEIqsmPg6RI_L1URaVmiJuY6N2ZtYb3U3zSen3mjV611h0y3tyDHbi_W_AU9HHA0",
    hl: "en",
    gl: "in",
    api_key: apiKey
  };

  try {

    
    // Step 1: Get Google search results and check for AI Overview page_token
    const googleSearchResults = await new Promise((resolve, reject) => {
      getJson(searchParams, (json) => {
        if (!json) return reject(new Error("No response from SerpAPI (Google search)."));
        resolve(json);
      });
    });

    console.log("🔍 Google search results:", googleSearchResults);

    return googleSearchResults.futures_chain;

    const aiOverview = googleSearchResults.search_parameters;
    console.log("🔍 AI Overview search parameters:", aiOverview);

    if (!aiOverview || !aiOverview.page_token) {
      console.warn("⚠️ No AI Overview page_token found in initial search.");
      return null;
    }

    console.log("✅ Found AI Overview page_token. Fetching AI Overview...");

    // Step 2: Use page_token to fetch AI Overview
    const aiOverviewParams = {
      engine: "google_ai_overview",
      page_token: aiOverview.page_token,
      api_key: apiKey
    };

    const aiOverviewResults = await new Promise((resolve, reject) => {
      getJson(aiOverviewParams, (json) => {
        if (!json) return reject(new Error("No response from SerpAPI (AI Overview)."));
        resolve(json["ai_overview"]);
      });
    });

    if (aiOverviewResults.search_metadata?.status !== "Success") {
      console.warn("⚠️ AI Overview fetch was not successful:", aiOverviewResults);
      return null;
    }

    console.log("🔍 AI Overview results:", aiOverviewResults);

    console.log("🎯 Successfully retrieved AI Overview.");
    return aiOverviewResults.ai_overview || null;

  } catch (err) {
    console.error("❌ Error in getNewsFromSerpApi:", err.message);
    throw err;
  }
};

//const SerpApi = require("google-search-results-nodejs");
require('dotenv').config();
//const search = new SerpApi.GoogleSearch(process.env.SERPAPI_API_KEY);




async function extractWithReadability(url) {
  const dom = await JSDOM.fromURL(url);
  const doc = dom.window.document;

  const reader = new Readability(doc);
  console.log(reader,"reader\n");
  const article = reader.parse();
  console.log(article,"article");

  return article.content;
}