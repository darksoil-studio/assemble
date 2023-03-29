// vite.config.js
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
  root: './demo',
  plugins: [
    checker({
      typescript: true,
    }),
  ],
});
