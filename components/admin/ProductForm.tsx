"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Accord, Category, Product, SizeMl } from "@/types";
import { isOptimizableImageUrl } from "@/lib/utils";

type StorageFile = { name: string; url: string };

function emptyProduct(categories: Category[]): Product {
  return {
    id: "",
    categoria: categories[0]?.key || "",
    marca: "",
    nome: "",
    imagem: "",
    imagens: [],
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

  const initialProduct: Product = product
    ? {
        ...product,
        imagens:
          Array.isArray(product.imagens) && product.imagens.length > 0
            ? product.imagens
            : product.imagem
            ? [product.imagem]
            : [],
      }
    : emptyProduct(categories);

  const [form, setForm] = useState<Product>(initialProduct);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [existingImages, setExistingImages] = useState<StorageFile[]>([]);
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    fetch("/api/admin/storage/perfumes")
      .then((res) => res.json())
      .then((data) => setExistingImages(data.files || []))
      .catch(() => setExistingImages([]));
  }, []);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAccord(key: string) {
    setForm((f) => ({
      ...f,
      acordes: f.acordes.includes(key) ? f.acordes.filter((a) => a !== key) : [...f.acordes, key],
    }));
  }

  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const body = new FormData();
      for (let i = 0; i < files.length; i++) {
        body.append("files", files[i]);
      }

      const res = await fetch("/api/admin/storage/perfumes", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar imagem(ns).");

      const newUrls: string[] = data.urls || (data.url ? [data.url] : []);
      if (newUrls.length > 0) {
        setForm((f) => {
          const combined = [...(f.imagens || []), ...newUrls];
          return {
            ...f,
            imagens: combined,
            imagem: combined[0] || "",
          };
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem(ns).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleAddManualUrl() {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    setForm((f) => {
      const combined = [...(f.imagens || []), trimmed];
      return {
        ...f,
        imagens: combined,
        imagem: combined[0] || "",
      };
    });
    setManualUrl("");
  }

  function handleAddStorageFile(url: string) {
    if (!url) return;
    setForm((f) => {
      if ((f.imagens || []).includes(url)) return f;
      const combined = [...(f.imagens || []), url];
      return {
        ...f,
        imagens: combined,
        imagem: combined[0] || "",
      };
    });
  }

  function removeImage(index: number) {
    setForm((f) => {
      const updated = (f.imagens || []).filter((_, i) => i !== index);
      return {
        ...f,
        imagens: updated,
        imagem: updated[0] || "",
      };
    });
  }

  function setAsCover(index: number) {
    if (index === 0) return;
    setForm((f) => {
      const current = [...(f.imagens || [])];
      const [selected] = current.splice(index, 1);
      const reordered = [selected, ...current];
      return {
        ...f,
        imagens: reordered,
        imagem: reordered[0] || "",
      };
    });
  }

  function moveImage(from: number, to: number) {
    setForm((f) => {
      const current = [...(f.imagens || [])];
      if (to < 0 || to >= current.length) return f;
      const [item] = current.splice(from, 1);
      current.splice(to, 0, item);
      return {
        ...f,
        imagens: current,
        imagem: current[0] || "",
      };
    });
  }

  async function handleSave() {
    if (!form.marca.trim() || !form.nome.trim()) {
      setError("Preencha marca e nome do perfume.");
      return;
    }
    setSaving(true);
    setError("");

    const finalImagens = form.imagens || [];
    const payload: Product = {
      ...form,
      id: form.id || generateId(),
      imagens: finalImagens,
      imagem: finalImagens[0] || form.imagem || "",
    };

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

  const gallery = form.imagens && form.imagens.length > 0 ? form.imagens : (form.imagem ? [form.imagem] : []);

  return (
    <div className="px-4 pb-32 pt-4 max-w-xl">
      <h2 className="font-display text-xl mb-4">{isEditing ? "Editar perfume" : "Novo perfume"}</h2>
      {error && <div className="text-xs mb-3 font-medium p-2 rounded-lg" style={{ background: "#FDE8E8", color: "#B0554B" }}>{error}</div>}

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
        className="w-full rounded-lg px-3 py-2 mb-4 text-sm"
        placeholder="Ex: Erba Pura"
      />

      {/* Seção de Gerenciamento de Imagens */}
      <div className="glass rounded-2xl p-4 mb-4 border border-black/10">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold uppercase tracking-label" style={{ color: "var(--gold-deep)" }}>
            Galeria de Imagens ({gallery.length})
          </label>
          <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
            A 1ª foto é a capa principal
          </span>
        </div>

        {/* Grid de Imagens */}
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {gallery.map((imgUrl, idx) => (
              <div key={idx} className="relative rounded-xl border border-black/10 overflow-hidden bg-white p-2 flex flex-col justify-between">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-stone-50 flex items-center justify-center">
                  {isOptimizableImageUrl(imgUrl) ? (
                    <Image
                      src={imgUrl}
                      alt={`Foto ${idx + 1}`}
                      fill
                      sizes="150px"
                      className="object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain" />
                  )}

                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                      ★ Capa
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 text-[10px]">
                  {idx !== 0 ? (
                    <button
                      type="button"
                      onClick={() => setAsCover(idx)}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                      title="Definir como capa principal"
                    >
                      Tornar capa
                    </button>
                  ) : (
                    <span className="text-stone-400 font-medium px-1">Principal</span>
                  )}

                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx - 1)}
                        className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Mover para esquerda"
                      >
                        ◀
                      </button>
                    )}
                    {idx < gallery.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx + 1)}
                        className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Mover para direita"
                      >
                        ▶
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 font-bold"
                      title="Remover foto"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs py-4 text-center text-stone-400 italic">
            Nenhuma foto adicionada ainda.
          </p>
        )}

        {/* Input de Upload de Imagens */}
        <div className="space-y-3 pt-2 border-t border-black/5">
          <div>
            <label className="block text-xs mb-1 font-medium text-stone-700">
              Fazer upload de fotos (pode selecionar várias):
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFiles}
              disabled={uploading}
              className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
            />
            {uploading && (
              <p className="text-xs mt-1 animate-pulse" style={{ color: "var(--teal-deep)" }}>
                Enviando foto(s) para o Storage...
              </p>
            )}
          </div>

          {/* Adicionar por URL */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Ou cole uma URL de imagem aqui"
              className="flex-1 rounded-lg px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="btn-glass rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              + Adicionar URL
            </button>
          </div>

          {/* Selecionar foto já existente no Storage */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-xs mb-1 text-stone-500">
                Ou vincular foto já presente no Storage:
              </label>
              <select
                value=""
                onChange={(e) => {
                  const file = existingImages.find((f) => f.name === e.target.value);
                  if (file) handleAddStorageFile(file.url);
                }}
                className="w-full rounded-lg px-3 py-1.5 text-xs"
              >
                <option value="">Selecione um arquivo da biblioteca...</option>
                {existingImages.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      {/* Preços com suporte a centavos (step=0.01) */}
      <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--teal-deep)" }}>
        Preços dos Decants (sem arredondar)
      </label>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([2, 5, 10] as SizeMl[]).map((sz) => (
          <div key={sz}>
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              Preço {sz}ml (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.precos[sz] || ""}
              onChange={(e) =>
                update("precos", {
                  ...form.precos,
                  [sz]: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0,00"
              className="w-full rounded-lg px-3 py-2 text-sm font-medium"
            />
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-3 mb-4">
        <label className="flex items-center gap-2 text-sm mb-2 font-medium cursor-pointer">
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
          step="0.1"
          min="0"
          max="100"
          value={form.promo.desconto || ""}
          onChange={(e) =>
            update("promo", {
              ...form.promo,
              desconto: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
            })
          }
          className="w-full rounded-lg px-3 py-2 text-sm"
          placeholder="Ex: 10"
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
