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

  const row = toProdutoRow(product);
  let { error } = await supabase.from("produtos").upsert(row);

  // Se o Supabase reclamar que colunas recentes não existem no schema cache (banco ainda sem migração 05)
  if (error && error.message && error.message.includes("Could not find the") && error.message.includes("column")) {
    console.warn("Colunas recentes não encontradas na tabela produtos. Tentando salvamento retrocompatível:", error.message);

    // Se for exclusivamente frasco lacrado, salva na categoria 'lacrados' para manter compatibilidade no catálogo legado
    const fallbackCategoria =
      product.vendeLacrado && !product.vendeDecant
        ? "lacrados"
        : row.categoria;

    // Remove as colunas novas não reconhecidas pelo banco
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { preco_frasco_lacrado, vende_decant, vende_lacrado, ...legacyRow } = row;

    const retry = await supabase.from("produtos").upsert({
      ...legacyRow,
      categoria: fallbackCategoria,
    });
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/");
  revalidatePath("/admin/produtos");
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
