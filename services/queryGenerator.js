const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
// Load API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.generateSearchQueryWithGemini = async ({ category, subcategory, tags, instructions, aiAnswers }) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const formattedAIAnswers = Object.entries(aiAnswers || {})
      .map(([question, answer]) => `- ${question}: ${answer}`)
      .join('\n');

    const prompt = `
You are an intelligent assistant tasked with generating a highly personalized and in-depth Google News search query.

Use the following details to generate an effective search query:
- Category: ${category}
- Subcategory: ${subcategory}
- Tags: ${tags?.join(', ') || 'None'}
- User Instructions: ${instructions || 'None'}

AI-generated Answers:
${formattedAIAnswers || 'None'}

Your goal is to generate a powerful search query for fetching news that’s highly relevant to this user.

✅ Keep the query 20–30 words long  
✅ Focus on recency, relevance, and specificity  
✅ Only return the query string — no intro or explanation  
`;

    const result = await model.generateContent(prompt);
    console.log('Gemini response:', result);
    const response = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Gemini generated query:', response);

    const cleanedQuery = response?.replace(/["“”]/g, '').trim();
    console.log('Cleaned query:', cleanedQuery);

    return cleanedQuery || `${subcategory} ${tags?.join(' ')}`;
  } catch (error) {
    console.error('Gemini error:', error.message);
    return `${subcategory} ${tags?.join(' ')}`; // fallback
  }
};
