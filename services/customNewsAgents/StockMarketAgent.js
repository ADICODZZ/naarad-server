const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
// Load API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.generateRecipe = async ({ specificInstructions }) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    

    const prompt = `You are a professional chef and a creative writer.  

Task:
✅ Generate a recipe based on these user instructions:  
"{specific_instructions}"  
(The instructions might specify cuisine, preferred ingredients, dietary restrictions, or a theme — respect them fully.)

✅ Then format the recipe as a **WhatsApp message** that is:
- Friendly and engaging
- Starts with a catchy title or headline
- Clearly lists ingredients and then steps
- Uses emojis where appropriate (but not over the top)
- Keeps the recipe easy to follow, with short paragraphs
- Fits in a single WhatsApp message

Example of style:
🌮 *Mexican Veggie Tacos*
Ingredients:
- 4 corn tortillas
- 1 cup black beans
- …
Steps:
1️⃣ Heat the tortillas…  
2️⃣ Prepare the filling…  
3️⃣ Assemble and enjoy!

Now generate the recipe accordingly.

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
