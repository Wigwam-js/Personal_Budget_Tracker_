import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'transfer 2 rupees to hdfc from slice internal transfer',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: 'One of: add_transaction, add_due, general_response' },
            responseMessage: { type: Type.STRING, description: 'Friendly response to the user' },
          },
          required: ['action', 'responseMessage'],
        },
      },
    });
    console.log("SUCCESS:", response.text);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
