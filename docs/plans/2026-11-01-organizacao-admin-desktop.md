# Otimização e Organização do Painel Administrativo no Desktop — Implementation Plan

> **Status:** Todas as etapas implementadas com sucesso (Tasks 1 a 5 concluídas).

**Goal:** Corrigir a visualização do painel administrativo no desktop (que atualmente fica comprimida na metade esquerda da tela devido a classes como `max-w-xl` sem centralização) e reorganizar a apresentação das telas em layouts modernos de 2 a 3 colunas no desktop, mantendo o layout mobile 100% intacto e sem alterações de comportamento.

**Architecture:** 
1. **Padronização do Grid & Containers:** Unificar todos os containers de página do admin sob `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`, garantindo alinhamento perfeito com o cabeçalho (`AdminNav`) em monitores de qualquer resolução.
2. **Reorganização do Formulário de Produtos (`ProductForm`):** Converter a estrutura linear de 1 coluna em um layout responsivo de 2 colunas (`lg:grid-cols-12`), agrupando dados essenciais e notas olfativas na coluna principal (7 cols) e mídia, precificação/calculadora de decants, status e ações fixas na coluna lateral (5 cols).
3. **Dashboards de Gestão em 2 Colunas (`Categorias`, `Acordes`, `Mensagens`, `Pedidos`, `Produtos`):** Separar listagens e formulários em colunas dedicadas no desktop, aproveitando todo o espaço horizontal sem poluição visual.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

---

### Task 1: Alinhamento e Padronização do Header (`AdminNav.tsx`)

**Files:**
- Modify: `components/admin/AdminNav.tsx:30-62`

**Step 1: Envolver os elementos do `AdminNav` em container responsivo centralizado**

Atualmente o header expande até as bordas extremas da tela (`px-4`), desconectando-se das páginas abaixo. Vamos adicionar o container `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` preservando o comportamento sticky e as abas com scroll horizontal no mobile.

```tsx
    <header className="sticky top-0 z-40 glass-strong">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
              Offglass Scent
            </p>
            <h1 className="font-display text-xl font-semibold">Painel administrativo</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn-glass rounded-full px-3 py-2 text-xs font-medium">
              Ver catálogo
            </Link>
            <button onClick={handleLogout} className="btn-glass rounded-full px-3 py-2 text-xs font-medium cursor-pointer">
              Sair
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
          {TABS.map((t) => {
            const isActive = t.exact ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`chip ${isActive ? "active" : ""} rounded-full px-4 py-2 text-xs font-medium shrink-0`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
```

---

### Task 2: Reorganização do Formulário de Produtos (`ProductForm.tsx`) para Desktop

**Files:**
- Modify: `components/admin/ProductForm.tsx:376-1100`

**Causa Raiz Identificada:**
A tag raiz do formulário utilizava `<div className="px-4 pb-32 pt-4 max-w-xl">`. No desktop, `max-w-xl` (576px) sem `mx-auto` força todo o formulário a ocupar somente ~30-40% da tela grudado na margem esquerda, deixando a metade direita vazia.

**Step 1: Expandir o container e estruturar Grid de 2 Colunas no Desktop**

Substituir `max-w-xl` por `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4`.
Criar um layout `grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8`:

- **Coluna Principal Esquerda (`lg:col-span-7 xl:col-span-7 space-y-5`):**
  1. Identificação Básica: Categoria, Marca e Nome do Perfume
  2. Descrições: Descrição Curta (catálogo) e Descrição Completa (modal)
  3. Acordes Olfativos: Seleção visual de acordes e inclusão rápida
  4. Pirâmide Olfativa: Notas de Topo/Saída, Notas de Coração/Corpo e Notas de Fundo/Base
  5. Gênero e Destaque

