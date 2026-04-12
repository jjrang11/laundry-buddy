import { test, expect } from '@playwright/test'

/**
 * CRUD tests for orders.
 *
 * Strategy:
 *  - Create order  → verify it appears in the Orders table
 *  - Edit order    → change a field, save, verify change persists
 *  - Delete order  → only if admin role; confirm it disappears (or shows in "Show deleted")
 *
 * The "New Order" button lives in the global DashboardHeader so it is
 * reachable from every page. Tests navigate to /orders for a predictable
 * starting point and use the shared admin storageState for auth.
 *
 * Key timing notes:
 *  - OrderModal fetches price-per-kg and additional-charges on open.
 *    The submit button is disabled while loading. Always wait for the
 *    button to be enabled before clicking.
 *  - react-hook-form pre-fills fields in a useEffect after mount, so
 *    use toHaveValue() / not.toHaveValue('') rather than inputValue()
 *    to get proper retry semantics.
 */

const TEST_CUSTOMER = `E2E Test Customer ${Date.now()}`
const UPDATED_NOTES = 'Updated by E2E test'

test.describe('Order CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible()
  })

  // ─── CREATE ───────────────────────────────────────────────────────────────

  test('create a new walk-in order', async ({ page }) => {
    // Open create modal via header button
    await page.getByRole('button', { name: /new order/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /new order/i })).toBeVisible()

    // Wait for modal to finish loading price/charges — the form reset
    // inside useEffect fires when loading completes, so fill fields AFTER
    // the button is enabled to avoid having values wiped by the reset.
    const submitBtn = dialog.getByRole('button', { name: /create order/i })
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 })

    // Order type — Walk-in (default), click to be explicit
    await dialog.getByRole('button', { name: /walk.?in/i }).click()

    // Fill required fields
    await dialog.getByLabel(/customer name/i).fill(TEST_CUSTOMER)
    await dialog.getByLabel(/contact number/i).fill('09171234567')
    await dialog.getByLabel(/weight/i).fill('3')

    // Optional notes
    await dialog.getByLabel(/notes/i).fill('E2E test order — please ignore')

    await submitBtn.click()

    // Dialog should close after successful save
    await expect(dialog).not.toBeVisible({ timeout: 15_000 })

    // New order should appear in the table
    await expect(page.getByText(TEST_CUSTOMER).first()).toBeVisible({ timeout: 10_000 })
  })

  // ─── READ (row click opens modal) ─────────────────────────────────────────

  test('clicking a row opens the edit modal with order data', async ({ page }) => {
    const rows = page.locator('tbody tr[role="button"]')
    await expect(rows.first()).toBeVisible()

    await rows.first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /edit order/i })).toBeVisible()

    // Wait for react-hook-form useEffect to pre-fill fields
    const customerInput = dialog.getByLabel(/customer name/i)
    await expect(customerInput).not.toHaveValue('', { timeout: 8_000 })

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 5_000 })
  })

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  test('edit an existing order and save changes', async ({ page }) => {
    // Try to find the order we just created; fall back to the first row
    const testRow = page.locator('tbody tr[role="button"]').filter({ hasText: TEST_CUSTOMER })
    const rows = page.locator('tbody tr[role="button"]')
    await expect(rows.first()).toBeVisible()
    const targetRow = (await testRow.count()) > 0 ? testRow.first() : rows.first()

    await targetRow.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /edit order/i })).toBeVisible()

    // Wait for modal to finish loading before interacting
    const submitBtn = dialog.getByRole('button', { name: /save changes/i })
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 })

    // Update the notes field
    const notesField = dialog.getByLabel(/notes/i)
    await notesField.clear()
    await notesField.fill(UPDATED_NOTES)

    await submitBtn.click()
    await expect(dialog).not.toBeVisible({ timeout: 15_000 })

    // Re-open the same row and verify the note was persisted
    await targetRow.click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel(/notes/i)).toHaveValue(UPDATED_NOTES, { timeout: 8_000 })

    await page.keyboard.press('Escape')
  })

  // ─── DELETE ───────────────────────────────────────────────────────────────

  test('delete an order (admin only)', async ({ page }) => {
    // Create a dedicated order for this test so it is fully self-contained
    const deleteCustomer = `E2E Delete Target ${Date.now()}`

    await page.getByRole('button', { name: /new order/i }).click()
    const createDialog = page.getByRole('dialog')
    await expect(createDialog).toBeVisible()

    const createBtn = createDialog.getByRole('button', { name: /create order/i })
    await expect(createBtn).toBeEnabled({ timeout: 10_000 })

    await createDialog.getByLabel(/customer name/i).fill(deleteCustomer)
    await createDialog.getByLabel(/contact number/i).fill('09181234567')
    await createDialog.getByLabel(/weight/i).fill('2')
    await createBtn.click()
    await expect(createDialog).not.toBeVisible({ timeout: 15_000 })

    // Verify it appears in the table
    await expect(page.getByText(deleteCustomer).first()).toBeVisible({ timeout: 10_000 })

    // Click the row to open edit modal
    const orderRow = page.locator('tbody tr[role="button"]').filter({ hasText: deleteCustomer })
    await orderRow.first().click()
    // Use a named dialog reference — the delete confirm also uses role=dialog so we disambiguate
    const dialog = page.getByRole('dialog', { name: 'Edit Order' })
    await expect(dialog).toBeVisible()

    // Delete button only visible for admin role
    const deleteBtn = dialog.getByRole('button', { name: /delete/i })
    if (!(await deleteBtn.isVisible())) {
      await page.keyboard.press('Escape')
      test.skip()
      return
    }

    await deleteBtn.click()

    // Confirm dialog — shadcn Dialog with title "Delete this order?"
    const confirmDialog = page.getByRole('dialog', { name: 'Delete this order?' })
    await expect(confirmDialog).toBeVisible({ timeout: 4_000 })
    await confirmDialog.getByRole('button', { name: 'Delete Order' }).click()

    // Edit dialog should close after successful delete
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    // Deleted order should no longer appear in the default view
    await expect(page.getByText(deleteCustomer).first()).not.toBeVisible({ timeout: 8_000 })

    // Enabling "Show deleted" should make it reappear
    await page.getByText('Show deleted').click()
    await expect(page.getByText(deleteCustomer).first()).toBeVisible({ timeout: 8_000 })
  })
})
