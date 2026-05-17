import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  base: '/tectonix/',
  server: {
    host: '0.0.0.0', // Exposes server to local network (Wi-Fi)
    port: 3000,      // Port number
    https: false,    // Disables HTTPS (HTTP strictly)
    proxy: {
      // PROXY CONFIGURATION:
      '/api': {
        target: 'http://localhost:5000', // Your Backend URL
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      }
    },
  },
  
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});