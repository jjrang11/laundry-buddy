import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * Order Status Flow Tests
 *
 * Tests the full lifecycle of pickup orders through the kanban board and
 * delivery page. Each test creates 5 pickup orders then exercises a specific
 * status transition or page flow.
 *
 * Test cases:
 *  1. Create 5 pickup orders (verify they appear in "New Order" column)
 *  2-7. Create 5 orders, drag to the specified status column
 *  8. Create 5 orders → Ready for Delivery → delivery page:
 *       "Load to Car" moves orders to Out for Delivery (board + delivery page)
 *       "Mark Delivered" removes orders from the delivery page
 *
 * Drag-and-drop notes:
 *  - @dnd-kit uses PointerSensor with activationConstraint: { distance: 8 }.
 *    We emit a short initial move (>8 px) before sliding to the target.
 *  - `scrollIntoViewIfNeeded()` is called on both source and target to ensure
 *    coordinates are resolved inside the visible viewport.
 */

const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`

// ─── Order creation ───────────────────────────────────────────────────────────

/** Open the "New Order" modal and create one pickup order. */
async function createPickupOrder(page: Page, name: string, addressNum: number) {
  await page.getByRole('button', { name: /new order/i }).click()
  const dialog = page.getByRole('dialog')
  const submitBtn = dialog.getByRole('button', { name: /create order/i })
  await expect(submitBtn).toBeEnabled({ timeout: 10_000 })

  // Switch to Pickup type
  await dialog.getByRole('button', { name: /^pickup$/i }).click()

  await dialog.getByLabel(/customer name/i).fill(name)
  await dialog.getByLabel(/address/i).fill(`${addressNum} Sample St`)
  await dialog.getByLabel(/weight/i).fill('2')

  await submitBtn.click()
  await expect(dialog).not.toBeVisible({ timeout: 15_000 })
}

/** Create exactly 5 pickup orders and return their customer names. */
async function create5PickupOrders(page: Page, prefix: string): Promise<string[]> {
  const names: string[] = []
  for (let i = 1; i <= 5; i++) {
    const name = `${prefix} #${i}`
    names.push(name)
    await createPickupOrder(page, name, i)
  }
  return names
}

// ─── Kanban helpers ───────────────────────────────────────────────────────────

/**
 * Returns the droppable container of a kanban column identified by its status heading.
 *
 * Column DOM structure:
 *   div.w-[272px] (column wrapper)
 *     div (column header)
 *       div (accent bar)
 *       div.flex-1 > h2   ← status heading
 *       span              (count badge)
 *     div.rounded-xl      ← droppable drop zone  (following-sibling)
 */
function kanbanDropZone(page: Page, status: string): Locator {
  return page.locator(
    `xpath=//h2[normalize-space()="${status}"]/../../following-sibling::div[1]`
  )
}

/**
 * Drag a kanban card to a target column using raw Playwright mouse events.
 *
 * Why not `locator.dragTo()`?
 *   @dnd-kit's PointerSensor requires the pointer to travel at least 8 px
 *   before it activates the drag.  Playwright's built-in `dragTo` may not
 *   satisfy that constraint reliably, so we emit an explicit short initial
 *   move and then glide to the destination in many steps.
 */
async function dragCardToColumn(page: Page, customerName: string, targetStatus: string) {
  const card = page.locator('[role="button"]').filter({ hasText: customerName }).first()
  const dropZone = kanbanDropZone(page, targetStatus)

  // 1. Scroll the source card into view and capture its viewport coords.
  await card.scrollIntoViewIfNeeded()
  const srcBB = await card.boundingBox()
  if (!srcBB) throw new Error(`Card "${customerName}" has no bounding box`)
  const srcX = srcBB.x + srcBB.width / 2
  const srcY = srcBB.y + srcBB.height / 2

  // 2. Press the mouse on the card.
  await page.mouse.move(srcX, srcY)
  await page.mouse.down()

  // 3. Small initial move (>8 px) to satisfy @dnd-kit activation constraint.
  await page.mouse.move(srcX + 12, srcY, { steps: 5 })

  // 4. Scroll the target drop zone into view (kanban container scrolls horizontally).
  await dropZone.scrollIntoViewIfNeeded()
  const dstBB = await dropZone.boundingBox()
  if (!dstBB) throw new Error(`Drop zone for "${targetStatus}" not found`)
  const dstX = dstBB.x + dstBB.width / 2
  const dstY = dstBB.y + dstBB.height / 2

  // 5. Slide to the target and release.
  await page.mouse.move(dstX, dstY, { steps: 25 })
  await page.mouse.up()
}

// ─── Delivery page helpers ────────────────────────────────────────────────────

/**
 * Within a delivery section, find the action button for the given customer name
 * and click it.
 *
 * Order card DOM structure (DeliveryBoard > Section > OrderCard):
 *   div.overflow-hidden  (outer card)
 *     div.w-1            (accent bar)
 *     div.flex-col       (card body)
 *       div > p.font-semibold  ← customer name
 *       div                    (detail row)
 *       button                 ← "Load to Car" / "Mark Delivered"
 *
 * Uses a chained Playwright filter (no XPath ancestor:: axis) so the locator
 * stays scoped within the section and never escapes its boundary.
 */
