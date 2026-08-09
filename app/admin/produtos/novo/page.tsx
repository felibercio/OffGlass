import { getCategories, getAccords, getProducts } from "@/lib/data";
import ProductForm from "@/components/admin/ProductForm";

export const revalidate = 0;

export default async function NovoProdutoPage() {
  const [categories, accords, products] = await Promise.all([getCategories(), getAccords(), getProducts()]);
  const brands = [...new Set(products.map((p) => p.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return <ProductForm categories={categories} accords={accords} brands={brands} />;
}
