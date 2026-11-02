# Plano de Implementação: Restauração do Header com Logo & Sistema de Banners Duplos com Ativação/Desativação

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restaurar o header profissional com a logo clássica da OFFGLASS SCENT e botão de carrinho no canto superior direito, criando um sistema de banners em duas posições de mercado (Top Slim Banner acima do header e Hero Banner vitrine abaixo do header/filtros), ambos com opção de upload (Desktop e Mobile) e toggle de ligar/desligar no painel administrativo.

**Architecture:** Expandir a configuração em `site_config` para suportar duas posições independentes: `banner_top` (banner fino acima do header) e `banner_hero` (banner vitrine abaixo do header/filtros), cada um com campos `ativo`, `desktop`, `mobile` e `link`. No catálogo (`CatalogApp.tsx`), restaurar o header com a logo original em glassmorphism e posicionar os dois banners de acordo com seus status de ativação. No painel administrativo (`/admin/banners`), fornecer switches táteis de ativação, upload direto pelo celular/computador e guias de resolução padrão de mercado.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (Database & Storage), Tailwind CSS v4, TypeScript.

---

### 1. Padrões de Mercado & Sugestões de Tamanho

#### A. Banner Fino Acima do Header (Top Slim Announcement Banner)
- **Função no nicho de luxo:** Comunicar benefícios-chave ("Decants 100% Originais", "Frete Grátis acima de R$ 199", "Cupom BEMVINDO") de forma elegante e sutil, sem disputar a atenção com a logo.
- **Desktop (Monitores & Laptops):**
  - **Altura visual no site:** ~38px a 44px
  - **Resolução ideal para upload (2x Retina):** **`1920 × 80 px`** (ou **`2560 × 88 px`**)
  - **Proporção:** ~25:1 a 30:1
- **Mobile (Smartphones iPhone / Android):**
  - **Altura visual no site:** ~36px a 40px
  - **Resolução ideal para upload (3x Retina):** **`1080 × 120 px`**
  - **Proporção:** ~9:1

#### B. Banner Principal / Vitrine (Hero Banner Abaixo do Header e Filtros)
- **Função no nicho de luxo:** Apresentar coleções, lançamentos, marcas de nicho em destaque ou campanhas sazonais.
- **Desktop (Monitores & Laptops):**
  - **Altura visual no site:** ~280px a 340px (mantém os primeiros produtos visíveis na primeira dobra).
  - **Resolução ideal para upload (2x Retina):** **`1920 × 480 px`** ou **`2048 × 512 px`**
  - **Proporção:** 4:1
- **Mobile (Smartphones iPhone / Android):**
  - **Altura visual no site:** ~175px a 200px (não esconde a grade de produtos).
  - **Resolução ideal para upload (3x Retina):** **`1080 × 540 px`**
  - **Proporção:** 2:1

---

### Task 1: Modelagem dos Dados e Migração SQL (`site_config`)

**Files:**
- Create: `supabase/07_migration_banners_duplos_e_visibilidade.sql`
- Modify: `lib/data.ts`
- Modify: `types/index.ts`

**Step 1: Criar migração SQL com as novas chaves de configuração**
```sql
-- Chaves para o Banner Fino Superior (Acima do Header)
insert into site_config (chave, valor) values
  ('banner_top_ativo', 'true'),
  ('banner_top_desktop', ''),
  ('banner_top_mobile', ''),
  ('banner_top_link', '')
on conflict (chave) do nothing;

-- Chaves para o Banner Hero Principal (Abaixo do Header/Filtros)
insert into site_config (chave, valor) values
  ('banner_hero_ativo', 'true'),
  ('banner_hero_desktop', '/banner-desktop.png'),
  ('banner_hero_mobile', '/banner-mobile.png'),
  ('banner_hero_link', '')
on conflict (chave) do nothing;

NOTIFY pgrst, 'reload schema';
```

**Step 2: Atualizar tipos e função `getBannersConfig()` em `lib/data.ts`**
Definir a interface:
```typescript
export interface BannersConfig {
  top: {
    ativo: boolean;
    desktop: string;
    mobile: string;
    link?: string;
  };
  hero: {
    ativo: boolean;
    desktop: string;
    mobile: string;
    link?: string;
  };
}
```
Atualizar `getBannersConfig()` para carregar todas as chaves com fallbacks seguros.

---

### Task 2: API de Administração de Banners (`/api/admin/banners`)

**Files:**
- Modify: `app/api/admin/banners/route.ts`

**Step 1: Expandir o endpoint POST para manipular ambos os banners e toggles**
1. Aceitar campos de controle:
   - `topAtivo`: boolean
   - `heroAtivo`: boolean
   - `topLink`: string
   - `heroLink`: string
