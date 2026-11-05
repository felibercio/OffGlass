import { createPublicClient } from "@/lib/supabase/public";
import {
  Product,
  Category,
  Accord,
  ProdutoRow,
  fromProdutoRow,
  BannersConfig,
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

export async function getBannersConfig(): Promise<BannersConfig> {
  const fallback: BannersConfig = {
    top: {
      ativo: false,
      desktop: "",
      mobile: "",
      link: "",
    },
    hero: {
      ativo: true,
      desktop: "/banner-desktop.png",
      mobile: "/banner-mobile.png",
      link: "",
    },
  };

  try {
    const supabase = createPublicClient();
    let map = new Map<string, string>();

    // 1. Tenta ler da tabela site_config
    const { data: siteData, error: siteError } = await supabase
      .from("site_config")
      .select("chave, valor");

    if (!siteError && siteData && siteData.length > 0) {
      map = new Map(siteData.map((d) => [d.chave, d.valor]));
    } else {
      // 2. Fallback resiliente para a tabela mensagens_config (chave/template)
      const { data: msgData } = await supabase
        .from("mensagens_config")
        .select("chave, template")
        .like("chave", "banner_%");

      if (msgData && msgData.length > 0) {
        map = new Map(msgData.map((d) => [d.chave, d.template]));
      }
    }

    if (map.size === 0) return fallback;

    return {
      top: {
        ativo: map.get("banner_top_ativo") === "true",
        desktop: map.get("banner_top_desktop") || fallback.top.desktop,
        mobile: map.get("banner_top_mobile") || fallback.top.mobile,
        link: map.get("banner_top_link") || "",
      },
      hero: {
        ativo: map.has("banner_hero_ativo") ? map.get("banner_hero_ativo") !== "false" : true,
        desktop: map.get("banner_hero_desktop") || map.get("banner_desktop") || fallback.hero.desktop,
        mobile: map.get("banner_hero_mobile") || map.get("banner_mobile") || fallback.hero.mobile,
        link: map.get("banner_hero_link") || "",
      },
    };
  } catch {
    return fallback;
  }
}

