"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Accord,
  CartItem,
  Category,
  FormaPagamento,
  PedidoItem,
  Product,
  SizeMl,
} from "@/types";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import CartDrawer from "./CartDrawer";
import SearchBar from "./SearchBar";
import CategorySection from "./CategorySection";
import {
  ChipGroup,
  CategorySubFilters,
  ChipOption,
  SortOption,
} from "./Filters";
import { fillTemplate, formatBRL, precoComPromo, whatsappUrl } from "@/lib/utils";

const WHATSAPP_NUMBER = "5545999736188";

const DEFAULT_TEMPLATE_PEDIDO =
  "Olá! Meu nome é {{nome}}. Gostaria de fazer o seguinte pedido: {{itens}}. Forma de pagamento: {{pagamento}}. Total: {{total}}";

export default function CatalogApp({
  products,
  categories,
  accords,
  mensagemPedidoTemplate,
  salesCounts = {},
}: {
  products: Product[];
  categories: Category[];
  accords: Accord[];
  mensagemPedidoTemplate: string;
  salesCounts?: Record<string, number>;
}) {
  // Estados de Filtros e Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState("todos");
  const [currentGender, setCurrentGender] = useState("todos");
  const [currentBrand, setCurrentBrand] = useState("todas");
  const [promoOnly, setPromoOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevancia");

  // Estados de Modais e Carrinho
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Categorias preparadas para o ChipGroup sem emojis
  const categoryOptions: ChipOption[] = useMemo(() => {
    const officialKeys = ["nicho", "arabe", "designer", "autoral", "lacrados"];

    const sorted = [...categories].sort((a, b) => {
      const idxA = officialKeys.indexOf(a.key);
      const idxB = officialKeys.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.label.localeCompare(b.label, "pt-BR");
    });

    const categoryChips = sorted
      .map((c) => {
        const count = products.filter(
          (p) =>
            p.categoria === c.key ||
            (c.key === "arabe" && p.categoria === "arabes") ||
            (c.key === "designer" && p.categoria === "designers")
        ).length;

        return {
          value: c.key,
          label: c.label,
          count,
        };
      })
      .filter((c) => c.count > 0); // Regra: quando não houver cadastrado, não apresentar

    return [
      { value: "todos", label: "Todos" },
      ...categoryChips,
    ];
  }, [categories, products]);

  // Nome legível da categoria atual
  const currentCategoryLabel = useMemo(() => {
    if (currentCategory === "todos") return "Todos";
    const opt = categoryOptions.find((c) => c.value === currentCategory);
    if (opt) return opt.label;
    const found = categories.find((c) => c.key === currentCategory);
    return found ? found.label : currentCategory;
  }, [currentCategory, categoryOptions, categories]);

  // Marcas disponíveis com base na categoria e gênero selecionados
  const brands = useMemo(() => {
    const scoped = products.filter((p) => {
      const catOk =
        currentCategory === "todos" ||
        p.categoria === currentCategory ||
        (currentCategory === "arabe" && p.categoria === "arabes") ||
        (currentCategory === "designer" && p.categoria === "designers");
      const genOk = currentGender === "todos" || (p.genero || "compartilhado") === currentGender;
      return catOk && genOk;
    });
    return [...new Set(scoped.map((p) => p.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products, currentCategory, currentGender]);

  // Contagem de filtros ativos
  const activeFilterCount =
    (currentCategory !== "todos" ? 1 : 0) +
    (currentGender !== "todos" ? 1 : 0) +
    (currentBrand !== "todas" ? 1 : 0) +
    (promoOnly ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0) +
    (sortBy !== "relevancia" ? 1 : 0);

  function resetFilters() {
    setSearchQuery("");
    setCurrentCategory("todos");
    setCurrentGender("todos");
    setCurrentBrand("todas");
    setPromoOnly(false);
    setSortBy("relevancia");
  }

  function handleCategoryChange(key: string) {
    setCurrentCategory(key);
    setCurrentBrand("todas");
    if (key === "todos") {
      setCurrentGender("todos");
      setPromoOnly(false);
      setSortBy("relevancia");
    }
  }

  // Visualizar todos da seção Novidades em ordem do mais recente por primeiro
  function handleViewMoreNovidades() {
    resetFilters();
    setSortBy("novidades");
  }

  // Ordenação de produtos
  function sortProducts(list: Product[], option: SortOption): Product[] {
    const copy = [...list];
    switch (option) {
      case "novidades":
        return copy.sort((a, b) => {
          const timeA = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
          const timeB = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
          return timeB - timeA || b.id.localeCompare(a.id);
        });
      case "menor_preco":
        return copy.sort((a, b) => precoComPromo(a, 2) - precoComPromo(b, 2));
      case "maior_preco":
        return copy.sort((a, b) => precoComPromo(b, 2) - precoComPromo(a, 2));
      case "mais_vendidos":
        return copy.sort((a, b) => {
          const countA = salesCounts[a.nome] || 0;
          const countB = salesCounts[b.nome] || 0;
          return countB - countA || a.nome.localeCompare(b.nome, "pt-BR");
        });
      case "nome_az":
        return copy.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      case "relevancia":
      default:
        return copy;
    }
  }

  // Lista filtrada para quando há filtros ou busca ativa
  const filtered = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    const result = products.filter((p) => {
      const catOk =
        currentCategory === "todos" ||
        p.categoria === currentCategory ||
        (currentCategory === "arabe" && p.categoria === "arabes") ||
        (currentCategory === "designer" && p.categoria === "designers");

      const brandOk = currentBrand === "todas" || p.marca === currentBrand;
      const genOk = currentGender === "todos" || (p.genero || "compartilhado") === currentGender;
      const promoOk = !promoOnly || (p.promo?.ativo && p.promo.desconto > 0);

      let searchOk = true;
      if (normalized) {
        const inName = p.nome.toLowerCase().includes(normalized);
        const inBrand = p.marca.toLowerCase().includes(normalized);
        const inShort = (p.descricaoCurta || "").toLowerCase().includes(normalized);
        const inFull = (p.descricaoCompleta || "").toLowerCase().includes(normalized);
        const inNotes =
          (p.notas.topo || "").toLowerCase().includes(normalized) ||
          (p.notas.coracao || "").toLowerCase().includes(normalized) ||
          (p.notas.fundo || "").toLowerCase().includes(normalized);
        const inAccords = (p.acordes || []).some((a) => a.toLowerCase().includes(normalized));
        searchOk = inName || inBrand || inShort || inFull || inNotes || inAccords;
      }

      return catOk && brandOk && genOk && promoOk && searchOk;
    });

    return sortProducts(result, sortBy);
  }, [products, currentCategory, currentBrand, currentGender, promoOnly, searchQuery, sortBy, salesCounts]);

  // Determina se exibe a listagem completa (filtrada/categoria/novidades) ou as seções da Home
  const isFilteredView =
    currentCategory !== "todos" ||
    searchQuery.trim().length > 0 ||
    promoOnly ||
    currentBrand !== "todas" ||
    currentGender !== "todos" ||
    sortBy !== "relevancia";

  // Seções dinâmicas da Home (quando está no Todos e sem filtros)
  const homeSections = useMemo(() => {
    if (isFilteredView) return null;

    // 1. Promoções (itens em promoção ativa)
    const promo = sortProducts(
      products.filter((p) => p.promo?.ativo && p.promo.desconto > 0),
      "novidades"
    );

    // 2. Novidades (mais recentes cadastrados primeiro)
    const novidades = sortProducts(products, "novidades");

    // 3. Destaques (itens marcados com destaque)
    const destaques = sortProducts(
      products.filter((p) => p.destaque),
      "novidades"
    );

    // 4. Categorias oficiais na sequência: Nicho -> Árabe -> Designer -> Autoral -> Lacrados
    const nicho = products.filter((p) => p.categoria === "nicho");
    const arabe = products.filter((p) => p.categoria === "arabe" || p.categoria === "arabes");
    const designer = products.filter((p) => p.categoria === "designer" || p.categoria === "designers");
    const autoral = products.filter((p) => p.categoria === "autoral");
    const lacrados = products.filter((p) => p.categoria === "lacrados");

    // Outras categorias personalizadas cadastradas pelo lojista
    const officialKeys = ["nicho", "arabe", "arabes", "designer", "designers", "autoral", "lacrados"];
    const outros = categories
      .filter((c) => !officialKeys.includes(c.key))
      .map((c) => ({
        key: c.key,
        label: c.label,
        products: products.filter((p) => p.categoria === c.key),
      }))
      .filter((item) => item.products.length > 0);

    return {
      promo,
      novidades,
      destaques,
      nicho,
      arabe,
      designer,
      autoral,
      lacrados,
      outros,
    };
  }, [products, categories, isFilteredView]);

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

    try {
      await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCliente: nome,
          telefoneCliente: telefone,
          itens,
          formaPagamento: pagamento,
          total,
        }),
      });
    } catch (e) {
      console.error("Não foi possível salvar o pedido:", e);
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
    const mensagem = "Olá! Vim pelo catálogo OFFGLASS SCENT e gostaria de tirar uma dúvida.";
    window.open(whatsappUrl(WHATSAPP_NUMBER, mensagem), "_blank");
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Cabeçalho Sticky com Glassmorphism limpo padrão OFFGLASS */}
      <header className="sticky top-0 z-40 glass-strong border-b border-black/5 transition-colors">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo transparente com mix-blend-multiply padrão original */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="OFFGLASS"
              width={140}
              height={26}
              className="h-5 sm:h-6 w-auto object-contain mix-blend-multiply"
              priority
            />
            <span
              className="text-[10px] tracking-label uppercase font-medium mt-0.5"
              style={{ color: "var(--gold-deep)" }}
            >
              Scent
            </span>
          </div>

          {/* Sacola de Compras */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative btn-glass rounded-full p-2.5 cursor-pointer"
              aria-label="Carrinho"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 6h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" />
                <circle cx="9" cy="21" r="1.4" />
                <circle cx="18" cy="21" r="1.4" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 btn-teal text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa com Autocomplete Instantâneo */}
        <div className="px-4 pb-2">
          <SearchBar
            products={products}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelectProduct={setModalProduct}
          />
        </div>

        {/* Elemento ChipGroup de Categorias (Inspirado em 21st.dev/@kuratlielia/components/chip-group) */}
        <div className="pt-0.5 pb-1.5">
          <ChipGroup
            options={categoryOptions}
            value={currentCategory}
            onValueChange={handleCategoryChange}
          />
        </div>

        {/* Subopções ampliadas exibidas somente quando uma categoria é clicada */}
        {currentCategory !== "todos" && (
          <CategorySubFilters
            currentCategory={currentCategory}
            currentGender={currentGender}
            onGenderChange={setCurrentGender}
            brands={brands}
            currentBrand={currentBrand}
            onBrandChange={setCurrentBrand}
            promoOnly={promoOnly}
            onTogglePromo={() => setPromoOnly(!promoOnly)}
            sortBy={sortBy}
            onSortChange={setSortBy}
            activeFilterCount={activeFilterCount}
            onResetFilters={resetFilters}
          />
        )}
      </header>

      {/* Hero de Boas-vindas (Exibido na Home inicial com tipografia de alto contraste) */}
      {!isFilteredView && (
        <section className="px-5 pt-6 pb-2 animate-fade-in">
          <p
            className="font-display italic text-3xl leading-tight"
            style={{ color: "var(--ink)" }}
          >
            Olá,
            <br />
            seja bem-vinda(o).
          </p>
          <p
            className="text-sm mt-3 max-w-md leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            Fragrâncias originais decantadas com cuidado em frascos de <b>2ml, 5ml e 10ml</b>, etiquetados e
            prontos para você experimentar no conforto da sua rotina.
          </p>
        </section>
      )}

      {/* Conteúdo Principal */}
      <main className="mt-4 pb-32">
        {isFilteredView ? (
          /* ======================================================== */
          <div className="px-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 px-1">
              <div>
                <span
                  className="text-xs font-semibold block"
                  style={{ color: "var(--ink)" }}
                >
                  {filtered.length} perfume(s) encontrado(s)
                  {sortBy === "novidades" && currentCategory === "todos"
                    ? " em Novidades"
                    : currentCategory !== "todos"
                    ? ` em ${currentCategoryLabel}`
                    : ""}
                </span>
                {sortBy === "novidades" && currentCategory === "todos" ? (
                  <span className="text-[11px] block mt-0.5" style={{ color: "var(--ink-soft)" }}>
                    Exibindo todas as fragrâncias em ordem das mais recentes para as mais antigas
                  </span>
                ) : currentCategory !== "todos" ? (
                  <span className="text-[11px] block mt-0.5" style={{ color: "var(--ink-soft)" }}>
                    Exibindo todos os produtos cadastrados nesta categoria
                  </span>
                ) : null}
              </div>

              {/* Barra de Ordenação e Limpeza reposicionada sobre os produtos para mobile e desktop */}
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                    Ordenar:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Ordenar perfumes por"
                    className="rounded-full px-3 py-1.5 text-xs font-semibold bg-white/90 border border-black/15 text-stone-800 cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-[#3f6b62]"
                  >
                    <option value="relevancia">Relevância</option>
                    <option value="novidades">Novidades</option>
                    <option value="mais_vendidos">Mais Vendidos</option>
                    <option value="menor_preco">Menor Preço</option>
                    <option value="maior_preco">Maior Preço</option>
                    <option value="nome_az">Nome (A - Z)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded-full border border-black/10 hover:border-black/20 bg-white/60 cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-semibold hover:underline cursor-pointer shrink-0"
                    style={{ color: "var(--teal-deep)" }}
                  >
                    ← Voltar a Todos
                  </button>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center mt-4 border border-black/5">
                <p className="font-display text-lg mb-1" style={{ color: "var(--ink)" }}>
                  Nenhuma fragrância encontrada
                </p>
                <p className="text-xs max-w-sm mx-auto mb-4" style={{ color: "var(--ink-soft)" }}>
                  Não encontramos perfumes com a combinação de filtros selecionada. Tente limpar os filtros ou buscar por outro termo.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-teal rounded-full px-5 py-2 text-xs font-semibold cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                {filtered.map((p, index) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    priority={index < 4}
                    onOpen={setModalProduct}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* MODO HOME: Seções temáticas por categoria em fileira única */
          /* ======================================================== */
          homeSections && (
            <div>
              {/* 1. Promoções Especiais (oculto se 0) */}
              <CategorySection
                title="Promoções Especiais"
                subtitle="Fragrâncias selecionadas com desconto exclusivo"
                products={homeSections.promo}
                categoryKey="promo"
                onOpenProduct={setModalProduct}
                onViewMore={() => setPromoOnly(true)}
              />

              {/* 2. Novidades (mais recentes primeiro, oculto se 0) */}
              <CategorySection
                title="Novidades"
                subtitle="Os últimos perfumes adicionados ao catálogo"
                products={homeSections.novidades}
                categoryKey="novidades"
                onOpenProduct={setModalProduct}
                onViewMore={handleViewMoreNovidades}
              />

              {/* 3. Destaques da Coleção (oculto se 0) */}
              <CategorySection
                title="Destaques da Coleção"
                subtitle="Recomendações especiais da nossa curadoria"
                products={homeSections.destaques}
                categoryKey="destaques"
                onOpenProduct={setModalProduct}
                onViewMore={() => setSortBy("mais_vendidos")}
              />

              {/* 4. Nicho (oculto se 0) */}
              <CategorySection
                title="Nicho"
                subtitle="Criações exclusivas das casas mais sofisticadas do mundo"
                products={homeSections.nicho}
                categoryKey="nicho"
                onOpenProduct={setModalProduct}
                onViewMore={handleCategoryChange}
              />

              {/* 5. Perfumaria Árabe (oculto se 0) */}
              <CategorySection
                title="Perfumaria Árabe"
                subtitle="Opulência do Oriente com notas intensas de âmbar, oud e especiarias"
                products={homeSections.arabe}
                categoryKey="arabe"
                onOpenProduct={setModalProduct}
                onViewMore={handleCategoryChange}
              />

              {/* 6. Designer (oculto se 0) */}
              <CategorySection
                title="Designer"
                subtitle="Grandes clássicos e criações das principais maisons"
                products={homeSections.designer}
                categoryKey="designer"
                onOpenProduct={setModalProduct}
                onViewMore={handleCategoryChange}
              />

              {/* 7. Perfumaria Autoral (oculto se 0) */}
              <CategorySection
                title="Perfumaria Autoral"
                subtitle="Expressões olfativas artísticas e independentes"
                products={homeSections.autoral}
                categoryKey="autoral"
                onOpenProduct={setModalProduct}
                onViewMore={handleCategoryChange}
              />

              {/* 8. Frascos Lacrados (oculto se 0) - Atendimento exclusivo WhatsApp */}
              <CategorySection
                title="Frascos Lacrados"
                subtitle="Frascos originais fechados — consulte cotação e envio diretamente pelo WhatsApp"
                products={homeSections.lacrados}
                categoryKey="lacrados"
                onOpenProduct={setModalProduct}
                onViewMore={handleCategoryChange}
              />

              {/* Outras Categorias Personalizadas (ocultas se 0) */}
              {homeSections.outros.map((item) => (
                <CategorySection
                  key={item.key}
                  title={item.label}
                  products={item.products}
                  categoryKey={item.key}
                  onOpenProduct={setModalProduct}
                  onViewMore={handleCategoryChange}
                />
              ))}
            </div>
          )
        )}
      </main>

      {/* Botão Flutuante de WhatsApp Geral (apenas ícone oficial WhatsApp) */}
      <button
        onClick={generalWhatsapp}
        className="fixed bottom-6 right-5 z-40 fab-shadow rounded-full w-14 h-14 flex items-center justify-center btn-teal cursor-pointer hover:scale-105 active:scale-95 transition-all"
        aria-label="Falar no WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="white">
          <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.702 4.61 1.912 6.475L4 29l7.72-1.874A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3Zm.001 21.6c-1.938 0-3.75-.55-5.287-1.5l-.379-.226-4.58 1.112 1.13-4.46-.248-.394A9.55 9.55 0 0 1 5.4 15c0-5.85 4.75-10.6 10.6-10.6S26.6 9.15 26.6 15 22.85 24.6 16.002 24.6Zm5.79-7.94c-.317-.159-1.878-.928-2.169-1.034-.29-.106-.502-.159-.713.16-.21.317-.818 1.033-1.003 1.245-.185.211-.37.238-.687.08-.317-.159-1.338-.494-2.548-1.575-.942-.84-1.578-1.878-1.763-2.195-.185-.317-.02-.489.139-.647.143-.142.317-.37.475-.556.159-.185.211-.317.317-.529.106-.211.053-.397-.026-.556-.08-.159-.713-1.72-.977-2.354-.257-.617-.518-.534-.713-.544-.185-.008-.397-.01-.608-.01-.211 0-.556.08-.847.397-.29.317-1.11 1.086-1.11 2.647 0 1.562 1.137 3.07 1.296 3.281.159.211 2.239 3.42 5.427 4.796.758.327 1.35.523 1.812.669.761.242 1.454.208 2.002.126.611-.091 1.878-.767 2.143-1.508.264-.741.264-1.376.185-1.508-.079-.132-.29-.211-.607-.37Z" />
        </svg>
      </button>

      {/* Modal de Detalhes do Produto */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          accords={accords}
          onClose={() => setModalProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Gaveta do Carrinho */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        products={products}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeItem}
        onCheckout={handleCheckout}
      />

      {/* Rodapé da Marca */}
      <footer className="text-center pb-8 pt-4 border-t border-black/5 transition-colors">
        <p className="text-[11px] tracking-label uppercase" style={{ color: "var(--ink-soft)" }}>
          Siga nossa página
        </p>
        <a
          href="https://www.instagram.com/offglassscent/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-display text-lg hover:opacity-75 transition-opacity"
          style={{ color: "var(--ink)" }}
        >
          @offglassscent
        </a>
      </footer>
    </>
  );
}
