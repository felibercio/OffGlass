"use client";

import { useState } from "react";

async function salvar(chave: string, template: string) {
  return fetch("/api/admin/mensagens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chave, template }),
  });
}

export default function MensagensManager({
  pedidoInicial,
  frascoInicial,
}: {
  pedidoInicial: string;
  frascoInicial: string;
}) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [frasco, setFrasco] = useState(frascoInicial);
  const [savingPedido, setSavingPedido] = useState(false);
  const [savingFrasco, setSavingFrasco] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSavePedido() {
    setSavingPedido(true);
    const res = await salvar("pedido", pedido);
    setSavingPedido(false);
    setMsg(res.ok ? "Mensagem de pedido salva." : "Erro ao salvar.");
  }
  async function handleSaveFrasco() {
    setSavingFrasco(true);
    const res = await salvar("frasco_lacrado", frasco);
    setSavingFrasco(false);
    setMsg(res.ok ? "Mensagem de frasco lacrado salva." : "Erro ao salvar.");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4">
      <div className="mb-5">
        <h2 className="font-display text-xl">Templates de Mensagens</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
          Personalize as mensagens automáticas enviadas ao WhatsApp. Use as variáveis entre chaves duplas — elas são
          substituídas automaticamente pelo valor real de cada pedido.
        </p>
      </div>

      {msg && (
        <div className="p-3 mb-4 rounded-xl bg-teal-50 text-teal-800 text-xs border border-teal-200">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Finalização de Pedido */}
        <div className="glass rounded-xl p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold text-stone-900">Finalização de Pedido</p>
              <span className="text-[10px] bg-teal-100/80 text-teal-800 font-medium px-2 py-0.5 rounded-full">
                WhatsApp Checkout
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
              Mensagem gerada ao fechar o carrinho de compras.
            </p>

            <div className="mb-3 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <p className="text-[11px] font-medium text-stone-600 mb-1">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-1.5">
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono">{"{{nome}}"}</code>
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono">{"{{itens}}"}</code>
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono">{"{{total}}"}</code>
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono">{"{{pagamento}}"}</code>
              </div>
            </div>

            <textarea
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              rows={8}
              className="w-full rounded-lg px-3 py-2 text-sm border border-stone-300 bg-white font-mono text-xs focus:ring-1 focus:ring-[var(--teal-deep)]"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex justify-end">
            <button
              onClick={handleSavePedido}
              disabled={savingPedido}
              className="btn-teal rounded-full px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {savingPedido ? "Salvando..." : "Salvar Template de Pedido"}
            </button>
          </div>
        </div>

        {/* Card 2: Frasco Lacrado */}
        <div className="glass rounded-xl p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold text-stone-900">Frasco Lacrado</p>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                WhatsApp Produto
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
              Mensagem gerada ao consultar disponibilidade de frasco lacrado.
            </p>

            <div className="mb-3 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <p className="text-[11px] font-medium text-stone-600 mb-1">Variável disponível:</p>
              <div className="flex flex-wrap gap-1.5">
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono">{"{{nome_produto}}"}</code>
              </div>
            </div>

            <textarea
              value={frasco}
              onChange={(e) => setFrasco(e.target.value)}
              rows={8}
              className="w-full rounded-lg px-3 py-2 text-sm border border-stone-300 bg-white font-mono text-xs focus:ring-1 focus:ring-[var(--teal-deep)]"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex justify-end">
            <button
              onClick={handleSaveFrasco}
              disabled={savingFrasco}
              className="btn-teal rounded-full px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {savingFrasco ? "Salvando..." : "Salvar Template de Frasco"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
