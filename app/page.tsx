import Showroom from "@/components/showroom";
import { defaultSettings } from "@/lib/catalog";
import { readCatalog } from "@/lib/server";
export const dynamic = "force-dynamic";
export default async function Home() {
  try { const data = await readCatalog(); return <Showroom {...data} />; }
  catch { return <Showroom cars={[]} settings={defaultSettings} storageError />; }
}
