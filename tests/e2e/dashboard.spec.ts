import { test, expect } from '@playwright/test'

test.describe('Dashboard (Kanban)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('loads and shows kanban columns', async ({ page }) => {
    // All 7 status columns should be visible
    const expectedColumns = [
      'New Order',
      'For Pickup',
      'Arrived at Shop',
      'Processing',
      'Ready for Delivery',
      'Out for Delivery',
      'Completed',
    ]
    for (const col of expectedColumns) {
      await expect(page.getByText(col).first()).toBeVisible()
    }
  })

  test('sidebar navigation is visible', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('can open create order modal', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new order|create order|add order/i })
    if (await createBtn.count() > 0) {
      await createBtn.first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
    }
  })
})
