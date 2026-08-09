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
  onCheckout: (nome: string, telefone: string, pagamento: FormaPagamento) => Promise<void>;
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
  const [step, setStep] = useState<"carrinho" | "dados">("carrinho");
  const [pagamento, setPagamento] = useState<FormaPagamento>("pix");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const total = items.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.productId);
    if (!p) return sum;
    return sum + precoComPromo(p, item.size) * item.qty;
  }, 0);

  async function handleSubmit() {
    if (!nome.trim() || !telefone.trim()) return;
    setSending(true);
    try {
      await onCheckout(nome.trim(), telefone.trim(), pagamento);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="font-display text-xl">
            {step === "carrinho" ? "Seu carrinho" : "Quase lá"}
          </h3>
          <button onClick={onClose} className="btn-glass rounded-full w-8 h-8 flex items-center justify-center">
            ✕
          </button>
        </div>

        {step === "carrinho" && (
          <>
            <div className="overflow-y-auto px-5 flex-1 pb-3">
              {items.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--ink-soft)" }}>
                  Seu carrinho está vazio.
                </p>
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
                  className="btn-teal w-full rounded-full py-3 text-sm font-medium tracking-wide"
                >
                  Continuar
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
              className="w-full rounded-lg px-3 py-2 mb-3 text-sm"
              placeholder="Como podemos te chamar?"
            />
            <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
              WhatsApp
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-lg px-3 py-2 mb-5 text-sm"
              placeholder="(45) 9XXXX-XXXX"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStep("carrinho")}
                className="btn-glass rounded-full px-4 py-3 text-sm"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!nome.trim() || !telefone.trim() || sending}
                className="btn-teal flex-1 rounded-full py-3 text-sm font-medium tracking-wide"
              >
                {sending ? "Enviando..." : "Enviar pedido no WhatsApp"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
