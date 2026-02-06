import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
});
