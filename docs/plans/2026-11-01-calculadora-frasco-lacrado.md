# Calculadora do Frasco Inteiro Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar uma calculadora de custos e markup para o frasco inteiro (lacrado) no admin, que se abre dinamicamente quando a opção de vender o frasco lacrado for selecionada, no mesmo padrão visual e funcional da calculadora de decants.

**Architecture:** Criar o componente de cálculo financeiro para frascos lacrados em `ProductForm.tsx`, integrando simulação de markup comercial (ex: +30%, +50%, +70%, +100%), cálculo automático de lucro bruto estimado em R$ e preço de venda sugerido com botão de aplicação direta no campo de preço final do frasco lacrado. O card é exibido condicionalmente quando `form.vendeLacrado` estiver ativo e compartilha dados de custo base com a calculadora de decants.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase PostgreSQL.

---

### Task 1: Estruturar os Estados e Funções de Cálculo do Frasco Inteiro em `ProductForm.tsx`

**Files:**
- Modify: `components/admin/ProductForm.tsx:120-135` e `280-310`

**Step 1: Adicionar estado para a margem de lucro do frasco inteiro**
- Criar estado `margemLucroFrascoInput` e inicializar com valor padrão (`"50"` ou derivado se existir).
- Criar estado numérico `margemLucroFrascoPct` (default: `50`).

**Step 2: Implementar a fórmula de cálculo da calculadora do frasco inteiro**
```typescript
// Custo base de aquisição do frasco
const custoAquisicao = form.custoFrasco || 0;
// Margem multiplicadora do frasco
const margemFrascoMult = 1 + (margemLucroFrascoPct || 0) / 100;
// Preço sugerido do frasco lacrado
const sugestaoFrascoLacrado = custoAquisicao > 0 ? Number((custoAquisicao * margemFrascoMult).toFixed(2)) : 0;
// Lucro bruto estimado em R$
const lucroEstimadoFrasco = sugestaoFrascoLacrado > 0 ? Number((sugestaoFrascoLacrado - custoAquisicao).toFixed(2)) : 0;
```

**Step 3: Implementar a função `aplicarPrecoSugeridoFrasco`**
- Atualizar `form.precoFrascoLacrado` com `sugestaoFrascoLacrado`.
- Atualizar `precoFrascoLacradoInput` com `formatBRLValue(sugestaoFrascoLacrado)`.

---

### Task 2: Construir o Card da Calculadora do Frasco Inteiro no Form Admin

**Files:**
- Modify: `components/admin/ProductForm.tsx:1240-1270`

**Step 1: Renderizar o Card Condicional da Calculadora quando `form.vendeLacrado` estiver ativo**
- O card deve abrir dinamicamente com animação suave e padrão visual correspondente:
  - Cabeçalho: `Calculadora do Frasco Inteiro & Markup` com tag de status do custo de aquisição.
  - Linha 1: Input de **Custo do Frasco (R$)** e Seletor de **Volume do Frasco (ml)** com atalhos em `grid-cols-4` (`[50ml] [75ml] [100ml] [120ml]`), sincronizado com `form.custoFrasco` e `form.volumeFrascoMl`.
  - Linha 2: Input de **Margem de Lucro Desejada para o Frasco Inteiro (%)** com atalhos comerciais de revenda de frascos em `grid-cols-4`: `[+30%] [+50%] [+70%] [+100%]`.
  - Quadro de Resultados & Simulação:
    - Card 1: **Custo Base** (`R$ X,XX`)
    - Card 2: **Lucro Estimado** (`+ R$ Y,YY`)
    - Card 3: **Preço Sugerido** (`R$ Z,ZZ`) com destaque visual em âmbar/dourado.
  - Botão de Ação: `Aplicar Preço Sugerido no Frasco Inteiro` com ícone de calculadora.

**Step 2: Campo do Preço Final de Venda do Frasco Lacrado**
- Posicionado logo abaixo da calculadora no mesmo card ou como bloco final da seção:
  - Label: `Preço Final de Venda do Frasco Lacrado (R$)`
  - Input com máscara BRL e formatação automática.
  - Permite ao lojista aceitar o valor sugerido ou ajustar manualmente (ex: arredondar centavos).

---

### Task 3: Harmonizar a Coexistência das Duas Calculadoras (Lacrado & Decants)

**Files:**
- Modify: `components/admin/ProductForm.tsx`

**Step 1: Sincronização inteligente de Custo e Volume**
- Quando o usuário preencher o Custo do Frasco na Calculadora do Frasco Inteiro, o valor é refletido na Calculadora de Decants (e vice-versa), eliminando digitação duplicada.
- O mesmo vale para o Volume do Frasco (ml).

**Step 2: Independência das Margens de Lucro**
- A margem dos decants (+100%, +120%, +150%, +200%) é mantida separada da margem do frasco fechado (+30%, +50%, +70%, +100%), permitindo ao lojista adotar estratégias de precificação adequadas a cada modelo de negócio.

---

### Task 4: Validação, Build e Deploy

**Files:**
- `components/admin/ProductForm.tsx`

**Step 1: Compilação de Produção**
- Executar `npm run build` e verificar que todas as 16 rotas estáticas e dinâmicas compilam com zero erros e tipagem estrita no TypeScript.

**Step 2: Verificação Visual e Responsividade**
- Validar comportamento no Desktop (espaçamento amplo, botões proporcionais em `grid-cols-4`) e no Mobile (quebra de linha fluida).

**Step 3: Commit e Push**
- Fazer commit com mensagem semântica e subir para `origin/main`.
