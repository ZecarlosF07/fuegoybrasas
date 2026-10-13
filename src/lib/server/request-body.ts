import "server-only";

export class BodyError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function receiveChunks(reader: ReadableStreamDefaultReader<Uint8Array>, maximum: number) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  let next = await reader.read();
  while (!next.done) {
    size += next.value.byteLength;
    if (size > maximum) { await reader.cancel(); throw new BodyError(413, "La solicitud excede el tamaño permitido."); }
    chunks.push(next.value);
    next = await reader.read();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}
export async function readBoundedBody(request: Request, maximum: number, timeoutMs = 15000) {
  if (Number(request.headers.get("content-length")) > maximum) throw new BodyError(413, "La solicitud excede el tamaño permitido.");
  if (!request.body) throw new BodyError(400, "La solicitud está vacía.");
  const reader = request.body.getReader();
  let expired = false;
  const timer = setTimeout(() => { expired = true; void reader.cancel("Tiempo agotado"); }, timeoutMs);
  try {
    const bytes = await receiveChunks(reader, maximum);
    if (expired) throw new BodyError(408, "La solicitud tardó demasiado. Intenta nuevamente.");
    return bytes;
  } finally { clearTimeout(timer); reader.releaseLock(); }
}
