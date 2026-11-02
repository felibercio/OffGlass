import { getBannersConfig } from "@/lib/data";
import BannersManager from "@/components/admin/BannersManager";

export const revalidate = 0;

export default async function BannersAdminPage() {
  const { bannerDesktop, bannerMobile } = await getBannersConfig();

  return (
    <BannersManager
      initialBannerDesktop={bannerDesktop}
      initialBannerMobile={bannerMobile}
    />
  );
}

