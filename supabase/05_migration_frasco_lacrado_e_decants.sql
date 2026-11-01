-- =========================================================
-- OFFGLASS DECANTS — Migração 05:
-- Suporte a Frascos Lacrados com Preço e Modalidades de Venda (Decant / Lacrado / Ambos)
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- É 100% seguro: adiciona novas colunas com valores padrão e não remove nada.
-- =========================================================

alter table produtos add column if not exists preco_frasco_lacrado numeric(10,2) default 0;
alter table produtos add column if not exists vende_decant boolean default true;
alter table produtos add column if not exists vende_lacrado boolean default false;

-- Atualiza perfumes que estão na categoria 'lacrados' para vende_lacrado = true
update produtos set vende_lacrado = true where categoria = 'lacrados';

-- Recarrega o Schema Cache do PostgREST imediatamente para o Supabase reconhecer as novas colunas
NOTIFY pgrst, 'reload schema';