async function clickDeliveryAction(section: Locator, customerName: string) {
  // Find the card div (has overflow-hidden) that contains the customer name,
  // then target its action button directly — all within the section scope.
  const card = section.locator('div.overflow-hidden').filter({ hasText: customerName })
  const btn = card.locator('button').first()
  await expect(btn).toBeVisible({ timeout: 10_000 })
  await btn.click()
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Order Status Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    // Ensure the kanban board is fully rendered before each test.
    await expect(
      page.locator('h2').filter({ hasText: 'New Order' }).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  // ── Test 1 ──────────────────────────────────────────────────────────────────

  test('1 – create 5 new pickup orders', async ({ page }) => {
    const names = await create5PickupOrders(page, `T1 ${RUN_ID}`)

    // All 5 cards should be visible on the board (in "New Order" column).
    for (const name of names) {
      await expect(
        page.locator('[role="button"]').filter({ hasText: name }).first()
      ).toBeVisible({ timeout: 10_000 })
    }
  })

  // ── Tests 2–7 (parametrised) ────────────────────────────────────────────────

  const STATUS_CASES: [string, string][] = [
    ['2', 'For Pickup'],
    ['3', 'Arrived at Shop'],
    ['4', 'Processing'],
    ['5', 'Ready for Delivery'],
    ['6', 'Out for Delivery'],
    ['7', 'Completed'],
  ]

  for (const [num, targetStatus] of STATUS_CASES) {
    test(`${num} – create 5 pickup orders then move all to "${targetStatus}"`, async ({ page }) => {
      const names = await create5PickupOrders(page, `T${num} ${RUN_ID}`)
      const dropZone = kanbanDropZone(page, targetStatus)

      for (const name of names) {
        await dragCardToColumn(page, name, targetStatus)

        // Card must appear in the target column's drop zone.
        await expect(
          dropZone.locator('[role="button"]').filter({ hasText: name })
        ).toBeVisible({ timeout: 10_000 })
      }
    })
  }

  // ── Test 8 ──────────────────────────────────────────────────────────────────

  test('8 – delivery page: load to car then mark delivered', async ({ page }) => {
    // This test creates 5 orders, drags them, then clicks through real-time
    // Supabase updates on the delivery page — needs a generous timeout.
    test.setTimeout(120_000)
    const names = await create5PickupOrders(page, `T8 ${RUN_ID}`)

    // ── Step 1: move all 5 orders to "Ready for Delivery" on the kanban ──────
    const readyDropZone = kanbanDropZone(page, 'Ready for Delivery')
    for (const name of names) {
      await dragCardToColumn(page, name, 'Ready for Delivery')
      await expect(
        readyDropZone.locator('[role="button"]').filter({ hasText: name })
      ).toBeVisible({ timeout: 10_000 })
    }

    // ── Step 2: navigate to the delivery page ─────────────────────────────────
    // The kanban uses optimistic updates — a dragged card appears immediately
    // in the UI before the server action commits the DB write. Navigate first,
    // then reload so the server component re-fetches after the write has settled.
    await page.goto('/delivery')
    await expect(page.getByRole('heading', { name: 'Delivery', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Delivery', exact: true })).toBeVisible()

    const readySection = page.locator('section').filter({
      has: page.locator('h2', { hasText: 'Ready for Delivery' }),
    })
    const outSection = page.locator('section').filter({
      has: page.locator('h2', { hasText: 'Out for Delivery' }),
    })

    // ── Step 3: verify all 5 orders appear in "Ready for Delivery" section ────
    for (const name of names) {
      await expect(readySection.getByText(name).first()).toBeVisible({ timeout: 10_000 })
    }

    // ── Step 4: "Load to Car" each order → should move to "Out for Delivery" ──
    for (const name of names) {
      await clickDeliveryAction(readySection, name)
      // Verify the order appears in the "Out for Delivery" section.
      await expect(outSection.getByText(name).first()).toBeVisible({ timeout: 10_000 })
    }

    // ── Step 5: verify orders appear in "Out for Delivery" column on dashboard ─
    await page.goto('/dashboard')
    await expect(
      page.locator('h2').filter({ hasText: 'New Order' }).first()
    ).toBeVisible({ timeout: 10_000 })

    const outDropZone = kanbanDropZone(page, 'Out for Delivery')
    for (const name of names) {
      await expect(
        outDropZone.locator('[role="button"]').filter({ hasText: name })
      ).toBeVisible({ timeout: 10_000 })
    }

    // ── Step 6: back on delivery page — "Mark Delivered" → order disappears ───
    await page.goto('/delivery')
    await expect(page.getByRole('heading', { name: 'Delivery', exact: true })).toBeVisible()

    for (const name of names) {
      await clickDeliveryAction(outSection, name)
      // Order should no longer be visible anywhere on the delivery page.
      await expect(outSection.getByText(name)).not.toBeVisible({ timeout: 10_000 })
    }
  })
})
