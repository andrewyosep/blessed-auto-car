import { env } from "cloudflare:workers";
export async function GET(_request: Request, context: {params: Promise<{key: string}>}) {
  const {key} = await context.params;
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(key) || !env.BUCKET) return new Response("Tidak ditemukan", {status: 404});
  const photo = await env.BUCKET.get(`photos/${key}`);
  if (!photo) return new Response("Tidak ditemukan", {status: 404});
  return new Response(photo.body, {headers: {"Content-Type": photo.httpMetadata?.contentType || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff"}});
}
