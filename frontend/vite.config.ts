import path from 'node:path';
import react from '@vitejs/plugin-react';
// @ts-expect-error Types are missing
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://mujcode-1.onrender.com',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'https://mujcode-1.onrender.com',
        ws: true,
        secure: false
      }
    }
  }
});
