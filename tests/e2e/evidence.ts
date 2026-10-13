import { join } from "node:path";

export function evidenceDirectory(relativePath: string) {
  // H8 conserva capturas de los hitos anteriores; ejecución independiente conserva su ruta histórica.
  return process.env.E2E_EVIDENCE_ROOT ? join(process.env.E2E_EVIDENCE_ROOT, relativePath) : join("docs/implementacion/evidencia", relativePath);
}
