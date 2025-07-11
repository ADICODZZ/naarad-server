const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
// Load API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.generateDailyHistoryFacts = async ({ specificInstructions,previousMessages }) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  

    const prompt = `You are a creative historian and writer.  

Task:  
✅ Generate a **History Fact of the Day**, based on the user’s instruction: "${specificInstructions}".  
✅ Include:  
- The year and event  
- A short, engaging explanation (1-2 sentences)

✅ Style:  
- WhatsApp-friendly: Short, clear, engaging  
- Include a 🕰️ emoji at the top and a short title  
- Use clean formatting and line breaks for readability

✅ Check:  
You are also passed a list of "${previousMesages}":  
${JSON.stringify(previousMessages)}  
Do NOT generate a fact or message that matches or closely resembles any of the previous messages. Make sure today’s message is unique.

Now generate the WhatsApp-style message accordingly.

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
