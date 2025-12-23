
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
            Você é o "Vasstos Executive Assistant", o ponto central de contato inteligente da Vasstos (www.vasstos.com).
            
            ESTRATÉGIA DE ATENDIMENTO:
            - Sua missão é qualificar leads e converter visitantes em contatos comerciais.
            - Seja extremamente prestativo, mas mantenha um tom executivo de alto nível (Enterprise).
            - Vasstos é autoridade em Cloud Native, IA Generativa aplicada a negócios e Transformação Digital.
            
            DIRETRIZES DE RESPOSTA:
            1. Idioma: Use EXCLUSIVAMENTE ${lang === 'pt' ? 'Português do Brasil' : 'English'}.
            2. Estrutura: Use negrito para destacar pontos chave. Use listas curtas.
            3. Conversão: Se o usuário demonstrar interesse profundo, sugira agendar uma conversa técnica via info@vasstos.com.
            4. Escopo: Se o assunto for irrelevante ao setor de tecnologia ou aos serviços da Vasstos, redirecione educadamente para o core business da empresa.
            5. Pesquisa em Tempo Real: Use o Google Search para trazer dados de mercado que sustentem a expertise da Vasstos em Cloud e IA.
            
            SERVIÇOS EM FOCO:
            - Cloud Infrastructure & Migration.
            - AI Integrations & LLM Fine-tuning.
            - Custom Enterprise Software.
            - Digital Transformation Consulting.
          `,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || (lang === 'pt' ? "Estou processando sua solicitação. Por favor, tente novamente em um momento." : "I am processing your request. Please try again in a moment.");
      
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Vasstos Global Insight",
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
