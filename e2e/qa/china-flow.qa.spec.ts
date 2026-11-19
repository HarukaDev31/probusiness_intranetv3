import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { confirmIfAsked, expectNoServerErrors, login, receiptFile, rowButton, text, trackApiErrors } from './helpers'

/**
 * Flujo completo en QA: Almacén China registra operaciones → socio e importador pagan → China confirma
 * (exacto y con diferencia) y pasa a caja → socio e importador ven sus estados.
 * Crea datos marcados con [QA-E2E] + marca de tiempo; no borra nada.
 * Clientes usados (ya existen en QA): QA_SOCIO_NAME y QA_IMPORTADOR_NAME, ambos con país de origen Perú.
 */
const RUN = new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '')
const SOCIO = process.env.QA_SOCIO_NAME ?? '[QA-PRUEBA] Socio Colombia'
const IMPORTADOR = process.env.QA_IMPORTADOR_NAME ?? '[QA-PRUEBA] Importador Lima'
const DIR = resolve('test-results/qa'); mkdirSync(DIR, { recursive: true })
const RECEIPT = receiptFile(DIR)
const ops: Record<string, string> = {}

async function newOperation(page: Page, client: string, description: string, cbm: string, rate: string | null, fob: string, freight: string) {
  await page.goto('/operaciones-china')
  await page.getByRole('button', { name: 'Nueva operación' }).first().click()
  const d = page.getByRole('dialog').last()
  const pais = d.getByRole('combobox').first()
  await pais.click(); await pais.fill('per')
  await page.getByRole('option', { name: /^PERU/i }).first().click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await d.getByText(/Selecciona un cliente/).click()
  await page.getByRole('option', { name: client }).first().click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(d).toContainText(client)
  await d.getByPlaceholder(/Consolidado #49/).fill(description)
  const nums = d.locator('input[inputmode], input[type=number]')
  await nums.nth(0).fill(cbm)
  if (rate) await nums.nth(1).fill(rate)
  const n = await nums.count()
  await nums.nth(n - 2).fill(fob); await nums.nth(n - 1).fill(freight); await nums.nth(n - 1).blur()
  await expect(d.getByText(/Falta:/)).toHaveCount(0)
  await d.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('El número de orden se genera al guardar.')).toHaveCount(0)
  await page.goto('/operaciones-china')
  const row = page.locator('tr', { hasText: description }).filter({ visible: true }).first()
  const code = (await text(row)).match(/OP-\d+/)?.[0]
  expect(code, `código de ${description}`).toBeTruthy()
  return code!
}

async function partnerPays(page: Page, op: string, amount: string) {
  await page.goto('/pagos-socio')
  await page.locator('tr', { hasText: op }).filter({ visible: true }).first().getByRole('button', { name: 'Pagar' }).click()
  const d = page.getByRole('dialog').last()
  await d.locator('input[inputmode], input[type=number]').first().fill(amount)
  await d.locator('input[type=file]').first().setInputFiles(RECEIPT)
  await d.getByRole('button', { name: /Enviar pago|Registrar pago/ }).last().click()
  await page.getByText(/Mis pagos/).first().click()
  const row = page.locator('tr', { hasText: op }).filter({ visible: true }).first()
  await expect(row).toContainText('Por confirmar')
  return (await text(row)).match(/PG-\d+/)![0]
}

async function chinaConfirmAndCash(page: Page, pg: string, received: string, rate: string, shortfallOp?: string) {
  await page.goto('/operaciones-china')
  await page.getByText(/^Cobros/).first().click()
  await expect(page.getByText(pg, { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await (await rowButton(page, /Confirmar ingreso/, pg)).click()
  let d = page.locator('[role=dialog]').last()
  const input = d.locator('input:not([type=file])').last()
  await input.fill(received); await input.blur()
  if (shortfallOp) {
    await expect(d.getByText(/Llegaron \$[\d.,]+ menos/)).toBeVisible()
    await d.getByRole('button', { name: new RegExp(shortfallOp) }).first().click()
  }
  await d.getByRole('button', { name: 'Confirmar ingreso' }).click(); await confirmIfAsked(page)
  d = page.locator('[role=dialog]').last()
  await expect(d.getByText(/RECIBIDO/i)).toBeVisible()
  if (shortfallOp) await expect(d).toContainText(`Cargada a ${shortfallOp}`)
  await expect(d.getByRole('button', { name: 'Pasar a caja' })).toBeVisible()
  const tc = d.locator('input:not([type=file])').filter({ visible: true }).last()
  await tc.fill(rate); await tc.blur()
  await expect(d.getByText(/Ingresa a caja\s*¥/)).toBeVisible()
  await d.getByRole('button', { name: 'Pasar a caja' }).click()
  await expect(page.locator('[role=dialog]').last().getByText(/En caja/i).first()).toBeVisible()
}

test.describe.serial('QA · Operaciones China y pagos de socio/importador', () => {
  test('China registra una operación para el socio y otra para el importador', async ({ page }) => {
    const errors = trackApiErrors(page)
    await login(page, 'china')
    ops.socio = await newOperation(page, SOCIO, `[QA-E2E ${RUN}] socio`, '0.8', null, '100', '50')
    ops.importador = await newOperation(page, IMPORTADOR, `[QA-E2E ${RUN}] importador`, '2', '90', '0', '0')
    await expectNoServerErrors(errors)
  })

  test('El socio paga con sobrante y el importador paga el total', async ({ browser }) => {
    for (const [profile, op, amount] of [['socio', ops.socio, '250'], ['importador', ops.importador, '180']] as const) {
      const page = await browser.newPage(); const errors = trackApiErrors(page)
      await login(page, profile)
      ops[`pg_${profile}`] = await partnerPays(page, op, amount)
      await expectNoServerErrors(errors); await page.close()
    }
  })

  test('China confirma (exacto y con $5 menos) y pasa a caja', async ({ page }) => {
    const errors = trackApiErrors(page)
    await login(page, 'china')
    await chinaConfirmAndCash(page, ops.pg_socio, '250', '7')
    await chinaConfirmAndCash(page, ops.pg_importador, '175', '7.1', ops.importador)
    await expectNoServerErrors(errors)
  })

  test('Socio ve su factura pagada; importador la ve en pago parcial', async ({ browser }) => {
    for (const [profile, op, status] of [['socio', ops.socio, 'Pagado'], ['importador', ops.importador, 'Pago parcial']] as const) {
      const page = await browser.newPage()
      await login(page, profile)
      await page.goto('/pagos-socio')
      await expect(page.locator('tr', { hasText: op }).filter({ visible: true }).first()).toContainText(status)
      await page.close()
    }
  })
})
