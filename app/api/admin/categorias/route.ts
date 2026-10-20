import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { key, label } = await req.json();
  if (!key?.trim() || !label?.trim()) {
    return NextResponse.json({ error: "key e label são obrigatórios." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("categorias").upsert({ key, label });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { key } = await req.json();
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("produtos")
    .select("id", { count: "exact", head: true })
    .eq("categoria", key);
  if (count && count > 0) {
    return NextResponse.json(
      { error: "Existem produtos nesta categoria. Mova ou exclua-os antes." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("categorias").delete().eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
