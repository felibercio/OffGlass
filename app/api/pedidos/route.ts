import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PedidoItem, FormaPagamento } from "@/types";

interface PedidoBody {
  nomeCliente: string;
  telefoneCliente: string;
  itens: PedidoItem[];
  formaPagamento: FormaPagamento;
  total: number;
}

export async function POST(req: NextRequest) {
  let body: PedidoBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { nomeCliente, telefoneCliente, itens, formaPagamento, total } = body;

  if (!nomeCliente?.trim() || !telefoneCliente?.trim()) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios." }, { status: 400 });
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ error: "O pedido precisa ter ao menos um item." }, { status: 400 });
  }
  if (!["pix", "cartao"].includes(formaPagamento)) {
    return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("pedidos").insert({
    nome_cliente: nomeCliente.trim().slice(0, 200),
    telefone_cliente: telefoneCliente.trim().slice(0, 40),
    itens,
    forma_pagamento: formaPagamento,
    total,
    status: "novo",
  });

  if (error) {
    console.error("Erro ao salvar pedido:", error.message);
    return NextResponse.json({ error: "Não foi possível salvar o pedido." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
