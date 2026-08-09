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

  async function handleAdd() {
    if (!label.trim()) return;
    setSaving(true);
    setError("");
    const key = slugify(label);
    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label: label.trim() }),
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
        Categorias controlam as abas de filtro do catálogo (ex: Nicho, Árabes, Designer, Autoral).
      </p>
      {categories.map((c) => (
        <div key={c.key} className="glass rounded-xl p-3 flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium">{c.label}</p>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              {counts[c.key] || 0} produto(s)
            </p>
          </div>
          <button onClick={() => handleRemove(c.key)} className="text-xs" style={{ color: "#B0554B" }}>
            remover
          </button>
        </div>
      ))}
      <div className="glass rounded-xl p-3 mt-4">
        {error && <p className="text-xs mb-2" style={{ color: "#B0554B" }}>{error}</p>}
        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Nova categoria
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-sm"
            placeholder="Ex: Sazonal, Masculinos VIP..."
          />
          <button onClick={handleAdd} disabled={saving} className="btn-teal rounded-full px-4 py-2 text-sm">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
