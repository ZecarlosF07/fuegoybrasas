import { describe, expect, it } from "vitest";

import { readBoundedBody } from "./request-body";

describe("recepción acotada de cuerpos HTTP", () => {
  it("limita bytes reales incluso sin Content-Length y con una cabecera falsa", async () => {
    const body = new Uint8Array(32769);
    await expect(readBoundedBody(new Request("http://localhost/api", { method: "POST", body }), 32768)).rejects.toMatchObject({ status: 413 });
    await expect(readBoundedBody(new Request("http://localhost/api", { method: "POST", body, headers: { "Content-Length": "10" } }), 32768)).rejects.toMatchObject({ status: 413 });
  });
  it("cancelar un cuerpo lento es un error explícito, sin aceptar JSON parcial", async () => {
    const init = { method: "POST", body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("{}")); } }), duplex: "half" };
    const request = new Request("http://localhost/api", init);
    await expect(readBoundedBody(request, 32768, 5)).rejects.toMatchObject({ status: 408 });
  });
});
