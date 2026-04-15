import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, 'tests/e2e/.env.test') })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // run serially so auth setup runs first
  retries: 1,
  timeout: 90_000,
  expect: { timeout: 8_000 },

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // 1. Auth setup — logs in as admin, saves cookie state
    {
      name: 'setup-admin',
      testMatch: '**/auth.setup.ts',
    },
    // 2. All tests run with saved admin session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Wide enough so all 7 kanban columns (7×272 + gaps + sidebar ≈ 2250px)
        // are simultaneously visible, preventing mid-drag horizontal scroll issues.
        viewport: { width: 2560, height: 900 },
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup-admin'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // reuse if already running
    timeout: 60_000,
  },
})
