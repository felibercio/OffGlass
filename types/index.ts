export type SizeMl = 2 | 5 | 10;

export interface Notas {
  topo: string;
  coracao: string;
  fundo: string;
}

export interface Promo {
  ativo: boolean;
  desconto: number; // percentual
}

export type Genero = "masculino" | "feminino" | "compartilhado";

export interface Product {
  id: string;
  categoria: string;
  marca: string;
  nome: string;
  imagem: string;
  imagens: string[]; // galeria de imagens
  descricaoCurta: string;
  descricaoCompleta: string;
  acordes: string[]; // chaves de Accord
  notas: Notas;
  precos: Record<SizeMl, number>;
  promo: Promo;
  genero?: Genero;
  destaque?: boolean;
  custoFrasco?: number;
  volumeFrascoMl?: number;
  margemLucroPct?: number;
  criadoEm?: string;
}

export interface Category {
  key: string;
  label: string;
}

export interface Accord {
  key: string;
  label: string;
  cor: string; // hex
}

export type FormaPagamento = "pix" | "cartao";
export type PedidoStatus = "novo" | "preparo" | "enviado" | "concluido" | "cancelado";

export interface CartItem {
  productId: string;
  size: SizeMl;
  qty: number;
}

export interface PedidoItem {
  produto: string;
  tamanho: SizeMl;
  qtd: number;
  precoUnit: number;
}

export interface Pedido {
  id?: string;
  nomeCliente: string;
  telefoneCliente: string;
  itens: PedidoItem[];
  formaPagamento: FormaPagamento;
  total: number;
  status?: PedidoStatus;
  criadoEm?: string;
}

export interface MensagemConfig {
  chave: string;
  template: string;
}

/* ---------- Linhas cruas vindas do banco (snake_case) ---------- */
export interface ProdutoRow {
  id: string;
  categoria: string;
  marca: string;
  nome: string;
  imagem: string;
  imagens?: string[];
  descricao_curta: string;
  descricao_completa: string;
  acordes: string[];
  notas_topo: string;
  notas_coracao: string;
  notas_fundo: string;
  preco_2: number;
  preco_5: number;
  preco_10: number;
  promo_ativo: boolean;
  promo_desconto: number;
  genero?: Genero;
  destaque?: boolean;
  custo_frasco?: number;
  volume_frasco_ml?: number;
  margem_lucro_pct?: number;
  criado_em?: string;
}

export interface PedidoRow {
  id: string;
  nome_cliente: string;
  telefone_cliente: string;
  itens: PedidoItem[];
  forma_pagamento: FormaPagamento;
  total: number;
  status?: PedidoStatus;
  criado_em: string;
}

export interface CategoriaRow {
  key: string;
  label: string;
}

export interface AcordeRow {
  key: string;
  label: string;
  cor: string;
}

export interface MensagemConfigRow {
  chave: string;
  template: string;
}

export function fromProdutoRow(row: ProdutoRow): Product {
  const imagens = Array.isArray(row.imagens) && row.imagens.length > 0
    ? row.imagens.filter(Boolean)
    : (row.imagem ? [row.imagem] : []);

  return {
    id: row.id,
    categoria: row.categoria,
    marca: row.marca,
    nome: row.nome,
    imagem: imagens[0] || row.imagem || "",
    imagens,
    descricaoCurta: row.descricao_curta || "",
    descricaoCompleta: row.descricao_completa || "",
    acordes: row.acordes || [],
    notas: {
      topo: row.notas_topo || "",
      coracao: row.notas_coracao || "",
      fundo: row.notas_fundo || "",
    },
    precos: {
      2: Number(row.preco_2),
      5: Number(row.preco_5),
      10: Number(row.preco_10),
    },
    promo: {
      ativo: !!row.promo_ativo,
      desconto: Number(row.promo_desconto) || 0,
    },
    genero: row.genero || "compartilhado",
    destaque: !!row.destaque,
    custoFrasco: Number(row.custo_frasco) || 0,
    volumeFrascoMl: Number(row.volume_frasco_ml) || 100,
    margemLucroPct: Number(row.margem_lucro_pct) || 100,
    criadoEm: row.criado_em || "",
  };
}

export function toProdutoRow(p: Product): Omit<ProdutoRow, never> {
  const imagens = Array.isArray(p.imagens) && p.imagens.length > 0
    ? p.imagens.filter(Boolean)
    : (p.imagem ? [p.imagem] : []);

  return {
    id: p.id,
    categoria: p.categoria,
    marca: p.marca,
    nome: p.nome,
    imagem: imagens[0] || p.imagem || "",
    imagens,
    descricao_curta: p.descricaoCurta || "",
    descricao_completa: p.descricaoCompleta || "",
    acordes: p.acordes || [],
    notas_topo: p.notas.topo,
    notas_coracao: p.notas.coracao,
    notas_fundo: p.notas.fundo,
    preco_2: p.precos[2],
    preco_5: p.precos[5],
    preco_10: p.precos[10],
    promo_ativo: p.promo.ativo,
    promo_desconto: p.promo.desconto,
    genero: p.genero || "compartilhado",
    destaque: !!p.destaque,
    custo_frasco: p.custoFrasco !== undefined ? Number(p.custoFrasco) : 0,
    volume_frasco_ml: p.volumeFrascoMl !== undefined ? Number(p.volumeFrascoMl) : 100,
    margem_lucro_pct: p.margemLucroPct !== undefined ? Number(p.margemLucroPct) : 100,
    ...(p.criadoEm ? { criado_em: p.criadoEm } : {}),
  };
}
