import { createClient } from '@supabase/supabase-js';

// =================================================================
// CONFIGURAÇÃO DO SUPABASE
// =================================================================

// Função robusta para buscar variáveis de ambiente em diferentes ambientes (Vite, Next.js, Create React App)
const getEnv = (key: string, fallback: string): string => {
  // 1. Tenta usar import.meta.env (Padrão Vite/Moderno)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
       // @ts-ignore
       return import.meta.env[key] as string;
    }
  } catch (e) {}

  // 2. Tenta usar process.env (Padrão Node/CRA)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}

  // 3. Retorna fallback
  return fallback;
};

const SUPABASE_URL: string = getEnv('SUPABASE_URL', "https://xzznwouqvvtyivijqvel.supabase.co");
const SUPABASE_ANON_KEY: string = getEnv('SUPABASE_ANON_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6em53b3VxdnZ0eWl2aWpxdmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzQyNTksImV4cCI6MjA3OTMxMDI1OX0.GGlsUZsZbq4s-pUVAO5bbiVtbb2iPZCsVinFkc_uZf4");

// Verifica se o Supabase foi configurado corretamente
export const isSupabaseConfigured = SUPABASE_URL !== "SUA_PROJECT_URL_AQUI" && !SUPABASE_URL.includes("AQUI");

let supabaseClient = null;

try {
  if (isSupabaseConfigured) {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("IsaPlanner: Cliente Supabase inicializado.");
  } else {
      console.warn("IsaPlanner: Supabase não configurado. Usando modo offline (LocalStorage).");
  }
} catch (error) {
  console.error("IsaPlanner: Erro fatal ao criar cliente Supabase:", error);
}

export const supabase = supabaseClient;