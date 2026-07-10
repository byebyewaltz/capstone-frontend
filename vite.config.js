import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The client calls the API with relative paths (/auth, /orgs, /notifications),
// so the dev server proxies those to the backend. Adjust the port if your
// TaskForge API runs somewhere other than 3000.
const API = "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": API,
      "/orgs": API,
      "/notifications": API,
    },
  },
});
