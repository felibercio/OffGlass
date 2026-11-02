"use client";

import Image from "next/image";
import { Product } from "@/types";
import { formatBRL, isOptimizableImageUrl, precoComPromo } from "@/lib/utils";

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
  priority = false,
}: {
  product: Product;
  onOpen: (product: Product) => void;
  priority?: boolean;
}) {
  const hasPromo = product.promo?.ativo && product.promo.desconto > 0;
  const isSomenteLacrado = product.vendeLacrado && !product.vendeDecant;
  const isHibrido = product.vendeLacrado && product.vendeDecant;
  const isLacradoLegado = product.categoria === "lacrados" && !product.vendeDecant;
  const coverImage = product.imagens?.[0] || product.imagem;
  const photoCount = product.imagens?.length || (product.imagem ? 1 : 0);

  return (
    <button
      onClick={() => onOpen(product)}
      className="card rounded-2xl p-3.5 sm:p-4 flex flex-col text-left relative w-full group cursor-pointer transition-all duration-300"
    >
      {/* Badges superiores */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
        {hasPromo && (
          <span className="badge-promo text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-label uppercase shadow">
            -{product.promo.desconto}%
          </span>
        )}
        {(isSomenteLacrado || isLacradoLegado) && (
          <span className="bg-teal-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
            Frasco Lacrado
          </span>
        )}
        {isHibrido && (
          <span className="bg-stone-800 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
            Decants + Frasco
          </span>
        )}
      </div>

      <div className="relative w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden mb-3 bg-white">
        {coverImage ? (
          isOptimizableImageUrl(coverImage) ? (
            <Image
              src={coverImage}
              alt={product.nome}
              fill
              priority={priority}
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
          <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{photoCount}</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 w-full mb-0.5">
        <p className="text-[10px] tracking-label uppercase font-medium truncate" style={{ color: "var(--gold-deep)" }}>
          {product.marca}
        </p>
        <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-500 bg-stone-100/90 px-2 py-0.5 rounded-full shrink-0">
          {product.genero === "masculino" ? "Masculino" : product.genero === "feminino" ? "Feminino" : "Compartilhável"}
        </span>
      </div>
      <h3 className="font-display text-base sm:text-lg leading-snug mb-1" style={{ color: "var(--ink)" }}>
        {product.nome}
      </h3>
      {product.descricaoCurta && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--ink-soft)" }}>
          {product.descricaoCurta}
        </p>
      )}

      {/* Rodapé do Card */}
      {isSomenteLacrado || isLacradoLegado ? (
        <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between text-xs w-full">
          {product.precoFrascoLacrado && product.precoFrascoLacrado > 0 ? (
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-500 font-medium">Frasco Lacrado</span>
              <div className="flex items-center gap-1.5">
                {hasPromo && (
                  <span className="text-[11px] line-through text-stone-400 font-normal">
                    {formatBRL(product.precoFrascoLacrado)}
                  </span>
                )}
                <span className="text-xs sm:text-sm font-bold text-stone-900">
                  {formatBRL(precoComPromo(product, "lacrado"))}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full font-semibold" style={{ color: "var(--teal-deep)" }}>
              <span>Consultar Frasco</span>
              <span className="text-[11px] underline">WhatsApp →</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-auto pt-3 border-t border-black/5 flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between text-xs w-full">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400">Decants a partir de</span>
              <div className="flex items-center gap-1.5">
                {hasPromo && (
                  <span className="text-[11px] line-through text-stone-400 font-normal">
                    {formatBRL(product.precos[2])}
                  </span>
                )}
                <span className="text-xs sm:text-sm font-bold text-stone-900">
                  {formatBRL(precoComPromo(product, 2))}
                </span>
              </div>
            </div>
            {isHibrido && (
              <span className="text-[9px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                + Opção Lacrado
              </span>
            )}
          </div>

          {!product.vendeLacrado && (
            <div className="flex items-center justify-between text-[11px] font-medium text-teal-700/90 pt-1 border-t border-black/[0.04]">
              <span>Frasco inteiro sob consulta</span>
              <span className="text-[10px] underline">WhatsApp →</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
