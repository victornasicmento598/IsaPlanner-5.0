import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Função para buscar variáveis de ambiente de forma segura, focada no padrão Vite.
const getEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore - Padrão Vite/Moderno é o único que precisamos para a Vercel
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[key];
    }
  } catch (e) { /* Ignora o erro se import.meta não existir */ }
  return undefined;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

const isConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;
let warningShown = false;

/**
 * Inicializa o cliente Supabase apenas uma vez (padrão Singleton "preguiçoso").
 * Isso evita que o app trave na inicialização se as chaves estiverem erradas.
 * @returns A instância do cliente Supabase ou null se não configurado.
 */
export const getSupabase = (): SupabaseClient | null => {
    // Se a instância já existe, retorne-a.
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Se não está configurado, retorne null e mostre um aviso (apenas uma vez).
    if (!isConfigured) {
        if (!warningShown) {
            console.warn("IsaPlanner: Chaves Supabase não encontradas. App rodando em modo offline (LocalStorage).");
            warningShown = true;
        }
        return null;
    }

    // Se está configurado mas ainda não foi instanciado, crie a instância.
    try {
        console.log("IsaPlanner: Tentando inicializar cliente Supabase sob demanda...");
        supabaseInstance = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
        console.log("IsaPlanner: Cliente Supabase inicializado com sucesso.");
        return supabaseInstance;
    } catch (error) {
        console.error("IsaPlanner: Erro CRÍTICO ao criar cliente Supabase. Verifique as chaves na Vercel.", error);
        return null; // Falha na criação, força o modo offline.
    }
};
