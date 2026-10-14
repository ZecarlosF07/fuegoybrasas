import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import "server-only";

import { IMAGE_FORMATS, MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, MAX_REQUEST_BYTES, MEDIA_BUCKET } from "../constants";
import { cleanupSchema, imagePathSchema, imageUploadSchema } from "../validation/schemas";
import { staffAccessSchema } from "@/features/staff/validation/schemas";
import { getPublicEnvironment } from "@/lib/env/public";
import { getSecretKey } from "@/lib/env/server";
import { BodyError, readBoundedBody } from "@/lib/server/request-body";
import { hasExpectedOrigin } from "@/lib/server/request-origin";
import { STATELESS_AUTH_OPTIONS } from "@/lib/supabase/constants";
import { fetchWithoutCache } from "@/lib/supabase/fetch";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class MediaError extends Error {
  constructor(public status: number, message: string, public code = "VALIDATION_ERROR") { super(message); }
}
export async function readLimitedBody(request: Request) {
  try { return await readBoundedBody(request, MAX_REQUEST_BYTES); }
  catch (error) { if (error instanceof BodyError) throw new MediaError(error.status, error.message); throw error; }
}
export async function decodeCatalogImage(file: File) {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) throw new MediaError(413, "La fotografía debe pesar como máximo 3 MiB.");
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning" });
    const meta = await image.metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new MediaError(400, "Usa una imagen JPEG, PNG o WebP real.");
    const format = meta.format === "jpeg" ? "jpeg" : meta.format === "png" ? "png" : "webp";
    if (file.type !== IMAGE_FORMATS[format].mime) throw new MediaError(400, "El formato real no coincide con el tipo declarado.");
    if (!meta.width || !meta.height || meta.width > MAX_IMAGE_DIMENSION || meta.height > MAX_IMAGE_DIMENSION || (meta.pages ?? 1) > 1) throw new MediaError(400, "Usa una imagen estática de hasta 4096 × 4096 píxeles.");
    // Decodifica píxeles y vuelve a codificar: no basta leer la cabecera. Quita EXIF.
    const bytes = await image.rotate().toFormat(format).toBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) throw new MediaError(413, "La imagen procesada supera 3 MiB. Reduce su tamaño.");
    return { bytes, ...IMAGE_FORMATS[format] };
  } catch (error) {
    if (error instanceof MediaError) throw error;
    throw new MediaError(400, "La fotografía está dañada o supera las dimensiones permitidas.");
  }
}
async function authorizeMediaRequest(request: Request) {
  if (request.method !== "GET" && !hasExpectedOrigin(request)) throw new MediaError(403, "La solicitud debe iniciarse desde este sitio.", "FORBIDDEN");
  const client = await createServerSupabaseClient("action");
  const identity = await client.auth.getUser();
  if (identity.error || !identity.data.user) throw new MediaError(401, "Inicia sesión para continuar.", "AUTH_REQUIRED");
  const response = await client.rpc("get_staff_access");
  const access = staffAccessSchema.safeParse(response.data);
  if (!access.success || access.data.role !== "manager") throw new MediaError(403, "Solo el responsable puede gestionar fotografías.", "FORBIDDEN");
  return client;
}
export async function uploadCatalogMedia(request: Request) {
  const client = await authorizeMediaRequest(request);
  const body = await readLimitedBody(request);
  let form: FormData;
  try { form = await new Response(body, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData(); }
  catch { throw new MediaError(400, "No pudimos leer la fotografía."); }
  const input = imageUploadSchema.safeParse({ itemId: form.get("itemId"), uploadId: form.get("uploadId") });
  const file = form.get("file");
  if (!input.success || !(file instanceof File) || [...form.keys()].some((key) => !["itemId", "uploadId", "file"].includes(key)) || form.getAll("file").length !== 1) throw new MediaError(400, "Revisa el producto y la fotografía.");
  const image = await decodeCatalogImage(file);
  const path = `items/${input.data.itemId}/${input.data.uploadId}.${image.extension}`;
  const allowed = await client.rpc("catalog_media_upload_allowed", { p_path: path });
  if (allowed.error || allowed.data !== true) throw new MediaError(409, "El producto ya no admite esta fotografía. Revisa su estado.", "CONFLICT");
  const result = await client.storage.from(MEDIA_BUCKET).upload(path, image.bytes, { contentType: image.mime, upsert: false, cacheControl: "31536000" });
  if (result.error) throw new MediaError(503, "No pudimos comprobar la subida. Conserva su referencia y consulta antes de repetir.", "OPERATION_UNCERTAIN");
  return { imagePath: path };
}
export async function cleanupCatalogMedia(request: Request) {
  const client = await authorizeMediaRequest(request);
  const body = await readLimitedBody(request);
  let input: unknown;
  try { input = JSON.parse(new TextDecoder().decode(body)); } catch { throw new MediaError(400, "Revisa la referencia de la foto."); }
  const parsed = cleanupSchema.safeParse(input);
  if (!parsed.success) throw new MediaError(400, "Revisa la referencia de la foto.");
  const reserved = await client.rpc("prepare_catalog_image_cleanup", { p_image_path: parsed.data.imagePath, p_operation_id: parsed.data.operationId });
  if (reserved.error) throw new MediaError(reserved.error.message === "CONFLICT" ? 409 : 503, "La foto puede estar asociada o su estado no pudo comprobarse. Se conserva el archivo.", reserved.error.message === "CONFLICT" ? "CONFLICT" : "OPERATION_UNCERTAIN");
  // Privilegio aislado: solo después de autorización y reserva SQL sin referencias.
  const admin = createClient(getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL, getSecretKey(), { auth: STATELESS_AUTH_OPTIONS, global: { fetch: fetchWithoutCache } });
  const result = await admin.storage.from(MEDIA_BUCKET).remove([parsed.data.imagePath]);
  if (result.error) throw new MediaError(503, "La limpieza quedó pendiente. Reintenta con la misma referencia.", "OPERATION_UNCERTAIN");
  return { removed: true };
}
export async function checkCatalogMedia(request: Request) {
  const client = await authorizeMediaRequest(request);
  const path = imagePathSchema.safeParse(new URL(request.url).searchParams.get("imagePath"));
  if (!path.success) throw new MediaError(400, "Revisa la referencia de la foto.");
  const result = await client.rpc("get_catalog_image_upload", { p_image_path: path.data });
  if (result.error || typeof result.data !== "boolean") throw new MediaError(503, "No pudimos comprobar la subida.", "SERVICE_UNAVAILABLE");
  return { exists: result.data };
}
export async function mediaResponse(request: Request, removing = false) {
  const requestId = randomUUID();
  try { return Response.json({ ok: true, data: await (request.method === "GET" ? checkCatalogMedia(request) : removing ? cleanupCatalogMedia(request) : uploadCatalogMedia(request)), requestId }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    const known = error instanceof MediaError;
    return Response.json({ ok: false, error: { code: known ? error.code : "SERVICE_UNAVAILABLE", message: known ? error.message : "No pudimos completar la gestión de fotografías." }, requestId }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } });
  }
}
