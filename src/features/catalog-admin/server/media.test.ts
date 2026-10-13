// @vitest-environment node
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import { MAX_IMAGE_BYTES, MAX_REQUEST_BYTES } from "../constants";
import { decodeCatalogImage, readLimitedBody } from "./media";

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

describe("Fotografías: contenido decodificado y límites reales", () => {
  it("decodifica y vuelve a codificar PNG, JPEG y WebP", async () => {
    for (const format of ["png", "jpeg", "webp"] as const) {
      const bytes = await sharp({ create: { width: 80, height: 60, channels: 3, background: "white" } }).toFormat(format).toBuffer();
      const result = await decodeCatalogImage(new File([new Uint8Array(bytes)], `photo.${format}`, { type: `image/${format}` }));
      expect((await sharp(result.bytes).metadata()).format).toBe(format);
      expect(result.bytes.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    }
  });
  it("rechaza MIME falso, texto, SVG, archivo vacío y archivo mayor de 3 MiB", async () => {
    const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
    await expect(decodeCatalogImage(new File([new Uint8Array(png)], "fake.jpg", { type: "image/jpeg" }))).rejects.toThrow("tipo declarado");
    for (const bytes of ["texto", "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'></svg>", ""]) await expect(decodeCatalogImage(new File([bytes], "fake.png", { type: "image/png" }))).rejects.toThrow();
    await expect(decodeCatalogImage(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", { type: "image/png" }))).rejects.toMatchObject({ status: 413 });
  });
  it("rechaza imágenes grandes y archivos truncados aun con cabecera reconocible", async () => {
    const wide = await sharp({ create: { width: 4097, height: 1, channels: 3, background: "white" } }).png().toBuffer();
    await expect(decodeCatalogImage(new File([new Uint8Array(wide)], "wide.png", { type: "image/png" }))).rejects.toThrow("4096");
    const jpeg = await sharp({ create: { width: 300, height: 300, channels: 3, background: "white" } }).jpeg().toBuffer();
    await expect(decodeCatalogImage(new File([new Uint8Array(jpeg.subarray(0, 200))], "broken.jpg", { type: "image/jpeg" }))).rejects.toThrow();
  });
  it("cuenta el cuerpo sin Content-Length y cancela el stream al pasar 4 MiB", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES)); controller.enqueue(new Uint8Array(1)); }, cancel });
    const init = { method: "POST", body: stream, duplex: "half" };
    const request = new Request("http://localhost/upload", init);
    await expect(readLimitedBody(request)).rejects.toMatchObject({ status: 413 });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("comprueba el stream aunque Content-Length mienta", async () => {
    const request = new Request("http://localhost/upload", { method: "POST", body: new Uint8Array(MAX_REQUEST_BYTES + 1), headers: { "Content-Length": "1" } });
    await expect(readLimitedBody(request)).rejects.toMatchObject({ status: 413 });
    const small = new Request("http://localhost/upload", { method: "POST", body: "hola" });
    expect(new TextDecoder().decode(await readLimitedBody(small))).toBe("hola");
  });
});
