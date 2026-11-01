# Plano de Melhoria: Precificação, Decants e Venda de Frascos Lacrados

> **Documento:** `docs/plans/2026-11-01-correcao-precificacao-decants-desktop.md`  
> **Objetivo:**
> 1. Corrigir a sobreposição e quebra dos botões de atalho da calculadora financeira no desktop.
> 2. Implementar suporte nativo a **3 modalidades de venda para qualquer perfume**:
>    - **Apenas Decants** (2ml, 5ml, 10ml);
>    - **Apenas Frasco Lacrado** (venda do frasco original com preço fixo, sem obrigatoriedade de decant);
>    - **Ambas as opções** (o cliente pode comprar decants de 2ml/5ml/10ml OU o frasco original lacrado).
> 3. Manter a experiência mobile 100% intacta, responsiva e fluida.

---

## 1. Diagnóstico do Problema Visual (Foto enviada)

- **Espremimento Horizontal:** A calculadora financeira dividia 3 campos (`Custo`, `Volume` e `Margem`) em 3 colunas simultâneas dentro de uma sidebar de ~440px, deixando apenas ~125px por campo.
- **Botões Vazando:** Os atalhos de volume (`50ml`, `75ml`, `100ml`, `125ml`) e os atalhos de margem (`+100%`, `+120%`, `+150%`, `+200%`) não cabiam em 125px, quebrando a linha, colidindo e estourando a borda direita do card (`+200%` cortado).
- **Falta de Suporte a Venda de Frasco Lacrado com Preço:** Quando o lojista cadastra um frasco lacrado e não quer vender decant, o sistema atualmente exige decants ou força a categoria "lacrados" sem campo de preço de venda do frasco.

---

## 2. Nova Arquitetura de Precificação & Modalidades

### A. Modalidades de Venda no Formulário Admin (`ProductForm.tsx`)
No card de precificação, o lojista poderá marcar claramente como quer vender o perfume:
- [x] **Vender Decants Fracionados (2ml, 5ml, 10ml):**
  - Ao ativar: Exibe a Calculadora Financeira (redesenhada) e os campos de preço de cada decant.
  - Ao desativar: Oculta a obrigatoriedade de decants (ideal para frascos lacrados exclusivos).
- [x] **Vender Frasco Original Lacrado:**
  - Ao ativar: Exibe o campo com máscara monetária: **Preço de Venda do Frasco Lacrado (R$)** (ex: R$ 890,00).
- **Combinações possíveis:**
  - *Somente Lacrado:* preenche apenas o preço do frasco lacrado.
  - *Somente Decants:* preenche apenas os decants calculados.
  - *Ambos:* preenche tanto o preço do frasco lacrado quanto os decants!

### B. Redesign da Calculadora Financeira no Desktop (Sem Quebra de Botões)
- **Linha 1 — Custo do Frasco e Volume Original (Grid 2 Colunas Amplo):**
  - Campo 1: `Custo de Aquisição (R$)` com máscara BRL.
  - Campo 2: `Volume do Frasco (ml)` acompanhado de atalhos em grid de 4 colunas (`grid grid-cols-4 gap-1 mt-1.5` para `50ml`, `75ml`, `100ml`, `125ml`) com espaço de sobra para não colidir nem quebrar.
- **Linha 2 — Margem de Lucro (%):**
  - Campo com máscara decimal e atalhos em barra dedicada de 4 colunas (`+100%`, `+120%`, `+150%`, `+200%`) perfeitamente alinhada.
- **Linha 3 — Badge Custo por ML & Valores Sugeridos:**
  - Custo por ml calculado em destaque.
  - Cards de valores sugeridos (2ml, 5ml, 10ml) com tipografia limpa.
  - Botão **"Aplicar Preços Sugeridos nos Decants"** no padrão visual da marca `btn-teal` com ícone de cálculo.
- **Linha 4 — Preços Finais dos Decants:**
  - 3 inputs amplos para 2ml, 5ml e 10ml.

### C. Experiência do Cliente no Catálogo e Modal
- **Produto Somente Lacrado:**
  - Card: Exibe o preço do frasco original (ex: `R$ 890,00 · Frasco 100ml`).
  - Modal: Apresenta o frasco lacrado com seu preço oficial e permite comprar/adicionar ao carrinho ou falar no WhatsApp.
- **Produto com Ambas as Opções (Decants + Lacrado):**
  - Card: Exibe `a partir de R$ 35,00` e selo discreto `Opção Lacrado`.
  - Modal: Apresenta os tamanhos de decants (`2ml`, `5ml`, `10ml`) **MAIS** um botão especial `Frasco Lacrado (100ml)`. Ao clicar no frasco lacrado, o preço atualiza para o valor do frasco e permite adicionar ao carrinho ou pedir no WhatsApp.
- **Produto Somente Decant:**
  - Mantém 100% da experiência atual de decants.

---

## 3. Fases de Execução

- [ ] **Fase 1: Atualização dos Modelos e Tipos (`types/index.ts` e Supabase)**
  - Adicionar campos `vendeDecant?: boolean`, `vendeLacrado?: boolean`, `precoFrascoLacrado?: number` em `Product` e `ProdutoRow`.
  - Criar script SQL `supabase/05_migration_frasco_lacrado_e_decants.sql` com `alter table if not exists` retrocompatível.
  - Atualizar `toProdutoRow` e `fromProdutoRow` com fallbacks seguros.

- [ ] **Fase 2: Redesign da Seção de Precificação no Admin (`ProductForm.tsx`)**
  - Adicionar os toggles/cards de seleção de modalidades (Decants e/ou Frasco Lacrado).
  - Incluir input de `Preço do Frasco Lacrado (R$)` com máscara BRL.
  - Redesenhar a Calculadora Financeira em linhas inteligentes de 2 colunas com grids de atalhos simétricos (`grid-cols-4`).
  - Estilizar o botão de aplicar preços sugeridos e os inputs finais.

- [ ] **Fase 3: Exibição no Catálogo e Modal (`ProductCard.tsx` e `ProductModal.tsx`)**
  - No `ProductCard`: Se for somente lacrado, exibir preço do frasco lacrado. Se for híbrido, indicar as duas modalidades.
  - No `ProductModal`: Se tiver frasco lacrado com preço, permitir selecionar o frasco lacrado ou os decants, atualizando o valor na hora para adicionar ao carrinho ou WhatsApp.
  - No `CartDrawer`: Permitir que o item do carrinho suporte tanto tamanhos de decants (2ml, 5ml, 10ml) quanto o Frasco Lacrado.

- [ ] **Fase 4: Validação, Build de Produção e Deploy**
  - Executar `npm run build` para garantir TypeScript limpo e zero erros.
  - Validar responsividade em telas desktop e mobile.
  - Commit e push para produção.
