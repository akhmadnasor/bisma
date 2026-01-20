import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables
// Note: In a production React app, this usually requires a backend proxy to hide the key,
// or strictly restricted API key settings in Google Cloud Console if used client-side.
const apiKey = process.env.API_KEY;

// Only initialize if key exists to prevent immediate crash, handle null check in function
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!ai) {
    return "Maaf, API Key Gemini belum dikonfigurasi. Mohon cek environment variable process.env.API_KEY.";
  }

  try {
    // Using gemini-3-flash-preview for fast, efficient text tasks (consultation/Q&A)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: "Anda adalah asisten cerdas untuk guru SD bernama 'Bisma AI'. Bantu guru dalam merencanakan pembelajaran, memberikan ide metode mengajar, solusi masalah kedisiplinan siswa, dan administrasi sekolah. Jawab dengan ramah, suportif, dan ringkas dalam Bahasa Indonesia.",
      }
    });

    return response.text || "Maaf, saya tidak dapat menghasilkan respon saat ini.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Terjadi kesalahan saat menghubungi AI: ${error.message}`;
  }
};