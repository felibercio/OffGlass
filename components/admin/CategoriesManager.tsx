"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORY_SUGGESTIONS = [
  "Nicho",
  "Designer",
  "Árabe",
  "Autoral",
  "Lacrados",
  "Edição Limitada",
  "Colecionador",
  "Gourmand",
  "Vintage",
];

export default function CategoriesManager({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Estado de Edição de Categoria Cadastrada
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function startEditing(c: Category) {
    setEditingKey(c.key);
    setEditLabel(c.label);
    setError("");
  }

  function cancelEditing() {
    setEditingKey(null);
    setEditLabel("");
  }

  async function handleSaveEdit() {
    if (!editingKey || !editLabel.trim()) return;
    setSavingEdit(true);
    setError("");
    const res = await fetch("/api/admin/categorias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editingKey, label: editLabel.trim() }),
    });
    setSavingEdit(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao atualizar categoria.");
      return;
    }
    setEditingKey(null);
    setEditLabel("");
    router.refresh();
  }

  async function handleAdd(customText?: string) {
    const textToAdd = (customText || label).trim();
    if (!textToAdd) return;
    setSaving(true);
    setError("");
    const key = slugify(textToAdd);
    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label: textToAdd }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao criar categoria.");
      return;
    }
    setLabel("");
    router.refresh();
  }

  async function handleRemove(key: string) {
    if (!confirm("Remover esta categoria?")) return;
    const res = await fetch("/api/admin/categorias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao remover.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="px-4 pb-32 pt-4">
      <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
        Categorias controlam as abas de filtro do catálogo (ex: Nicho, Árabe, Designer, Autoral, Lacrados).
      </p>

      {error && (
        <div className="p-3 mb-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Listagem de Categorias */}
      <div className="space-y-2 mb-6">
        {categories.map((c) => {
          const isEditing = editingKey === c.key;

          return (
            <div
              key={c.key}
              className={`glass rounded-xl p-3.5 transition-all ${
                isEditing ? "ring-2 ring-[var(--teal-deep)] bg-white/90" : ""
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-label">
                      Editando nome da categoria:
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      chave: {c.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[var(--teal-deep)]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="btn-teal rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {savingEdit ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-black/10 hover:bg-stone-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">{c.label}</p>
                      <span className="text-[10px] text-stone-400 font-mono bg-stone-100 px-1.5 py-0.5 rounded">
                        {c.key}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                      {counts[c.key] || 0} produto(s) vinculado(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEditing(c)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(c.key)}
                      className="text-xs font-medium hover:underline cursor-pointer"
                      style={{ color: "#B0554B" }}
                    >
                      remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sugestões de Edição e Criação */}
      <div className="glass rounded-xl p-3.5 mb-4">
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-label" style={{ color: "var(--teal-deep)" }}>
          Sugestões de Categorias (clique para preencher)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_SUGGESTIONS.map((sug) => {
            const alreadyExists = categories.some(
              (c) => c.label.toLowerCase() === sug.toLowerCase() || c.key === slugify(sug)
            );
            return (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  if (editingKey) {
                    setEditLabel(sug);
                  } else {
                    setLabel(sug);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                  alreadyExists
                    ? "bg-stone-100 text-stone-500 border-black/5"
                    : "bg-white/80 hover:bg-white text-stone-800 border-black/10 hover:border-[var(--teal-deep)]"
                }`}
              >
                {sug} {alreadyExists ? "✓" : "+"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cadastrar Nova Categoria */}
      <div className="glass rounded-xl p-4">
        <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
          Cadastrar Nova Categoria
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-sm border border-stone-300"
            placeholder="Ex: Colecionador, Sazonal, etc."
          />
          <button
            type="button"
            onClick={() => handleAdd()}
            disabled={saving || !label.trim()}
            className="btn-teal rounded-full px-5 py-2 text-sm font-semibold cursor-pointer disabled:opacity-40"
          >
            {saving ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
