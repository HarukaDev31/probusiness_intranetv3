import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

// Pruebas contra QA (qaintranet.probusiness.pe). Credenciales solo por variables de entorno (ver e2e/qa/README.md).
export default defineConfig({
  testDir: './e2e/qa',
  testMatch: /\.qa\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  outputDir: resolve(process.env.QA_E2E_OUTPUT ?? 'test-results/qa'),
  reporter: [['line']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.QA_BASE_URL ?? 'https://qaintranet.probusiness.pe',
    viewport: { width: 1500, height: 1000 },
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    screenshot: 'only-on-failure',
    trace: 'off',
    // En contenedores con Chromium preinstalado (p. ej. sesiones en la nube): PW_CHROMIUM_PATH=/opt/pw-browsers/chromium
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
  }
})
