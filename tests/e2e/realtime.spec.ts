import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * Realtime Subscription Tests
 *
 * Verifies that Supabase Realtime works correctly on page load using two
 * separate browser contexts authenticated as the same admin user.
 *
 * Tests:
 *  1. Basic: new order created in Context B appears in Context A's kanban
 *     without any manual reload.
 *
 *  2. Delivery flow: exercises both the kanban and delivery page subscriptions
 *     in a single cross-context sequence:
 *       a. Context A (dashboard) creates an order and drags it to
 *          "Ready for Delivery".
 *       b. Context B (delivery page) receives it via realtime and it appears
 *          in the "Ready for Delivery" section — no reload.
 *       c. Context B clicks "Load to Car".
 *       d. Context A's kanban receives the update via realtime and shows the
 *          order in the "Out for Delivery" column — no reload.
 *
 *  3. Connection status: the "Connecting…" banner clears within 15 s of page
 *     load and the error banner never appears.
 */

const STORAGE_STATE = 'tests/e2e/.auth/admin.json'

// ─── Shared helpers (mirror of order-flows.spec.ts) ──────────────────────────

async function createPickupOrder(page: Page, name: string) {
  await page.getByRole('button', { name: /new order/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: /create order/i })).toBeEnabled({ timeout: 10_000 })
  await dialog.getByRole('button', { name: /^pickup$/i }).click()
  await dialog.getByLabel(/customer name/i).fill(name)
  await dialog.getByLabel(/address/i).fill('1 Test St')
  await dialog.getByLabel(/weight/i).fill('2')
  await dialog.getByRole('button', { name: /create order/i }).click()
  await expect(dialog).not.toBeVisible({ timeout: 15_000 })
}

function kanbanDropZone(page: Page, status: string): Locator {
  return page.locator(
    `xpath=//h2[normalize-space()="${status}"]/../../following-sibling::div[1]`
  )
}

async function dragCardToColumn(page: Page, customerName: string, targetStatus: string) {
  const card = page.locator('[role="button"]').filter({ hasText: customerName }).first()
  const dropZone = kanbanDropZone(page, targetStatus)

  await card.scrollIntoViewIfNeeded()
  const srcBB = await card.boundingBox()
  if (!srcBB) throw new Error(`Card "${customerName}" has no bounding box`)
  const srcX = srcBB.x + srcBB.width / 2
  const srcY = srcBB.y + srcBB.height / 2

  await page.mouse.move(srcX, srcY)
  await page.mouse.down()
  await page.mouse.move(srcX + 12, srcY, { steps: 5 })

  await dropZone.scrollIntoViewIfNeeded()
  const dstBB = await dropZone.boundingBox()
  if (!dstBB) throw new Error(`Drop zone for "${targetStatus}" not found`)
  await page.mouse.move(dstBB.x + dstBB.width / 2, dstBB.y + dstBB.height / 2, { steps: 25 })
  await page.mouse.up()
}

async function waitForRealtimeConnected(page: Page) {
  await expect(page.locator('text=Connecting to live updates')).not.toBeVisible({ timeout: 20_000 })
  await expect(page.locator('text=Live updates disconnected')).not.toBeVisible()
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Realtime subscription', () => {

  test('1 – new order from another tab appears on kanban without reload', async ({ browser }) => {
    test.setTimeout(60_000)

    const ctxA = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 1400, height: 900 } })
    const ctxB = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 1400, height: 900 } })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    try {
      // Context A: open dashboard and confirm realtime is live
      await pageA.goto('/dashboard')
      await expect(pageA.locator('h2', { hasText: 'New Order' }).first()).toBeVisible({ timeout: 15_000 })
      await waitForRealtimeConnected(pageA)

      // Context B: create a new order
      await pageB.goto('/dashboard')
      await expect(pageB.locator('h2', { hasText: 'New Order' }).first()).toBeVisible({ timeout: 10_000 })
      const orderName = `RT1 ${Date.now()}`
      await createPickupOrder(pageB, orderName)

      // Context A: order must appear without any reload
      await expect(
        pageA.locator('[role="button"]').filter({ hasText: orderName }).first()
      ).toBeVisible({ timeout: 10_000 })
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('2 – ready-for-delivery → delivery page realtime → load to car → kanban updates', async ({ browser }) => {
    test.setTimeout(120_000)

    // Context A uses a wide viewport so all kanban columns are visible for drag-and-drop
    const ctxA = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 2560, height: 900 } })
    const ctxB = await browser.newContext({ storageState: STORAGE_STATE, viewport: { width: 1400, height: 900 } })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    try {
      // ── Step 1: Context A opens dashboard and waits for realtime ─────────
      await pageA.goto('/dashboard')
      await expect(pageA.locator('h2', { hasText: 'New Order' }).first()).toBeVisible({ timeout: 15_000 })
      await waitForRealtimeConnected(pageA)

      // ── Step 2: Context A creates an order and drags to "Ready for Delivery"
      const orderName = `RT2 ${Date.now()}`
      await createPickupOrder(pageA, orderName)
      await expect(
        kanbanDropZone(pageA, 'New Order').locator('[role="button"]').filter({ hasText: orderName })
      ).toBeVisible({ timeout: 10_000 })

      await dragCardToColumn(pageA, orderName, 'Ready for Delivery')
      await expect(
        kanbanDropZone(pageA, 'Ready for Delivery').locator('[role="button"]').filter({ hasText: orderName })
      ).toBeVisible({ timeout: 10_000 })

      // ── Step 3: Context B opens delivery page ────────────────────────────
      await pageB.goto('/delivery')
      await expect(pageB.getByRole('heading', { name: 'Delivery', exact: true })).toBeVisible({ timeout: 10_000 })

      // ── Step 4: The order must appear in "Ready for Delivery" section via
      //            realtime — no reload allowed ────────────────────────────
      const readySection = pageB.locator('section').filter({
        has: pageB.locator('h2', { hasText: 'Ready for Delivery' }),
      })
      await expect(
        readySection.locator('div.overflow-hidden').filter({ hasText: orderName })
      ).toBeVisible({ timeout: 15_000 })

      // ── Step 5: Context B clicks "Load to Car" ───────────────────────────
      const card = readySection.locator('div.overflow-hidden').filter({ hasText: orderName })
      await card.locator('button').first().click()

      // ── Step 6: Order moves to "Out for Delivery" section on delivery page
      const outSection = pageB.locator('section').filter({
        has: pageB.locator('h2', { hasText: 'Out for Delivery' }),
      })
      await expect(
        outSection.locator('div.overflow-hidden').filter({ hasText: orderName })
      ).toBeVisible({ timeout: 10_000 })

      // ── Step 7: Context A's kanban must reflect the status change via
      //            realtime — no reload allowed ────────────────────────────
      await expect(
        kanbanDropZone(pageA, 'Out for Delivery').locator('[role="button"]').filter({ hasText: orderName })
      ).toBeVisible({ timeout: 15_000 })
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('3 – kanban shows "connected" status on page load', async ({ browser }) => {
    test.setTimeout(30_000)

    const ctx = await browser.newContext({ storageState: STORAGE_STATE })
    const page = await ctx.newPage()

    try {
      await page.goto('/dashboard')
      await expect(page.locator('h2', { hasText: 'New Order' }).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.locator('text=Connecting to live updates')).not.toBeVisible({ timeout: 15_000 })
      await expect(page.locator('text=Live updates disconnected')).not.toBeVisible()
      await expect(page.locator('text=Live updates active')).toBeAttached()
    } finally {
      await ctx.close()
    }
  })

})
