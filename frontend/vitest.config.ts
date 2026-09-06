import { defineConfig } from 'vitest/config'

// The tests used to run under `node --test`, where `import.meta.env` is simply
// undefined, so every module fell through to its offline/stub path. Vitest is
// Vite-based and would otherwise load .env and hand the suite a real
// VITE_API_URL, pointing it at a live backend. An env prefix that matches
// nothing keeps VITE_* off import.meta.env and preserves the old behaviour.
export default defineConfig({
  envPrefix: ['VITEST_NO_ENV_'],
  test: {
    include: ['test/**/*.test.{js,ts}'],
    environment: 'node',
  },
})
