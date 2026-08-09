import { createClient } from "@/lib/supabase/server";
import {
  Product,
  Category,
  Accord,
  ProdutoRow,
  fromProdutoRow,
} from "@/types";

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data, error } = await supabase.from("categorias").select("*");
  if (error) {
    console.error("Erro ao buscar categorias:", error.message);
    return [];
  }
  return data as Category[];
}

export async function getAccords(): Promise<Accord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("acordes").select("*");
  if (error) {
    console.error("Erro ao buscar acordes:", error.message);
    return [];
  }
  return data as Accord[];
}

export async function getMensagemTemplate(chave: string, fallback: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mensagens_config")
    .select("template")
    .eq("chave", chave)
    .maybeSingle();
  return data?.template || fallback;
}
