"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Accord, Category, Product, SizeMl } from "@/types";

function emptyProduct(categories: Category[]): Product {
  return {
    id: "",
    categoria: categories[0]?.key || "",
    marca: "",
    nome: "",
    imagem: "",
    descricaoCurta: "",
    descricaoCompleta: "",
    acordes: [],
    notas: { topo: "", coracao: "", fundo: "" },
    precos: { 2: 0, 5: 0, 10: 0 },
    promo: { ativo: false, desconto: 0 },
  };
}

function generateId(): string {
  return "p" + Math.random().toString(36).slice(2, 10);
}

export default function ProductForm({
  product,
  categories,
  accords,
  brands,
}: {
  product?: Product;
  categories: Category[];
  accords: Accord[];
  brands: string[];
}) {
  const router = useRouter();
  const isEditing = !!product;
  const [form, setForm] = useState<Product>(product || emptyProduct(categories));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAccord(key: string) {
    setForm((f) => ({
      ...f,
      acordes: f.acordes.includes(key) ? f.acordes.filter((a) => a !== key) : [...f.acordes, key],
    }));
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("imagem", (ev.target?.result as string) || "");
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.marca.trim() || !form.nome.trim()) {
      setError("Preencha marca e nome do perfume.");
      return;
    }
    setSaving(true);
    setError("");
    const payload: Product = { ...form, id: form.id || generateId() };
    const res = await fetch("/api/admin/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar.");
      return;
    }
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <div className="px-4 pb-32 pt-4 max-w-xl">
      <h2 className="font-display text-xl mb-4">{isEditing ? "Editar perfume" : "Novo perfume"}</h2>
      {error && <div className="text-xs mb-3" style={{ color: "#B0554B" }}>{error}</div>}

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Categoria
      </label>
      <select
        value={form.categoria}
        onChange={(e) => update("categoria", e.target.value)}
        className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
      >
        {categories.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Marca
      </label>
      <input
        list="brand-list"
        type="text"
        value={form.marca}
        onChange={(e) => update("marca", e.target.value)}
        className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
        placeholder="Ex: Xerjoff"
      />
      <datalist id="brand-list">
        {brands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Nome do perfume
      </label>
      <input
        type="text"
        value={form.nome}
        onChange={(e) => update("nome", e.target.value)}
        className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
        placeholder="Ex: Erba Pura"
      />

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Imagem
      </label>
      <div className="flex items-center gap-3 mb-3">
        {form.imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imagem} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={form.imagem?.startsWith("data:") ? "" : form.imagem}
            onChange={(e) => update("imagem", e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm mb-2"
            placeholder="Cole a URL da imagem"
          />
          <input type="file" accept="image/*" onChange={handleImageFile} className="w-full text-xs" />
        </div>
      </div>

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Descrição curta (aparece no card da vitrine)
      </label>
      <textarea
        value={form.descricaoCurta}
        onChange={(e) => update("descricaoCurta", e.target.value)}
        rows={2}
        className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
        placeholder="Uma frase que capture a essência do perfume"
      />

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Descrição completa (aparece no modal de detalhes)
      </label>
      <textarea
        value={form.descricaoCompleta}
        onChange={(e) => update("descricaoCompleta", e.target.value)}
        rows={4}
        className="w-full rounded-lg px-3 py-2 mb-4 text-sm"
        placeholder="Descrição mais longa, estilo Fragrantica, escrita por você"
      />

      <label className="block text-xs mb-2" style={{ color: "var(--ink-soft)" }}>
        Principais acordes
      </label>
      <div className="flex flex-wrap gap-2 mb-4">
        {accords.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => toggleAccord(a.key)}
            className="text-xs px-3 py-1.5 rounded-full font-medium border"
            style={
              form.acordes.includes(a.key)
                ? { background: a.cor, color: "#fff", borderColor: a.cor }
                : { background: a.cor + "15", color: a.cor, borderColor: a.cor + "40" }
            }
          >
            {a.label}
          </button>
        ))}
        {accords.length === 0 && (
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            Nenhum acorde cadastrado ainda — crie na aba &quot;Acordes&quot;.
          </p>
        )}
      </div>

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Notas de topo
      </label>
      <input
        type="text"
        value={form.notas.topo}
        onChange={(e) => update("notas", { ...form.notas, topo: e.target.value })}
        className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
      />
      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Notas de coração
      </label>
      <input
        type="text"
        value={form.notas.coracao}
        onChange={(e) => update("notas", { ...form.notas, coracao: e.target.value })}
        className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
      />
      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Notas de fundo
      </label>
      <input
        type="text"
        value={form.notas.fundo}
        onChange={(e) => update("notas", { ...form.notas, fundo: e.target.value })}
        className="w-full rounded-lg px-3 py-2 mb-4 text-sm"
      />

      <div className="grid grid-cols-3 gap-2 mb-4">
        {([2, 5, 10] as SizeMl[]).map((sz) => (
          <div key={sz}>
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              Preço {sz}ml
            </label>
            <input
              type="number"
              value={form.precos[sz]}
              onChange={(e) => update("precos", { ...form.precos, [sz]: Number(e.target.value) || 0 })}
              className="w-full rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-3 mb-4">
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            checked={form.promo.ativo}
            onChange={(e) => update("promo", { ...form.promo, ativo: e.target.checked })}
          />
          Produto em promoção
        </label>
        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Desconto (%)
        </label>
        <input
          type="number"
          value={form.promo.desconto}
          onChange={(e) => update("promo", { ...form.promo, desconto: Number(e.target.value) || 0 })}
          className="w-full rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-teal flex-1 rounded-full py-3 text-sm font-medium"
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar perfume"}
        </button>
      </div>
    </div>
  );
}
