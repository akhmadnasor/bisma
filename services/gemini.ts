import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Function to send message using a dynamic API key provided by the component
export const sendMessageToGemini = async (message: string, dynamicApiKey?: string): Promise<string> => {
  // 1. Prioritize Dynamic Key from DB (App Config)
  // 2. Fallback to Process Env
  const apiKey = dynamicApiKey || process.env.API_KEY;

  if (!apiKey) {
    return "Maaf, API Key Gemini belum dikonfigurasi oleh Admin Sekolah. Silahkan hubungi Operator.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-flash-preview for fast, efficient text tasks
    // (Note: Using the correct model name as per instructions if available, or falling back to a standard one)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Updated to a standard available model
      contents: message,
      config: {
        systemInstruction: "Anda adalah asisten cerdas bernama 'Bisma AI' untuk guru dan siswa SD. Jawab dengan ramah, suportif, edukatif, dan ringkas dalam Bahasa Indonesia.",
      }
    });

    return response.text || "Maaf, saya tidak dapat menghasilkan respon saat ini.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Terjadi kesalahan koneksi AI: ${error.message}`;
  }
};