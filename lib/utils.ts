import { Product, SizeMl } from "@/types";

export function formatBRL(v: number): string {
  return "R$ " + v.toFixed(0);
}

export function precoComPromo(produto: Product, size: SizeMl): number {
  const base = produto.precos[size];
  if (produto.promo?.ativo && produto.promo.desconto > 0) {
    return Math.round(base * (1 - produto.promo.desconto / 100));
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