- **Coluna Lateral Direita (`lg:col-span-5 xl:col-span-5 space-y-5`):**
  1. Galeria & Imagens: Dropzone de upload, galeria de miniaturas com remoção e botão para selecionar fotos já enviadas ao Supabase Storage
  2. Precificação & Calculadora Inteligente de Decants: Custo do frasco original, volume (ml), margem de lucro (%) e precificação dos frascos de 2ml, 5ml e 10ml
  3. Promoção com Desconto Percentual
  4. Bloco de Ações Fixo (`lg:sticky lg:top-28`): Botões "Salvar perfume" e "Cancelar" sempre visíveis ao rolar o formulário no desktop.

---

### Task 3: Organização da Listagem de Produtos (`app/admin/produtos/page.tsx`)

**Files:**
- Modify: `app/admin/produtos/page.tsx:13-108`

**Step 1: Ajustar container e transformar listagem em Grid Responsivo de 2 Colunas no Desktop**

- Atualizar o container de `max-w-4xl mx-auto` para `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4`.
- Na listagem de perfumes, trocar `space-y-2` por `grid grid-cols-1 lg:grid-cols-2 gap-3.5`.
- No mobile: continua exatamente em 1 coluna vertical.
- No desktop: preenche harmonicamente as duas colunas com cards elegantes, aproveitando toda a largura da tela.

---

### Task 4: Organização de Categorias e Acordes (`CategoriesManager.tsx` e `AccordsManager.tsx`)

**Files:**
- Modify: `components/admin/CategoriesManager.tsx:112-268`
- Modify: `components/admin/AccordsManager.tsx:68-218`

**Step 1: Reorganizar `CategoriesManager.tsx` em 2 Colunas no Desktop**
- Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4`.
- Estrutura:
  - Coluna Esquerda (`lg:col-span-7`): Lista de categorias cadastradas, quantidade de perfumes associados, edição inline e exclusão.
  - Coluna Direita (`lg:col-span-5` em `lg:sticky lg:top-28`): Formulário de criação de nova categoria + sugestões rápidas (`CATEGORY_SUGGESTIONS`).

**Step 2: Reorganizar `AccordsManager.tsx` em 2 Colunas no Desktop**
- Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4`.
- Estrutura:
  - Coluna Esquerda (`lg:col-span-7`): Biblioteca de acordes existentes com cores vivas e exclusão.
  - Coluna Direita (`lg:col-span-5` em `lg:sticky lg:top-28`): Formulário de criação de novo acorde com paleta de cores e seletor HEX.

---

### Task 5: Organização de Mensagens e Pedidos (`MensagensManager.tsx` e `pedidos/page.tsx`)

**Files:**
- Modify: `components/admin/MensagensManager.tsx:39-82`
- Modify: `app/admin/pedidos/page.tsx:25-116`
- Modify: `components/admin/SalesDashboard.tsx:212-214`

**Step 1: Reorganizar `MensagensManager.tsx`**
- Substituir `max-w-xl` (sem `mx-auto`) por `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4`.
- Grid de 2 colunas no desktop (`grid grid-cols-1 lg:grid-cols-2 gap-6`):
  - Card 1: Mensagem de finalização de pedido no WhatsApp (com variáveis e pré-visualização).
  - Card 2: Mensagem de consulta de frasco lacrado no WhatsApp.

**Step 2: Reorganizar `app/admin/pedidos/page.tsx`**
- Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4`.
- Grid de pedidos no desktop: `grid grid-cols-1 lg:grid-cols-2 gap-4`.

**Step 3: Ajustar padding lateral no `SalesDashboard.tsx`**
- Atualizar linha 213 de `px-4 pb-32 pt-4 max-w-6xl mx-auto` para `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4`, garantindo paridade total entre todas as abas do admin.

---

### Task 6: Validação Visual e Responsividade

**Step 1: Validação de Telas**
1. Testar visualização em desktop (1440px / 1920px):
   - Confirmar que nenhuma tela fica espremida na metade esquerda.
   - Verificar navegação, cabeçalho e alinhamento centralizado com margens generosas.
   - Testar o formulário de produto em 2 colunas com bloco de ações sticky.
2. Testar visualização em mobile (< 768px):
   - Confirmar que todas as telas mantêm rigorosamente o layout mobile atual (1 coluna vertical fluida, sem quebras nem scrolls indesejados).
