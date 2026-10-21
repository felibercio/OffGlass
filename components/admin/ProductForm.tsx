"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Accord, Category, Genero, Product, SizeMl } from "@/types";
import {
  isOptimizableImageUrl,
  formatBRLValue,
  maskBRLDigits,
  maskPercentInput,
} from "@/lib/utils";

type StorageFile = { name: string; url: string };

function emptyProduct(categories: Category[]): Product {
  return {
    id: "",
    categoria: categories[0]?.key || "nicho",
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
    genero: "compartilhado",
    destaque: false,
    custoFrasco: 0,
    volumeFrascoMl: 100,
    margemLucroPct: 100,
  };
}

function generateId(): string {
  return "p" + Math.random().toString(36).slice(2, 10);
}

export default function ProductForm({
  product,
  categories,
  accords: initialAccords,
  brands: initialBrands,
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
        genero: product.genero || "compartilhado",
        destaque: !!product.destaque,
        custoFrasco: product.custoFrasco ?? 0,
        volumeFrascoMl: product.volumeFrascoMl ?? 100,
        margemLucroPct: product.margemLucroPct ?? 100,
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

  // Estado para biblioteca dinâmica de marcas e acordes
  const [availableBrands, setAvailableBrands] = useState<string[]>(initialBrands);
  const [availableAccords, setAvailableAccords] = useState<Accord[]>(initialAccords);

  // Estado para seleção de CATEGORIA com busca e opção (Outro)
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(
    !!product?.categoria && !categories.some((c) => c.key === product.categoria)
  );
  const [customCategoryName, setCustomCategoryName] = useState(
    isCustomCategory ? product?.categoria || "" : ""
  );

  // Estado para seleção de MARCA com busca e opção (Outro) - Mesmo padrão de Categoria
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState("");

  // Estado para seleção de PRINCIPAIS ACORDES com busca organizada + criação rápida
  const [accordSearch, setAccordSearch] = useState("");
  const [showAccordDropdown, setShowAccordDropdown] = useState(false);
  const [isCreatingAccord, setIsCreatingAccord] = useState(false);
  const [newAccordName, setNewAccordName] = useState("");
  const [newAccordColor, setNewAccordColor] = useState("#6E9C93");
  const [savingNewAccord, setSavingNewAccord] = useState(false);

  // Estados com máscaras amigáveis de Ponto e Vírgula
  const [custoFrascoInput, setCustoFrascoInput] = useState(
    formatBRLValue(initialProduct.custoFrasco)
  );
  const [margemLucroInput, setMargemLucroInput] = useState(
    initialProduct.margemLucroPct ? String(initialProduct.margemLucroPct).replace(".", ",") : "100"
  );
  const [precoInputs, setPrecoInputs] = useState<Record<SizeMl, string>>({
    2: formatBRLValue(initialProduct.precos[2]),
    5: formatBRLValue(initialProduct.precos[5]),
    10: formatBRLValue(initialProduct.precos[10]),
  });

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
      acordes: f.acordes.includes(key)
        ? f.acordes.filter((a) => a !== key)
        : [...f.acordes, key],
    }));
  }

  async function handleQuickCreateAccord() {
    if (!newAccordName.trim()) return;
    setSavingNewAccord(true);
    const key = newAccordName
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    const res = await fetch("/api/admin/acordes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label: newAccordName.trim(), cor: newAccordColor }),
    });

    setSavingNewAccord(false);
    if (!res.ok) {
      alert("Erro ao cadastrar novo acorde.");
      return;
    }

    const newAccordObj: Accord = { key, label: newAccordName.trim(), cor: newAccordColor };
    setAvailableAccords((prev) => [...prev.filter((a) => a.key !== key), newAccordObj]);
    setForm((f) => ({ ...f, acordes: [...f.acordes.filter((a) => a !== key), key] }));
    setNewAccordName("");
    setIsCreatingAccord(false);
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
      const current = f.imagens || [];
      if (current.includes(trimmed)) return f;
      const combined = [...current, trimmed];
      return {
        ...f,
        imagens: combined,
        imagem: combined[0] || "",
      };
    });
    setManualUrl("");
  }

  function handleAddStorageFile(url: string) {
    setForm((f) => {
      const current = f.imagens || [];
      if (current.includes(url)) return f;
      const combined = [...current, url];
      return {
        ...f,
        imagens: combined,
        imagem: combined[0] || "",
      };
    });
  }

  function removeImage(index: number) {
    setForm((f) => {
      const current = [...(f.imagens || [])];
      current.splice(index, 1);
      return {
        ...f,
        imagens: current,
        imagem: current[0] || "",
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

  function setAsCover(index: number) {
    if (index === 0) return;
    setForm((f) => {
      const current = [...(f.imagens || [])];
      const [item] = current.splice(index, 1);
      current.unshift(item);
      return {
        ...f,
        imagens: current,
        imagem: current[0] || "",
      };
    });
  }

  // Cálculos da Calculadora Financeira
  const custoPorMl =
    form.volumeFrascoMl && form.volumeFrascoMl > 0
      ? (form.custoFrasco || 0) / form.volumeFrascoMl
      : 0;
  const margemMult = 1 + (form.margemLucroPct || 0) / 100;
  // Insumos inclusos por decant: R$ 3,00 (2ml), R$ 3,50 (5ml), R$ 4,50 (10ml)
  const sugestao2 = custoPorMl > 0 ? Number((((custoPorMl * 2) + 3.0) * margemMult).toFixed(2)) : 0;
  const sugestao5 = custoPorMl > 0 ? Number((((custoPorMl * 5) + 3.5) * margemMult).toFixed(2)) : 0;
  const sugestao10 = custoPorMl > 0 ? Number((((custoPorMl * 10) + 4.5) * margemMult).toFixed(2)) : 0;

  function aplicarPrecosSugeridos() {
    setForm((f) => ({
      ...f,
      precos: {
        2: sugestao2,
        5: sugestao5,
        10: sugestao10,
      },
    }));
    setPrecoInputs({
      2: formatBRLValue(sugestao2),
      5: formatBRLValue(sugestao5),
      10: formatBRLValue(sugestao10),
    });
  }

  async function handleSave() {
    const finalMarca = isCustomBrand ? customBrandName.trim() : form.marca.trim();

    if (!finalMarca || !form.nome.trim()) {
      setError("Preencha marca e nome do perfume.");
      return;
    }

    let finalCategory = form.categoria;
    let newCategoryLabel: string | undefined = undefined;

    if (isCustomCategory) {
      if (!customCategoryName.trim()) {
        setError("Digite o nome da nova categoria.");
        return;
      }
      finalCategory = customCategoryName
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");
      newCategoryLabel = customCategoryName.trim();
    }

    setSaving(true);
    setError("");

    const finalImagens = form.imagens || [];
    const payload: Product = {
      ...form,
      marca: finalMarca,
      categoria: finalCategory,
      id: form.id || generateId(),
      imagens: finalImagens,
      imagem: finalImagens[0] || form.imagem || "",
    };

    const res = await fetch("/api/admin/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, newCategoryLabel }),
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

  // Categorias filtradas pela busca
  const filteredCategories = categories.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.key.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const currentCategoryLabel =
    categories.find((c) => c.key === form.categoria)?.label || form.categoria || "Selecione a categoria";

  // Marcas filtradas pela busca
  const filteredBrands = availableBrands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Acordes filtrados pela busca
  const filteredAccords = availableAccords.filter((a) =>
    a.label.toLowerCase().includes(accordSearch.toLowerCase()) ||
    a.key.toLowerCase().includes(accordSearch.toLowerCase())
  );

  return (
    <div className="px-4 pb-32 pt-4 max-w-xl">
      <h2 className="font-display text-xl mb-4">{isEditing ? "Editar perfume" : "Novo perfume"}</h2>
      {error && (
        <div className="text-xs mb-3 font-medium p-2.5 rounded-lg border border-red-200" style={{ background: "#FDE8E8", color: "#B0554B" }}>
          {error}
        </div>
      )}

      {/* 1. SELEÇÃO DE CATEGORIA com Busca + Opção (Outro) */}
      <div className="mb-4 relative">
        <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
          Categoria
        </label>
        
        {!isCustomCategory ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm flex items-center justify-between text-left font-medium border border-black/15 bg-white/80 cursor-pointer hover:bg-white"
            >
              <span>{currentCategoryLabel}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-xl border border-black/10 p-2 animate-fade-in max-h-64 overflow-y-auto bg-white">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Pesquisar categoria..."
                  className="w-full text-xs rounded-lg px-2.5 py-1.5 mb-2 border border-black/10"
                  autoFocus
                />
                
                <div className="space-y-1">
                  {filteredCategories.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => {
                        update("categoria", c.key);
                        setShowCategoryDropdown(false);
                        setCategorySearch("");
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        form.categoria === c.key
                          ? "bg-stone-900 text-white"
                          : "hover:bg-stone-100"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="text-[11px] text-stone-400 py-1 text-center">Nenhuma categoria encontrada.</p>
                  )}
                  
                  <div className="border-t border-black/10 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(true);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Outro (Cadastrar nova categoria)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-teal-500/40 bg-teal-50/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-800">
                Criando Nova Categoria:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(false);
                  setCustomCategoryName("");
                }}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                Voltar às categorias existentes
              </button>
            </div>
            <input
              type="text"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Digite o nome da nova categoria (ex: Exclusivos)"
              className="w-full rounded-lg px-3 py-2 text-sm border border-teal-500 bg-white"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* 2. SELEÇÃO DE MARCA (MESMO PADRÃO DE CATEGORIA + OPÇÃO DE CRIAR NOVA) */}
      <div className="mb-4 relative">
        <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
          Marca
        </label>

        {!isCustomBrand ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBrandDropdown(!showBrandDropdown)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm flex items-center justify-between text-left font-medium border border-black/15 bg-white/80 cursor-pointer hover:bg-white"
            >
              <span>{form.marca || "Selecione uma marca existente..."}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showBrandDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-xl border border-black/10 p-2 animate-fade-in max-h-64 overflow-y-auto bg-white">
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Pesquisar marca (ex: Xerjoff, Creed, Dior)..."
                  className="w-full text-xs rounded-lg px-2.5 py-1.5 mb-2 border border-black/10"
                  autoFocus
                />

                <div className="space-y-1">
                  {filteredBrands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        update("marca", b);
                        setShowBrandDropdown(false);
                        setBrandSearch("");
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        form.marca === b
                          ? "bg-stone-900 text-white"
                          : "hover:bg-stone-100"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                  {filteredBrands.length === 0 && (
                    <p className="text-[11px] text-stone-400 py-1 text-center">Nenhuma marca encontrada.</p>
                  )}

                  <div className="border-t border-black/10 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBrand(true);
                        setShowBrandDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Outro (Cadastrar nova marca)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-teal-500/40 bg-teal-50/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-800">
                Cadastrando Nova Marca:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCustomBrand(false);
                  setCustomBrandName("");
                }}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                Voltar às marcas existentes
              </button>
            </div>
            <input
              type="text"
              value={customBrandName}
              onChange={(e) => setCustomBrandName(e.target.value)}
              placeholder="Digite o nome da nova marca (ex: Initio Parfums)"
              className="w-full rounded-lg px-3 py-2 text-sm border border-teal-500 bg-white"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* 3. NOME DO PERFUME */}
      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Nome do perfume
      </label>
      <input
        type="text"
        value={form.nome}
        onChange={(e) => update("nome", e.target.value)}
        className="w-full rounded-lg px-3 py-2 mb-4 text-sm"
        placeholder="Ex: Naxos"
      />

      {/* 4. GÊNERO OLFATIVO */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
          Gênero Olfativo
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["compartilhado", "masculino", "feminino"] as Genero[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => update("genero", g)}
              className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                (form.genero || "compartilhado") === g
                  ? "bg-stone-900 text-white border-transparent shadow-sm"
                  : "bg-white/60 text-stone-700 border-black/10 hover:bg-white"
              }`}
            >
              {g === "compartilhado" ? "Compartilhado" : g === "masculino" ? "Masculino" : "Feminino"}
            </button>
          ))}
        </div>
      </div>

      {/* 5. DESTAQUE NA HOME */}
      <div className="mb-4 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.destaque}
            onChange={(e) => update("destaque", e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 cursor-pointer"
          />
          <span>Destacar na Home (exibir na seção Destaques)</span>
        </label>
        {form.destaque && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
            Ativo
          </span>
        )}
      </div>

      {/* 6. GALERIA DE FOTOS E BOTÃO DE UPLOAD APARENTE */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
            Fotos do perfume ({gallery.length})
          </label>
          <span className="text-[11px] text-stone-500">
            A 1ª foto é a capa principal
          </span>
        </div>

        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {gallery.map((url, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl border p-2 flex flex-col justify-between ${
                  idx === 0
                    ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-400/40"
                    : "border-black/10 bg-white"
                }`}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white mb-2 flex items-center justify-center">
                  {isOptimizableImageUrl(url) ? (
                    <Image src={url} alt={`Foto ${idx + 1}`} fill sizes="160px" className="object-contain p-1" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain p-1" />
                  )}

                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                      Capa
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 text-[10px]">
                  {idx !== 0 ? (
                    <button
                      type="button"
                      onClick={() => setAsCover(idx)}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
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
                        className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer flex items-center justify-center"
                        title="Mover para esquerda"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                    )}
                    {idx < gallery.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx + 1)}
                        className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer flex items-center justify-center"
                        title="Mover para direita"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer flex items-center justify-center"
                      title="Remover foto"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* DROPZONE E BOTÃO DE UPLOAD DESTACADO E APARENTE */}
        <div className="p-5 rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-50/25 hover:bg-teal-50/50 transition-all text-center mb-3">
          <input
            id="product-photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFiles}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="product-photo-upload"
            className="cursor-pointer flex flex-col items-center justify-center gap-2.5"
          >
            <div className="w-12 h-12 rounded-full bg-teal-100/90 flex items-center justify-center text-teal-800 shadow-xs">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <span className="btn-teal rounded-full px-5 py-2.5 text-xs font-semibold shadow-xs inline-block">
                {uploading ? "Enviando foto(s)..." : "Selecionar Fotos do Computador / Celular"}
              </span>
              <p className="text-[11px] text-stone-500 mt-1.5">
                Pode selecionar múltiplos arquivos (PNG, JPG, WEBP).
              </p>
            </div>
          </label>
        </div>

        {/* Opções alternativas: URL e Biblioteca Storage */}
        <div className="space-y-2 pt-2 border-t border-black/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Ou cole uma URL externa de imagem aqui"
              className="flex-1 rounded-lg px-3 py-1.5 text-xs border border-stone-200"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="btn-glass rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              + Adicionar URL
            </button>
          </div>

          {existingImages.length > 0 && (
            <div>
              <select
                value=""
                onChange={(e) => {
                  const file = existingImages.find((f) => f.name === e.target.value);
                  if (file) handleAddStorageFile(file.url);
                }}
                className="w-full rounded-lg px-3 py-1.5 text-xs border border-stone-200 bg-white"
              >
                <option value="">Ou vincule uma foto já presente no Storage...</option>
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

      {/* 7. DESCRIÇÕES */}
      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Descrição curta (vitrine)
      </label>
      <input
        type="text"
        value={form.descricaoCurta}
        onChange={(e) => update("descricaoCurta", e.target.value)}
        className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
        placeholder="Fragrância oriental especiada com toque de mel e tabaco"
      />

      <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
        Descrição completa (modal de detalhes)
      </label>
      <textarea
        value={form.descricaoCompleta}
        onChange={(e) => update("descricaoCompleta", e.target.value)}
        rows={4}
        className="w-full rounded-lg px-3 py-2 mb-4 text-sm"
        placeholder="Descrição mais detalhada, estilo Fragrantica, escrita por você"
      />

      {/* 8. PRINCIPAIS ACORDES (ORGANIZADO COM PADRÃO COMBOBOX + TAGS SELECIONADAS) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
            Principais Acordes Olfativos ({form.acordes.length})
          </label>
          <span className="text-[11px] text-stone-500">
            Texto sempre preto e tag colorida
          </span>
        </div>

        {/* Tags Selecionadas */}
        <div className="min-h-11 p-2.5 rounded-xl border border-black/10 bg-white/70 mb-2 flex flex-wrap gap-1.5 items-center">
          {form.acordes.length > 0 ? (
            form.acordes.map((accKey) => {
              const acc = availableAccords.find((a) => a.key === accKey) || {
                key: accKey,
                label: accKey,
                cor: "#6E9C93",
              };
              return (
                <span
                  key={accKey}
                  className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 border shadow-xs"
                  style={{
                    background: acc.cor + "2e",
                    color: "#1b1f1d", // SEMPRE PRETO
                    borderColor: acc.cor + "66",
                  }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: acc.cor }} />
                  <span>{acc.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleAccord(accKey)}
                    className="hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                    title="Remover acorde deste perfume"
                  >
                    ✕
                  </button>
                </span>
              );
            })
          ) : (
            <span className="text-xs text-stone-400 italic">
              Nenhum acorde selecionado. Clique abaixo para pesquisar e adicionar.
            </span>
          )}
        </div>

        {/* Dropdown Pesquisável de Acordes */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAccordDropdown(!showAccordDropdown)}
            className="w-full rounded-xl px-3.5 py-2 text-xs flex items-center justify-between font-semibold border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer text-stone-700"
          >
            <span>+ Adicionar / Buscar Acordes Olfativos</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showAccordDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-xl border border-black/10 p-2.5 animate-fade-in max-h-64 overflow-y-auto bg-white">
              <input
                type="text"
                value={accordSearch}
                onChange={(e) => setAccordSearch(e.target.value)}
                placeholder="Pesquisar acorde (ex: Amadeirado, Cítrico, Baunilha)..."
                className="w-full text-xs rounded-lg px-2.5 py-1.5 mb-2 border border-black/10"
                autoFocus
              />

              <div className="space-y-1">
                {filteredAccords.map((a) => {
                  const isSelected = form.acordes.includes(a.key);
                  return (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => toggleAccord(a.key)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        isSelected ? "bg-teal-50 text-teal-900 border border-teal-200" : "hover:bg-stone-50 text-stone-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.cor }} />
                        <span style={{ color: "#1b1f1d" }}>{a.label}</span>
                      </div>
                      <span className="text-xs font-bold">{isSelected ? "✓" : "+"}</span>
                    </button>
                  );
                })}

                {filteredAccords.length === 0 && (
                  <p className="text-[11px] text-stone-400 py-1 text-center">Nenhum acorde encontrado.</p>
                )}

                <div className="border-t border-black/10 pt-2 mt-2">
                  {!isCreatingAccord ? (
                    <button
                      type="button"
                      onClick={() => setIsCreatingAccord(true)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Criar novo acorde rápido</span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-700">Novo Acorde:</span>
                        <button
                          type="button"
                          onClick={() => setIsCreatingAccord(false)}
                          className="text-[10px] text-stone-500 hover:underline"
                        >
                          Fechar
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newAccordName}
                        onChange={(e) => setNewAccordName(e.target.value)}
                        placeholder="Nome do acorde"
                        className="w-full text-xs rounded px-2 py-1 border border-stone-300"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newAccordColor}
                          onChange={(e) => setNewAccordColor(e.target.value)}
                          className="w-8 h-7 rounded cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={handleQuickCreateAccord}
                          disabled={savingNewAccord || !newAccordName.trim()}
                          className="btn-teal rounded px-3 py-1 text-xs font-semibold flex-1 disabled:opacity-40"
                        >
                          {savingNewAccord ? "Criando..." : "Salvar Acorde"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 9. NOTAS OLFATIVAS */}
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

      {/* 10. CALCULADORA FINANCEIRA COM MÁSCARA PONTO E VÍRGULA */}
      <div className="glass rounded-2xl p-4 mb-4 border border-teal-500/30 bg-teal-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-label text-teal-800">
              Calculadora de Custos & Precificação
            </label>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
            {custoPorMl > 0 ? `R$ ${custoPorMl.toFixed(2).replace(".", ",")} / ml` : "Aguardando custos"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {/* Custo do Frasco com máscara BRL (ponto e vírgula) */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              Custo do Frasco (R$)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={custoFrascoInput}
              onChange={(e) => {
                const { formatted, numericValue } = maskBRLDigits(e.target.value);
                setCustoFrascoInput(formatted);
                update("custoFrasco", numericValue);
              }}
              placeholder="0,00"
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold border border-stone-300 bg-white"
            />
          </div>

          {/* Volume do Frasco em ml */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              Volume do Frasco (ml)
            </label>
            <input
              type="number"
              min="1"
              value={form.volumeFrascoMl || ""}
              onChange={(e) => update("volumeFrascoMl", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
              placeholder="Ex: 100"
              className="w-full rounded-lg px-3 py-2 text-sm font-medium border border-stone-300 bg-white"
            />
            <div className="flex gap-1 mt-1">
              {[50, 75, 100, 125].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => update("volumeFrascoMl", ml)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                    form.volumeFrascoMl === ml
                      ? "bg-stone-900 text-white border-transparent font-bold"
                      : "bg-white/60 text-stone-600 border-black/10 hover:bg-white"
                  }`}
                >
                  {ml}ml
                </button>
              ))}
            </div>
          </div>

          {/* Margem de Lucro com máscara de ponto e vírgula */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              Margem de Lucro (%)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={margemLucroInput}
              onChange={(e) => {
                const { formatted, numericValue } = maskPercentInput(e.target.value);
                setMargemLucroInput(formatted);
                update("margemLucroPct", numericValue);
              }}
              placeholder="Ex: 120"
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold border border-stone-300 bg-white"
            />
            <div className="flex gap-1 mt-1">
              {[100, 120, 150, 200].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    update("margemLucroPct", pct);
                    setMargemLucroInput(String(pct));
                  }}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                    form.margemLucroPct === pct
                      ? "bg-stone-900 text-white border-transparent font-bold"
                      : "bg-white/60 text-stone-600 border-black/10 hover:bg-white"
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quadro com valores sugeridos */}
        <div className="bg-white/70 rounded-xl p-3 border border-black/5 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-700">
              Valores Sugeridos para Decants:
            </span>
            <span className="text-[10px] text-stone-500">
              Inclui frasco spray + etiqueta
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200/50">
              <span className="block text-[10px] text-stone-500 font-medium">2ml Sugerido</span>
              <span className="text-sm font-bold text-teal-800">
                {sugestao2 > 0 ? `R$ ${formatBRLValue(sugestao2)}` : "--"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200/50">
              <span className="block text-[10px] text-stone-500 font-medium">5ml Sugerido</span>
              <span className="text-sm font-bold text-teal-800">
                {sugestao5 > 0 ? `R$ ${formatBRLValue(sugestao5)}` : "--"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200/50">
              <span className="block text-[10px] text-stone-500 font-medium">10ml Sugerido</span>
              <span className="text-sm font-bold text-teal-800">
                {sugestao10 > 0 ? `R$ ${formatBRLValue(sugestao10)}` : "--"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={aplicarPrecosSugeridos}
          disabled={sugestao2 <= 0}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold btn-teal shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <span>Aplicar Preços Sugeridos nos Decants</span>
        </button>
      </div>

      {/* 11. PREÇOS DOS DECANTS COM MÁSCARA PONTO E VÍRGULA */}
      <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--teal-deep)" }}>
        Preços dos Decants (com ponto e vírgula)
      </label>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([2, 5, 10] as SizeMl[]).map((sz) => (
          <div key={sz}>
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              Preço {sz}ml (R$)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={precoInputs[sz] || ""}
              onChange={(e) => {
                const { formatted, numericValue } = maskBRLDigits(e.target.value);
                setPrecoInputs((prev) => ({ ...prev, [sz]: formatted }));
                update("precos", {
                  ...form.precos,
                  [sz]: numericValue,
                });
              }}
              placeholder="0,00"
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold border border-stone-300 bg-white"
            />
          </div>
        ))}
      </div>

      {/* 12. PROMOÇÃO */}
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
          className="w-full rounded-lg px-3 py-2 text-sm border border-stone-300 bg-white"
          placeholder="Ex: 10"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-teal flex-1 rounded-full py-3 text-sm font-medium cursor-pointer disabled:opacity-50"
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar perfume"}
        </button>
      </div>
    </div>
  );
}
