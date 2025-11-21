import { GoogleGenAI } from "@google/genai";
import { Subject } from "../types";

// Acesso seguro à variável de ambiente para evitar crash da tela branca
const getApiKey = (): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}
  return '';
};

const apiKey = getApiKey();

// Inicializa o cliente apenas se houver chave, ou usa uma string vazia para evitar erro fatal no construtor,
// tratando a falta de chave dentro das funções.
const ai = new GoogleGenAI({ apiKey: apiKey || 'PENDING_KEY' });

export const generateStudyPlan = async (subject: Subject, topic: string, examDate: string): Promise<string> => {
  if (!apiKey || apiKey === 'PENDING_KEY') {
      console.warn("API Key do Gemini não encontrada.");
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
    return "Erro ao conectar com o assistente robô. Tente novamente mais tarde!";
  }
};

export const getMotivationalQuote = async (): Promise<string> => {
    if (!apiKey || apiKey === 'PENDING_KEY') {
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