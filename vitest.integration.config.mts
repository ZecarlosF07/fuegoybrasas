import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const localEnvironment = loadEnv("development", process.cwd(), ["NEXT_PUBLIC_SUPABASE_", "SUPABASE_SECRET_KEY", "SUPABASE_LOCAL_DB_URL", "STAFF_AUTH_FLOW_SECRET"]);
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Vitest no aplica la condición del paquete externo. Resolver su entrada real
    // de servidor; el rechazo desde cliente se comprueba además con Next build.
    alias: { "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    env: localEnvironment,
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
