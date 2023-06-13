import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const env = loadEnv("", process.cwd(), "");
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    sentryVitePlugin({
      org: "niveth-personal",
      project: "javascript-react",
      authToken: env.SENTRY_AUTH_TOKEN,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
