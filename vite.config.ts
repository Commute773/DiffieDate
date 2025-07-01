import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    watch: {
      ignored: ["**/*.json"],
    },
    allowedHosts: ["woman-improve-watch-site.trycloudflare.com"],
  },
  test: {
    setupFiles: ["./setup-tests.ts"],
    globals: true,
    environment: "jsdom",
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
