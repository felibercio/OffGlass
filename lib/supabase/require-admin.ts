import "server-only";
import { createClient } from "./server";

/**
 * Confere se existe uma sessão válida do Supabase Auth (usuária logada
 * no /admin). Retorna o usuário se autenticado, ou null caso contrário.
 * Use isto no início de toda Route Handler que faz escrita.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
