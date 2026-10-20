export class HttpError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export async function boundedBytes(request: Request, limit: number) {
  if (Number(request.headers.get("content-length") || 0) > limit) throw new HttpError(413, "Data melebihi batas ukuran.");
  const reader = request.body?.getReader(); if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = []; let length = 0;
  try { while (true) { const {done,value} = await reader.read(); if (done) break; length += value.byteLength; if (length > limit) { await reader.cancel(); throw new HttpError(413, "Data melebihi batas ukuran."); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  const result = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { result.set(chunk,offset); offset += chunk.byteLength; }
  return result;
}
export function emailAllowed(email: string | null | undefined, configuredEmails: string | undefined) {
  if (!email) return false;
  return (configuredEmails || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());
}
