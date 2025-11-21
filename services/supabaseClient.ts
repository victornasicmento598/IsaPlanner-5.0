import { createClient } from '@supabase/supabase-js';

// =================================================================
// CONFIGURAÇÃO DO SUPABASE
// =================================================================
// ATENÇÃO: Para produção (Vercel/GitHub), configure as Environment Variables.
// O código abaixo tenta ler do process.env primeiro. Se não achar, usa o valor fixo.

const SUPABASE_URL: string = process.env.SUPABASE_URL || "https://xzznwouqvvtyivijqvel.supabase.co";
const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6em53b3VxdnZ0eWl2aWpxdmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzQyNTksImV4cCI6MjA3OTMxMDI1OX0.GGlsUZsZbq4s-pUVAO5bbiVtbb2iPZCsVinFkc_uZf4";

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