import { env } from "cloudflare:workers";
import { HttpError, jsonError, requireAdmin } from "@/lib/server";
import { boundedBytes } from "@/lib/http";
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    if (!env.BUCKET) throw new HttpError(503, "Penyimpanan foto belum tersedia.");
    if (Number(request.headers.get("content-length") || 0) > 11000000) throw new HttpError(413, "Foto maksimal 10 MB.");
    const bytes = await boundedBytes(request, 10000000);
    if (!bytes.length || bytes.length > 10000000) throw new HttpError(413, "Foto maksimal 10 MB.");
    let ext = ""; let type = "";
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) { ext = "jpg"; type = "image/jpeg"; }
    else if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) { ext = "png"; type = "image/png"; }
    else if (new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP") { ext = "webp"; type = "image/webp"; }
    if (!ext) throw new HttpError(400, "Gunakan foto JPG, PNG, atau WebP.");
    const key = `${crypto.randomUUID()}.${ext}`;
    await env.BUCKET.put(`photos/${key}`, bytes, { httpMetadata: { contentType: type } });
    return Response.json({ url: `/api/photos/${key}` });
  } catch (e) { return jsonError(e); }
}
