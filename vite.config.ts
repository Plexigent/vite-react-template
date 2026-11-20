import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static assets only: compatible with the existing Workers deployment or Pages Free.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist/client' },
});
