# Correção do Erro de Schema no Cadastro de Perfumes (Decant / Lacrado) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolver o erro `Could not find the 'preco_frasco_lacrado' column of 'produtos' in the schema cache` no cadastro de novos perfumes, garantindo que o sistema funcione com resiliência total caso o perfume seja somente decant, somente frasco lacrado ou híbrido, mesmo se o banco ainda não tiver as novas colunas migradas.

**Architecture:** Implementar no backend (`app/api/admin/produtos/route.ts`) uma camada de fallback automático resiliente que detecta ausência de colunas no schema cache do Supabase e retenta o salvamento com o payload sanitizado e mapeamento retrocompatível (usando `categoria = 'lacrados'` para perfumes exclusivamente lacrados). Em paralelo, atualizar o script de migração SQL com comando de reload forçado do PostgREST (`NOTIFY pgrst, 'reload schema'`) e ajustar as validações de formulário para cada modalidade.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (PostgREST), React 19.

---

### Task 1: Adicionar Fallback Gracioso no Endpoint de Produtos (`/api/admin/produtos`)

**Files:**
- Modify: `app/api/admin/produtos/route.ts:25-36`

**Step 1: Implementar detecção de erro de coluna inexistente e retry compatível**
- Ao executar `supabase.from("produtos").upsert(row)`:
- Se retornar erro contendo `Could not find the` e `column` (ou código `PGRST204`):
  1. Criar payload retrocompatível removendo `preco_frasco_lacrado`, `vende_decant`, `vende_lacrado`.
  2. Se o produto for exclusivamente lacrado (`product.vendeLacrado && !product.vendeDecant`), forçar `categoria: "lacrados"` para garantir que o catálogo legado e atual o reconheçam como frasco original.
  3. Reexecutar o `upsert` com o payload compatível.
  4. Retornar sucesso transparente sem impactar o usuário.

---

### Task 2: Ajustar Validações no Formulário Admin (`ProductForm.tsx`)

**Files:**
- Modify: `components/admin/ProductForm.tsx:340-365`

**Step 1: Ajustar regras para "Somente Decant" vs "Somente Lacrado"**
- Se `form.vendeDecant && !form.vendeLacrado` (Somente Decant):
  - Validar se ao menos um decant (2ml, 5ml ou 10ml) possui valor > 0.
  - Não exigir preço do frasco lacrado.
- Se `form.vendeLacrado && !form.vendeDecant` (Somente Lacrado):
  - Validar se o preço do frasco lacrado > 0.
  - Não exigir preços dos decants.
- Se ambos marcados:
  - Validar preço de decants e preço do frasco.

---

### Task 3: Atualizar Script SQL de Migração com Recarregamento de Cache

**Files:**
- Modify: `supabase/05_migration_frasco_lacrado_e_decants.sql`

**Step 1: Adicionar comando explícito de recarga do PostgREST**
- Incluir `NOTIFY pgrst, 'reload schema';` no script para garantir que o Supabase atualize seu schema cache imediatamente após a execução.
- Fornecer instruções prontas de 2 cliques no painel do Supabase.

---

### Task 4: Validação e Teste de Build

**Files:**
- Testar com `npm run build`
- Garantir 0 erros de compilação.
- Commit e push para produção.
