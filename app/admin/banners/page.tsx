import { getBannersConfig } from "@/lib/data";
import BannersManager from "@/components/admin/BannersManager";

export const revalidate = 0;

export default async function BannersAdminPage() {
  const bannersConfig = await getBannersConfig();

  return <BannersManager initialConfig={bannersConfig} />;
}
