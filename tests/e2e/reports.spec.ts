import { test, expect } from '@playwright/test'

test.describe('Reports page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
  })

  test('shows all 6 summary cards', async ({ page }) => {
    const labels = ['Revenue', 'Orders', 'Completed', 'Weight', 'Avg Order', 'Completion Rate']
    for (const label of labels) {
      await expect(page.getByText(label).first()).toBeVisible()
    }
  })

  test('shows filter bar with date pickers, status, type', async ({ page }) => {
    await expect(page.getByText('All statuses').first()).toBeVisible()
    await expect(page.getByText('All types').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /download pdf/i })).toBeVisible()
  })

  test('charts are rendered', async ({ page }) => {
    // Charts render inside svg elements
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 8_000 })
    // At least 3 chart containers (Revenue/Volume, Status, Order Type)
    const svgCount = await page.locator('svg').count()
    expect(svgCount).toBeGreaterThanOrEqual(3)
  })

  test('status filter updates URL', async ({ page }) => {
    await page.getByText('All statuses').first().click()
    await page.getByRole('option', { name: 'Completed' }).click()
    await page.waitForURL(/status=Completed/, { timeout: 5_000 })
    expect(page.url()).toContain('status=Completed')
  })

  test('type filter updates URL', async ({ page }) => {
    await page.getByText('All types').first().click()
    await page.getByRole('option', { name: 'Walk-in' }).click()
    await page.waitForURL(/type=walkin/, { timeout: 5_000 })
    expect(page.url()).toContain('type=walkin')
  })

  test('reset button clears filters', async ({ page }) => {
    // Apply status filter
    await page.getByText('All statuses').first().click()
    await page.getByRole('option', { name: 'Completed' }).click()
    await page.waitForURL(/status=Completed/, { timeout: 5_000 })

    // Reset
    await page.getByRole('button', { name: /reset/i }).click()
    await page.waitForURL(url => !url.href.includes('status='), { timeout: 5_000 })
    expect(page.url()).not.toContain('status=')
  })

  test('PDF download button is present and clickable', async ({ page }) => {
    const downloadBtn = page.getByRole('button', { name: /download pdf/i })
    await expect(downloadBtn).toBeVisible()
    await expect(downloadBtn).toBeEnabled()
  })

  test('PDF actually downloads', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 20_000 }),
      page.getByRole('button', { name: /download pdf/i }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/report.*\.pdf$/)
  })
})
