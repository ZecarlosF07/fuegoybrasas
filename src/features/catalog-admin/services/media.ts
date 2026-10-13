import { z } from "zod";

import { IMAGE_FORMATS, MAX_IMAGE_BYTES } from "../constants";
import type { MediaJournal } from "../types/media";
import { imagePathSchema, uploadResponseSchema } from "../validation/schemas";
import { configFingerprint } from "@/features/business-config/services/journal";

export const MEDIA_JOURNAL_KEY = "fyb.catalog-media.v1";
export const mediaJournalSchema = z.strictObject({ actorUserId: z.uuid(), itemId: z.uuid(), uploadId: z.uuid(), imagePath: imagePathSchema, fingerprint: z.string().regex(/^[a-f0-9]{64}$/), cleanupId: z.uuid().optional() });
export function readMediaJournal(actorUserId: string) {
  const raw = sessionStorage.getItem(MEDIA_JOURNAL_KEY);
  if (!raw) return null;
  const parsed = mediaJournalSchema.safeParse(JSON.parse(raw));
  if (!parsed.success || parsed.data.actorUserId !== actorUserId) throw new Error("La referencia de fotografía no corresponde a esta sesión.");
  return parsed.data;
}
export function writeMediaJournal(value: MediaJournal) { sessionStorage.setItem(MEDIA_JOURNAL_KEY, JSON.stringify(value)); }
export function clearMediaJournal() { sessionStorage.removeItem(MEDIA_JOURNAL_KEY); }
export async function prepareImageJournal(file: File, actorUserId: string, itemId: string, current: MediaJournal | null) {
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("Usa una foto JPEG, PNG o WebP de hasta 3 MiB.");
  const format = file.type === IMAGE_FORMATS.jpeg.mime ? IMAGE_FORMATS.jpeg : file.type === IMAGE_FORMATS.png.mime ? IMAGE_FORMATS.png : file.type === IMAGE_FORMATS.webp.mime ? IMAGE_FORMATS.webp : null;
  if (!format) throw new Error("Usa una foto JPEG, PNG o WebP.");
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const fingerprint = await configFingerprint(Array.from(new Uint8Array(digest)));
  if (current) {
    if (current.itemId !== itemId || current.fingerprint !== fingerprint || current.cleanupId) throw new Error("Conserva la fotografía original y resuelve su referencia pendiente antes de subir otra.");
    return current;
  }
  const uploadId = crypto.randomUUID();
  return { actorUserId, itemId, uploadId, imagePath: `items/${itemId}/${uploadId}.${format.extension}`, fingerprint };
}
export async function mediaRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: "no-store", signal: AbortSignal.timeout(20000) });
  const body: unknown = await response.json();
  const failure = z.object({ ok: z.literal(false), error: z.object({ message: z.string() }) }).safeParse(body);
  if (failure.success) throw new Error(failure.data.error.message);
  if (!response.ok) throw new Error("No pudimos comprobar la operación de fotografías.");
  return body;
}
export async function uploadImage(file: File, reference: MediaJournal) {
  const form = new FormData(); form.set("file", file); form.set("itemId", reference.itemId); form.set("uploadId", reference.uploadId);
  const body = await mediaRequest("/api/admin/catalog/images", { method: "POST", body: form });
  return z.object({ ok: z.literal(true), data: uploadResponseSchema }).parse(body).data;
}
export async function checkImage(reference: MediaJournal) {
  const body = await mediaRequest(`/api/admin/catalog/images?imagePath=${encodeURIComponent(reference.imagePath)}`);
  return z.object({ ok: z.literal(true), data: z.object({ exists: z.boolean() }) }).parse(body).data.exists;
}
export async function removeImage(reference: MediaJournal) {
  const journal = { ...reference, cleanupId: reference.cleanupId ?? crypto.randomUUID() };
  writeMediaJournal(journal);
  const body = await mediaRequest("/api/admin/catalog/images", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagePath: journal.imagePath, operationId: journal.cleanupId }) });
  z.object({ ok: z.literal(true), data: z.object({ removed: z.literal(true) }) }).parse(body);
  clearMediaJournal();
}
