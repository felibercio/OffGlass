"use client";

import { useMemo, useState } from "react";
import { Accord, CartItem, Category, FormaPagamento, PedidoItem, Product, SizeMl } from "@/types";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import CartDrawer from "./CartDrawer";
import { CategoryTabs, BrandChips } from "./Filters";
import { fillTemplate, formatBRL, precoComPromo, whatsappUrl } from "@/lib/utils";

const WHATSAPP_NUMBER = "5545999736188";

const DEFAULT_TEMPLATE_PEDIDO =
  "Olá! Meu nome é {{nome}}. Gostaria de fazer o seguinte pedido: {{itens}}. Forma de pagamento: {{pagamento}}. Total: {{total}}";

export default function CatalogApp({
  products,
  categories,
  accords,
  mensagemPedidoTemplate,
}: {
  products: Product[];
  categories: Category[];
  accords: Accord[];
  mensagemPedidoTemplate: string;
}) {
  const [currentCategory, setCurrentCategory] = useState("todos");
  const [currentBrand, setCurrentBrand] = useState("todas");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const brands = useMemo(() => {
    const scoped = products.filter((p) => currentCategory === "todos" || p.categoria === currentCategory);
    return [...new Set(scoped.map((p) => p.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products, currentCategory]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const catOk = currentCategory === "todos" || p.categoria === currentCategory;
      const brandOk = currentBrand === "todas" || p.marca === currentBrand;
      return catOk && brandOk;
    });
  }, [products, currentCategory, currentBrand]);

  function handleCategoryChange(key: string) {
    setCurrentCategory(key);
    setCurrentBrand("todas");
  }

  function addToCart(product: Product, size: SizeMl) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.size === size);
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { productId: product.id, size, qty: 1 }];
    });
    setModalProduct(null);
    setCartOpen(true);
  }

  function changeQty(index: number, delta: number) {
    setCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], qty: next[index].qty + delta };
      return next.filter((i) => i.qty > 0);
    });
  }

  function removeItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCheckout(nome: string, telefone: string, pagamento: FormaPagamento) {
    const itens: PedidoItem[] = cart.map((item) => {
      const p = products.find((x) => x.id === item.productId)!;
      return {
        produto: p.nome,
        tamanho: item.size,
        qtd: item.qty,
        precoUnit: precoComPromo(p, item.size),
      };
    });
    const total = itens.reduce((s, i) => s + i.precoUnit * i.qtd, 0);

    // Salva o pedido no banco antes de direcionar ao WhatsApp
    try {
      await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeCliente: nome, telefoneCliente: telefone, itens, formaPagamento: pagamento, total }),
      });
    } catch (e) {
      console.error("Não foi possível salvar o pedido:", e);
      // segue o fluxo mesmo assim — a cliente não pode ficar travada por uma falha de rede aqui
    }

    const itensTexto = itens
      .map((i) => `${i.qtd}x ${i.produto} (${i.tamanho}ml) - ${formatBRL(i.precoUnit * i.qtd)}`)
      .join(", ");
    const mensagem = fillTemplate(mensagemPedidoTemplate || DEFAULT_TEMPLATE_PEDIDO, {
      nome,
      itens: itensTexto,
      total: formatBRL(total),
      pagamento: pagamento === "pix" ? "Pix" : "Cartão",
    });

    window.open(whatsappUrl(WHATSAPP_NUMBER, mensagem), "_blank");
    setCart([]);
    setCartOpen(false);
  }

  function generalWhatsapp() {
    const mensagem = "Olá! Vim pelo catálogo OFFGLASS DECANTS e gostaria de tirar uma dúvida.";
    window.open(whatsappUrl(WHATSAPP_NUMBER, mensagem), "_blank");
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <header className="sticky top-0 z-40 glass-strong">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold" style={{ letterSpacing: "0.02em" }}>
              OFFGLASS
            </span>
            <span className="text-[10px] tracking-label uppercase" style={{ color: "var(--gold-deep)" }}>
              Decants
            </span>
          </div>
          <button onClick={() => setCartOpen(true)} className="relative btn-glass rounded-full p-2.5" aria-label="Carrinho">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 6h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" />
              <circle cx="9" cy="21" r="1.4" />
              <circle cx="18" cy="21" r="1.4" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 btn-teal text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
        <div className="pt-1">
          <CategoryTabs categories={categories} current={currentCategory} onChange={handleCategoryChange} />
        </div>
        <BrandChips brands={brands} current={currentBrand} onChange={setCurrentBrand} />
      </header>

      <section className="px-5 pt-6 pb-2">
        <p className="font-display italic text-3xl leading-tight">
          Olá,
          <br />
          seja bem-vinda(o).
        </p>
        <p className="text-sm mt-3 max-w-md" style={{ color: "var(--ink-soft)" }}>
          Fragrâncias de nicho, originais, decantadas com cuidado em frascos de <b>2ml, 5ml e 10ml</b>, etiquetados e
          prontos para uso.
        </p>
      </section>

      <section className="px-4 mt-4 pb-32">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center mt-4">
            <p className="font-display text-lg mb-1">Em breve nesta categoria</p>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              Estamos preparando novas fragrâncias por aqui. Volte em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setModalProduct} />
            ))}
          </div>
        )}
      </section>

      <button
        onClick={generalWhatsapp}
        className="fixed bottom-6 right-5 z-40 fab-shadow rounded-full w-14 h-14 flex items-center justify-center btn-teal"
        aria-label="Falar no WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="white">
          <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.702 4.61 1.912 6.475L4 29l7.72-1.874A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3Zm.001 21.6c-1.938 0-3.75-.55-5.287-1.5l-.379-.226-4.58 1.112 1.13-4.46-.248-.394A9.55 9.55 0 0 1 5.4 15c0-5.85 4.75-10.6 10.6-10.6S26.6 9.15 26.6 15 22.85 24.6 16.002 24.6Zm5.79-7.94c-.317-.159-1.878-.928-2.169-1.034-.29-.106-.502-.159-.713.16-.21.317-.818 1.033-1.003 1.245-.185.211-.37.238-.687.08-.317-.159-1.338-.494-2.548-1.575-.942-.84-1.578-1.878-1.763-2.195-.185-.317-.02-.489.139-.647.143-.142.317-.37.475-.556.159-.185.211-.317.317-.529.106-.211.053-.397-.026-.556-.08-.159-.713-1.72-.977-2.354-.257-.617-.518-.534-.713-.544-.185-.008-.397-.01-.608-.01-.211 0-.556.08-.847.397-.29.317-1.11 1.086-1.11 2.647 0 1.562 1.137 3.07 1.296 3.281.159.211 2.239 3.42 5.427 4.796.758.327 1.35.523 1.812.669.761.242 1.454.208 2.002.126.611-.091 1.878-.767 2.143-1.508.264-.741.264-1.376.185-1.508-.079-.132-.29-.211-.607-.37Z" />
        </svg>
      </button>

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          accords={accords}
          onClose={() => setModalProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <CartDrawer
        open={cartOpen}
        items={cart}
        products={products}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeItem}
        onCheckout={handleCheckout}
      />

      <footer className="text-center pb-8 pt-2">
        <p className="text-[11px] tracking-label uppercase" style={{ color: "var(--ink-soft)" }}>
          Siga nossa página
        </p>
        <p className="font-display text-lg">@offglassscent</p>
      </footer>
    </>
  );
}
