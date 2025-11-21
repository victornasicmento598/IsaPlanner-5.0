import { createClient } from '@supabase/supabase-js';

// =================================================================
// CONFIGURAÇÃO DO SUPABASE
// =================================================================

// Função auxiliar para ler variáveis de ambiente de forma segura.
// Evita o erro "ReferenceError: process is not defined" que causa a tela branca.
const getEnv = (key: string, fallback: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // Ignora se process não estiver definido
  }
  return fallback;
};

const SUPABASE_URL: string = getEnv('SUPABASE_URL', "https://xzznwouqvvtyivijqvel.supabase.co");
const SUPABASE_ANON_KEY: string = getEnv('SUPABASE_ANON_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6em53b3VxdnZ0eWl2aWpxdmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzQyNTksImV4cCI6MjA3OTMxMDI1OX0.GGlsUZsZbq4s-pUVAO5bbiVtbb2iPZCsVinFkc_uZf4");

// Verifica se o Supabase foi configurado corretamente
export const isSupabaseConfigured = SUPABASE_URL !== "SUA_PROJECT_URL_AQUI" && !SUPABASE_URL.includes("AQUI");

let supabaseClient = null;

if (isSupabaseConfigured) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("IsaPlanner: Cliente Supabase inicializado.");
} else {
    console.warn("IsaPlanner: Supabase não configurado. Usando modo offline (LocalStorage).");
}

export const supabase = supabaseClient;