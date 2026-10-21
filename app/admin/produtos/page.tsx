import Link from "next/link";
import Image from "next/image";
import { getProducts, getCategories } from "@/lib/data";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { formatBRL, isOptimizableImageUrl } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminProdutosPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const categoryLabel = (key: string) => categories.find((c) => c.key === key)?.label || key;

  return (
    <div className="px-4 pb-32 pt-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl">Catálogo de Perfumes</h2>
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {products.length} produto(s) cadastrado(s)
          </p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-teal rounded-full px-4 py-2 text-xs font-medium">
          + Novo perfume
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--ink-soft)" }}>
          Nenhum produto cadastrado ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const cover = p.imagens?.[0] || p.imagem;
            const photoCount = p.imagens?.length || (p.imagem ? 1 : 0);

            return (
              <div key={p.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-black/10 flex items-center justify-center">
                    {cover ? (
                      isOptimizableImageUrl(cover) ? (
                        <Image src={cover} alt={p.nome} fill sizes="48px" className="object-contain" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={p.nome} className="w-full h-full object-contain" />
                      )
                    ) : (
                      <span className="text-[10px] text-stone-400">Sem foto</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] tracking-label uppercase font-medium" style={{ color: "var(--gold-deep)" }}>
                        {p.marca} · {categoryLabel(p.categoria)}
                      </p>
                      {p.genero && (
                        <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full font-medium">
                          {p.genero === "masculino" ? "Masculino" : p.genero === "feminino" ? "Feminino" : "Compartilhado"}
                        </span>
                      )}
                      {p.destaque && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                          Destaque
                        </span>
                      )}
                      {photoCount > 1 && (
                        <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                          </svg>
                          <span>{photoCount} fotos</span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold truncate text-stone-900">
                      {p.nome}
                      {p.promo?.ativo && (
                        <span className="badge-promo text-[9px] px-1.5 py-0.5 rounded-full ml-1.5">
                          -{p.promo.desconto}%
                        </span>
                      )}
                    </p>

                    <p className="text-xs text-stone-600 mt-0.5">
                      2ml <span className="font-medium text-stone-800">{formatBRL(p.precos[2])}</span> · 
                      5ml <span className="font-medium text-stone-800">{formatBRL(p.precos[5])}</span> · 
                      10ml <span className="font-medium text-stone-800">{formatBRL(p.precos[10])}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Link href={`/admin/produtos/${p.id}`} className="btn-glass rounded-full px-3 py-1.5 text-xs font-medium">
                    Editar
                  </Link>
                  <DeleteProductButton id={p.id} nome={p.nome} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
