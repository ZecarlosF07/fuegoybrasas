"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormFeedback } from "@/components/ui/form-feedback";
import type { OperationError } from "@/contracts/types/result";
import { clearMediaJournal, checkImage, prepareImageJournal, readMediaJournal, removeImage, uploadImage, writeMediaJournal } from "@/features/catalog-admin/services/media";
import type { ImageEditorProps } from "@/features/catalog-admin/types/catalog-admin";
import type { MediaJournal } from "@/features/catalog-admin/types/media";
import { getPublicEnvironment } from "@/lib/env/public";

export function ImageEditor({ itemId, actorUserId, currentPath, disabled, onAssociate, onBusyChange }: ImageEditorProps) {
  const [reference, setReference] = useState<MediaJournal | null>(null);
  const [exists, setExists] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<OperationError | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const approved = useRef<HTMLInputElement>(null);
  const running = useRef(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = readMediaJournal(actorUserId);
        if (stored?.imagePath === currentPath) { clearMediaJournal(); setReference(null); }
        else setReference(stored);
        setReady(true);
      } catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos leer la referencia de fotografía. Habilita el almacenamiento local." }); }
    });
    return () => { active = false; };
  }, [actorUserId, currentPath]);
  async function run(label: string, action: () => Promise<void>) {
    if (disabled || running.current || !ready) return;
    running.current = true; onBusyChange(true); setPending(label); setError(null); setMessage(null);
    try { await action(); }
    catch (failure) { setError({ code: "OPERATION_UNCERTAIN", message: failure instanceof Error ? failure.message : "No pudimos comprobar la operación. Conserva la referencia." }); }
    finally { running.current = false; onBusyChange(false); setPending(null); }
  }
  async function upload() {
    await run("upload", async () => {
      const file = fileInput.current?.files?.[0];
      if (!file || !approved.current?.checked) throw new Error("Selecciona una foto y confirma que es del producto y está autorizada.");
      const journal = await prepareImageJournal(file, actorUserId, itemId, reference);
      writeMediaJournal(journal); setReference(journal);
      await uploadImage(file, journal); setExists(true); setMessage("Foto subida. Todavía debes asociarla al producto.");
    });
  }
  async function check() {
    if (!reference) return;
    await run("check", async () => { const found = await checkImage(reference); setExists(found); setMessage(found ? "La foto está subida. Revisa su asociación antes de continuar." : "La foto aún no existe en Storage. Reintenta con el mismo archivo y referencia."); });
  }
  async function remove() {
    if (!reference) return;
    await run("remove", async () => { await removeImage(reference); setReference(null); setExists(false); setMessage("Foto sin asociación eliminada."); });
  }
  async function associate() {
    if (!reference || reference.itemId !== itemId) return;
    await run("associate", () => onAssociate(reference.imagePath));
  }
  const isBusy = disabled || Boolean(pending) || !ready;
  const previewPath = reference?.itemId === itemId && exists ? reference.imagePath : currentPath;
  const imageUrl = previewPath ? `${getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalog-media/${previewPath}` : null;
  return <section className="space-y-4 border-t border-brand-border pt-6" aria-label="Fotografía del producto">
    <h3 className="text-xl font-bold">Fotografía</h3><p className="text-brand-muted">JPEG, PNG o WebP, hasta 3 MiB y 4096 × 4096 píxeles. Subir una foto y asociarla son pasos separados.</p>
    <FormFeedback error={error} message={message} />
    {imageUrl && <Image src={imageUrl} alt="Fotografía del producto en revisión" width={640} height={480} className="aspect-4/3 h-auto w-full rounded-card object-contain" />}
    <label htmlFor="product-photo" className="block font-semibold">Seleccionar fotografía</label><input ref={fileInput} id="product-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={isBusy} className="min-h-12 w-full rounded-field border border-brand-control-border p-3 text-base focus-visible:outline-2 focus-visible:outline-brand-action" />
    <CheckboxField ref={approved} id="photo-approved" label="La fotografía corresponde al producto y su uso está autorizado" disabled={isBusy} />
    <Button onClick={upload} disabled={isBusy || Boolean(reference?.cleanupId)} aria-busy={pending === "upload"}>{pending === "upload" ? "Subiendo fotografía…" : reference ? "Reintentar la misma subida" : "Subir fotografía"}</Button>
    {reference && <div className="space-y-4 rounded-field border border-brand-control-border p-4"><p className="break-all">Referencia pendiente: {reference.imagePath}</p>
      {reference.itemId !== itemId && <p>Esta referencia pertenece a otro producto. Comprueba su estado o completa su limpieza antes de subir otra.</p>}
      <div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={check} disabled={isBusy} aria-busy={pending === "check"}>{pending === "check" ? "Comprobando subida…" : "Comprobar subida"}</Button>
        <Button onClick={associate} disabled={isBusy || !exists || reference.itemId !== itemId || Boolean(reference.cleanupId)} aria-busy={pending === "associate"}>{pending === "associate" ? "Asociando fotografía…" : "Asociar foto al producto"}</Button>
        <Button variant="secondary" onClick={remove} disabled={isBusy} aria-busy={pending === "remove"}>{pending === "remove" ? "Eliminando foto sin asociación…" : "Eliminar foto subida sin asociar"}</Button></div>
    </div>}
    {currentPath && <Button variant="secondary" disabled={isBusy || Boolean(reference)} onClick={() => run("detach", () => onAssociate(null))} aria-busy={pending === "detach"}>{pending === "detach" ? "Quitando asociación…" : "Quitar foto del producto"}</Button>}
  </section>;
}
