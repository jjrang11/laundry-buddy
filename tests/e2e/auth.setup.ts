import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/admin.json')

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD in .env.test\n' +
      'Create tests/e2e/.env.test with those values.'
    )
  }

  await page.goto('/login')
  await expect(page).toHaveURL(/login/)

  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|log in|login/i }).click()

  // Wait for redirect to dashboard after login
  await page.waitForURL(/dashboard/, { timeout: 15_000 })

  // Save auth cookies/storage so other tests skip the login step
  await page.context().storageState({ path: authFile })
})
