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

/**
 * Converte valor numérico para exibição com máscara brasileira (ex: 550 -> "550,00")
 */
export function formatBRLValue(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return "";
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Aplica máscara monetária ao digitar números (ex: "55000" -> "550,00", "125050" -> "1.250,50")
 */
export function maskBRLDigits(rawText: string): { formatted: string; numericValue: number } {
  const digits = rawText.replace(/\D/g, "");
  if (!digits) return { formatted: "", numericValue: 0 };
  const num = parseInt(digits, 10) / 100;
  const formatted = num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return { formatted, numericValue: num };
}

/**
 * Converte texto com ponto e vírgula brasileiro (ex: "1.250,50") para número float (1250.50)
 */
export function parseBRLValue(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/\./g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Formata percentual permitindo vírgula ou ponto (ex: "120,5")
 */
export function maskPercentInput(rawText: string): { formatted: string; numericValue: number } {
  let cleaned = rawText.replace(/[^0-9,\.]/g, "").replace(/\./g, ",");
  const parts = cleaned.split(",");
  if (parts.length > 2) {
    cleaned = parts[0] + "," + parts.slice(1).join("");
  }
  const numericVal = parseFloat(cleaned.replace(",", "."));
  return {
    formatted: cleaned,
    numericValue: isNaN(numericVal) ? 0 : numericVal,
  };
}

