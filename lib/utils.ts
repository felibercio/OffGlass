import { Product, SizeMl } from "@/types";

export function formatBRL(v: number): string {
  const num = typeof v === "number" && !isNaN(v) ? v : 0;
  const parts = num.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${intPart},${parts[1]}`;
}

export function precoComPromo(produto: Product, size: SizeMl): number {
  const base = produto.precos[size] ?? 0;
  if (produto.promo?.ativo && produto.promo.desconto > 0) {
    // Mantém precisão de 2 casas decimais (centavos reais)
    return Math.round(base * (1 - produto.promo.desconto / 100) * 100) / 100;
  }
  return base;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    template
  );
}

export function whatsappUrl(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

const SUPABASE_STORAGE_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
  : null;

/**
 * next/image só otimiza hosts liberados em remotePatterns (next.config.ts).
 * Produtos antigos podem ter URLs coladas manualmente de qualquer domínio;
 * para essas, caímos num <img> normal em vez de quebrar a página.
 */
export function isOptimizableImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  return !!SUPABASE_STORAGE_PREFIX && url.startsWith(SUPABASE_STORAGE_PREFIX);
}
