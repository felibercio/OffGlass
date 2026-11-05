import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { BannersConfig } from "@/types";

const BUCKET = "image";
const FOLDER = "banners";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const supabase = createAdminClient();
  let map = new Map<string, string>();

  // 1. Tenta ler de site_config
  const { data: siteConfigData, error: siteConfigError } = await supabase
    .from("site_config")
    .select("chave, valor");

  if (!siteConfigError && siteConfigData && siteConfigData.length > 0) {
    map = new Map(siteConfigData.map((d) => [d.chave, d.valor]));
  } else {
    // 2. Fallback resiliente para mensagens_config
    const { data: msgConfigData } = await supabase
      .from("mensagens_config")
      .select("chave, template")
      .like("chave", "banner_%");

    if (msgConfigData) {
      map = new Map(msgConfigData.map((d) => [d.chave, d.template]));
    }
  }

  const config: BannersConfig = {
    top: {
      ativo: map.get("banner_top_ativo") === "true",
      desktop: map.get("banner_top_desktop") || "",
      mobile: map.get("banner_top_mobile") || "",
      link: map.get("banner_top_link") || "",
    },
    hero: {
      ativo: map.has("banner_hero_ativo") ? map.get("banner_hero_ativo") !== "false" : true,
      desktop: map.get("banner_hero_desktop") || map.get("banner_desktop") || "/banner-desktop.png",
      mobile: map.get("banner_hero_mobile") || map.get("banner_mobile") || "/banner-mobile.png",
      link: map.get("banner_hero_link") || "",
    },
  };

  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const supabase = createAdminClient();
  const formData = await req.formData();

  // Top banner values
  const topAtivo = formData.get("topAtivo") === "true";
  let topDesktop = (formData.get("topDesktop") as string) || "";
  let topMobile = (formData.get("topMobile") as string) || "";
  const topLink = (formData.get("topLink") as string) || "";

  // Hero banner values
  const heroAtivo = formData.get("heroAtivo") === "true";
  let heroDesktop = (formData.get("heroDesktop") as string) || "/banner-desktop.png";
  let heroMobile = (formData.get("heroMobile") as string) || "/banner-mobile.png";
  const heroLink = (formData.get("heroLink") as string) || "";

  // Files
  const fileTopDesktop = formData.get("fileTopDesktop") as File | null;
  const fileTopMobile = formData.get("fileTopMobile") as File | null;
  const fileHeroDesktop = formData.get("fileHeroDesktop") as File | null;
  const fileHeroMobile = formData.get("fileHeroMobile") as File | null;

  async function uploadFile(file: File, prefix: string): Promise<string | null> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${FOLDER}/${prefix}-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/png",
      upsert: true,
    });
    if (error) {
      console.error(`Erro no upload ${prefix}:`, error.message);
      return null;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return pub?.publicUrl || null;
  }

  if (fileTopDesktop && fileTopDesktop.size > 0) {
    const url = await uploadFile(fileTopDesktop, "top-desktop");
    if (url) topDesktop = url;
  }

  if (fileTopMobile && fileTopMobile.size > 0) {
    const url = await uploadFile(fileTopMobile, "top-mobile");
    if (url) topMobile = url;
  }

  if (fileHeroDesktop && fileHeroDesktop.size > 0) {
    const url = await uploadFile(fileHeroDesktop, "hero-desktop");
    if (url) heroDesktop = url;
  }

  if (fileHeroMobile && fileHeroMobile.size > 0) {
    const url = await uploadFile(fileHeroMobile, "hero-mobile");
    if (url) heroMobile = url;
  }

  const rawUpdates = [
    { chave: "banner_top_ativo", valor: topAtivo ? "true" : "false" },
    { chave: "banner_top_desktop", valor: topDesktop },
    { chave: "banner_top_mobile", valor: topMobile },
    { chave: "banner_top_link", valor: topLink },
    { chave: "banner_hero_ativo", valor: heroAtivo ? "true" : "false" },
    { chave: "banner_hero_desktop", valor: heroDesktop },
    { chave: "banner_hero_mobile", valor: heroMobile },
    { chave: "banner_hero_link", valor: heroLink },
  ];

  // 1. Tenta salvar na tabela site_config
  const siteConfigUpdates = rawUpdates.map((item) => ({
    ...item,
    atualizado_em: new Date().toISOString(),
  }));

  const { error: siteConfigError } = await supabase
    .from("site_config")
    .upsert(siteConfigUpdates);

  // Se site_config falhar (ex: tabela não existe no schema do Supabase - PGRST205),
  // faz fallback automático e transparente para a tabela mensagens_config (chave/template)
  if (siteConfigError) {
    console.warn(
      "site_config indisponível no Supabase, salvando em mensagens_config:",
      siteConfigError.message
    );

    const msgConfigUpdates = rawUpdates.map((item) => ({
      chave: item.chave,
      template: item.valor,
    }));

    const { error: msgError } = await supabase
      .from("mensagens_config")
      .upsert(msgConfigUpdates);

    if (msgError) {
      console.error("Erro ao salvar em mensagens_config:", msgError.message);
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/banners");

  const responseConfig: BannersConfig = {
    top: {
      ativo: topAtivo,
      desktop: topDesktop,
      mobile: topMobile,
      link: topLink,
    },
    hero: {
      ativo: heroAtivo,
      desktop: heroDesktop,
      mobile: heroMobile,
      link: heroLink,
    },
  };

  return NextResponse.json({ ok: true, config: responseConfig });
}
