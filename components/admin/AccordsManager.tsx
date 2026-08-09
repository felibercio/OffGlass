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
    <div className="px-4 pb-32 pt-4">
      <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
        Acordes são nossa própria biblioteca de categorias olfativas (ex: Amadeirado, Cítrico, Floral) — mostrados
        como badges coloridos no modal de cada perfume.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {accords.map((a) => (
          <span
            key={a.key}
            className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-2"
            style={{ background: a.cor + "1a", color: a.cor }}
          >
            {a.label}
            <button onClick={() => handleRemove(a.key)} style={{ color: a.cor }}>
              ✕
            </button>
          </span>
        ))}
        {accords.length === 0 && (
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            Nenhum acorde cadastrado ainda.
          </p>
        )}
      </div>

      <div className="glass rounded-xl p-3">
        {error && <p className="text-xs mb-2" style={{ color: "#B0554B" }}>{error}</p>}
        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Nome do acorde
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-sm"
            placeholder="Ex: Amadeirado"
          />
          <input
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            className="w-12 h-10 rounded-lg cursor-pointer"
          />
        </div>
        <button onClick={handleAdd} disabled={saving} className="btn-teal rounded-full px-4 py-2 text-sm w-full">
          Adicionar acorde
        </button>
      </div>
    </div>
  );
}
