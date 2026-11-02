-- =========================================================
-- OFFGLASS DECANTS — Migração 06:
-- Configuração de Banners e Imagens do Topo (Desktop e Mobile)
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- =========================================================

create table if not exists site_config (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz default now()
);

alter table site_config enable row level security;

-- Política de leitura pública (qualquer cliente pode ler a URL dos banners)
drop policy if exists "Leitura publica site_config" on site_config;
create policy "Leitura publica site_config" on site_config for select using (true);

-- Política de escrita administrativa (apenas administradores logados podem alterar)
drop policy if exists "Admin gerencia site_config" on site_config;
create policy "Admin gerencia site_config" on site_config for all to authenticated using (true) with check (true);

-- Inserir valores padrão iniciais apontando para os arquivos locais
insert into site_config (chave, valor) values
  ('banner_desktop', '/banner-desktop.png'),
  ('banner_mobile', '/banner-mobile.png')
on conflict (chave) do nothing;

NOTIFY pgrst, 'reload schema';

