"use client";

import Image from "next/image";
import { useState } from "react";
import { Accord, Product, SizeMl } from "@/types";
import { formatBRL, isOptimizableImageUrl, precoComPromo, whatsappUrl } from "@/lib/utils";

const WHATSAPP_NUMBER = "5545999736188";

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const price = precoComPromo(product, size);
  const basePrice = product.precos[size];
  const hasPromo = product.promo?.ativo && product.promo.desconto > 0;
  const productAccords = accords.filter((a) => product.acordes.includes(a.key));

  const gallery =
    Array.isArray(product.imagens) && product.imagens.length > 0
      ? product.imagens.filter(Boolean)
      : product.imagem
      ? [product.imagem]
      : [];

  const currentImage = gallery[activeImageIndex] || gallery[0] || "";

  function nextImage() {
    if (gallery.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  }

  function prevImage() {
    if (gallery.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  }

  function handleConsultarFrascoOriginal() {
    const mensagem = `Olá! Gostaria de consultar a disponibilidade e o valor do frasco lacrado completo do perfume ${product.nome} da ${product.marca}.`;
    window.open(whatsappUrl(WHATSAPP_NUMBER, mensagem), "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
        <div className="glass-strong rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
          <div className="sticky top-0 flex justify-end p-3 z-10">
            <button
              onClick={onClose}
              className="btn-glass rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="px-6 pb-6 -mt-8">
            {/* Galeria de Fotos Interativa */}
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-3 flex items-center justify-center bg-white shadow-sm border border-black/5">
              {currentImage ? (
                isOptimizableImageUrl(currentImage) ? (
                  <Image
                    src={currentImage}
                    alt={`${product.nome} - Foto ${activeImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-contain p-2 transition-all duration-300"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage}
                    alt={`${product.nome} - Foto ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain p-2 transition-all duration-300"
                  />
                )
              ) : (
                <p className="font-display text-2xl" style={{ color: "var(--ink-soft)" }}>
                  {product.nome}
                </p>
              )}

              {/* Controles de Navegação Anterior/Próxima */}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition text-xs"
                    aria-label="Foto anterior"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition text-xs"
                    aria-label="Próxima foto"
                  >
                    ▶
                  </button>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
                    {activeImageIndex + 1} / {gallery.length}
                  </div>
                </>
              )}
            </div>

            {/* Carrossel de Miniaturas */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-2" style={{ scrollbarWidth: "none" }}>
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                      activeImageIndex === idx
                        ? "border-[var(--teal)] scale-105 shadow"
                        : "border-transparent opacity-65 hover:opacity-100"
                    } bg-white`}
                  >
                    {isOptimizableImageUrl(img) ? (
                      <Image src={img} alt="" fill sizes="56px" className="object-contain" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    )}
                  </button>
                ))}
              </div>
            )}

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
                <span className="font-display text-2xl font-semibold" style={{ color: "var(--teal-deep)" }}>
                  {formatBRL(price)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onAddToCart(product, size)}
              className="btn-teal w-full rounded-full py-3 text-sm font-medium tracking-wide shadow-md"
            >
              Adicionar ao carrinho
            </button>

            <button
              type="button"
              onClick={handleConsultarFrascoOriginal}
              className="w-full mt-2 text-center text-sm text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors"
            >
              Consultar disponibilidade do frasco lacrado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
