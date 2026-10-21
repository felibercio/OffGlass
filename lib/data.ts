import { createPublicClient } from "@/lib/supabase/public";
import {
  Product,
  Category,
  Accord,
  ProdutoRow,
  fromProdutoRow,
} from "@/types";

export async function getProducts(): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("id");
  if (error) {
    console.error("Erro ao buscar produtos:", error.message);
    return [];
  }
  return (data as ProdutoRow[]).map(fromProdutoRow);
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("categorias").select("*");
  if (error) {
    console.error("Erro ao buscar categorias:", error.message);
    return [];
  }
  return data as Category[];
}

export async function getAccords(): Promise<Accord[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("acordes").select("*");
  if (error) {
    console.error("Erro ao buscar acordes:", error.message);
    return [];
  }
  return data as Accord[];
}

export async function getMensagemTemplate(chave: string, fallback: string): Promise<string> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("mensagens_config")
    .select("template")
    .eq("chave", chave)
    .maybeSingle();
  return data?.template || fallback;
}

export async function getSalesCounts(): Promise<Record<string, number>> {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return {};
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data } = await supabase.from("pedidos").select("itens");
    const counts: Record<string, number> = {};
    if (data) {
      for (const row of data) {
        if (Array.isArray(row.itens)) {
          for (const it of row.itens) {
            const name = (it as { produto?: string; qtd?: number }).produto;
            if (name) {
              counts[name] = (counts[name] || 0) + ((it as { qtd?: number }).qtd || 1);
            }
          }
        }
      }
    }
    return counts;
  } catch {
    return {};
  }
}

