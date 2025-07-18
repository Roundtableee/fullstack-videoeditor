// vite.config.ts
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // ใช้ relative path ช่วยให้เปิดบน Vercel ได้ทุกกรณี :contentReference[oaicite:5]{index=5}
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // server ไม่ต้องตั้ง proxy ใน production – เอาไว้เฉพาะ dev
  server: {
    host: '0.0.0.0', // หรือใช้ true เพื่อ expose ให้ network อื่นเข้าถึงได้
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/upload": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
      "/outputs": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
      "/audio": {
        target: "https://cdn.designcombo.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
