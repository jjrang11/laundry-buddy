import { test, expect } from '@playwright/test'

// ── 404 Page ─────────────────────────────────────────────────────────────────

test.describe('404 Page', () => {
  test('navigating to an unknown route shows the custom 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-e2e')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    const backLink = page.getByRole('link', { name: /back to dashboard/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/dashboard')
  })
})

// ── Settings – Additional Charges ─────────────────────────────────────────────

test.describe('Settings – Additional Charges', () => {
  /**
   * Verifies Fix #6: storing charge_id on order_charges means renaming a catalog
   * charge does NOT break the edit modal's pre-population of applied charges.
   *
   * Prerequisite: the following DB migration must have been applied before
   * running this test:
   *
   *   ALTER TABLE order_charges
   *     ADD COLUMN IF NOT EXISTS charge_id UUID
   *       REFERENCES additional_charges(id) ON DELETE SET NULL;
   */
  test('renaming a charge does not break edit modal pre-population', async ({ page }) => {
    test.setTimeout(90_000)

    // Use a taller viewport so the order modal's submit button is not cut off
    await page.setViewportSize({ width: 1280, height: 900 })

    const RUN_ID = `${Date.now()}`
    const chargeName = `E2E Charge ${RUN_ID}`
    const renamedCharge = `E2E Charge ${RUN_ID} (renamed)`
    const customerName = `E2E Rename Test ${RUN_ID}`

    // ── Step 1: create a new additional charge in Settings → Pricing ──────
    await page.goto('/settings')

    // Click the Pricing tab
    await page.getByRole('tab', { name: 'Pricing' }).click()

    // Open the inline add-charge form
    await page.getByRole('button', { name: /add charge/i }).click()

    // Fill in name and amount
    await page.getByPlaceholder(/rush order/i).fill(chargeName)
    await page.locator('input[name="amount"]').last().fill('30')

    // Submit the add form
    await page.getByRole('button', { name: /^add$/i }).click()

    // Charge should appear in the table
    await expect(page.getByRole('cell', { name: chargeName })).toBeVisible({ timeout: 10_000 })

    // ── Step 2: create a walk-in order and apply the new charge ───────────
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible()

    await page.getByRole('button', { name: /new order/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const submitBtn = dialog.getByRole('button', { name: /create order/i })
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 })

    await dialog.getByLabel(/customer name/i).fill(customerName)
    await dialog.getByLabel(/contact number/i).fill('09191234567')
    await dialog.getByLabel(/weight/i).fill('2')

    // Apply the newly created charge (aria-pressed toggles selection)
    await dialog.getByRole('button', { name: new RegExp(chargeName) }).click()

    // Use evaluate to fire a native JS click — Playwright cannot pointer-click
    // an element that is below the viewport bottom (the dialog is taller than
    // the default 720px browser height when additional charge buttons are shown)
    await submitBtn.evaluate((el: HTMLElement) => el.click())
    await expect(dialog).not.toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(customerName).first()).toBeVisible({ timeout: 10_000 })

    // ── Step 3: rename the charge in Settings → Pricing ───────────────────
    await page.goto('/settings')
    await page.getByRole('tab', { name: 'Pricing' }).click()

    // Find the charge row and click its edit (Pencil) button.
    // After the click, the tr is replaced by an EditRow whose input contains
    // the charge name — the hasText locator breaks at that point, so we
    // scope the Pencil click only, then find the edit form independently.
    const chargeRow = page.locator('tr').filter({ hasText: chargeName })
    await expect(chargeRow).toBeVisible({ timeout: 10_000 })
    await chargeRow.locator('button').first().click() // Pencil (edit) button

    // The EditRow renders a form with input[name="name"] — locate it at page scope
    // since the old chargeRow text is now only in the input value (not visible text)
    const editForm = page.locator('form').filter({ has: page.locator('input[name="name"]') }).last()
    await editForm.locator('input[name="name"]').clear()
    await editForm.locator('input[name="name"]').fill(renamedCharge)

    // Submit via the Check button (type="submit")
    await editForm.locator('button[type="submit"]').click()

    // Renamed charge should appear in the table
    await expect(page.getByRole('cell', { name: renamedCharge })).toBeVisible({ timeout: 10_000 })

    // ── Step 4: open the order's edit modal and verify charge is still selected
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible()

    const orderRow = page.locator('tbody tr[role="button"]').filter({ hasText: customerName })
    await expect(orderRow.first()).toBeVisible({ timeout: 10_000 })
    await orderRow.first().click()

    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible()
    await expect(editDialog.getByRole('heading', { name: /edit order/i })).toBeVisible()

    // Wait for modal to finish loading charges (submit button enabled = loading done)
    const saveBtn = editDialog.getByRole('button', { name: /save changes/i })
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 })

    // The renamed charge button must be visible and have aria-pressed="true".
    // Use exact:false (substring match) to avoid regex escaping issues with
    // special characters like the parentheses in "(renamed)".
    const chargeBtn = editDialog.getByRole('button', { name: renamedCharge, exact: false })
    await expect(chargeBtn).toBeVisible({ timeout: 8_000 })
    await expect(chargeBtn).toHaveAttribute('aria-pressed', 'true')

    await page.keyboard.press('Escape')
    await expect(editDialog).not.toBeVisible({ timeout: 5_000 })
  })
})
