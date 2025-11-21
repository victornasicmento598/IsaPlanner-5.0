import { GoogleGenAI } from "@google/genai";
import { Subject } from "../types";

// --- CHAVE DA API DO GEMINI ADICIONADA DIRETAMENTE NO CÓDIGO ---
// Esta é a solução para fazer a IA funcionar na Vercel.
const GEMINI_API_KEY = "AIzaSyCFRPiKyMR-A_KYwtuvblTVBmpy1rBj1jc";


let aiInstance: GoogleGenAI | null = null;
let keyChecked = false;

// Inicialização preguiçosa (Lazy) para evitar crash na inicialização do app
const getAIClient = () => {
    if (aiInstance) return aiInstance;

    // Checa a validade da chave apenas uma vez para não poluir o console.
    if (!keyChecked) {
        if (!GEMINI_API_KEY) {
            console.warn("API Key do Gemini não foi configurada no código.");
            keyChecked = true;
            return null; // Retorna nulo se a chave for vazia
        }
        keyChecked = true;
    }
    
    // Se a chave for inválida, não tenta criar la instância.
    if (!GEMINI_API_KEY) {
        return null;
    }

    // Tenta criar a instância. Se der erro (ex: chave mal formatada), captura o erro.
    try {
        aiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        return aiInstance;
    } catch (e) {
        console.error("Erro ao inicializar GoogleGenAI. Verifique se a chave da API está correta.", e);
        return null;
    }
}

export const generateStudyPlan = async (subject: Subject, topic: string, examDate: string): Promise<string> => {
  const ai = getAIClient();
  
  if (!ai) {
      return "O Robô assistente está offline. Verifique a chave da API no código.";
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
