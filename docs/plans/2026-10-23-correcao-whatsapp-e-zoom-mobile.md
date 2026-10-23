# Correção de Redirecionamento para o WhatsApp e Zoom Mobile — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corrigir a falha de redirecionamento para o WhatsApp ao concluir o pedido no carrinho e eliminar o comportamento de zoom indesejado ao acessar o catálogo em dispositivos móveis.

**Architecture:** 
1. Para o WhatsApp: eliminar a dependência exclusiva de `window.open` assíncrono (bloqueado por pop-up blockers em mobile/Safari/Chrome/webviews após `await fetch`), adicionando redirecionamento direto (`window.location.href`), persistência de pedido com `keepalive: true`, e uma tela de confirmação de sucesso no `CartDrawer` com botão explícito ("Abrir WhatsApp Agora") como fallback garantido.
2. Para o Zoom Mobile: exportar a configuração nativa de `viewport` no Next.js (`initialScale: 1, maximumScale: 1, userScalable: false`), blindar o CSS contra overflow horizontal (`overflow-x: hidden`), garantir fonte mínima de 16px para campos de input (evitando auto-zoom do iOS Safari), e substituir larguras baseadas em `100vw` na fileira horizontal de produtos.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase.

---

### Task 1: Viewport e Prevenção do Zoom Mobile

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `components/catalog/SearchBar.tsx:78`
- Modify: `components/catalog/CategorySection.tsx:79,91`

**Step 1: Exportar configuração de `viewport` no `app/layout.tsx`**

No Next.js 14/15 App Router, as configurações de viewport devem ser exportadas através do objeto `viewport: Viewport` separado de `metadata`:

```tsx
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```

**Step 2: Blindar o CSS global contra overflow e auto-zoom do iOS em `app/globals.css`**

Em `app/globals.css`:
1. Adicionar `overflow-x: hidden`, `width: 100%`, `max-width: 100%` e `-webkit-text-size-adjust: 100%` em `html, body`.
2. Assegurar que inputs e selects em mobile possuam `font-size: 16px` para impedir que o iOS Safari aplique zoom automático ao tocar ou focar no campo:

```css
html,
body {
  overflow-x: hidden;
  max-width: 100%;
  width: 100%;
  -webkit-text-size-adjust: 100%;
  /* background existente ... */
}

/* Previne zoom automático forçado do iOS Safari em inputs/selects (exige min 16px) */
@media (max-width: 768px) {
  input[type="text"],
  input[type="number"],
  input[type="password"],
  input[type="tel"],
  input[type="email"],
  select,
  textarea {
    font-size: 16px !important;
  }
}
```

**Step 3: Ajustar o tamanho da fonte da barra de pesquisa em `components/catalog/SearchBar.tsx`**

Na linha 78 de `components/catalog/SearchBar.tsx`:
- Alterar a classe do `<input>` de `text-xs sm:text-sm` para `text-base sm:text-sm`. Isso garante que no mobile a fonte seja 16px (`text-base`), não disparando o zoom do iOS Safari ao focar na barra de busca.

**Step 4: Eliminar uso de `100vw` em `components/catalog/CategorySection.tsx`**

Nas linhas 79 e 91 de `components/catalog/CategorySection.tsx`:
- `w-[calc((100vw-44px)/2)]` causa overflow horizontal em telas com barras de rolagem nativas, provocando cálculo de tela maior que o viewport.
- Substituir por `w-[calc((100%-12px)/2)]` ou largura base fixa responsiva `w-[155px] min-[370px]:w-[170px] sm:w-[220px] md:w-[240px] lg:w-[250px]`.

---

### Task 2: Sanitização da URL do WhatsApp em `lib/utils.ts`

**Files:**
- Modify: `lib/utils.ts:26-28`

**Step 1: Tratar número e codificação em `whatsappUrl`**

Garantir que caracteres especiais no número de telefone sejam removidos e que o DDI do Brasil (`55`) seja preservado:

