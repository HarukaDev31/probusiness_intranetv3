import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

const baseURL = process.env.MANUAL_CAPTURE_BASE_URL ?? 'http://127.0.0.1:3000'
const outputDir = resolve(process.env.MANUAL_CAPTURE_TEST_OUTPUT ?? 'test-results/manual-captures')

export default defineConfig({
  testDir: './e2e/manual-captures',
  testMatch: /(manual-captures|runner)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir,
  reporter: [
    ['line'],
    ['./e2e/manual-captures/reporter.ts'],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    colorScheme: 'light',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    screenshot: 'off',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: '1920x1200',
      use: { viewport: { width: 1920, height: 1200 } },
    },
    {
      name: '2560x1440',
      use: { viewport: { width: 2560, height: 1440 } },
    },
  ],
})
