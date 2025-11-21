import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CHAVES ADICIONADAS DIRETAMENTE NO CÓDIGO ---
// Esta é a solução para fazer o app funcionar na Vercel sem um "build step".
const SUPABASE_URL = "https://xzznwouqvvtyivijqvel.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6em53b3VxdnZ0eWl2aWpxdmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzQyNTksImV4cCI6MjA3OTMxMDI1OX0.GGlsUZsZbq4s-pUVAO5bbiVtbb2iPZCsVinFkc_uZf4";

const isConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
let supabaseInstance: SupabaseClient | null = null;

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

    // Se não está configurado, retorne null.
    if (!isConfigured) {
        console.error("IsaPlanner: Chaves Supabase não foram configuradas no código. App não pode conectar ao banco.");
        return null;
    }

    // Se está configurado mas ainda não foi instanciado, crie a instância.
    try {
        supabaseInstance = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
        return supabaseInstance;
    } catch (error) {
        console.error("IsaPlanner: Erro CRÍTICO ao criar cliente Supabase.", error);
        return null; // Falha na criação, força o modo offline.
    }
};
