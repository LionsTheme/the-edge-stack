import { defineConfig } from 'vite';
import { TanStackStartVite } from '@tanstack/start/plugin/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    TanStackStartVite(),
    react(),
  ],
});