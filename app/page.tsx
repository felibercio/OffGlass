import { getProducts, getCategories, getAccords, getMensagemTemplate } from "@/lib/data";
import CatalogApp from "@/components/catalog/CatalogApp";

export const revalidate = 0; // sempre buscar dados atuais do Supabase

export default async function Home() {
  const [products, categories, accords, mensagemPedidoTemplate] = await Promise.all([
    getProducts(),
    getCategories(),
    getAccords(),
    getMensagemTemplate(
      "pedido",
      "Olá! Meu nome é {{nome}}. Gostaria de fazer o seguinte pedido: {{itens}}. Forma de pagamento: {{pagamento}}. Total: {{total}}"
    ),
  ]);

  return (
    <CatalogApp
      products={products}
      categories={categories}
      accords={accords}
      mensagemPedidoTemplate={mensagemPedidoTemplate}
    />
  );
}
