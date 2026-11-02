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
    vendeDecant: true,
    vendeLacrado: false,
    precoFrascoLacrado: 0,
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
        vendeDecant: product.vendeDecant !== false,
        vendeLacrado: product.vendeLacrado !== undefined ? !!product.vendeLacrado : (Number(product.precoFrascoLacrado) > 0 || product.categoria === "lacrados"),
        precoFrascoLacrado: product.precoFrascoLacrado ?? 0,
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
  const [margemLucroFrascoInput, setMargemLucroFrascoInput] = useState(() => {
    if (initialProduct.precoFrascoLacrado && initialProduct.custoFrasco && initialProduct.custoFrasco > 0) {
      const pct = Math.round(
        ((initialProduct.precoFrascoLacrado - initialProduct.custoFrasco) / initialProduct.custoFrasco) * 100
      );
      if (pct > 0) return String(pct);
    }
    return "50";
  });
  const [margemLucroFrascoPct, setMargemLucroFrascoPct] = useState<number>(() => {
    if (initialProduct.precoFrascoLacrado && initialProduct.custoFrasco && initialProduct.custoFrasco > 0) {
      const pct = Math.round(
        ((initialProduct.precoFrascoLacrado - initialProduct.custoFrasco) / initialProduct.custoFrasco) * 100
      );
      if (pct > 0) return pct;
    }
    return 50;
  });
  const [precoFrascoLacradoInput, setPrecoFrascoLacradoInput] = useState(
    formatBRLValue(initialProduct.precoFrascoLacrado)
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

  // Cálculos da Calculadora do Frasco Inteiro (Lacrado)
  const custoAquisicao = form.custoFrasco || 0;
  const margemFrascoMult = 1 + (margemLucroFrascoPct || 0) / 100;
  const sugestaoFrascoLacrado = custoAquisicao > 0 ? Number((custoAquisicao * margemFrascoMult).toFixed(2)) : 0;
  const lucroEstimadoFrasco = sugestaoFrascoLacrado > 0 ? Number((sugestaoFrascoLacrado - custoAquisicao).toFixed(2)) : 0;

  function aplicarPrecoSugeridoFrasco() {
    update("precoFrascoLacrado", sugestaoFrascoLacrado);
    setPrecoFrascoLacradoInput(formatBRLValue(sugestaoFrascoLacrado));
  }

  async function handleSave() {
    const finalMarca = isCustomBrand ? customBrandName.trim() : form.marca.trim();

    if (!finalMarca || !form.nome.trim()) {
      setError("Preencha marca e nome do perfume.");
      return;
    }

    const vendeDecantsAtivo = form.vendeDecant !== false;
    const vendeLacradoAtivo = !!form.vendeLacrado;

    if (!vendeLacradoAtivo && !vendeDecantsAtivo) {
      setError("Selecione pelo menos uma modalidade de venda: Frasco Lacrado ou Decants.");
      return;
    }

    if (vendeLacradoAtivo && (!form.precoFrascoLacrado || form.precoFrascoLacrado <= 0)) {
      setError("Informe o preço de venda do frasco lacrado.");
      return;
    }

    if (vendeDecantsAtivo) {
      const temPrecoDecant =
        (form.precos[2] && form.precos[2] > 0) ||
        (form.precos[5] && form.precos[5] > 0) ||
        (form.precos[10] && form.precos[10] > 0);
      if (!temPrecoDecant) {
        setError("Informe o preço de ao menos um decant (2ml, 5ml ou 10ml).");
        return;
      }
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
    <div className="px-4 sm:px-6 lg:px-8 pb-32 pt-4 max-w-6xl mx-auto">
      {/* Top Header com Ações Rápidas no Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-black/5">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Editar Perfume" : "Novo Perfume"}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {isEditing ? `Editando as informações de ${form.nome || "perfume"}` : "Cadastre uma nova fragrância no catálogo"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/produtos")}
            className="btn-glass rounded-full px-4 py-2 text-xs font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-teal rounded-full px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar perfume"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs mb-4 font-medium p-3 rounded-xl border border-red-200" style={{ background: "#FDE8E8", color: "#B0554B" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Coluna Principal Esquerda (7 cols no desktop): Dados, Descrições, Acordes e Notas */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* Card 1: Identificação & Classificação */}
          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-xs space-y-4">
            <h3 className="font-display text-base font-semibold border-b border-black/5 pb-2 text-stone-900">
              Identificação & Classificação
            </h3>

            {/* Linha 1 no Desktop: Categoria e Marca lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. SELEÇÃO DE CATEGORIA com Busca + Opção (Outro) */}
              <div className="relative">
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
                        Voltar
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="Nome da categoria (ex: Exclusivos)"
                      className="w-full rounded-lg px-3 py-2 text-sm border border-teal-500 bg-white"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* 2. SELEÇÃO DE MARCA */}
              <div className="relative">
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
                        Voltar
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customBrandName}
                      onChange={(e) => setCustomBrandName(e.target.value)}
                      placeholder="Nome da nova marca (ex: Initio Parfums)"
                      className="w-full rounded-lg px-3 py-2 text-sm border border-teal-500 bg-white"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Linha 2 no Desktop: Nome do Perfume e Gênero Olfativo */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* 3. NOME DO PERFUME */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
                  Nome do perfume
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => update("nome", e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm border border-stone-300 bg-white"
                  placeholder="Ex: Naxos"
                />
              </div>

              {/* 4. GÊNERO OLFATIVO */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold mb-1 uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
                  Gênero Olfativo
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["compartilhado", "masculino", "feminino"] as Genero[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update("genero", g)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                        (form.genero || "compartilhado") === g
                          ? "bg-stone-900 text-white border-transparent shadow-sm"
                          : "bg-white/70 text-stone-700 border-black/10 hover:bg-white"
                      }`}
                    >
                      {g === "compartilhado" ? "Compartilhável" : g === "masculino" ? "Masculino" : "Feminino"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. DESTAQUE NA HOME */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.destaque}
                  onChange={(e) => update("destaque", e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                />
                <span>Destacar na Home (exibir na seção Destaques do catálogo)</span>
              </label>
              {form.destaque && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  Ativo
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Textos de Apresentação */}
          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-xs space-y-4">
            <div className="border-b border-black/5 pb-2">
              <h3 className="font-display text-base font-semibold text-stone-900">
                Textos de Apresentação
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Descrições visualizadas pelos clientes na vitrine e na ficha técnica
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
                    Descrição Curta (Vitrine / Catálogo)
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Aparece no card do produto
                  </span>
                </div>
                <input
                  type="text"
                  value={form.descricaoCurta}
                  onChange={(e) => update("descricaoCurta", e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm border border-stone-300 bg-white"
                  placeholder="Ex: Fragrância oriental especiada com toque de mel e tabaco"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
                    Descrição Completa (Modal de Detalhes)
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Ficha sensorial completa
                  </span>
                </div>
                <textarea
                  value={form.descricaoCompleta}
                  onChange={(e) => update("descricaoCompleta", e.target.value)}
                  rows={4}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm border border-stone-300 bg-white"
                  placeholder="Descrição sensorial aprofundada, história da fragrância e percepção das notas..."
                />
              </div>
            </div>
          </div>

          {/* Card 3: Perfil Olfativo & Acordes */}
          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-xs space-y-4">
            <div className="border-b border-black/5 pb-2">
              <h3 className="font-display text-base font-semibold text-stone-900">
                Perfil Olfativo & Acordes
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Principais famílias olfativas que definem a fragrância
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
                  Acordes Selecionados ({form.acordes.length})
                </label>
                <span className="text-[11px] text-stone-400">
                  Texto sempre preto e tag colorida
                </span>
              </div>

              {/* Tags Selecionadas */}
              <div className="min-h-11 p-2.5 rounded-xl border border-black/10 bg-white/70 mb-3 flex flex-wrap gap-1.5 items-center">
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
                          color: "#1b1f1d",
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
          </div>

          {/* Card 4: Pirâmide Olfativa (Seção Própria com 3 Colunas no Desktop) */}
          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div>
                <h3 className="font-display text-base font-semibold text-stone-900">
                  Pirâmide Olfativa
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Estrutura olfativa nos 3 estágios de evolução do perfume
                </p>
              </div>
              <span className="text-[10px] tracking-label uppercase font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                3 Estágios
              </span>
            </div>

            {/* Grid de 3 Colunas no Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* 1. Notas de Topo / Saída */}
              <div className="p-3.5 rounded-xl bg-white/70 border border-black/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                    <label className="text-xs font-semibold uppercase tracking-label text-stone-900">
                      Notas de Topo
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2.5">
                    Saída imediata (15 a 30 min)
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={form.notas.topo}
                  onChange={(e) => update("notas", { ...form.notas, topo: e.target.value })}
                  placeholder="Ex: Bergamota, Limão, Lavanda..."
                  className="w-full rounded-lg px-3 py-2 text-xs border border-stone-200 bg-white focus:ring-1 focus:ring-[var(--teal-deep)]"
                />
              </div>

              {/* 2. Notas de Coração / Corpo */}
              <div className="p-3.5 rounded-xl bg-white/70 border border-black/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--teal-deep)] shrink-0"></span>
                    <label className="text-xs font-semibold uppercase tracking-label text-stone-900">
                      Notas de Coração
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2.5">
                    Corpo da fragrância (2h a 4h)
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={form.notas.coracao}
                  onChange={(e) => update("notas", { ...form.notas, coracao: e.target.value })}
                  placeholder="Ex: Mel Silvestre, Canela, Jasmim..."
                  className="w-full rounded-lg px-3 py-2 text-xs border border-stone-200 bg-white focus:ring-1 focus:ring-[var(--teal-deep)]"
                />
              </div>

              {/* 3. Notas de Fundo / Base */}
              <div className="p-3.5 rounded-xl bg-white/70 border border-black/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8C6E4A] shrink-0"></span>
                    <label className="text-xs font-semibold uppercase tracking-label text-stone-900">
                      Notas de Fundo
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2.5">
                    Fixação & rastro (6h a 12h+)
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={form.notas.fundo}
                  onChange={(e) => update("notas", { ...form.notas, fundo: e.target.value })}
                  placeholder="Ex: Folhas de Tabaco, Fava Tonka, Baunilha..."
                  className="w-full rounded-lg px-3 py-2 text-xs border border-stone-200 bg-white focus:ring-1 focus:ring-[var(--teal-deep)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Lateral Direita (5 cols no desktop): Mídia, Custos, Precificação e Ações */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6">
          {/* Card: Galeria de Fotos */}
          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-xs">
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

          {/* Card: Precificação & Modalidades de Venda */}
          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-xs space-y-4">
            <div className="border-b border-black/5 pb-2">
              <h3 className="font-display text-base font-semibold text-stone-900">
                Precificação & Modalidades de Venda
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Defina se este perfume será vendido em decants, em frasco lacrado ou em ambas as opções
              </p>
            </div>

            {/* SELEÇÃO DAS MODALIDADES DE VENDA */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-label" style={{ color: "var(--ink-soft)" }}>
                Como este perfume será comercializado?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opção 1: Vender Frasco Lacrado */}
                <div
                  onClick={() => update("vendeLacrado", !form.vendeLacrado)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                    form.vendeLacrado
                      ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-400/50 shadow-xs"
                      : "border-black/10 bg-white/60 hover:bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!form.vendeLacrado}
                    onChange={(e) => update("vendeLacrado", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold block text-stone-900">
                      📦 Frasco Lacrado
                    </span>
                    <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                      Venda do perfume original fechado
                    </span>
                  </div>
                </div>

                {/* Opção 2: Vender Decants */}
                <div
                  onClick={() => update("vendeDecant", form.vendeDecant === false ? true : false)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                    form.vendeDecant !== false
                      ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-400/50 shadow-xs"
                      : "border-black/10 bg-white/60 hover:bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.vendeDecant !== false}
                    onChange={(e) => update("vendeDecant", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-teal-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold block text-stone-900">
                      🧪 Decants (Fracionados)
                    </span>
                    <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                      Venda em 2ml, 5ml e 10ml
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: CALCULADORA E PRECIFICAÇÃO DO FRASCO INTEIRO (se vendeLacrado ativo) */}
            {form.vendeLacrado && (
              <div className="space-y-4 pt-1">
                {/* Calculadora do Frasco Inteiro no mesmo padrão dos Decants */}
                <div className="glass rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-amber-500/15">
                    <label className="text-xs font-semibold uppercase tracking-label text-amber-950 flex items-center gap-1.5">
                      <span>📦</span> Calculadora do Frasco Inteiro & Markup
                    </label>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {custoAquisicao > 0 ? `Custo: R$ ${formatBRLValue(custoAquisicao)}` : "Aguardando custos"}
                    </span>
                  </div>

                  {/* Linha 1: Custo do Frasco e Volume (Grid 2 colunas amplo) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Custo de Aquisição */}
                    <div>
                      <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
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

                    {/* Volume com atalhos em 4 colunas proporcionais */}
                    <div>
                      <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
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
                      <div className="grid grid-cols-4 gap-1 mt-1.5">
                        {[50, 75, 100, 125].map((ml) => (
                          <button
                            key={ml}
                            type="button"
                            onClick={() => update("volumeFrascoMl", ml)}
                            className={`text-[10px] py-1 rounded border transition cursor-pointer text-center font-medium ${
                              form.volumeFrascoMl === ml
                                ? "bg-stone-900 text-white border-transparent font-bold"
                                : "bg-white/80 text-stone-600 border-black/10 hover:bg-white"
                            }`}
                          >
                            {ml}ml
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Margem de Lucro Desejada do Frasco Inteiro (%) */}
                  <div>
                    <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
                      Margem de Lucro Desejada do Frasco (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={margemLucroFrascoInput}
                      onChange={(e) => {
                        const { formatted, numericValue } = maskPercentInput(e.target.value);
                        setMargemLucroFrascoInput(formatted);
                        setMargemLucroFrascoPct(numericValue);
                      }}
                      placeholder="Ex: 50"
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold border border-stone-300 bg-white"
                    />
                    {/* Barra de atalhos comerciais para frasco lacrado */}
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                      {[30, 50, 70, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setMargemLucroFrascoPct(pct);
                            setMargemLucroFrascoInput(String(pct));
                          }}
                          className={`text-[11px] py-1 rounded border transition cursor-pointer text-center font-semibold ${
                            margemLucroFrascoPct === pct
                              ? "bg-amber-900 text-white border-transparent shadow-xs"
                              : "bg-white/80 text-stone-700 border-black/10 hover:bg-white"
                          }`}
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quadro com valores sugeridos para o Frasco Inteiro */}
                  <div className="bg-white/85 rounded-xl p-3 border border-black/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-stone-800">
                        Simulação Financeira do Frasco:
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {form.volumeFrascoMl || 100}ml original
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/70">
                        <span className="block text-[10px] text-stone-500 font-medium">Custo Base</span>
                        <span className="text-xs sm:text-sm font-bold text-stone-800 truncate block">
                          {custoAquisicao > 0 ? `R$ ${formatBRLValue(custoAquisicao)}` : "--"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/60">
                        <span className="block text-[10px] text-emerald-700 font-medium">Lucro Bruto</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-800 truncate block">
                          {lucroEstimadoFrasco > 0 ? `+ R$ ${formatBRLValue(lucroEstimadoFrasco)}` : "--"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-300/70">
                        <span className="block text-[10px] text-amber-800 font-medium">Preço Sugerido</span>
                        <span className="text-xs sm:text-sm font-bold text-amber-900 truncate block">
                          {sugestaoFrascoLacrado > 0 ? `R$ ${formatBRLValue(sugestaoFrascoLacrado)}` : "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Aplicar Preço Sugerido no Frasco Inteiro */}
                  <button
                    type="button"
                    onClick={aplicarPrecoSugeridoFrasco}
                    disabled={sugestaoFrascoLacrado <= 0}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-amber-800 hover:bg-amber-900 text-white shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="8" y1="6" x2="16" y2="6" />
                      <line x1="16" y1="14" x2="16" y2="18" />
                      <line x1="16" y1="10" x2="16" y2="10" />
                      <line x1="12" y1="10" x2="12" y2="10" />
                      <line x1="8" y1="10" x2="8" y2="10" />
                      <line x1="12" y1="14" x2="12" y2="14" />
                      <line x1="8" y1="14" x2="8" y2="14" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                      <line x1="8" y1="18" x2="8" y2="18" />
                    </svg>
                    <span>Aplicar Preço Sugerido no Frasco Inteiro</span>
                  </button>
                </div>

                {/* Preço Final do Frasco Lacrado */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-label text-amber-950">
                    Preço Final do Frasco Lacrado (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={precoFrascoLacradoInput}
                    onChange={(e) => {
                      const { formatted, numericValue } = maskBRLDigits(e.target.value);
                      setPrecoFrascoLacradoInput(formatted);
                      update("precoFrascoLacrado", numericValue);
                    }}
                    placeholder="Ex: 890,00"
                    className="w-full rounded-lg px-3 py-2 text-sm font-bold border border-stone-300 bg-white text-stone-900 focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Preço final de venda do frasco completo exibido aos clientes no catálogo e no carrinho.
                  </p>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: CALCULADORA E PRECIFICAÇÃO DE DECANTS (se vendeDecant ativo) */}
            {form.vendeDecant !== false && (
              <div className="space-y-4 pt-1">
                {/* Calculadora Financeira Redesenhada em 2 Linhas Amplas */}
                <div className="glass rounded-2xl p-4 border border-teal-500/30 bg-teal-500/5 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-teal-500/10">
                    <label className="text-xs font-semibold uppercase tracking-label text-teal-900">
                      Calculadora de Custos & Markup
                    </label>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {custoPorMl > 0 ? `R$ ${custoPorMl.toFixed(2).replace(".", ",")} / ml` : "Aguardando custos"}
                    </span>
                  </div>

                  {/* Linha 1 da Calculadora: Custo do Frasco e Volume (Grid 2 colunas amplo) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Custo de Aquisição */}
                    <div>
                      <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
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

                    {/* Volume com atalhos em grid de 4 colunas sem sobreposição */}
                    <div>
                      <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
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
                      <div className="grid grid-cols-4 gap-1 mt-1.5">
                        {[50, 75, 100, 125].map((ml) => (
                          <button
                            key={ml}
                            type="button"
                            onClick={() => update("volumeFrascoMl", ml)}
                            className={`text-[10px] py-1 rounded border transition cursor-pointer text-center font-medium ${
                              form.volumeFrascoMl === ml
                                ? "bg-stone-900 text-white border-transparent font-bold"
                                : "bg-white/80 text-stone-600 border-black/10 hover:bg-white"
                            }`}
                          >
                            {ml}ml
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Linha 2 da Calculadora: Margem de Lucro (%) com barra dedicada de atalhos */}
                  <div>
                    <label className="block text-xs mb-1 font-medium" style={{ color: "var(--ink-soft)" }}>
                      Margem de Lucro Desejada (%)
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
                    {/* Barra de atalhos em 4 colunas proporcionais */}
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                      {[100, 120, 150, 200].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            update("margemLucroPct", pct);
                            setMargemLucroInput(String(pct));
                          }}
                          className={`text-[11px] py-1 rounded border transition cursor-pointer text-center font-semibold ${
                            form.margemLucroPct === pct
                              ? "bg-stone-900 text-white border-transparent shadow-xs"
                              : "bg-white/80 text-stone-700 border-black/10 hover:bg-white"
                          }`}
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quadro com valores sugeridos */}
                  <div className="bg-white/80 rounded-xl p-3 border border-black/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-stone-800">
                        Valores Sugeridos para Decants:
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Spray + etiqueta inclusos
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-teal-50/80 border border-teal-200/60">
                        <span className="block text-[10px] text-stone-500 font-medium">2ml</span>
                        <span className="text-sm font-bold text-teal-900">
                          {sugestao2 > 0 ? `R$ ${formatBRLValue(sugestao2)}` : "--"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-teal-50/80 border border-teal-200/60">
                        <span className="block text-[10px] text-stone-500 font-medium">5ml</span>
                        <span className="text-sm font-bold text-teal-900">
                          {sugestao5 > 0 ? `R$ ${formatBRLValue(sugestao5)}` : "--"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-teal-50/80 border border-teal-200/60">
                        <span className="block text-[10px] text-stone-500 font-medium">10ml</span>
                        <span className="text-sm font-bold text-teal-900">
                          {sugestao10 > 0 ? `R$ ${formatBRLValue(sugestao10)}` : "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Aplicar Preços Sugeridos nos Decants */}
                  <button
                    type="button"
                    onClick={aplicarPrecosSugeridos}
                    disabled={sugestao2 <= 0}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold btn-teal shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="8" y1="6" x2="16" y2="6" />
                      <line x1="16" y1="14" x2="16" y2="18" />
                      <line x1="16" y1="10" x2="16" y2="10" />
                      <line x1="12" y1="10" x2="12" y2="10" />
                      <line x1="8" y1="10" x2="8" y2="10" />
                      <line x1="12" y1="14" x2="12" y2="14" />
                      <line x1="8" y1="14" x2="8" y2="14" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                      <line x1="8" y1="18" x2="8" y2="18" />
                    </svg>
                    <span>Aplicar Preços Sugeridos nos Decants</span>
                  </button>
                </div>

                {/* Preços Finais dos Decants */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-label" style={{ color: "var(--teal-deep)" }}>
                    Preços Finais dos Decants (R$)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 5, 10] as SizeMl[]).map((sz) => (
                      <div key={sz}>
                        <label className="block text-[11px] mb-1 font-medium text-stone-600">
                          Decant {sz}ml
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
                </div>
              </div>
            )}

            {/* Aviso se nenhuma modalidade estiver selecionada */}
            {!form.vendeLacrado && form.vendeDecant === false && (
              <p className="text-xs p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                Selecione pelo menos uma modalidade de venda (Frasco Lacrado ou Decants).
              </p>
            )}
          </div>

    {/* 12. PROMOÇÃO */}
    <div className="glass rounded-2xl p-4 sm:p-5 border border-white/60 shadow-xs">
          <h3 className="font-display text-base font-semibold border-b border-black/5 pb-2 mb-3 text-stone-900">
            Campanha Promocional
          </h3>
          <label className="flex items-center gap-2 text-sm mb-2 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={form.promo.ativo}
              onChange={(e) => update("promo", { ...form.promo, ativo: e.target.checked })}
              className="w-4 h-4 rounded text-teal-700 cursor-pointer"
            />
            <span>Ativar desconto promocional neste produto</span>
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

        {/* Card: Ações Fixas no Desktop */}
        <div className="glass-strong rounded-2xl p-4 sm:p-5 border border-white/70 shadow-sm lg:sticky lg:top-24 space-y-2.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-teal w-full rounded-full py-3.5 text-sm font-semibold cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
          >
            <span>{saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar perfume"}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/produtos")}
            className="w-full text-center py-2 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
          >
            Cancelar e voltar para a lista
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
