import { GoogleGenAI } from "@google/genai";
import { Subject } from "../types";

// Função robusta para buscar API Key
const getApiKey = (): string => {
  // 1. Tenta usar import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Tenta usar process.env (Node/CRA)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.VITE_API_KEY) {
      return process.env.VITE_API_KEY;
    }
  } catch (e) {}
  
  return '';
};

let aiInstance: GoogleGenAI | null = null;

// Inicialização preguiçosa (Lazy) para evitar crash na inicialização do app
const getAIClient = () => {
    if (aiInstance) return aiInstance;

    const key = getApiKey();
    if (!key || key === 'PENDING_KEY') {
        console.warn("API Key do Gemini não encontrada.");
        return null;
    }

    try {
        aiInstance = new GoogleGenAI({ apiKey: key });
        return aiInstance;
    } catch (e) {
        console.error("Erro ao inicializar GoogleGenAI:", e);
        return null;
    }
}

export const generateStudyPlan = async (subject: Subject, topic: string, examDate: string): Promise<string> => {
  const ai = getAIClient();
  
  if (!ai) {
      return "Para eu criar um plano de estudos, preciso que a chave da API seja configurada no Vercel!";
  }

  try {
    const prompt = `
      Você é um tutor divertido e inteligente para uma menina chamada Isabelle que está no 5º ano.
      Ela tem uma prova de ${subject} no dia ${examDate}.
      O conteúdo da prova é: "${topic}".
      
      Crie um mini plano de estudos para ela. 
      - Seja conciso (máximo 4 passos).
      - Use emojis.
      - Use uma linguagem motivadora e adequada para crianças de 10-11 anos.
      - Formate a resposta em Markdown simples.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não consegui criar o plano agora, mas você vai arrasar!";
  } catch (error) {
    console.error("Error generating study plan:", error);
    return "Erro ao conectar com o assistente robô. Verifique a chave da API.";
  }
};

export const getMotivationalQuote = async (): Promise<string> => {
    const ai = getAIClient();
    
    if (!ai) {
        return "Você é capaz de coisas incríveis!";
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Gere uma frase curta, inspiradora e divertida para uma estudante do 5º ano começar o dia estudando. Apenas a frase.",
        });
        return response.text || "Vamos aprender algo novo hoje!";
    } catch (e) {
        return "Você é capaz de coisas incríveis!";
    }
}