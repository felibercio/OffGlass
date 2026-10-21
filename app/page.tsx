import { getProducts, getCategories, getAccords, getMensagemTemplate, getSalesCounts } from "@/lib/data";
import CatalogApp from "@/components/catalog/CatalogApp";

// ISR: página em cache na CDN Edge da Vercel. Atualizada a cada 60s ou imediatamente
// quando qualquer alteração for feita no painel /admin (via revalidatePath).
export const revalidate = 60;

export default async function Home() {
  const [products, categories, accords, mensagemPedidoTemplate, salesCounts] = await Promise.all([
    getProducts(),
    getCategories(),
    getAccords(),
    getMensagemTemplate(
      "pedido",
      "Olá! Meu nome é {{nome}}. Gostaria de fazer o seguinte pedido: {{itens}}. Forma de pagamento: {{pagamento}}. Total: {{total}}"
    ),
    getSalesCounts(),
  ]);

  return (
    <CatalogApp
      products={products}
      categories={categories}
      accords={accords}
      mensagemPedidoTemplate={mensagemPedidoTemplate}
      salesCounts={salesCounts}
    />
  );
}
