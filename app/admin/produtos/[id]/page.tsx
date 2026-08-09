import { notFound } from "next/navigation";
import { getCategories, getAccords, getProducts } from "@/lib/data";
import ProductForm from "@/components/admin/ProductForm";

export const revalidate = 0;

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, accords, products] = await Promise.all([getCategories(), getAccords(), getProducts()]);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const brands = [...new Set(products.map((p) => p.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return <ProductForm product={product} categories={categories} accords={accords} brands={brands} />;
}
