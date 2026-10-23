"use client";

import { useState } from "react";
import { CartItem, FormaPagamento, Product } from "@/types";
import { formatBRL, precoComPromo } from "@/lib/utils";

interface Props {
  open: boolean;
  items: CartItem[];
  products: Product[];
  onClose: () => void;
  onChangeQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: (nome: string, telefone: string, pagamento: FormaPagamento) => Promise<string>;
}

export default function CartDrawer({
  open,
  items,
  products,
  onClose,
  onChangeQty,
  onRemove,
  onCheckout,
}: Props) {
  const [step, setStep] = useState<"carrinho" | "dados" | "sucesso">("carrinho");
  const [pagamento, setPagamento] = useState<FormaPagamento>("pix");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappRedirectUrl, setWhatsappRedirectUrl] = useState<string>("");

  if (!open) return null;

  const total = items.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.productId);
    if (!p) return sum;
    return sum + precoComPromo(p, item.size) * item.qty;
  }, 0);

  function handleClose() {
    if (step === "sucesso") {
      setStep("carrinho");
      setNome("");
      setTelefone("");
      setWhatsappRedirectUrl("");
    }
    onClose();
  }

  async function handleSubmit() {
    if (!nome.trim() || !telefone.trim()) return;
    setSending(true);
    try {
      const waUrl = await onCheckout(nome.trim(), telefone.trim(), pagamento);
      setWhatsappRedirectUrl(waUrl);
      setStep("sucesso");
    } catch (err) {
      console.error("Erro ao enviar pedido:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 modal-backdrop" onClick={handleClose} />
      <div className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="font-display text-xl">
            {step === "carrinho" ? "Seu carrinho" : step === "dados" ? "Quase lá" : "Pedido Enviado"}
          </h3>
          <button onClick={handleClose} className="btn-glass rounded-full w-8 h-8 flex items-center justify-center">
            ✕
          </button>
        </div>

        {step === "carrinho" && (
          <>
            <div className="overflow-y-auto px-5 flex-1 pb-3">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm mb-3" style={{ color: "var(--ink-soft)" }}>
                    Seu carrinho está vazio.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-glass rounded-full px-4 py-2 text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    style={{ color: "var(--ink)" }}
                  >
                    <span>← Continuar comprando</span>
                  </button>
                </div>
              ) : (
                items.map((item, idx) => {
                  const p = products.find((x) => x.id === item.productId);
                  if (!p) return null;
                  const price = precoComPromo(p, item.size);
                  return (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-black/5">
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                          {item.size}ml · {formatBRL(price)} un.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => onChangeQty(idx, -1)} className="btn-glass w-7 h-7 rounded-full text-sm">
                          −
                        </button>
                        <span className="text-sm w-4 text-center">{item.qty}</span>
                        <button onClick={() => onChangeQty(idx, 1)} className="btn-glass w-7 h-7 rounded-full text-sm">
                          +
                        </button>
                        <button onClick={() => onRemove(idx)} className="ml-1 text-xs" style={{ color: "#B0554B" }}>
                          remover
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 pb-4">
                <p className="text-[10px] tracking-label uppercase font-medium mb-2" style={{ color: "var(--teal-deep)" }}>
                  Forma de pagamento
                </p>
                <div className="flex gap-2 mb-4">
                  {(["pix", "cartao"] as FormaPagamento[]).map((fp) => (
                    <button
                      key={fp}
                      onClick={() => setPagamento(fp)}
                      className={`pill ${pagamento === fp ? "active" : ""} rounded-full px-4 py-2 text-sm font-medium flex-1`}
                    >
                      {fp === "pix" ? "Pix" : "Cartão"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                    Subtotal
                  </span>
                  <span className="font-display text-2xl">{formatBRL(total)}</span>
                </div>
                <button
                  onClick={() => setStep("dados")}
                  className="btn-teal w-full rounded-full py-3 text-sm font-medium tracking-wide cursor-pointer"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full mt-2.5 py-1 text-center text-xs hover:underline transition-colors cursor-pointer"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </>
        )}

        {step === "dados" && (
          <div className="px-5 pb-6">
            <p className="text-sm mb-4" style={{ color: "var(--ink-soft)" }}>
              Só o essencial para prepararmos seu pedido:
            </p>
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              Seu nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 mb-3 text-base sm:text-sm"
              placeholder="Como podemos te chamar?"
            />
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              WhatsApp
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 mb-5 text-base sm:text-sm"
              placeholder="(45) 9XXXX-XXXX"
            />
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setStep("carrinho")}
                className="btn-glass rounded-full px-4 py-3 text-sm cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!nome.trim() || !telefone.trim() || sending}
                className="btn-teal flex-1 rounded-full py-3 text-sm font-medium tracking-wide cursor-pointer"
              >
                {sending ? "Enviando..." : "Enviar pedido no WhatsApp"}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full text-center py-1 text-xs hover:underline transition-colors cursor-pointer"
              style={{ color: "var(--ink-soft)" }}
            >
              Continuar comprando
            </button>
          </div>
        )}

        {step === "sucesso" && (
          <div className="px-5 pb-8 pt-2 text-center animate-fade-in">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h4 className="font-display text-xl font-bold mb-1" style={{ color: "var(--ink)" }}>
              Pedido registrado com sucesso!
            </h4>
            <p className="text-xs mb-5 max-w-xs mx-auto leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Estamos te direcionando para o WhatsApp da OFFGLASS com os dados do seu pedido. Caso o aplicativo não tenha aberto automaticamente, clique no botão abaixo:
            </p>

            {whatsappRedirectUrl && (
              <a
                href={whatsappRedirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-teal w-full rounded-full py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md mb-3"
              >
                <svg width="20" height="20" viewBox="0 0 32 32" fill="white">
                  <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.702 4.61 1.912 6.475L4 29l7.72-1.874A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3Zm.001 21.6c-1.938 0-3.75-.55-5.287-1.5l-.379-.226-4.58 1.112 1.13-4.46-.248-.394A9.55 9.55 0 0 1 5.4 15c0-5.85 4.75-10.6 10.6-10.6S26.6 9.15 26.6 15 22.85 24.6 16.002 24.6Zm5.79-7.94c-.317-.159-1.878-.928-2.169-1.034-.29-.106-.502-.159-.713.16-.21.317-.818 1.033-1.003 1.245-.185.211-.37.238-.687.08-.317-.159-1.338-.494-2.548-1.575-.942-.84-1.578-1.878-1.763-2.195-.185-.317-.02-.489.139-.647.143-.142.317-.37.475-.556.159-.185.211-.317.317-.529.106-.211.053-.397-.026-.556-.08-.159-.713-1.72-.977-2.354-.257-.617-.518-.534-.713-.544-.185-.008-.397-.01-.608-.01-.211 0-.556.08-.847.397-.29.317-1.11 1.086-1.11 2.647 0 1.562 1.137 3.07 1.296 3.281.159.211 2.239 3.42 5.427 4.796.758.327 1.35.523 1.812.669.761.242 1.454.208 2.002.126.611-.091 1.878-.767 2.143-1.508.264-.741.264-1.376.185-1.508-.079-.132-.29-.211-.607-.37Z" />
                </svg>
                <span>Abrir WhatsApp Agora</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full text-center py-2 text-xs hover:underline cursor-pointer"
              style={{ color: "var(--ink-soft)" }}
            >
              Concluir e voltar ao catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
