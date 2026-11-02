# Ajuste de Gênero Olfativo para 'Compartilhado' Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Atualizar o cadastro de produto no admin para usar o termo "Compartilhado" no lugar de "Unissex" e refletir essa identificação visual na apresentação dos perfumes para os clientes no catálogo (Card, Modal e Busca).

**Architecture:** Modificar o seletor de gênero em `ProductForm.tsx` para apresentar as opções completas ("Compartilhado", "Masculino", "Feminino"). No lado do cliente, integrar uma tag/badge sutil e sofisticada de gênero olfativo em `ProductCard.tsx` (acima ou ao lado do nome da marca) e no cabeçalho de `ProductModal.tsx` (junto à marca/categoria), além de enriquecer os resultados do autocomplete em `SearchBar.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS.

---

### Task 1: Atualizar o Seletor de Gênero no Formulário Admin (`ProductForm.tsx`)

**Files:**
- Modify: `components/admin/ProductForm.tsx:700-725`

**Step 1: Substituir a label "Unissex" por "Compartilhado"**
- No grupo de botões de gênero olfativo:
  - Botão 1: `Compartilhado` (em vez de `Unissex`)
  - Botão 2: `Masculino` (em vez de `Masc.`)
  - Botão 3: `Feminino` (em vez de `Fem.`)
- Manter o grid de 3 colunas harmonioso e legível.

---

### Task 2: Integrar o Gênero Olfativo na Apresentação para o Cliente (`ProductCard.tsx`)

**Files:**
- Modify: `components/catalog/ProductCard.tsx:100-115`

**Step 1: Exibir o gênero olfativo junto à marca**
- Adicionar indicador de gênero olfativo:
  - Se `product.genero === "compartilhado"` (ou default): exibe `Compartilhado`
  - Se `product.genero === "masculino"`: exibe `Masculino`
  - Se `product.genero === "feminino"`: exibe `Feminino`
- Apresentar com tipografia elegante e discreta (ex: texto `uppercase text-[9px] text-stone-500 font-medium` ou pill suave) ao lado da marca no card do catálogo.

---

### Task 3: Integrar o Gênero Olfativo no Modal de Detalhes (`ProductModal.tsx`)

**Files:**
- Modify: `components/catalog/ProductModal.tsx:170-185`

**Step 1: Exibir badge de gênero olfativo no cabeçalho do produto**
- No cabeçalho do modal, logo acima ou ao lado da marca:
  - Exibir a marca e a tag de gênero olfativo (ex: `Compartilhado`, `Masculino` ou `Feminino`).
  - Proporcionar clareza imediata ao cliente sobre a proposta olfativa do perfume.

---

### Task 4: Enriquecer a Busca Instantânea (`SearchBar.tsx`)

**Files:**
- Modify: `components/catalog/SearchBar.tsx:145-160`

**Step 1: Exibir gênero olfativo na linha de marca do autocomplete**
- Linha superior do resultado: `{p.marca} · {p.genero === "masculino" ? "Masculino" : p.genero === "feminino" ? "Feminino" : "Compartilhado"}`.

---

### Task 5: Validação, Build e Deploy

**Files:**
- Testar com `npm run build`.
- Verificar consistência visual em desktop e mobile.
- Commit e push para `origin/main`.
