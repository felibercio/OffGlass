import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PedidoStatus } from "@/types";

const VALID_STATUSES: PedidoStatus[] = ["novo", "preparo", "enviado", "concluido", "cancelado"];

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pedidos: data || [] });
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id, status } = await req.json().catch(() => ({}));

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID do pedido inválido." }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Status do pedido inválido." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, status });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("pedidos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
