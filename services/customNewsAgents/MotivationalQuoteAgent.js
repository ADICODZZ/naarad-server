const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
// Load API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.generateMotivationalQuote = async ({ specificInstructions,previousMessages }) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

   

    const prompt = `You are a motivational coach and inspiring writer.

Task:
🔷 Generate one unique Motivational Quote of the Day, based on the user’s instruction:
"${specificInstructions}"

🔷 Use this style:

WhatsApp-friendly: Short, clear, uplifting

Include a 💪 or 🌟 emoji at the top and a short title

Add line breaks for readability

🔷 Ensure:

Only output the final WhatsApp-formatted message.

Do NOT include any explanation or preface.

Do NOT repeat or closely resemble any of these previous messages:
${JSON.stringify(previousMessages)}

Now, output only the unique WhatsApp-style motivational message.`;

    const result = await model.generateContent(prompt);
    console.log('Gemini response:', result);
    
    const response = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Gemini generated query:', response);

    const cleanedQuery = response?.replace(/["“”]/g, '').trim();
    console.log('Cleaned query:', cleanedQuery);

    return cleanedQuery ;
  } catch (error) {
    console.error('Gemini error:', error.message);
    return null; // fallback
  }
};
