"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Accord } from "@/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const DEFAULT_COLOR = "#6E9C93";

const PRESET_COLORS = [
  { name: "Teal OffGlass", hex: "#6E9C93" },
  { name: "Cítrico Dourado", hex: "#D9A441" },
  { name: "Amadeirado", hex: "#8C6E4A" },
  { name: "Floral Rosa", hex: "#C97B9B" },
  { name: "Especiado Quente", hex: "#D97A5B" },
  { name: "Aquático", hex: "#5B92A8" },
  { name: "Aromático Verde", hex: "#6E9C6E" },
  { name: "Atalcado / Violeta", hex: "#9370DB" },
  { name: "Âmbar Oriental", hex: "#E5A93B" },
  { name: "Couro / Fumê", hex: "#7A5C43" },
  { name: "Baunilha / Doce", hex: "#C28B52" },
];

export default function AccordsManager({ accords }: { accords: Accord[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [cor, setCor] = useState(DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!label.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/acordes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: slugify(label), label: label.trim(), cor }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao criar acorde.");
      return;
    }
    setLabel("");
    router.refresh();
  }

  async function handleRemove(key: string) {
    if (!confirm("Remover este acorde?")) return;
    await fetch("/api/admin/acordes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4">
      <div className="mb-5">
        <h2 className="font-display text-xl">Biblioteca de Acordes Olfativos</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
          Acordes são a biblioteca de famílias olfativas dos perfumes (ex: Amadeirado, Cítrico, Floral) — exibidos com a cor selecionada e alta legibilidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Coluna Esquerda: Lista de Acordes Cadastrados */}
        <div className="lg:col-span-7">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
                Acordes Cadastrados ({accords.length})
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {accords.map((a) => (
                <span
                  key={a.key}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-2 border shadow-xs transition-all hover:scale-[1.02]"
                  style={{
                    background: a.cor + "2e",
                    color: "#1b1f1d", // Texto SEMPRE preto
                    borderColor: a.cor + "66",
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: a.cor }}
                  />
                  <span>{a.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(a.key)}
                    className="text-stone-600 hover:text-black font-bold ml-1 cursor-pointer"
                    title="Remover acorde"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {accords.length === 0 && (
                <p className="text-xs py-4 text-center w-full" style={{ color: "var(--ink-soft)" }}>
                  Nenhum acorde cadastrado ainda.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Formulário de Novo Acorde */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="glass rounded-xl p-4">
            {error && (
              <p className="text-xs mb-3 p-2 rounded-lg bg-red-50 text-red-700 border border-red-200">
                {error}
              </p>
            )}

            <label className="block text-xs font-semibold mb-3 uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
              Cadastrar Novo Acorde
            </label>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
                  Nome do acorde
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm border border-stone-300 bg-white"
                  placeholder="Ex: Amadeirado, Cítrico, Âmbar..."
                />
              </div>

              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
                  Escolha a cor da tag
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-black/10"
                    title="Personalizar cor via paleta"
                  />
                  <span className="text-xs font-mono font-medium text-stone-600 uppercase">
                    {cor}
                  </span>
                </div>

                {/* Paleta rápida de cores sugeridas */}
                <div className="mt-2.5">
                  <span className="text-[11px] text-stone-500 font-medium block mb-1.5">
                    Cores clássicas de perfumaria:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((pc) => (
                      <button
                        key={pc.hex}
                        type="button"
                        onClick={() => setCor(pc.hex)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                          cor.toLowerCase() === pc.hex.toLowerCase()
                            ? "ring-2 ring-stone-900 border-transparent font-bold"
                            : "border-black/10 hover:bg-white"
                        }`}
                        style={{ background: pc.hex + "20" }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pc.hex }} />
                        <span style={{ color: "#1b1f1d" }}>{pc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pré-visualização da Tag em Tempo Real */}
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Pré-visualização:</span>
                <span
                  className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-2 border shadow-xs"
                  style={{
                    background: cor + "2e",
                    color: "#1b1f1d", // SEMPRE PRETO
                    borderColor: cor + "66",
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: cor }} />
                  <span>{label.trim() || "Exemplo de Acorde"}</span>
                </span>
              </div>
            </div>

            {/* Botão de Adicionar Acorde */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !label.trim()}
              className="btn-teal rounded-full py-2.5 px-4 text-sm font-semibold w-full shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {saving ? (
                <span>Cadastrando...</span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Cadastrar Novo Acorde</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
