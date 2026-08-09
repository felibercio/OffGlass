-- =========================================================
-- OFFGLASS DECANTS — Migração para a versão Next.js
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- É seguro rodar mesmo já tendo os dados da versão anterior — só adiciona
-- o que falta, não apaga nada.
-- =========================================================

-- 1) NOVAS COLUNAS EM "produtos"
alter table produtos add column if not exists descricao_curta text default '';
alter table produtos add column if not exists descricao_completa text default '';
alter table produtos add column if not exists acordes text[] default '{}';

-- 2) TABELA DE ACORDES (nossa própria biblioteca, substitui o Fragrantica)
create table if not exists acordes (
  key text primary key,
  label text not null,
  cor text not null
);

alter table acordes enable row level security;
drop policy if exists "Leitura publica acordes" on acordes;
create policy "Leitura publica acordes" on acordes for select using (true);

-- Alguns acordes de exemplo para começar (edite/adicione pelo admin depois)
insert into acordes (key, label, cor) values
  ('citrico', 'Cítrico', '#D9A441'),
  ('amadeirado', 'Amadeirado', '#8C6E4A'),
  ('floral', 'Floral', '#C97B9B'),
  ('doce', 'Doce', '#D97A5B'),
  ('aquatico', 'Aquático', '#5B92A8'),
  ('amadeirado-especiado', 'Amadeirado especiado', '#A9622F'),
  ('aromatico', 'Aromático', '#6E9C6E')
on conflict (key) do nothing;

-- 3) TABELA DE PEDIDOS (sem conta de cliente, só registro do pedido)
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  telefone_cliente text not null,
  itens jsonb not null,
  forma_pagamento text not null check (forma_pagamento in ('pix', 'cartao')),
  total numeric not null,
  criado_em timestamptz default now()
);

alter table pedidos enable row level security;
-- IMPORTANTE: nenhuma política de SELECT para o público (anon) é criada
-- aqui de propósito — dado de cliente não pode ser lido pela chave pública.
-- Apenas usuárias autenticadas (você, logada no /admin) podem ler:
drop policy if exists "Admin le pedidos" on pedidos;
create policy "Admin le pedidos" on pedidos for select to authenticated using (true);
-- Escritas (inserir pedido) só acontecem via API route com a chave de
-- serviço, que ignora RLS — por isso não há política de insert aqui.

-- 4) TABELA DE MENSAGENS PERSONALIZÁVEIS (templates do WhatsApp)
create table if not exists mensagens_config (
  chave text primary key,
  template text not null
);

alter table mensagens_config enable row level security;
drop policy if exists "Leitura publica mensagens" on mensagens_config;
create policy "Leitura publica mensagens" on mensagens_config for select using (true);

insert into mensagens_config (chave, template) values
  ('pedido', 'Olá! Meu nome é {{nome}}. Gostaria de fazer o seguinte pedido: {{itens}}. Forma de pagamento: {{pagamento}}. Total: {{total}}'),
  ('frasco_lacrado', 'Olá! Gostaria de mais informações sobre o frasco lacrado de {{nome_produto}}.')
on conflict (chave) do nothing;
