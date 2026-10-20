import Admin from "@/components/admin";
import { adminIdentity, readCatalog } from "@/lib/server";
import { defaultSettings } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const identity = await adminIdentity();
  let cars: Awaited<ReturnType<typeof readCatalog>>["cars"] = [], settings = defaultSettings, storageError = false;
  try { const data = await readCatalog(identity.authorized); cars = data.cars; settings = data.settings; } catch { storageError = true; }
  return <Admin initialCars={cars} initialSettings={settings} authorized={identity.authorized} configured={identity.configured} signedIn={!!identity.user} storageError={storageError} />;
}