```typescript
export function whatsappUrl(numero: string, mensagem: string): string {
  const digits = numero.replace(/\D/g, "");
  const formattedNumber = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(mensagem.trim())}`;
}
```

---

### Task 3: Redirecionamento Infalível e Tela de Confirmação com Fallback no Carrinho

**Files:**
- Modify: `components/catalog/CartDrawer.tsx`
- Modify: `components/catalog/CatalogApp.tsx:297-338`

**Causa Raiz Identificada:**
Em `CatalogApp.tsx`, o redirecionamento executava `await fetch("/api/pedidos")` antes de `window.open(...)`. Como o fetch leva centenas de milissegundos, o navegador descarta o token de gesto do usuário ("user activation context"). Como resultado:
1. Safari no iOS e Chrome no Android bloqueiam silenciosamente a abertura de nova aba/janela (`window.open`).
2. Webviews (como Instagram, TikTok e navegadores embutidos) não permitem `window.open` assíncrono.
3. O código executava imediatamente `setCart([])` e `setCartOpen(false)`, fechando a gaveta e deixando o cliente na tela inicial sem qualquer feedback e sem abrir o WhatsApp.

**Step 1: Atualizar `handleCheckout` em `CatalogApp.tsx`**

1. Salvar o pedido via `fetch("/api/pedidos", { ..., keepalive: true })`.
2. Gerar a URL do WhatsApp e retorná-la para o `CartDrawer`.
3. Executar o redirecionamento com suporte a mobile:
   - Em mobile, `window.location.href = waUrl` direciona perfeitamente sem bloqueio de pop-up e aciona o app oficial do WhatsApp via Universal Link.
   - Caso `window.open` seja tentado e retorne nulo ou fechado, acionar `window.location.href`.

```typescript
  async function handleCheckout(nome: string, telefone: string, pagamento: FormaPagamento): Promise<string> {
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

    // Dispara o salvamento do pedido com keepalive para não abortar mesmo se a página redirecionar
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
        keepalive: true,
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

    const waUrl = whatsappUrl(WHATSAPP_NUMBER, mensagem);

    // Tenta redirecionar de forma robusta
    const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      const popup = window.open(waUrl, "_blank");
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        window.location.href = waUrl;
      }
    }

    return waUrl;
  }
```

**Step 2: Criar estado de confirmação e fallback no `CartDrawer.tsx`**

1. Adicionar o step `"sucesso"` no `CartDrawer`.
2. Ao clicar em "Enviar pedido no WhatsApp":
   - O `handleCheckout` é chamado e devolve a `waUrl`.
   - Se por qualquer motivo o navegador bloquear o redirecionamento automático (ou o cliente retornar à aba), o drawer exibe a tela de confirmação:
     - Ícone verde de confirmação: "Pedido registrado com sucesso!"
     - Aviso: "Estamos te direcionando para o WhatsApp..."
     - Botão verde/teal destacado: **"Abrir WhatsApp Agora"** (`<a href={waUrl} target="_blank" rel="noopener noreferrer">`).
     - Botão "Concluir e fechar".
   - O carrinho é esvaziado quando o pedido tem sucesso.
3. Garantir que os inputs de `nome` e `telefone` no formulário utilizem `text-base` no mobile (16px) para nunca causarem zoom ao digitar.

---

### Task 4: Validação e Testes Finais

**Step 1: Testar em modo mobile e desktop**
1. Testar acesso à página inicial no mobile com viewport 375px e 390px (iPhone):
   - Confirmar ausência de zoom inicial na tela (escala 1.0 cravada).
   - Tocar na barra de busca e nos inputs do carrinho: confirmar que a tela não sofre auto-zoom.
   - Rolar horizontalmente e confirmar ausência de rolagem lateral na página inteira.
2. Testar fluxo de fechamento de carrinho:
   - Adicionar itens ao carrinho.
   - Preencher nome e telefone.
   - Clicar em "Enviar pedido no WhatsApp".
   - Verificar que a requisição POST `/api/pedidos` registra o pedido no banco.
   - Confirmar o redirecionamento imediato para `https://wa.me/5545999736188?text=...`.
   - Verificar que a tela de sucesso com botão manual de fallback está presente e funcional caso o pop-up blocker atue.
