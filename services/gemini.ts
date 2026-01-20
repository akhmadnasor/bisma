import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables.
// SAFETY: Check if process is defined to avoid ReferenceError in some browser environments (Netlify/Vite)
const getApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    // In strict browser environments without polyfills, accessing process might fail.
    // Return undefined so the app loads, but AI features will alert the user.
    return undefined;
  }
};

const apiKey = getApiKey();

// Only initialize if key exists to prevent immediate crash, handle null check in function
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!ai) {
    return "Maaf, API Key Gemini belum dikonfigurasi. Mohon tambahkan 'API_KEY' di Environment Variables Netlify Anda.";
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