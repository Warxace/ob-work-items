import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['packages/core/tests/**/*.test.ts', 'packages/git/tests/**/*.test.ts', 'packages/mcp/tests/**/*.test.ts', 'packages/api/tests/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'ui',
          include: ['packages/ui/src/**/__tests__/**/*.test.tsx'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['packages/ui/src/test-setup.ts'],
        },
      },
    ],
  },
});
