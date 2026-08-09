import { getCategories, getProducts } from "@/lib/data";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const revalidate = 0;

export default async function CategoriasPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const counts = Object.fromEntries(categories.map((c) => [c.key, products.filter((p) => p.categoria === c.key).length]));
  return <CategoriesManager categories={categories} counts={counts} />;
}
