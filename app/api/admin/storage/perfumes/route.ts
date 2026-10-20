import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "image";
const FOLDER = "Fotos Perfumes";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).list(FOLDER, {
    limit: 500,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const files = (data || [])
    .filter((f) => f.id) // ignora placeholders de subpastas
    .map((f) => {
      const path = `${FOLDER}/${f.name}`;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { name: f.name, url: pub.publicUrl };
    });

  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const formData = await req.formData();
  // Aceita tanto "files" (múltiplo) quanto "file" (único)
  const allEntries = [...formData.getAll("files"), ...formData.getAll("file")];
  const files = allEntries.filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const uniqueSuffix = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    const path = `${FOLDER}/${uniqueSuffix}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

    if (error) {
      console.error(`Erro ao subir ${file.name}:`, error.message);
      continue;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (pub?.publicUrl) {
      uploadedUrls.push(pub.publicUrl);
    }
  }

  if (uploadedUrls.length === 0) {
    return NextResponse.json({ error: "Falha ao enviar arquivo(s) para o storage." }, { status: 500 });
  }

  return NextResponse.json({
    url: uploadedUrls[0],
    urls: uploadedUrls,
  });
}
