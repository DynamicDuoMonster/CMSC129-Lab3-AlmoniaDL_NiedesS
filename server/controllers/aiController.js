import ai from '../config/gemini.js';

export const askGemini = async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }], // Optional: allows real-time info
        systemInstruction: "You are an expert sneakerhead and inventory assistant for SoleSearch. Help users find shoes and manage stock efficiently."
      }
    });

    res.status(200).json({ 
      success: true, 
      answer: response.text 
    });
  } catch (error) {
    console.error("Gemini Error:", error);
    
    // Safety check: if the preview model is overloaded, 
    // it will throw a 503 or 404.
    res.status(500).json({ 
      success: false, 
      message: "AI service currently unavailable. Please try again shortly." 
    });
  }
};