"use client";

import { useMemo, useState } from "react";
import { FormaPagamento, PedidoItem, PedidoRow, PedidoStatus } from "@/types";
import { formatBRL, whatsappUrl } from "@/lib/utils";

type Periodo = "hoje" | "7d" | "30d" | "mes" | "tudo";

const STATUS_LABELS: Record<PedidoStatus, { label: string; bg: string; text: string }> = {
  novo: { label: "Novo", bg: "rgba(110, 156, 147, 0.18)", text: "#2c574f" },
  preparo: { label: "Em preparo", bg: "rgba(217, 164, 65, 0.18)", text: "#8f6515" },
  enviado: { label: "Enviado", bg: "rgba(91, 146, 168, 0.18)", text: "#2b5c70" },
  concluido: { label: "Concluído", bg: "rgba(110, 156, 110, 0.2)", text: "#275927" },
  cancelado: { label: "Cancelado", bg: "rgba(176, 85, 75, 0.15)", text: "#872f25" },
};

export default function SalesDashboard({ initialPedidos }: { initialPedidos: PedidoRow[] }) {
  const [pedidos, setPedidos] = useState<PedidoRow[]>(initialPedidos);
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtragem por Período
  const pedidosNoPeriodo = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return pedidos.filter((p) => {
      const dataPedido = new Date(p.criado_em);
      if (periodo === "tudo") return true;
      if (periodo === "hoje") return dataPedido >= startOfToday;
      if (periodo === "7d") {
        const seteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return dataPedido >= seteDiasAtras;
      }
      if (periodo === "30d") {
        const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return dataPedido >= trintaDiasAtras;
      }
      if (periodo === "mes") {
        return (
          dataPedido.getFullYear() === now.getFullYear() && dataPedido.getMonth() === now.getMonth()
        );
      }
      return true;
    });
  }, [pedidos, periodo]);

  // KPIs
  const kpis = useMemo(() => {
    // Pedidos válidos (ignora cancelados para faturamento se houver)
    const validos = pedidosNoPeriodo.filter((p) => (p.status || "novo") !== "cancelado");
    const faturamentoTotal = validos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const totalPedidos = pedidosNoPeriodo.length;
    const ticketMedio = validos.length > 0 ? faturamentoTotal / validos.length : 0;

    let totalDecants = 0;
    validos.forEach((p) => {
      if (Array.isArray(p.itens)) {
        p.itens.forEach((it) => {
          totalDecants += it.qtd || 1;
        });
      }
    });

    return { faturamentoTotal, totalPedidos, ticketMedio, totalDecants };
  }, [pedidosNoPeriodo]);

  // Divisão por método de pagamento
  const pagamentoStats = useMemo(() => {
    const validos = pedidosNoPeriodo.filter((p) => (p.status || "novo") !== "cancelado");
    const pix = validos.filter((p) => p.forma_pagamento === "pix");
    const cartao = validos.filter((p) => p.forma_pagamento === "cartao");

    const totalPix = pix.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const totalCartao = cartao.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const totalGeral = totalPix + totalCartao;

    const pctPix = totalGeral > 0 ? Math.round((totalPix / totalGeral) * 100) : 0;
    const pctCartao = totalGeral > 0 ? 100 - pctPix : 0;

    return { totalPix, totalCartao, qtdPix: pix.length, qtdCartao: cartao.length, pctPix, pctCartao };
  }, [pedidosNoPeriodo]);

  // Divisão por volumetria (2ml, 5ml, 10ml)
  const volumeStats = useMemo(() => {
    const validos = pedidosNoPeriodo.filter((p) => (p.status || "novo") !== "cancelado");
    let ml2 = 0;
    let ml5 = 0;
    let ml10 = 0;

    validos.forEach((p) => {
      p.itens?.forEach((it) => {
        const sz = Number(it.tamanho);
        const q = Number(it.qtd) || 1;
        if (sz === 2) ml2 += q;
        else if (sz === 5) ml5 += q;
        else if (sz === 10) ml10 += q;
      });
    });

    const total = ml2 + ml5 + ml10;
    return {
      ml2,
      ml5,
      ml10,
      total,
      pct2: total > 0 ? Math.round((ml2 / total) * 100) : 0,
      pct5: total > 0 ? Math.round((ml5 / total) * 100) : 0,
      pct10: total > 0 ? Math.round((ml10 / total) * 100) : 0,
    };
  }, [pedidosNoPeriodo]);

  // Ranking de Perfumes mais vendidos
  const rankingPerfumes = useMemo(() => {
    const validos = pedidosNoPeriodo.filter((p) => (p.status || "novo") !== "cancelado");
    const map = new Map<string, { nome: string; qtd: number; receita: number }>();

    validos.forEach((p) => {
      p.itens?.forEach((it) => {
        const chave = it.produto;
        const atual = map.get(chave) || { nome: chave, qtd: 0, receita: 0 };
        const qtd = Number(it.qtd) || 1;
        const unit = Number(it.precoUnit) || 0;
        atual.qtd += qtd;
        atual.receita += unit * qtd;
        map.set(chave, atual);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qtd - a.qtd || b.receita - a.receita)
      .slice(0, 5);
  }, [pedidosNoPeriodo]);

  // Gráfico de vendas diárias
  const graficoDias = useMemo(() => {
    const diasMap = new Map<string, { label: string; total: number; count: number }>();
    const diasParaGerar = periodo === "hoje" ? 1 : periodo === "7d" ? 7 : periodo === "30d" || periodo === "mes" ? 14 : 10;
    const now = new Date();

    for (let i = diasParaGerar - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const chave = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      diasMap.set(chave, { label, total: 0, count: 0 });
    }

    pedidosNoPeriodo.forEach((p) => {
      if ((p.status || "novo") === "cancelado") return;
      const chave = p.criado_em.slice(0, 10);
      if (diasMap.has(chave)) {
        const item = diasMap.get(chave)!;
        item.total += Number(p.total) || 0;
        item.count += 1;
      }
    });

    const lista = Array.from(diasMap.values());
    const maxTotal = Math.max(...lista.map((d) => d.total), 1);
    return { lista, maxTotal };
  }, [pedidosNoPeriodo, periodo]);

  // Lista de Pedidos filtrada pela busca e status
  const pedidosFiltrados = useMemo(() => {
    return pedidosNoPeriodo.filter((p) => {
      const matchStatus = statusFilter === "todos" || (p.status || "novo") === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchStatus;

      const matchNome = p.nome_cliente?.toLowerCase().includes(term);
      const matchTel = p.telefone_cliente?.toLowerCase().includes(term);
      const matchItem = p.itens?.some((i) => i.produto?.toLowerCase().includes(term));
      return matchStatus && (matchNome || matchTel || matchItem);
    });
  }, [pedidosNoPeriodo, searchTerm, statusFilter]);

  // Atualização de Status
  async function handleUpdateStatus(id: string, newStatus: PedidoStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      } else {
        alert("Erro ao atualizar status do pedido.");
      }
    } catch {
      alert("Falha na comunicação com o servidor.");
    } finally {
      setUpdatingId(null);
    }
  }

  function abrirWhatsAppCliente(p: PedidoRow) {
    const statusLabel = STATUS_LABELS[p.status || "novo"]?.label || "Em andamento";
    const mensagem = `Olá ${p.nome_cliente}! Aqui é da Offglass Scent. Seu pedido de ${formatBRL(
      p.total
    )} está com o status: *${statusLabel}*. Em caso de dúvidas, estamos à disposição!`;
    const telLimpo = p.telefone_cliente.replace(/\D/g, "");
    const numeroCompleto = telLimpo.startsWith("55") ? telLimpo : `55${telLimpo}`;
    window.open(whatsappUrl(numeroCompleto, mensagem), "_blank");
  }

  return (
    <div className="px-4 pb-32 pt-4 max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho e Filtro de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Painel de Vendas</h2>
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            Visão financeira e acompanhamento em tempo real dos pedidos
          </p>
        </div>

        {/* Chips de Período */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { id: "hoje", label: "Hoje" },
            { id: "7d", label: "7 dias" },
            { id: "30d", label: "30 dias" },
            { id: "mes", label: "Este mês" },
            { id: "tudo", label: "Todo o histórico" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodo(item.id as Periodo)}
              className={`chip text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                periodo === item.id ? "active shadow-sm" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4 flex flex-col justify-between shadow-sm border border-white/60">
          <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
            Faturamento Total
          </p>
          <div className="mt-2">
            <h3 className="font-display text-2xl sm:text-3xl font-semibold" style={{ color: "var(--teal-deep)" }}>
              {formatBRL(kpis.faturamentoTotal)}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Valores reais com centavos
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex flex-col justify-between shadow-sm border border-white/60">
          <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
            Total de Pedidos
          </p>
          <div className="mt-2">
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">
              {kpis.totalPedidos}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              {periodo === "tudo" ? "No histórico completo" : "No período filtrado"}
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex flex-col justify-between shadow-sm border border-white/60">
          <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
            Ticket Médio
          </p>
          <div className="mt-2">
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">
              {formatBRL(kpis.ticketMedio)}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Média por pedido aprovado
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex flex-col justify-between shadow-sm border border-white/60">
          <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
            Decants Vendidos
          </p>
          <div className="mt-2">
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">
              {kpis.totalDecants}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Total de frascos somados
            </p>
          </div>
        </div>
      </div>

      {/* Seção Gráfica e Inteligência de Vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Evolução de Vendas */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 shadow-sm border border-white/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-display text-base font-semibold">Evolução do Faturamento Diário</h4>
              <span className="text-xs text-stone-500">{periodo.toUpperCase()}</span>
            </div>
            <p className="text-xs text-stone-500 mb-6">
              Acompanhamento de vendas ao longo dos dias
            </p>
          </div>

          <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-black/10">
            {graficoDias.lista.map((d, i) => {
              const alturaPct = Math.max(Math.round((d.total / graficoDias.maxTotal) * 100), d.total > 0 ? 8 : 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 bg-stone-900 text-white text-[10px] py-1 px-2 rounded shadow whitespace-nowrap">
                    {d.label}: {formatBRL(d.total)} ({d.count} ped.)
                  </div>

                  <div
                    className="w-full max-w-[28px] rounded-t transition-all duration-300"
                    style={{
                      height: `${alturaPct}%`,
                      background: d.total > 0 ? "linear-gradient(180deg, var(--teal) 0%, var(--teal-deep) 100%)" : "rgba(0,0,0,0.06)",
                    }}
                  />
                  <span className="text-[9px] text-stone-500 mt-2 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formas de Pagamento & Volumetria */}
        <div className="space-y-4">
          {/* Card Formas de Pagamento */}
          <div className="glass rounded-2xl p-4 shadow-sm border border-white/60">
            <h4 className="font-display text-sm font-semibold mb-3">Métodos de Pagamento</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--teal)" }} />
                  Pix ({pagamentoStats.qtdPix})
                </span>
                <span className="font-semibold">{formatBRL(pagamentoStats.totalPix)} ({pagamentoStats.pctPix}%)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--gold)" }} />
                  Cartão ({pagamentoStats.qtdCartao})
                </span>
                <span className="font-semibold">{formatBRL(pagamentoStats.totalCartao)} ({pagamentoStats.pctCartao}%)</span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-stone-200 flex mt-2">
                <div style={{ width: `${pagamentoStats.pctPix}%`, background: "var(--teal)" }} />
                <div style={{ width: `${pagamentoStats.pctCartao}%`, background: "var(--gold)" }} />
              </div>
            </div>
          </div>

          {/* Card Volumetria de Frascos */}
          <div className="glass rounded-2xl p-4 shadow-sm border border-white/60">
            <h4 className="font-display text-sm font-semibold mb-2">Tamanhos mais Vendidos</h4>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white/60 p-2 rounded-xl border border-black/5">
                <span className="text-[10px] text-stone-500 font-medium block">2ml</span>
                <span className="font-display text-base font-bold text-stone-800">{volumeStats.ml2}</span>
                <span className="text-[9px] text-stone-400 block">{volumeStats.pct2}%</span>
              </div>
              <div className="bg-white/60 p-2 rounded-xl border border-black/5">
                <span className="text-[10px] text-stone-500 font-medium block">5ml</span>
                <span className="font-display text-base font-bold text-stone-800">{volumeStats.ml5}</span>
                <span className="text-[9px] text-stone-400 block">{volumeStats.pct5}%</span>
              </div>
              <div className="bg-white/60 p-2 rounded-xl border border-black/5">
                <span className="text-[10px] text-stone-500 font-medium block">10ml</span>
                <span className="font-display text-base font-bold text-stone-800">{volumeStats.ml10}</span>
                <span className="text-[9px] text-stone-400 block">{volumeStats.pct10}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking de Perfumes Mais Vendidos */}
      {rankingPerfumes.length > 0 && (
        <div className="glass rounded-2xl p-5 shadow-sm border border-white/60">
          <h4 className="font-display text-base font-semibold mb-3">Top Perfumes Mais Vendidos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {rankingPerfumes.map((p, idx) => (
              <div key={idx} className="bg-white/70 rounded-xl p-3 border border-black/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-stone-900 mt-1 line-clamp-1">
                    {p.nome}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                  <span className="text-stone-500">{p.qtd} decants</span>
                  <span className="font-semibold text-teal-800">{formatBRL(p.receita)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Pedidos & Gestão de Atendimento */}
      <div className="glass rounded-2xl p-5 shadow-sm border border-white/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-display text-lg font-semibold">Gestão de Pedidos ({pedidosFiltrados.length})</h4>
            <p className="text-xs text-stone-500">
              Altere o status em tempo real e abra conversas no WhatsApp com um clique
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Buscar cliente, telefone ou perfume..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-xs w-full sm:w-56"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium"
            >
              <option value="todos">Todos os status</option>
              <option value="novo">Novos</option>
              <option value="preparo">Em preparo</option>
              <option value="enviado">Enviados</option>
              <option value="concluido">Concluídos</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <p className="text-sm py-12 text-center text-stone-400 italic">
            Nenhum pedido encontrado para os filtros selecionados.
          </p>
        ) : (
          <div className="space-y-3">
            {pedidosFiltrados.map((p) => {
              const currentStatus: PedidoStatus = p.status || "novo";
              const statusCfg = STATUS_LABELS[currentStatus] || STATUS_LABELS.novo;

              return (
                <div
                  key={p.id}
                  className="bg-white/80 rounded-xl p-4 border border-black/5 hover:border-black/10 transition shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-900">{p.nome_cliente}</p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                          style={{ background: statusCfg.bg, color: statusCfg.text }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {p.telefone_cliente} · {p.forma_pagamento === "pix" ? "Pix" : "Cartão"} ·{" "}
                        {new Date(p.criado_em).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Seletor de Status */}
                      <select
                        value={currentStatus}
                        disabled={updatingId === p.id}
                        onChange={(e) => handleUpdateStatus(p.id, e.target.value as PedidoStatus)}
                        className="text-xs rounded-lg px-2 py-1 font-medium bg-stone-100 border border-stone-300 text-stone-800 cursor-pointer"
                      >
                        <option value="novo">Novo</option>
                        <option value="preparo">Em preparo</option>
                        <option value="enviado">Enviado</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                      </select>

                      {/* Botão de WhatsApp */}
                      <button
                        type="button"
                        onClick={() => abrirWhatsAppCliente(p)}
                        className="btn-teal rounded-lg px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Falar com cliente no WhatsApp"
                      >
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="pt-2">
                    <ul className="text-xs space-y-1 text-stone-700">
                      {p.itens?.map((it, idx) => (
                        <li key={idx} className="flex items-center justify-between">
                          <span>
                            {it.qtd}x <span className="font-medium text-stone-900">{it.produto}</span> ({it.tamanho}ml)
                          </span>
                          <span className="text-stone-500 font-mono">
                            {formatBRL(Number(it.precoUnit) * Number(it.qtd))}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5">
                      <span className="text-xs font-medium text-stone-500">Valor Total do Pedido:</span>
                      <span className="font-display text-lg font-bold text-teal-900">
                        {formatBRL(p.total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
