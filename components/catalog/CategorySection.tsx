"use client";

import { Product } from "@/types";
import ProductCard from "./ProductCard";

export default function CategorySection({
  title,
  subtitle,
  products,
  categoryKey,
  onOpenProduct,
  onViewMore,
  maxDisplay = 12,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  categoryKey: string;
  onOpenProduct: (p: Product) => void;
  onViewMore?: (key: string) => void;
  maxDisplay?: number;
}) {
  // Quando não houver nenhum produto na seção, não apresentar
  if (!products || products.length === 0) {
    return null;
  }

  const displayed = products.slice(0, maxDisplay);
  const totalCount = products.length;
  const hasMore = totalCount > maxDisplay;

  return (
    <section className="mb-10 animate-fade-in">
      {/* Cabeçalho da Seção */}
      <div className="flex items-end justify-between px-5 mb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2
              className="font-display text-xl sm:text-2xl font-bold tracking-tight"
              style={{ color: "var(--ink)" }}
            >
              {title}
            </h2>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--ink-soft)", opacity: 0.75 }}
            >
              ({totalCount})
            </span>
          </div>
          {subtitle && (
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              {subtitle}
            </p>
          )}
        </div>

        {hasMore && onViewMore && (
          <button
            type="button"
            onClick={() => onViewMore(categoryKey)}
            className="text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            style={{ color: "var(--teal-deep)" }}
          >
            <span>Ver todos</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Fileira única horizontal com rolagem suave no mobile e desktop */}
      <div
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 px-4 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {displayed.map((p, index) => (
          <div
            key={p.id}
            className="w-[160px] min-[370px]:w-[175px] min-[410px]:w-[190px] sm:w-[220px] md:w-[240px] lg:w-[250px] shrink-0 snap-start flex"
          >
            <ProductCard
              product={p}
              priority={index < 3}
              onOpen={onOpenProduct}
            />
          </div>
        ))}

        {/* Ao fim dos 12, se houver mais perfumes, apresentar card para ver todos da seção */}
        {hasMore && onViewMore && (
          <div className="w-[160px] min-[370px]:w-[175px] min-[410px]:w-[190px] sm:w-[220px] md:w-[240px] lg:w-[250px] shrink-0 snap-start flex">
            <button
              type="button"
              onClick={() => onViewMore(categoryKey)}
              className="card rounded-2xl p-5 flex flex-col items-center justify-center text-center w-full group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all border border-black/10 bg-white/70"
            >
              <div className="w-12 h-12 rounded-full btn-glass flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--teal-deep)" }}
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <p className="font-display font-semibold text-sm mb-1" style={{ color: "var(--ink)" }}>
                Ver todos ({totalCount})
              </p>
              <p className="text-[11px] leading-tight mb-3" style={{ color: "var(--ink-soft)" }}>
                +{totalCount - maxDisplay} fragrâncias nesta seção
              </p>
              <span
                className="text-xs font-semibold underline underline-offset-2"
                style={{ color: "var(--teal-deep)" }}
              >
                Acessar seção →
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
