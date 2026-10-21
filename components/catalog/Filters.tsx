"use client";

import { useMemo, useState } from "react";

export type SortOption =
  | "relevancia"
  | "novidades"
  | "menor_preco"
  | "maior_preco"
  | "mais_vendidos"
  | "nome_az";

export interface ChipOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * ChipGroup - Inspirado em 21st.dev/@kuratlielia/components/chip-group
 * Linha de chips com cantos arredondados, checkmark SVG animado na seleção
 * e recolhimento inteligente ("+N mais"). Totalmente sem emojis.
 */
export function ChipGroup({
  options,
  value,
  onValueChange,
  maxVisible = 6,
  className = "",
}: {
  options: ChipOption[];
  value: string;
  onValueChange: (val: string) => void;
  maxVisible?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  // Mantém opções visíveis e garante que o chip ativo nunca fique escondido
  const visibleOptions = useMemo(() => {
    if (expanded || options.length <= maxVisible) return options;
    const sliced = options.slice(0, maxVisible);
    const activeOpt = options.find((o) => o.value === value);
    if (activeOpt && !sliced.some((o) => o.value === value)) {
      return [...sliced.slice(0, maxVisible - 1), activeOpt];
    }
    return sliced;
  }, [options, maxVisible, expanded, value]);

  const hiddenCount = Math.max(0, options.length - visibleOptions.length);

  return (
    <div
      role="tablist"
      aria-label="Categorias de fragrâncias"
      className={`flex items-center gap-2 overflow-x-auto pb-1 px-4 scroll-smooth ${className}`}
      style={{ scrollbarWidth: "none" }}
    >
      {visibleOptions.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(opt.value)}
            className={`group relative inline-flex items-center justify-center shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
              active
                ? "bg-[#1b1f1d] text-white shadow-xs border border-[#1b1f1d] scale-[1.02]"
                : "bg-white/60 hover:bg-white text-stone-800 border border-black/10 hover:border-black/20 hover:shadow-xs active:scale-95"
            }`}
          >
            {/* Ícone de Check SVG animado */}
            <span
              className={`inline-flex items-center justify-center transition-all duration-300 ease-out overflow-hidden ${
                active ? "w-3.5 opacity-100 mr-1.5 scale-100" : "w-0 opacity-0 mr-0 scale-50"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 8.5 6.5 12 13 4.5" />
              </svg>
            </span>

            {/* Rótulo da Opção */}
            <span>{opt.label}</span>

            {/* Badge de Contagem opcional */}
            {typeof opt.count === "number" && (
              <span
                className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-black/5 text-stone-600"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Botão de "+N mais" / "Recolher" */}
      {options.length > maxVisible && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-white/40 hover:bg-white/90 text-stone-600 hover:text-stone-900 border border-black/10 transition-all cursor-pointer shadow-xs active:scale-95"
          aria-expanded={expanded}
        >
          <span>{expanded ? "Recolher" : `+${hiddenCount} mais`}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Subopções ampliadas exibidas quando uma categoria é clicada:
 * - Linha 1: Filtro de Gênero Olfativo + Botão PROMO + Seletor de Ordenação (Relevância) com cantos arredondados
 * - Linha 2 (footer da barra de filtros): Marcas com cantos arredondados exibidas com largura total
 */
export function CategorySubFilters({
  currentCategory,
  currentGender,
  onGenderChange,
  brands,
  currentBrand,
  onBrandChange,
  promoOnly,
  onTogglePromo,
}: {
  currentCategory: string;
  currentGender: string;
  onGenderChange: (g: string) => void;
  brands: string[];
  currentBrand: string;
  onBrandChange: (b: string) => void;
  promoOnly: boolean;
  onTogglePromo: () => void;
  sortBy?: SortOption;
  onSortChange?: (s: SortOption) => void;
  activeFilterCount?: number;
  onResetFilters?: () => void;
}) {
  const genderOptions = [
    { key: "todos", label: "Todos" },
    { key: "masculino", label: "Masculino" },
    { key: "feminino", label: "Feminino" },
    { key: "compartilhado", label: "Compartilhado" },
  ];

  return (
    <div className="pt-2 pb-1.5 px-4 space-y-2 animate-slide-up">
      {/* Linha 1: Gênero Olfativo + Botão PROMO */}
      <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {genderOptions.map((opt) => {
          const active = currentGender === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onGenderChange(opt.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center shrink-0 transition-all cursor-pointer ${
                active
                  ? "bg-[#3f6b62] text-white border-[#3f6b62] shadow-xs font-semibold"
                  : "bg-white/50 text-stone-700 border-black/10 hover:bg-white"
              }`}
            >
              <span>{opt.label}</span>
            </button>
          );
        })}

        {/* Botão PROMO sem emoji */}
        <button
          type="button"
          onClick={onTogglePromo}
          className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center shrink-0 transition-all cursor-pointer ${
            promoOnly
              ? "badge-promo text-white border-transparent shadow-xs scale-105"
              : "bg-white/50 text-stone-700 border-black/10 hover:bg-white"
          }`}
        >
          <span>PROMO</span>
        </button>
      </div>

      {/* Linha 2 (Footer da seção de filtros): Marcas com cantos arredondados com largura total */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto py-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          type="button"
          onClick={() => onBrandChange("todas")}
          className={`chip ${
            currentBrand === "todas" ? "active" : ""
          } rounded-full px-3 py-1 text-xs font-medium cursor-pointer shrink-0 border border-black/10`}
        >
          Todas as marcas
        </button>
        {brands.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => onBrandChange(b)}
            className={`chip ${
              currentBrand === b ? "active" : ""
            } rounded-full px-3 py-1 text-xs font-medium cursor-pointer shrink-0 border border-black/10`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
