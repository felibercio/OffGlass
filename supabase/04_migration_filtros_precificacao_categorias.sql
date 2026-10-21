-- =========================================================
-- OFFGLASS DECANTS — Migração 04:
-- Filtros Avançados, Precificação Inteligente, Gênero e Categorias Oficiais
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- É 100% seguro: adiciona novas colunas com valores padrão e não remove nada.
-- =========================================================

-- 1) NOVAS COLUNAS EM "produtos"
alter table produtos add column if not exists genero text default 'compartilhado' 
  check (genero in ('masculino', 'feminino', 'compartilhado'));

alter table produtos add column if not exists destaque boolean default false;
alter table produtos add column if not exists custo_frasco numeric(10,2) default 0;
alter table produtos add column if not exists volume_frasco_ml numeric(10,2) default 100;
alter table produtos add column if not exists margem_lucro_pct numeric(10,2) default 100;
alter table produtos add column if not exists criado_em timestamptz default now();

-- 2) GARANTIR AS CATEGORIAS OFICIAIS
-- Sequência prioritária da marca: Nicho, Árabe, Designer, Autoral, Lacrados
insert into categorias (key, label) values
  ('nicho', 'Nicho'),
  ('arabe', 'Árabe'),
  ('designer', 'Designer'),
  ('autoral', 'Autoral'),
  ('lacrados', 'Lacrados')
on conflict (key) do update set label = excluded.label;

-- 3) ÍNDICES PARA PERFORMANCE DE BUSCA E ORDENAÇÃO
create index if not exists idx_produtos_categoria on produtos (categoria);
create index if not exists idx_produtos_genero on produtos (genero);
create index if not exists idx_produtos_destaque on produtos (destaque);
create index if not exists idx_produtos_criado_em on produtos (criado_em desc);
