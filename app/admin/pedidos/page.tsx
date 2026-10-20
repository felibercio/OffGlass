import { createClient } from "@/lib/supabase/server";
import { PedidoRow } from "@/types";
import { formatBRL, whatsappUrl } from "@/lib/utils";

export const revalidate = 0;

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  novo: { label: "Novo", bg: "rgba(110, 156, 147, 0.18)", text: "#2c574f" },
  preparo: { label: "Em preparo", bg: "rgba(217, 164, 65, 0.18)", text: "#8f6515" },
  enviado: { label: "Enviado", bg: "rgba(91, 146, 168, 0.18)", text: "#2b5c70" },
  concluido: { label: "Concluído", bg: "rgba(110, 156, 110, 0.2)", text: "#275927" },
  cancelado: { label: "Cancelado", bg: "rgba(176, 85, 75, 0.15)", text: "#872f25" },
};

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(100);

  const pedidos = (data as PedidoRow[]) || [];

  return (
    <div className="px-4 pb-32 pt-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Histórico de Pedidos</h2>
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {pedidos.length} pedido(s) registrado(s)
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs mb-3 font-medium p-2 rounded-lg bg-red-50 text-red-600">
          Não foi possível carregar os pedidos: {error.message}
        </p>
      )}

      {pedidos.length === 0 ? (
        <p className="text-sm py-12 text-center text-stone-400">
          Nenhum pedido registrado ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => {
            const statusKey = p.status || "novo";
            const statusCfg = STATUS_LABELS[statusKey] || STATUS_LABELS.novo;
            const telLimpo = p.telefone_cliente.replace(/\D/g, "");
            const numeroCompleto = telLimpo.startsWith("55") ? telLimpo : `55${telLimpo}`;
            const msg = `Olá ${p.nome_cliente}! Aqui é da Offglass Scent referente ao seu pedido.`;
            const waLink = whatsappUrl(numeroCompleto, msg);

            return (
              <div key={p.id} className="glass rounded-xl p-4 shadow-xs border border-white/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">{p.nome_cliente}</p>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                      style={{ background: statusCfg.bg, color: statusCfg.text }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {new Date(p.criado_em).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-3 text-xs text-stone-600">
                  <p>
                    {p.telefone_cliente} · {p.forma_pagamento === "pix" ? "Pix" : "Cartão"}
                  </p>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-teal rounded-lg px-2.5 py-1 text-[11px] font-medium"
                  >
                    WhatsApp
                  </a>
                </div>

                <ul className="text-xs mb-3 space-y-1 bg-white/60 p-2.5 rounded-lg border border-black/5">
                  {p.itens?.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>
                        {item.qtd}x <span className="font-medium">{item.produto}</span> ({item.tamanho}ml)
                      </span>
                      {item.precoUnit && (
                        <span className="text-stone-500 font-mono">
                          {formatBRL(item.precoUnit * item.qtd)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-1 border-t border-black/5">
                  <span className="text-xs text-stone-500 font-medium">Total:</span>
                  <p className="font-display text-lg font-bold" style={{ color: "var(--teal-deep)" }}>
                    {formatBRL(p.total)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
