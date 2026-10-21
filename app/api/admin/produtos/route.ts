import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Product, toProdutoRow } from "@/types";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const product = body as Product;
  const newCategoryLabel = body.newCategoryLabel as string | undefined;

  if (!product.marca?.trim() || !product.nome?.trim()) {
    return NextResponse.json({ error: "Marca e nome são obrigatórios." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Se foi criada uma nova categoria via formulário, cadastra na tabela de categorias
  if (newCategoryLabel && product.categoria) {
    await supabase.from("categorias").upsert({
      key: product.categoria,
      label: newCategoryLabel.trim(),
    }, { onConflict: "key" });
    revalidatePath("/admin/categorias");
  }

  const { error } = await supabase.from("produtos").upsert(toProdutoRow(product));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
