import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from "path";

export default defineConfig({
  server: {
    host: '0.0.0.0', // Exposes server to local network (Wi-Fi)
    port: 8080,      // Port number
    https: true,     // Enables HTTPS
    proxy: {
      // PROXY CONFIGURATION:
      '/api': {
        target: 'http://localhost:5000', // Your Backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  plugins: [
    react(),
    basicSsl(), // Generates the self-signed cert
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});