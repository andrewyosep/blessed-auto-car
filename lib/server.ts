import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { defaultSettings, type Car, type Settings } from "./catalog";
import { HttpError, emailAllowed } from "./http";
export { HttpError } from "./http";
export function database() { if (!env.DB) throw new HttpError(503, "Penyimpanan belum tersedia. Coba lagi setelah konfigurasi selesai."); return env.DB; }
export async function adminIdentity() {
  const user = await getChatGPTUser();
  const allowed = (env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  return { user, configured: allowed.length > 0, authorized: emailAllowed(user?.email, env.ADMIN_EMAILS) };
}
export async function requireAdmin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new HttpError(403, "Permintaan harus berasal dari website ini.");
  const identity = await adminIdentity();
  if (!identity.user) throw new HttpError(401, "Masuk terlebih dahulu.");
  if (!identity.configured) throw new HttpError(503, "Email admin belum diatur. Pengelolaan data belum diaktifkan.");
  if (!identity.authorized) throw new HttpError(403, "Akun ini tidak memiliki akses admin.");
  return identity.user;
}
export async function readCatalog(includeDrafts = false) {
  if (includeDrafts && !(await adminIdentity()).authorized) throw new HttpError(403, "Akun ini tidak memiliki akses admin.");
  const db = database();
  const [cars, settings] = await Promise.all([
    db.prepare("SELECT data FROM vehicles ORDER BY updated_at DESC").all<{data: string}>(),
    db.prepare("SELECT data FROM showroom WHERE id = ?").bind("settings").first<{data: string}>(),
  ]);
  return { cars: cars.results.map(row => JSON.parse(row.data) as Car).filter(car => includeDrafts || car.published !== false), settings: settings ? { ...defaultSettings, ...JSON.parse(settings.data) } as Settings : defaultSettings };
}
export function jsonError(error: unknown) {
  const known = error instanceof HttpError;
  if (!known) console.error("Showroom request failed", error);
  return Response.json({ error: known ? error.message : "Permintaan gagal. Silakan coba lagi." }, { status: known ? error.status : 500 });
}
