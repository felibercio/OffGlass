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
    <div className="px-4 pb-32 pt-4 max-w-xl">
      <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
        Personalize as mensagens automáticas enviadas ao WhatsApp. Use as variáveis entre chaves duplas — elas são
        substituídas automaticamente pelo valor real de cada pedido.
      </p>
      {msg && <p className="text-xs mb-3" style={{ color: "var(--teal-deep)" }}>{msg}</p>}

      <div className="glass rounded-xl p-4 mb-4">
        <p className="text-sm font-medium mb-1">Mensagem de finalização de pedido</p>
        <p className="text-[11px] mb-2" style={{ color: "var(--ink-soft)" }}>
          Variáveis disponíveis: <code>{"{{nome}}"}</code> <code>{"{{itens}}"}</code> <code>{"{{total}}"}</code>{" "}
          <code>{"{{pagamento}}"}</code>
        </p>
        <textarea
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          rows={4}
          className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
        />
        <button onClick={handleSavePedido} disabled={savingPedido} className="btn-teal rounded-full px-4 py-2 text-sm">
          {savingPedido ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="glass rounded-xl p-4">
        <p className="text-sm font-medium mb-1">Mensagem de frasco lacrado</p>
        <p className="text-[11px] mb-2" style={{ color: "var(--ink-soft)" }}>
          Variável disponível: <code>{"{{nome_produto}}"}</code>
        </p>
        <textarea
          value={frasco}
          onChange={(e) => setFrasco(e.target.value)}
          rows={3}
          className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
        />
        <button onClick={handleSaveFrasco} disabled={savingFrasco} className="btn-teal rounded-full px-4 py-2 text-sm">
          {savingFrasco ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
