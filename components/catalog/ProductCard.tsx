"use client";

import Image from "next/image";
import { Product } from "@/types";
import { isOptimizableImageUrl } from "@/lib/utils";

function BottleFallback({ seed }: { seed: string }) {
  const colors = ["#6E9C93", "#A9895C", "#8C6E63", "#6C7A89", "#B08968", "#5E7C74"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % colors.length;
  const color = colors[Math.abs(hash) % colors.length];
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.12))" }}>
      <rect x="50" y="10" width="20" height="18" rx="4" fill="#C7A876" />
      <rect x="55" y="0" width="10" height="12" rx="2" fill="#8a6f45" />
      <path
        d="M42 30 h36 a6 6 0 0 1 6 6 v8 l8 10 a10 10 0 0 1 2 6 v76 a8 8 0 0 1 -8 8 H32 a8 8 0 0 1 -8 -8 V60 a10 10 0 0 1 2 -6 l8 -10 v-8 a6 6 0 0 1 6 -6 z"
        fill={color}
        fillOpacity="0.85"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
      />
      <rect x="34" y="70" width="52" height="26" rx="3" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export default function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  const hasPromo = product.promo?.ativo && product.promo.desconto > 0;
  const coverImage = product.imagens?.[0] || product.imagem;
  const photoCount = product.imagens?.length || (product.imagem ? 1 : 0);

  return (
    <button
      onClick={() => onOpen(product)}
      className="card rounded-2xl p-4 flex flex-col text-left relative w-full group cursor-pointer"
    >
      {hasPromo && (
        <span className="badge-promo absolute -top-2 -left-2 text-[10px] font-semibold px-2 py-1 rounded-full tracking-label uppercase shadow z-10">
          -{product.promo.desconto}%
        </span>
      )}
      <div className="relative w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden mb-3 bg-white">
        {coverImage ? (
          isOptimizableImageUrl(coverImage) ? (
            <Image
              src={coverImage}
              alt={product.nome}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={product.nome}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          )
        ) : (
          <div className="w-20 h-24">
            <BottleFallback seed={product.id} />
          </div>
        )}

        {photoCount > 1 && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            📷 {photoCount}
          </span>
        )}
      </div>
      <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
        {product.marca}
      </p>
      <h3 className="font-display text-lg leading-snug mb-1" style={{ color: "var(--ink)" }}>
        {product.nome}
      </h3>
      {product.descricaoCurta && (
        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--ink-soft)" }}>
          {product.descricaoCurta}
        </p>
      )}
    </button>
  );
}
