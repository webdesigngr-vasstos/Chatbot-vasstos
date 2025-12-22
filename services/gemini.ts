
import { GoogleGenAI } from "@google/genai";
import { VASSTOS_BRAND, I18N } from "../constants";
import { Language } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Fix: Initialize GoogleGenAI using process.env.API_KEY directly as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getChatResponse(userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], lang: Language) {
    const t = I18N[lang];
    
    try {
      // Fix: Use ai.models.generateContent directly and ensure roles are 'user' or 'model'
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `
            You are the "Vasstos AI Concierge", a highly professional virtual assistant for Vasstos (www.vasstos.com).
            
            Current Language: ${lang === 'pt' ? 'Portuguese (Brazilian)' : 'English'}.
            You MUST respond ONLY in ${lang === 'pt' ? 'Portuguese' : 'English'}.
            
            Vasstos Profile:
            - Mission: ${t.description}
            - Core Services: ${t.services.join(", ")}
            - Tone: Corporate yet innovative, reassuring, expert-level.
            
            Guidelines:
            1. Always identify as the Vasstos AI Concierge.
            2. Provide specific details about services when asked.
            3. If a question is outside the scope of Vasstos services, politely redirect the user back to technology or consulting topics.
            4. Use Google Search grounding for tech trends to ensure up-to-date answers.
            5. Keep responses concise and well-formatted using Markdown.
          `,
          tools: [{ googleSearch: {} }],
        },
      });

      // Fix: Access response.text directly as it is a property/getter
      const text = response.text || (lang === 'pt' ? "Desculpe, não consegui processar o pedido." : "I'm sorry, I couldn't process that request.");
      
      // Correct extraction of URLs from grounding chunks as per search grounding instructions
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Reference",
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
