import { createClient } from "@/lib/supabase/server";
import { PedidoRow } from "@/types";
import SalesDashboard from "@/components/admin/SalesDashboard";

export const revalidate = 0;

export default async function AdminRootPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao carregar pedidos para o painel de vendas:", error.message);
  }

  const pedidos = (data as PedidoRow[]) || [];

  return <SalesDashboard initialPedidos={pedidos} />;
}
