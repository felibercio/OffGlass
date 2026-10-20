-- =========================================================
-- OFFGLASS DECANTS — Migração: Vendas, Múltiplas Imagens e Preços
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- =========================================================

-- 1) MÚLTIPLAS IMAGENS EM "produtos"
alter table produtos add column if not exists imagens text[] default '{}';

-- Migra imagem única existente para o array de imagens caso esteja vazio
update produtos 
set imagens = array[imagem] 
where imagem is not null 
  and imagem <> '' 
  and (imagens is null or cardinality(imagens) = 0);

-- 2) PREÇOS EXATOS SEM ARREDONDAMENTO
-- Garante precisão decimal (centavos reais) em vez de inteiros
alter table produtos alter column preco_2 type numeric(10,2);
alter table produtos alter column preco_5 type numeric(10,2);
alter table produtos alter column preco_10 type numeric(10,2);

-- 3) STATUS DO PEDIDO EM "pedidos"
alter table pedidos add column if not exists status text default 'novo';

-- 4) PERMISSÕES RLS EM "pedidos"
-- Permite que usuário autenticado (admin logado) atualize pedidos (ex: status)
drop policy if exists "Admin atualiza pedidos" on pedidos;
create policy "Admin atualiza pedidos" on pedidos for update to authenticated using (true);
