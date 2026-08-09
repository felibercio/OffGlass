import { getMensagemTemplate } from "@/lib/data";
import MensagensManager from "@/components/admin/MensagensManager";

export const revalidate = 0;

const DEFAULT_PEDIDO =
  "Olá! Meu nome é {{nome}}. Gostaria de fazer o seguinte pedido: {{itens}}. Forma de pagamento: {{pagamento}}. Total: {{total}}";
const DEFAULT_FRASCO = "Olá! Gostaria de mais informações sobre o frasco lacrado de {{nome_produto}}.";

export default async function MensagensPage() {
  const [pedido, frasco] = await Promise.all([
    getMensagemTemplate("pedido", DEFAULT_PEDIDO),
    getMensagemTemplate("frasco_lacrado", DEFAULT_FRASCO),
  ]);

  return <MensagensManager pedidoInicial={pedido} frascoInicial={frasco} />;
}
