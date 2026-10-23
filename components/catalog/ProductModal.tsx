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
    const waUrl = whatsappUrl(WHATSAPP_NUMBER, mensagem);
    const isMobile =
      typeof window !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      const popup = window.open(waUrl, "_blank");
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        window.location.href = waUrl;
      }
    }
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer"
                    aria-label="Foto anterior"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer"
                    aria-label="Próxima foto"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
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
                      className="accord-badge text-xs px-3 py-1 rounded-full font-medium border"
                      style={{ background: a.cor + "22", color: "var(--ink)", borderColor: a.cor + "40" }}
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

            {product.categoria === "lacrados" ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-label text-teal-800">
                      Frasco Original Lacrado
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Esta fragrância é comercializada em frasco original completo e lacrado de fábrica. Fale diretamente com nossa consultoria para verificar a disponibilidade de volumetria e cotação personalizada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConsultarFrascoOriginal}
                  className="btn-teal w-full rounded-full py-3.5 text-sm font-semibold tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="white">
                    <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.702 4.61 1.912 6.475L4 29l7.72-1.874A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3Zm.001 21.6c-1.938 0-3.75-.55-5.287-1.5l-.379-.226-4.58 1.112 1.13-4.46-.248-.394A9.55 9.55 0 0 1 5.4 15c0-5.85 4.75-10.6 10.6-10.6S26.6 9.15 26.6 15 22.85 24.6 16.002 24.6Zm5.79-7.94c-.317-.159-1.878-.928-2.169-1.034-.29-.106-.502-.159-.713.16-.21.317-.818 1.033-1.003 1.245-.185.211-.37.238-.687.08-.317-.159-1.338-.494-2.548-1.575-.942-.84-1.578-1.878-1.763-2.195-.185-.317-.02-.489.139-.647.143-.142.317-.37.475-.556.159-.185.211-.317.317-.529.106-.211.053-.397-.026-.556-.08-.159-.713-1.72-.977-2.354-.257-.617-.518-.534-.713-.544-.185-.008-.397-.01-.608-.01-.211 0-.556.08-.847.397-.29.317-1.11 1.086-1.11 2.647 0 1.562 1.137 3.07 1.296 3.281.159.211 2.239 3.42 5.427 4.796.758.327 1.35.523 1.812.669.761.242 1.454.208 2.002.126.611-.091 1.878-.767 2.143-1.508.264-.741.264-1.376.185-1.508-.079-.132-.29-.211-.607-.37Z" />
                  </svg>
                  <span>Solicitar Orçamento no WhatsApp</span>
                </button>
              </div>
            ) : (
              <>
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
                  className="btn-teal w-full rounded-full py-3 text-sm font-medium tracking-wide shadow-md cursor-pointer"
                >
                  Adicionar ao carrinho
                </button>

                <button
                  type="button"
                  onClick={handleConsultarFrascoOriginal}
                  className="w-full mt-2 text-center text-sm text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Consultar disponibilidade do frasco lacrado
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
