import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

interface PedidoRow {
  id: string;
  nome_cliente: string;
  telefone_cliente: string;
  itens: { produto: string; tamanho: number; qtd: number; precoUnit: number }[];
  forma_pagamento: string;
  total: number;
  criado_em: string;
}

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(100);

  const pedidos = (data as PedidoRow[]) || [];

  return (
    <div className="px-4 pb-32 pt-4">
      <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
        Pedidos enviados pelas clientes antes de seguirem para o WhatsApp. Dado visível só para o admin autenticado.
      </p>
      {error && (
        <p className="text-xs mb-3" style={{ color: "#B0554B" }}>
          Não foi possível carregar os pedidos: {error.message}
        </p>
      )}
      {pedidos.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--ink-soft)" }}>
          Nenhum pedido registrado ainda.
        </p>
      ) : (
        pedidos.map((p) => (
          <div key={p.id} className="glass rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{p.nome_cliente}</p>
              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                {new Date(p.criado_em).toLocaleString("pt-BR")}
              </p>
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--ink-soft)" }}>
              {p.telefone_cliente} · {p.forma_pagamento === "pix" ? "Pix" : "Cartão"}
            </p>
            <ul className="text-xs mb-2 space-y-0.5">
              {p.itens?.map((item, idx) => (
                <li key={idx}>
                  {item.qtd}x {item.produto} ({item.tamanho}ml)
                </li>
              ))}
            </ul>
            <p className="font-display text-lg" style={{ color: "var(--teal-deep)" }}>
              R$ {p.total.toFixed(0)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
