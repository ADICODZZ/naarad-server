const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
// Load API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.generateRecipe = async ({ specificInstructions,previousMessages }) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

   

    const prompt = `You are a professional chef and a creative writer.

🎯 Task:
- Generate **one unique recipe** based on these user instructions:  
"${specificInstructions}"  
(The instructions might specify cuisine, preferred ingredients, dietary restrictions, or a theme — respect them fully.)

🎯 Style:
- Output **only the recipe**, nothing else. Do not add introductions, explanations, or apologies.
- WhatsApp-friendly: Short, clean, and engaging.
- Starts with a catchy title or headline, styled with a relevant emoji.
- Clearly lists **Ingredients** and then **Steps**, with proper indentation.
- Use emojis where appropriate (but not excessive).
- Keep the recipe easy to follow, with short paragraphs.
- Fits within a single WhatsApp message.

🎯 Check:
You are also passed a list of "${previousMessages}":  
${JSON.stringify(previousMessages)}  
Do NOT generate a recipe that matches or closely resembles any of the previous messages. Make sure today’s recipe is unique.

✍️ Output only the recipe, in the requested style.

`;

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
