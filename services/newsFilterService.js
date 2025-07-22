const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// 🧠 Rule-based scoring function
function computeRelevanceScore(article, preferences) {
  const { tags = [], subcategory = '', aiAnswers = [], specificInstructions = '' } = preferences;
  let score = 0;

  const content = `${article.title} ${article.snippet || ''}`.toLowerCase();

  // Score based on tag matches
  tags.forEach(tag => {
    if (content.includes(tag.toLowerCase())) score += 2;
  });

  // Subcategory match
  if (subcategory && content.includes(subcategory.toLowerCase())) score += 3;

  // AI answers relevance
  aiAnswers.forEach(ans => {
    if (content.includes(ans.toLowerCase())) score += 1;
  });

  // Specific instructions
  if (specificInstructions && content.includes(specificInstructions.toLowerCase())) score += 2;

  // Recency bias (optional)
  if (article.date) {
    const articleDate = new Date(article.date);
    const now = new Date();
    const diffHours = (now - articleDate) / (1000 * 60 * 60);
    if (diffHours < 6) score += 2; // Recent
    else if (diffHours < 24) score += 1; // Somewhat recent
  }

  return score;
}

// 📋 Step 1: Shortlist top N articles
function shortlistTopArticles(allArticles, preferences, topN = 10) {
  recentArticls=filterPreviousDayNews(allArticles);

  return recentArticls;

}

// 💡 Step 2: Let Gemini pick the best
async function selectBestNewsWithGemini(topArticles, preferences) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


const prompt = `
You are a smart assistant that helps select one **most relevant** news article from a list, based on user preferences. Your task is to behave like a **logical human assistant**, using reasoning, contextual understanding, and soft signal matching — not rigid keyword matching.

---

🎯 YOUR OBJECTIVE:
From a list of news articles, choose the **one** that best matches what the user is **really interested in**, even if the match is not directly based on keywords. Your response must reflect intelligent judgment, nuanced relevance, and an understanding of **how real users interpret related content**.

---

🧠 THINKING STRATEGY:

1. **Understand Preference Depth**:
   - Parse the user’s preferences not as strict filters but as **core intent signals**.
   - For example, if a user likes “Virat Kohli,” they may be interested in:
     - Other Indian players,
     - India’s team performance,
     - Post-match analysis,
     - Captaincy discussions, or
     - Rivals or match outcomes involving India.

2. **Semantically Expand Tags**:
   - Don’t just look for exact tags in the article.
   - Consider their **conceptual and contextual equivalents**:
     - "T20 World Cup" ≈ “T20 International matches” or “Global tournaments”
     - "Shubman Gill" ≈ “young Indian openers,” “top-order performance”
     - "Match analysis" ≈ “expert commentary,” “post-match breakdown”

3. **Latent Interest Mapping**:
   - Try to imagine: *“What would a human with these preferences care about?”*
   - Even if an article doesn’t mention exact names, if it includes **related entities or dynamics**, that can be **more relevant** than an exact-match but irrelevant article.

4. **Tone and Format Sensitivity**:
   - The user may want **interviews**, **player reactions**, or **analytical pieces** — not just news headlines.
   - If preferences say “prefers analysis,” don’t choose a plain match score — choose one with deeper insights.

5. **Temporal Relevance**:
   - Give **priority** to articles from the **previous day** or most recent — not outdated or old news.
   - But balance it: a slightly older but highly relevant article is better than a fresh but unrelated one.

6. **Avoid Superficial Matches**:
   - Don't include articles which has keywords like "Died" , "Death", "Accident" etc.
   - Don’t just pick the first article with matching words.
   - Ask: *“Does this article truly serve the user's interest?”*
   - Choose **substance over surface**.

---

📌 USER PREFERENCES:

- Subcategory: ${preferences.sports.subcategory || 'None'}
- Tags: ${preferences.sports.tags?.join(', ') || 'None'}
- Specific Instructions: ${preferences.sports.specificInstructions || 'None'}
- AI-Generated Preferences:
${preferences.sports.aiGeneratedAnswers?.map((ans, i) => `   ${i + 1}. ${ans}`).join('\n') || 'None'}

---

📚 ARTICLES TO CHOOSE FROM:

${topArticles.map((article, index) => `   ${index}. ${article.title} (${article.url})`).join('\n')}

---

📤 FINAL TASK:

Choose the **ONE** article from above that you think would most likely **capture the user's interest**.

Return ONLY this JSON output format:
\`\`\`json
{
  "index": <index of best article>,
  "reason": "<why this article matches the user's interests — not just textually, but conceptually>"
}
\`\`\`

❗ Very Important:
- DO NOT include any text outside of the JSON.
- The reason must show **human-like justification** (e.g., “Although Virat Kohli wasn’t mentioned, the article covers India’s captain in a T20 match, which aligns with the user’s broader interests”).

---
`;

  try {
    const result = await model.generateContent(prompt);
    console.log('Gemini response:', result);
    const text = result.response.text();
    console.log('Gemini response text:', text);
    const cleaned = text
  .replace(/^```json\s*/, '')  // remove leading ```json
  .replace(/```$/, '')         // remove trailing ```
  .trim();
  console.log('Gemini response cleaned:', cleaned);
     const json = JSON.parse(cleaned);
    console.log('Gemini response JSON:', json);
    return {
      bestArticle: topArticles[json.index],
      reason: json.reason,
    };
  } catch (err) {
    console.error('Gemini selection failed:', err.message);
    return {
      bestArticle: topArticles[0],
      reason: 'Fallback to highest scored article due to Gemini error.'
    };
  }
}

function filterPreviousDayNews(articles) {
  const now = new Date();

  // Start time: Yesterday at 12:00 AM
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(now.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  // End time: Current time
  const endTime = new Date(now);
  endTime.setHours(now.getHours()-18, now.getMinutes(), now.getSeconds(), now.getMilliseconds());

  // Filter articles published within that time range
  return articles.filter(article => {
    if (!article.date) return false;
    const articleDate = new Date(article.date);
    return articleDate >= startOfYesterday && articleDate <= endTime;
  });
}



module.exports = {
  computeRelevanceScore,
  shortlistTopArticles,
  filterPreviousDayNews,
  selectBestNewsWithGemini,
};
