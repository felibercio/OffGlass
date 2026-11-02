# Mensagem de Consulta do Frasco Inteiro nos Perfumes Somente Decants Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restaurar e aprimorar a mensagem de consulta do frasco inteiro nos cards e no modal dos perfumes cadastrados apenas como decants, permitindo que os clientes consultem a disponibilidade e o valor do frasco completo via WhatsApp.

**Architecture:** Atualizar `ProductCard.tsx` e `ProductModal.tsx` para que fragrâncias comercializadas em decants (e que não tenham preço de frasco inteiro cadastrado) exibam com destaque e elegância a opção de consulta do frasco completo via WhatsApp, com mensagem contextualizada pré-formatada e redirecionamento seguro para mobile e desktop.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS.

---

### Task 1: Restaurar Mensagem de Consulta do Frasco Inteiro no Rodapé do `ProductCard.tsx`

**Files:**
- Modify: `components/catalog/ProductCard.tsx:140-165`

**Step 1: Ajustar o rodapé do card para perfumes de decants sem frasco inteiro tabelado**
- Para perfumes onde `product.vendeDecant !== false` e `!product.vendeLacrado` (ou seja, apenas decants tabelados):
  - Exibir o preço inicial dos decants (`Decants a partir de R$ XX,XX`).
  - Incluir linha explicativa elegante no rodapé do card:
    `Frasco inteiro sob consulta` com link sutil `WhatsApp →`.
- Se o card for clicado em qualquer ponto, continua abrindo o modal normalmente, mantendo a experiência fluida.

---

### Task 2: Restaurar o Botão de Consulta do Frasco Inteiro no `ProductModal.tsx`

**Files:**
- Modify: `components/catalog/ProductModal.tsx:365-385`

**Step 1: Garantir o botão de consulta do frasco lacrado para perfumes de decants**
- No modal, logo abaixo do botão "Adicionar ao carrinho" dos decants, exibir sempre o botão secundário:
  `Consultar disponibilidade e valor do frasco inteiro` (com link direto para o WhatsApp).
- A mensagem enviada ao WhatsApp mantém a consulta contextualizada:
  `"Olá! Gostaria de consultar a disponibilidade e o valor do frasco completo do perfume [Nome] da [Marca]."`
- Se o perfume for híbrido (vende decant E tem frasco tabelado), o modal mantém a seleção direta do frasco com seu preço.

---

### Task 3: Validação, Build e Deploy

**Files:**
- Executar `npm run build` para garantir zero erros de tipagem e compilação.
- Validar layout no Desktop e no Mobile.
- Realizar commit semântico e push para a branch `main`.
