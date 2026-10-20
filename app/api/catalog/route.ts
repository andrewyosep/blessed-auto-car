import { carSchema, settingsSchema } from "@/lib/validation";
import { database, HttpError, jsonError, readCatalog, requireAdmin } from "@/lib/server";
import { boundedBytes } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() { try { return Response.json(await readCatalog(), { headers: { "Cache-Control": "no-store" } }); } catch (e) { return jsonError(e); } }
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    if (Number(request.headers.get("content-length") || 0) > 150000) throw new HttpError(413, "Data terlalu besar.");
    const text = new TextDecoder().decode(await boundedBytes(request,150000));
    let body; try { body = JSON.parse(text); } catch { throw new HttpError(400, "Data tidak valid."); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Data tidak valid.");
    const db = database();
    if (body.action === "save-car") {
      const result = carSchema.safeParse(body.car); if (!result.success) throw new HttpError(400, result.error.issues[0].message);
      const car = result.data;
      await db.prepare("INSERT INTO vehicles (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").bind(car.id, JSON.stringify(car), Date.now()).run();
      return Response.json({ car });
    }
    if (body.action === "delete-car") {
      if (typeof body.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(body.id)) throw new HttpError(400, "ID mobil tidak valid.");
      await db.prepare("DELETE FROM vehicles WHERE id = ?").bind(body.id).run(); return Response.json({ success: true });
    }
    if (body.action === "save-settings") {
      const result = settingsSchema.safeParse(body.settings); if (!result.success) throw new HttpError(400, result.error.issues[0].message);
      await db.prepare("INSERT INTO showroom (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data").bind("settings", JSON.stringify(result.data)).run();
      return Response.json({ settings: result.data });
    }
    throw new HttpError(400, "Tindakan tidak dikenal.");
  } catch (e) { return jsonError(e); }
}
