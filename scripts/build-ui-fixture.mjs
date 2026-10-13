import react from "@vitejs/plugin-react";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

await build({
  configFile: false,
  plugins: [react()],
  logLevel: "warn",
  build: {
    ssr: "tests/fixtures/primitives.tsx",
    outDir: ".test-fixtures/ui",
    rolldownOptions: { output: { entryFileNames: "primitives.mjs" } },
  },
});
const { markup } = await import(pathToFileURL(resolve(".test-fixtures/ui/primitives.mjs")).href);
writeFileSync(".test-fixtures/ui/primitives.html", markup, "utf8");
