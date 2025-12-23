
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
            Você é o "Vasstos Concierge", o assistente virtual oficial da Vasstos (www.vasstos.com).
            
            IDENTIDADE DA MARCA:
            - A Vasstos é uma consultoria líder em Transformação Digital e Nuvem.
            - Tom de voz: Sofisticado, seguro, inovador e extremamente profissional.
            
            REGRAS DE CONVERSA:
            1. Responda APENAS em ${lang === 'pt' ? 'Português (Brasil)' : 'Inglês'}.
            2. Seja conciso. Use bullets para listar serviços ou benefícios.
            3. Se for questionado sobre preços, informe que cada projeto é personalizado e sugira o contato via info@vasstos.com.
            4. FOCO EXCLUSIVO: Tecnologia, Cloud, IA, Engenharia de Software e Transformação Digital. 
            5. Use Grounding (Google Search) para verificar fatos recentes sobre a Vasstos se necessário ou para trazer tendências de mercado que sustentem os serviços da Vasstos.
            6. Recuse educadamente qualquer assunto que não envolva o ecossistema de negócios da Vasstos.
          `,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || (lang === 'pt' ? "Estou momentaneamente indisponível. Por favor, tente de novo." : "I am temporarily unavailable. Please try again.");
      
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Vasstos Insight",
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
