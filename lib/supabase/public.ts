import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase leve para leitura de dados públicos (produtos, categorias, acordes).
 * Não depende de cookies de sessão, permitindo que o Next.js faça cache estático
 * e ISR das páginas públicas na CDN Edge da Vercel sem bloqueio de renderização dinâmica.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
