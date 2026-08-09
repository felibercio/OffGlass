import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Product, toProdutoRow } from "@/types";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const product = (await req.json()) as Product;
  if (!product.marca?.trim() || !product.nome?.trim()) {
    return NextResponse.json({ error: "Marca e nome são obrigatórios." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("produtos").upsert(toProdutoRow(product));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

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

  return NextResponse.json({ ok: true });
}
