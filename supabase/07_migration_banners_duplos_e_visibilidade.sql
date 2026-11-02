-- =========================================================
-- OFFGLASS DECANTS — Migração 07:
-- Sistema de Banners Duplos (Top Slim e Hero Principal) com Ativação/Desativação
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- =========================================================

create table if not exists site_config (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz default now()
);

alter table site_config enable row level security;

drop policy if exists "Leitura publica site_config" on site_config;
create policy "Leitura publica site_config" on site_config for select using (true);

drop policy if exists "Admin gerencia site_config" on site_config;
create policy "Admin gerencia site_config" on site_config for all to authenticated using (true) with check (true);

-- 1) Banner Superior Fino (Acima do Header)
insert into site_config (chave, valor) values
  ('banner_top_ativo', 'false'),
  ('banner_top_desktop', ''),
  ('banner_top_mobile', ''),
  ('banner_top_link', '')
on conflict (chave) do nothing;

-- 2) Banner Principal Vitrine (Abaixo do Header/Filtros)
insert into site_config (chave, valor) values
  ('banner_hero_ativo', 'true'),
  ('banner_hero_desktop', '/banner-desktop.png'),
  ('banner_hero_mobile', '/banner-mobile.png'),
  ('banner_hero_link', '')
on conflict (chave) do nothing;

NOTIFY pgrst, 'reload schema';

