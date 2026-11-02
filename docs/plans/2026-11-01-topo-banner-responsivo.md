# Implementação do Topo com Banner Responsivo e Reorganização do Header

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Substituir o topo atual (logo OFFGLASS e seção de boas-vindas) por uma section de banner responsivo (desktop e mobile), mantendo o botão do carrinho no canto superior e posicionando a barra de pesquisa e filtros logo abaixo do banner, com validação completa em localhost antes da produção.

**Architecture:** Adicionar as duas imagens otimizadas em `public/` (`banner-mobile.png` 440x187 e `banner-desktop.png` 1024x198). No componente `CatalogApp.tsx`, criar uma section de banner no topo com background verde `#507b1f` (cor exata de fundo das imagens), renderização responsiva via Next.js `Image` com `priority` e botão do carrinho posicionado de forma acessível no canto superior direito. Posicionar a barra de busca e filtros de categorias logo abaixo do banner (com fixação sticky para navegação contínua) e remover a section com texto redundante de boas-vindas.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript.

---

### Task 1: Processar e copiar os banners para o diretório `public/`

**Files:**
- Create: `public/banner-mobile.png` (a partir de `media_1793583557078_9fe4649d.png`, 440x187)
- Create: `public/banner-desktop.png` (a partir de `media_1793583559379_0a9efcc9.png`, 1024x198)

**Step 1: Copiar as imagens da pasta de uploads para `public/`**
Executar comando de cópia garantindo permissões e integridade dos bytes:
```bash
cp /Users/felipearcega/.gemini/antigravity/brain/ccd4bb6a-9b9d-4eed-966a-c659b82801c9/.user_uploaded/media_1793583557078_9fe4649d.png public/banner-mobile.png
cp /Users/felipearcega/.gemini/antigravity/brain/ccd4bb6a-9b9d-4eed-966a-c659b82801c9/.user_uploaded/media_1793583559379_0a9efcc9.png public/banner-desktop.png
```

**Step 2: Verificar dimensões e integridade dos arquivos gerados**
```bash
sips -g pixelWidth -g pixelHeight public/banner-mobile.png public/banner-desktop.png
```
*Resultado esperado:*
- `public/banner-mobile.png`: 440 x 187
- `public/banner-desktop.png`: 1024 x 198

**Step 3: Commit dos novos assets**
```bash
git add public/banner-mobile.png public/banner-desktop.png
git commit -m "feat(assets): adiciona banners mobile e desktop para o topo da loja"
```

---

### Task 2: Refatorar o topo de `CatalogApp.tsx` (Banner, Carrinho, Busca e Remoção de Hero)

**Files:**
- Modify: `components/catalog/CatalogApp.tsx`

**Step 1: Substituir a estrutura do topo atual**
No arquivo `components/catalog/CatalogApp.tsx`:
1. **Criar a section de banner no topo**:
   - Container `relative w-full bg-[#507b1f] overflow-hidden` garantindo preenchimento de ponta a ponta na cor verde original.
   - Banner Mobile: `<Image src="/banner-mobile.png" width={440} height={187} alt="OFFGLASS SCENT" className="block md:hidden w-full h-auto mx-auto object-cover" priority />`.
   - Banner Desktop: `<Image src="/banner-desktop.png" width={1024} height={198} alt="OFFGLASS SCENT" className="hidden md:block w-full h-auto max-h-[220px] mx-auto object-cover" priority />`.
   - Botão do carrinho posicionado no canto superior direito da section (`absolute top-3 right-3 sm:top-4 sm:right-5 z-20`):
     - Estilo translúcido elegante `bg-white/85 hover:bg-white text-stone-900 shadow-md backdrop-blur-md rounded-full p-2.5 transition-all active:scale-95`.
     - Badge do contador de itens (`cartCount > 0`) com a classe `btn-teal` no canto superior do ícone.
2. **Posicionar a barra de pesquisa e filtros abaixo do banner**:
   - O `<header>` sticky fica posicionado abaixo do banner (`sticky top-0 z-40 glass-strong border-b border-black/5`):
     - Contém o `SearchBar` (`px-4 pt-3 pb-2`).
     - Contém o `ChipGroup` de categorias (`pt-0.5 pb-2`).
     - Contém os subfiltros (`CategorySubFilters`) quando uma categoria estiver selecionada.
3. **Remover a antiga seção de boas-vindas ("Olá, seja bem-vinda(o)...")**:
   - Deletar a `section` entre as linhas 462-481 (`{!isFilteredView && (<section className="px-5 pt-6 pb-2 animate-fade-in">...`)).

**Step 2: Validar compilação TypeScript**
```bash
npx tsc --noEmit
```
*Resultado esperado:* Nenhum erro de tipo.

**Step 3: Commit da refatoração**
```bash
git add components/catalog/CatalogApp.tsx
git commit -m "feat(catalog): substitui logo e hero por banner responsivo e reorganiza busca e filtros"
```

---

### Task 3: Validação Completa em Localhost

**Files:**
- Script de teste ou verificação via navegador / terminal local.

**Step 1: Iniciar servidor Next.js em localhost**
```bash
npm run dev
```
*Resultado esperado:* Servidor ouvindo em `http://localhost:3000` (ou porta configurada) sem falhas.

**Step 2: Verificar resposta HTTP e renderização dos elementos**
Testar requisição local via `curl`:
- Garantir que status code seja 200.
- Conferir que `/banner-mobile.png` e `/banner-desktop.png` constam no HTML renderizado.
- Conferir que o texto antigo "Olá, seja bem-vinda(o)" **NÃO** está mais presente.

**Step 3: Testar Responsividade e Interações**
1. **Viewport Mobile (375px a 440px):**
   - O banner mobile (440x187) é exibido com proporções perfeitas e texto nítido.
   - O botão do carrinho permanece visível, acessível no topo à direita e com touch target confortável (> 44px).
   - A barra de pesquisa e o chip group de categorias aparecem imediatamente abaixo do banner.
2. **Viewport Desktop (1024px a 1440px):**
   - O banner desktop (1024x198) é exibido sem distorção e sem cortes.
   - Em telas ultrawide (>1440px), o fundo `#507b1f` estende o verde uniformemente nas laterais, sem bordas pretas ou brancas.
   - A barra de pesquisa e filtros ficam centralizados e elegantes abaixo do banner.
3. **Fluxos de Interação:**
   - Clicar no botão do carrinho abre a gaveta lateral (`CartDrawer`).
   - Adicionar perfume ao carrinho atualiza a badge numérica no botão do carrinho no topo.
   - Digitar na barra de pesquisa filtra os produtos instantaneamente.
   - Clicar nas categorias e subfiltros funciona perfeitamente.

---

### Task 4: Revisão Final e Conclusão

**Step 1: Executar checagem de integridade**
```bash
git status
git diff HEAD~1
```

**Step 2: Checklist final para liberação**
- [ ] Banners salvos e renderizando com Next.js `Image` e `priority`
- [ ] Logo antiga removida
- [ ] Botão do carrinho fixado/acessível no canto superior direito
- [ ] Barra de busca e filtros posicionados logo abaixo do banner
- [ ] Seção "Olá, seja bem-vinda(o)..." removida
- [ ] Validação em localhost concluída com sucesso no mobile e desktop

