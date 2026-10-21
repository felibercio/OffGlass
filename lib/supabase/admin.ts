import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave de SERVIÇO (service role).
 *
 * ATENÇÃO: NUNCA importe este arquivo em um Client Component ("use client") ou
 * em qualquer código que rode no navegador. O pacote "server-only" no
 * topo faz o build FALHAR de propósito se isso acontecer, como uma rede
 * de segurança extra.
 *
 * Esta chave ignora RLS — só deve ser usada dentro de Route Handlers
 * (app/api/**) DEPOIS de confirmar que o usuário é um admin autenticado.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Defina essa variável de ambiente no servidor (Vercel → Settings → Environment Variables), nunca no código."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
