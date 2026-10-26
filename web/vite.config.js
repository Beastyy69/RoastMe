// Vite (dev server + build tool) ki settings.
// react() = JSX support, tailwindcss() = Tailwind CSS v4.
import { defineConfig } from "vite"; // config banane ka helper (autocomplete ke liye)
import react from "@vitejs/plugin-react"; // React/JSX plugin
import tailwindcss from "@tailwindcss/vite"; // Tailwind plugin

export default defineConfig({ // config export
  plugins: [react(), tailwindcss()], // dono plugins chalu
}); // config band
