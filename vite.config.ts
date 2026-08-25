import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/inventario-simple/", // debe coincidir EXACTAMENTE con el nombre del repo, mayúsculas incluidas
  plugins: [vue(), tailwindcss()],
});