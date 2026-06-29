import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/printing/**'],
      exclude: ['lib/printing/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      // Mirror the @/* path alias from tsconfig.json
      '@': path.resolve(__dirname, '.'),
    },
  },
})
