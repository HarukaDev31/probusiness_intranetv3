import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

// E2E de Operaciones (Almacén China) y Pagos (Socio). Requiere backend y front levantados sobre una base descartable.
const baseURL = process.env.CHINA_E2E_BASE_URL ?? 'http://localhost:3011'
const outputDir = resolve(process.env.CHINA_E2E_OUTPUT ?? 'test-results/china-billing')

export default defineConfig({
  testDir: './e2e/china-billing',
  testMatch: /china-billing\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir,
  reporter: [['line']],
  use: {
    ...devices['Desktop Chrome'],
    channel: process.env.CHINA_E2E_CHANNEL ?? 'msedge',
    baseURL,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    trace: 'retain-on-failure'
  }
})
