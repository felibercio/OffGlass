import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no navegador.
 * Usa APENAS a chave pública (anon key) — só consegue LER dados
 * (produtos, categorias, acordes), nunca escrever. As políticas de
 * RLS no banco garantem isso mesmo que alguém inspecione o código.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
