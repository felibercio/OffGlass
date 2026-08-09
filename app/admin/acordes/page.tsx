import { getAccords } from "@/lib/data";
import AccordsManager from "@/components/admin/AccordsManager";

export const revalidate = 0;

export default async function AcordesPage() {
  const accords = await getAccords();
  return <AccordsManager accords={accords} />;
}