2. Aceitar uploads de arquivos binários para cada slot:
   - `fileTopDesktop`, `fileTopMobile`
   - `fileHeroDesktop`, `fileHeroMobile`
3. Fazer upload para as respectivas pastas no Supabase Storage:
   - `banners/top/${timestamp}-${safeName}`
   - `banners/hero/${timestamp}-${safeName}`
4. Salvar os registros em `site_config` e executar `revalidatePath("/")` e `revalidatePath("/admin/banners")`.

---

### Task 3: Redesenhar a Interface do Admin (`/admin/banners`)

**Files:**
- Modify: `components/admin/BannersManager.tsx`

**Step 1: Criar interface com controles por abas/seções e switches de ativação**
- **Mobile First:** Switches táteis grandes (toggle on/off) fáceis de tocar pelo celular.
- **Seção 1 — Banner Fino Superior (Acima do Header):**
  - Switch: "Exibir Banner Superior no Catálogo" (Ativar / Desativar).
  - Preview ao vivo fino (formato fita / announcement bar).
  - Upload para Desktop (`1920 × 80 px`) e Mobile (`1080 × 120 px`).
  - Campo opcional: Link de destino ao clicar.
  - Indicadores de tamanho e dicas de exportação.
- **Seção 2 — Banner Principal Vitrine (Abaixo do Header e Filtros):**
  - Switch: "Exibir Banner Principal no Catálogo" (Ativar / Desativar).
  - Preview ao vivo proporcional (Desktop 4:1 e Mobile 2:1).
  - Upload para Desktop (`1920 × 480 px`) e Mobile (`1080 × 540 px`).
  - Campo opcional: Link de destino ao clicar.
  - Botão "Restaurar Padrão".
- **Barra de Ações:**
  - Botão "Salvar Todas as Alterações" visível e fixável no rodapé mobile para nunca perder o botão de vista.

---

### Task 4: Restauração do Header de Luxo e Banners no Catálogo

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/catalog/CatalogApp.tsx`

**Step 1: Layout estruturado em `CatalogApp.tsx`**
1. **Posição 1 — Banner Fino Superior (`banners.top.ativo === true`):**
   - Renderizado antes de qualquer elemento no topo absoluto da página.
   - Envolvido em link opcional se `banners.top.link` estiver preenchido.
   - `<picture>` responsivo com classes para manter a altura contida e elegante (`h-[36px] sm:h-[42px] w-full object-cover`).
2. **Posição 2 — Header Profissional Sticky com Glassmorphism:**
   - `<header className="sticky top-0 z-40 glass-strong border-b border-black/5">`:
     - Linha 1 (Topo do Header):
       - Esquerda: Logo original `/logo.png` transparente + selo `"Scent"` em ouro (`var(--gold-deep)`).
       - Direita: Botão de Atendimento rápido no WhatsApp + Botão do Carrinho (`relative btn-glass rounded-full p-2.5`) com badge numérica dos itens.
     - Linha 2: Barra de Pesquisa (`SearchBar`) com autocomplete instantâneo.
     - Linha 3: Seletor de Categorias (`ChipGroup`) + Subfiltros de marca/gênero/promoção.
3. **Posição 3 — Banner Principal Vitrine (`banners.hero.ativo === true`):**
   - Renderizado logo abaixo do header/filtros na Home (quando no início do catálogo).
   - Container responsivo com cantos arredondados elegantes (`rounded-2xl overflow-hidden mx-4 my-3 sm:mx-6 shadow-sm border border-black/5`).
   - `<picture>` com Desktop (`banner_hero_desktop`) e Mobile (`banner_hero_mobile`).
   - Envolvido em link caso configurado.
4. **Posição 4 — Catálogo de Produtos e Seções:**
   - Começa imediatamente após o Banner Principal (ou logo após os filtros se o banner principal estiver desativado).

---

### Task 5: Validação Localhost e Testes de Responsividade

1. **Testar Cenários de Banners:**
   - [ ] Ambos os banners ativos (Top Slim + Hero Principal).
   - [ ] Apenas o Top Slim ativo.
   - [ ] Apenas o Hero Principal ativo.
   - [ ] Ambos desativados (header colado no topo e produtos colados nos filtros).
2. **Testar Funcionalidades do Header:**
   - [ ] Logo renderizando com nitidez e link para a Home.
   - [ ] Botão do carrinho abrindo a gaveta (`CartDrawer`) tanto no mobile quanto no desktop.
   - [ ] Contador de carrinho atualizando dinamicamente.
   - [ ] Barra de busca e filtros operando com fixação sticky perfeita.
3. **Testar Painel Admin no Celular e Desktop:**
   - [ ] Toggles ligando e desligando.
   - [ ] Upload de novas imagens gerando preview instantâneo.
   - [ ] Salvamento refletindo no catálogo em `localhost:3000`.

