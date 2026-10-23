"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Product } from "@/types";
import { formatBRL, isOptimizableImageUrl, precoComPromo } from "@/lib/utils";

export default function SearchBar({
  products,
  query,
  onQueryChange,
  onSelectProduct,
}: {
  products: Product[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelectProduct: (p: Product) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalized = query.trim().toLowerCase();

  const matchingProducts = normalized
    ? products.filter((p) => {
        const inName = p.nome.toLowerCase().includes(normalized);
        const inBrand = p.marca.toLowerCase().includes(normalized);
        const inShortDesc = (p.descricaoCurta || "").toLowerCase().includes(normalized);
        const inFullDesc = (p.descricaoCompleta || "").toLowerCase().includes(normalized);
        const inNotes =
          (p.notas.topo || "").toLowerCase().includes(normalized) ||
          (p.notas.coracao || "").toLowerCase().includes(normalized) ||
          (p.notas.fundo || "").toLowerCase().includes(normalized);
        const inAccords = (p.acordes || []).some((a) => a.toLowerCase().includes(normalized));

        return inName || inBrand || inShortDesc || inFullDesc || inNotes || inAccords;
      })
    : [];

  function handleSelect(product: Product) {
    onSelectProduct(product);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {/* Ícone de Busca */}
        <span className="absolute left-3.5 text-stone-400 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>

        <input
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          placeholder="Pesquise por nome, marca, nota olfativa ou acorde..."
          className="w-full pl-10 pr-9 py-2.5 rounded-full text-base sm:text-sm transition-all shadow-xs border border-black/10 bg-white/80 focus:bg-white focus:ring-2 focus:ring-[#3f6b62]/20 text-stone-900 placeholder:text-stone-400"
        />

        {/* Botão de Limpar Busca (X) */}
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              setIsOpen(false);
            }}
            className="absolute right-3 text-stone-400 hover:text-stone-700 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/5 transition cursor-pointer"
            aria-label="Limpar pesquisa"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown de Autocomplete / Resultados Instantâneos */}
      {isOpen && normalized && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 glass-strong rounded-2xl shadow-xl border border-black/10 p-2 max-h-96 overflow-y-auto animate-fade-in bg-white/95">
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-black/5 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-label text-stone-500">
              {matchingProducts.length} perfume(s) encontrado(s)
            </span>
            <span className="text-[10px] text-stone-400">Clique para abrir detalhes</span>
          </div>

          {matchingProducts.length > 0 ? (
            <div className="space-y-1">
              {matchingProducts.map((p) => {
                const cover = p.imagens?.[0] || p.imagem;
                const isLacrado = p.categoria === "lacrados";
                const precoMin = precoComPromo(p, 2);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors hover:bg-stone-100/90 cursor-pointer group"
                  >
                    {/* Miniatura da Foto */}
                    <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-black/10 flex items-center justify-center">
                      {cover ? (
                        isOptimizableImageUrl(cover) ? (
                          <Image
                            src={cover}
                            alt={p.nome}
                            fill
                            sizes="48px"
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={p.nome}
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        )
                      ) : (
                        <span className="text-[10px] text-stone-400">Frasco</span>
                      )}
                    </div>

                    {/* Informações: Marca, Nome e Breve Descrição */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] tracking-label uppercase font-medium text-amber-700">
                        {p.marca}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold truncate text-stone-900 group-hover:text-teal-800 transition-colors">
                        {p.nome}
                      </p>
                      {p.descricaoCurta && (
                        <p className="text-[11px] text-stone-600 line-clamp-1">
                          {p.descricaoCurta}
                        </p>
                      )}
                    </div>

                    {/* Preço ou Selo Frasco Lacrado */}
                    <div className="shrink-0 text-right">
                      {isLacrado ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                          Lacrado
                        </span>
                      ) : (
                        <div>
                          <span className="text-[9px] block text-stone-400">A partir de</span>
                          <span className="text-xs font-bold text-stone-900">
                            {formatBRL(precoMin)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-stone-600">
              Nenhuma fragrância encontrada para &quot;{query}&quot;.
              <br />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Tente pesquisar por notas como baunilha, âmbar, cítrico ou marcas.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
