"use client";

import { useState } from "react";
import { Accord, Product, SizeMl } from "@/types";
import { formatBRL, precoComPromo } from "@/lib/utils";

export default function ProductModal({
  product,
  accords,
  onClose,
  onAddToCart,
}: {
  product: Product;
  accords: Accord[];
  onClose: () => void;
  onAddToCart: (product: Product, size: SizeMl) => void;
}) {
  const [size, setSize] = useState<SizeMl>(5);
  const price = precoComPromo(product, size);
  const basePrice = product.precos[size];
  const hasPromo = product.promo?.ativo && product.promo.desconto > 0;
  const productAccords = accords.filter((a) => product.acordes.includes(a.key));

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
        <div className="glass-strong rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
          <div className="sticky top-0 flex justify-end p-3 z-10">
            <button
              onClick={onClose}
              className="btn-glass rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="px-6 pb-6 -mt-8">
            <div
              className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.9), rgba(207,227,221,0.4))",
              }}
            >
              {product.imagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imagem} alt={product.nome} className="w-full h-full object-cover" />
              ) : (
                <p className="font-display text-2xl" style={{ color: "var(--ink-soft)" }}>
                  {product.nome}
                </p>
              )}
            </div>

            <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
              {product.marca}
            </p>
            <h2 className="font-display text-2xl mb-2">{product.nome}</h2>

            {product.descricaoCompleta && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--ink-soft)" }}>
                {product.descricaoCompleta}
              </p>
            )}

            {productAccords.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] tracking-label uppercase font-medium mb-2" style={{ color: "var(--teal-deep)" }}>
                  Principais acordes
                </p>
                <div className="flex flex-wrap gap-2">
                  {productAccords.map((a) => (
                    <span
                      key={a.key}
                      className="accord-badge text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: a.cor + "22", color: a.cor }}
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 space-y-2">
              <p className="text-[10px] tracking-label uppercase font-medium mb-1" style={{ color: "var(--teal-deep)" }}>
                Pirâmide olfativa
              </p>
              {[
                { label: "Topo", val: product.notas.topo },
                { label: "Coração", val: product.notas.coracao },
                { label: "Fundo", val: product.notas.fundo },
              ].map(
                (n) =>
                  n.val && (
                    <p key={n.label} className="text-sm" style={{ color: "var(--ink-soft)" }}>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>
                        {n.label}:
                      </span>{" "}
                      {n.val}
                    </p>
                  )
              )}
            </div>

            <div className="divider-fade my-4" />

            <p className="text-[10px] tracking-label uppercase font-medium mb-2" style={{ color: "var(--teal-deep)" }}>
              Escolha o tamanho do decant
            </p>
            <div className="flex gap-2 mb-4">
              {([2, 5, 10] as SizeMl[]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSize(sz)}
                  className={`pill ${size === sz ? "active" : ""} rounded-full px-4 py-2 text-sm font-medium flex-1`}
                >
                  {sz}ml
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                {hasPromo && (
                  <span className="text-sm line-through opacity-50 mr-2">{formatBRL(basePrice)}</span>
                )}
                <span className="font-display text-2xl" style={{ color: "var(--teal-deep)" }}>
                  {formatBRL(price)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onAddToCart(product, size)}
              className="btn-teal w-full rounded-full py-3 text-sm font-medium tracking-wide"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
