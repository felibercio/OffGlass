# Plano de Implementação: Gerenciamento de Banners no Admin e Alta Resolução (Retina)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir que o lojista edite e faça upload dos banners do topo (Desktop e Mobile) diretamente pelo painel administrativo (otimizado para celular e computador), garantindo suporte a imagens de alta resolução (2x/3x Retina) e atualização instantânea no catálogo.

**Architecture:** Criar tabela `site_config` no Supabase com leitura pública e escrita autenticada para armazenar as URLs dos banners configurados, com fallback gracioso para os arquivos locais `/banner-desktop.png` e `/banner-mobile.png`. Criar endpoint de upload seguro no Supabase Storage (`/api/admin/banners`) e página administrativa em `/admin/banners` totalmente responsiva para uso no smartphone ou desktop, com upload de arquivos da galeria/câmera, pré-visualizações em tempo real e guias de resolução. No catálogo (`app/page.tsx` e `CatalogApp.tsx`), consumir as URLs ativas de forma dinâmica e revalidada.

**Tech Stack:** Next.js 16 (App Router), Supabase Storage & Database, React 19, Tailwind CSS v4, TypeScript.

---

### Diagnóstico de Qualidade: Por que 1024×198 não fica em alta resolução?

- **O que acontece nas telas modernas (Retina / OLED / High-DPI):**
  - Celulares modernos (iPhone, Samsung Galaxy) possuem telas com densidade de **3x** (3 pixels físicos para cada 1 pixel lógico de CSS).
  - MacBooks e monitores de alta resolução possuem densidade de **2x**.
  - O arquivo desktop enviado possui **1024 × 198 pixels** a 72 DPI. Em um monitor 1080p ou MacBook (que opera em 2x), essa imagem é esticada para preencher a largura, exigindo 2048 pixels físicos. Por ter apenas 1024, a tela interpola os pixels, resultando em textos com aspecto borrado/pixelado.
  - O arquivo mobile atual possui **440 × 187 pixels**. Em um iPhone (que possui largura física de 1170px), a imagem é esticada quase 3 vezes!

- **Qualidade e Resoluções Ideais:**
  1. **Banner Desktop (Proporção ~5:1):**
     - **Resolução ideal:** **`2048 × 396 px`** ou **`2560 × 496 px`** (PNG ou WebP de alta qualidade).
     - No Canva ou Figma: ao exportar, selecionar escala **`2x`** ou definir a largura em 2048px.
  2. **Banner Mobile (Proporção ~2.35:1):**
     - **Resolução ideal:** **`1080 × 460 px`** ou **`1200 × 510 px`** (PNG ou WebP).
     - No Canva ou Figma: exportar com largura de 1080px para máxima nitidez em smartphones.

---

### Task 1: Banco de Dados Supabase (`site_config`) & Migração

**Files:**
- Create: `supabase/06_migration_banners_e_site_config.sql`
- Modify: `lib/data.ts`

**Step 1: Criar o script SQL de migração**
```sql
-- Configurações gerais do catálogo (banners, etc.)
create table if not exists site_config (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz default now()
);

alter table site_config enable row level security;
drop policy if exists "Leitura publica site_config" on site_config;
create policy "Leitura publica site_config" on site_config for select using (true);

-- Inserir valores padrão iniciais apontando para os arquivos locais
insert into site_config (chave, valor) values
  ('banner_desktop', '/banner-desktop.png'),
  ('banner_mobile', '/banner-mobile.png')
on conflict (chave) do nothing;
```

**Step 2: Atualizar `lib/data.ts` com função resiliente de leitura**
```typescript
export async function getBannersConfig(): Promise<{ bannerDesktop: string; bannerMobile: string }> {
  const fallback = {
    bannerDesktop: "/banner-desktop.png",
    bannerMobile: "/banner-mobile.png",
  };
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("chave, valor")
      .in("chave", ["banner_desktop", "banner_mobile"]);

    if (error || !data) return fallback;

    const desktop = data.find((d) => d.chave === "banner_desktop")?.valor;
    const mobile = data.find((d) => d.chave === "banner_mobile")?.valor;

    return {
      bannerDesktop: desktop || fallback.bannerDesktop,
      bannerMobile: mobile || fallback.bannerMobile,
    };
  } catch {
    return fallback;
  }
}
```

