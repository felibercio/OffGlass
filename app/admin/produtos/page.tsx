import Link from "next/link";
import { getProducts, getCategories } from "@/lib/data";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export const revalidate = 0;

export default async function AdminProdutosPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const categoryLabel = (key: string) => categories.find((c) => c.key === key)?.label || key;

  return (
    <div className="px-4 pb-32 pt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
          {products.length} produto(s) cadastrado(s)
        </p>
        <Link href="/admin/produtos/novo" className="btn-teal rounded-full px-4 py-2 text-xs font-medium">
          + Novo perfume
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--ink-soft)" }}>
          Nenhum produto ainda.
        </p>
      ) : (
        products.map((p) => (
          <div key={p.id} className="glass rounded-xl p-3 flex items-center justify-between mb-2">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] tracking-label uppercase" style={{ color: "var(--gold-deep)" }}>
                {p.marca} · {categoryLabel(p.categoria)}
              </p>
              <p className="text-sm font-medium truncate">
                {p.nome}
                {p.promo?.ativo && (
                  <span className="badge-promo text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                    -{p.promo.desconto}%
                  </span>
                )}
              </p>
              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                2ml R$ {p.precos[2]} · 5ml R$ {p.precos[5]} · 10ml R$ {p.precos[10]}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/admin/produtos/${p.id}`} className="btn-glass rounded-full px-3 py-1.5 text-xs">
                Editar
              </Link>
              <DeleteProductButton id={p.id} nome={p.nome} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
