
import { GoogleGenAI } from "@google/genai";
import { VASSTOS_BRAND, I18N } from "../constants";
import { Language } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getChatResponse(userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], lang: Language) {
    const t = I18N[lang];
    
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `
            You are the "Vasstos Academy Advisor", the international education specialist for Vasstos Academy (www.vasstos.com).
            
            CORE IDENTITY:
            - Vasstos is essentially a PROFESSIONAL TRAINING ACADEMY.
            - We focus on high-level technical training, international certifications, and corporate education.
            - We serve both local and global students.
            
            BILINGUAL STRATEGY:
            - You are fully bilingual in Portuguese (PT-BR) and English (EN-US).
            - The current UI language is ${lang.toUpperCase()}. You should primarily respond in this language.
            - However, if the user speaks to you in the other language (PT or EN), detect it and respond in that language naturally, while still promoting Vasstos Academy.
            - Always maintain an executive, inspiring, and academic tone.
            
            SPECIFIC GUIDELINES:
            1. Language Consistency: Respect the current selection but be flexible if the user switches mid-conversation.
            2. Highlighting: Use bold for course names and certifications. Use lists for readability.
            3. Conversion: Encourage users to download the full syllabus or speak with a coordinator via info@vasstos.com.
            4. Scope: If the topic is outside professional education or tech, gently redirect to Vasstos's learning tracks.
            5. Market Insights: Use Google Search to verify current IT market trends and certification demands to provide expert advice.
          `,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || (lang === 'pt' ? "Estou processando sua solicitação acadêmica. Por favor, tente novamente." : "I am processing your academic request. Please try again.");
      
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Vasstos Academy Resource",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri !== "") || [];

      return { text, sources };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
