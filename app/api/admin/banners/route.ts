import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const BUCKET = "image";
const FOLDER = "banners";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("site_config")
    .select("chave, valor")
    .in("chave", ["banner_desktop", "banner_mobile"]);

  const bannerDesktop = data?.find((d) => d.chave === "banner_desktop")?.valor || "/banner-desktop.png";
  const bannerMobile = data?.find((d) => d.chave === "banner_mobile")?.valor || "/banner-mobile.png";

  return NextResponse.json({ bannerDesktop, bannerMobile });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const supabase = createAdminClient();
  const formData = await req.formData();

  let bannerDesktop = formData.get("bannerDesktop") as string | null;
  let bannerMobile = formData.get("bannerMobile") as string | null;

  const fileDesktop = formData.get("fileDesktop") as File | null;
  const fileMobile = formData.get("fileMobile") as File | null;

  // Processa upload desktop se houver arquivo
  if (fileDesktop && fileDesktop.size > 0) {
    const safeName = fileDesktop.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${FOLDER}/${Date.now()}-desktop-${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, fileDesktop, {
      contentType: fileDesktop.type || "image/png",
      upsert: true,
    });
    if (error) {
      console.error("Erro no upload do banner desktop:", error.message);
      return NextResponse.json({ error: `Erro no upload desktop: ${error.message}` }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (pub?.publicUrl) bannerDesktop = pub.publicUrl;
  }

  // Processa upload mobile se houver arquivo
  if (fileMobile && fileMobile.size > 0) {
    const safeName = fileMobile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${FOLDER}/${Date.now()}-mobile-${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, fileMobile, {
      contentType: fileMobile.type || "image/png",
      upsert: true,
    });
    if (error) {
      console.error("Erro no upload do banner mobile:", error.message);
      return NextResponse.json({ error: `Erro no upload mobile: ${error.message}` }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (pub?.publicUrl) bannerMobile = pub.publicUrl;
  }

  // Salva na tabela site_config
  const updates = [];
  if (bannerDesktop) {
    updates.push({ chave: "banner_desktop", valor: bannerDesktop, atualizado_em: new Date().toISOString() });
  }
  if (bannerMobile) {
    updates.push({ chave: "banner_mobile", valor: bannerMobile, atualizado_em: new Date().toISOString() });
  }

  if (updates.length > 0) {
    const { error: dbError } = await supabase.from("site_config").upsert(updates);
    if (dbError) {
      console.error("Erro ao salvar site_config:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/banners");

  return NextResponse.json({
    ok: true,
    bannerDesktop: bannerDesktop || "/banner-desktop.png",
    bannerMobile: bannerMobile || "/banner-mobile.png",
  });
}

