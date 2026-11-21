import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.mjs';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/setupTests.js'],
      include: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'functions/**/*.{test,spec}.{js,jsx,ts,tsx}',
      ],
      clearMocks: true,
    },
  })
);