---

### Task 2: Rotas de API para Upload e Salvamento de Banners (`/api/admin/banners`)

**Files:**
- Create: `app/api/admin/banners/route.ts`

**Step 1: Criar API com suporte a upload de arquivo e atualização de configuração**
- `GET`: Retorna `{ bannerDesktop, bannerMobile }`.
- `POST`: 
  1. Suporta `multipart/form-data`:
     - Se receber arquivo binário (`fileDesktop` ou `fileMobile`), faz upload para o Supabase Storage no bucket `image`, pasta `banners/${timestamp}-${safeName}` com `upsert: true`.
     - Permite também receber URL direta (caso o lojista selecione uma foto já existente).
  2. Atualiza os registros na tabela `site_config` usando `createAdminClient()`.
  3. Dispara `revalidatePath("/")` e `revalidatePath("/admin/banners")` para atualização imediata na CDN da Vercel.

---

### Task 3: Interface no Painel Administrativo (`/admin/banners`)

**Files:**
- Modify: `components/admin/AdminNav.tsx`
- Create: `app/admin/banners/page.tsx`
- Create: `components/admin/BannersManager.tsx`

**Step 1: Adicionar aba no `AdminNav.tsx`**
Incluir `{ href: "/admin/banners", label: "Banners" }` na lista de navegação.

**Step 2: Criar `BannersManager.tsx` 100% responsivo para celular**
- **Mobile First:** Todo o formulário pensado para o lojista operar pelo smartphone:
  - Botões de upload com touch targets confortáveis (`min-h-[48px]`).
  - Inputs com `accept="image/*"` permitindo selecionar direto da galeria de fotos do celular ou tirar foto.
- **Card 1: Banner Desktop**
  - Preview interativo da imagem atual (aspect ratio 5:1).
  - Badge informando status ("Padrão local" ou "Personalizado").
  - Botão de upload de novo arquivo.
  - Dica de resolução com texto explicativo: "Ideal: 2048 × 396 px (exporte em 2x no Canva)".
  - Botão "Restaurar Padrão".
- **Card 2: Banner Mobile**
  - Preview interativo em formato de smartphone (aspect ratio 2.35:1).
  - Botão de upload direto do celular.
  - Dica de resolução: "Ideal: 1080 × 460 px (exporte em 2x ou 3x)".
  - Botão "Restaurar Padrão".
- **Ações Finais:**
  - Botão flutuante ou fixo "Salvar Alterações" com feedback visual de carregamento.
  - Botão "Visualizar Catálogo".

---

### Task 4: Conectar Banners Dinâmicos no Catálogo

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/catalog/CatalogApp.tsx`

**Step 1: Buscar os banners em `app/page.tsx`**
Passar `bannersConfig` como prop para `CatalogApp`.

**Step 2: Usar as URLs dinâmicas no `<picture>` de `CatalogApp.tsx`**
```tsx
<picture className="w-full max-w-full block">
  <source media="(min-width: 768px)" srcSet={bannerDesktop} />
  <img
    src={bannerMobile}
    alt="OFFGLASS SCENT — Fragrâncias Originais em Decants"
    className="w-full max-w-full h-auto block mx-auto"
    loading="eager"
    fetchPriority="high"
  />
</picture>
```

---

### Task 5: Validação Localhost e Testes nos Dispositivos

1. **Testar no Celular (Mobile View):**
   - Acessar `/admin/banners`.
   - Testar seleção de arquivo e preview no celular.
   - Salvar e conferir atualização instantânea na Home `/`.
2. **Testar no Desktop:**
   - Conferir se o novo arquivo enviado pelo usuário (`public/banner-desktop.png`) já está carregando localmente com o layout correto.
3. **Verificação de Tipos:**
   - Executar `npx tsc --noEmit` garantindo integridade total de código.

