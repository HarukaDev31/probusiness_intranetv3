import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Flujo completo de Operaciones (Almacén China) y Pagos (Socio) con capturas.
 * Usuarios y consolidado cerrado (CBM China = 20) vienen de la semilla de la base descartable.
 */
const SHOTS = resolve(process.env.CHINA_E2E_SHOTS ?? 'test-results/china-billing/shots')
mkdirSync(SHOTS, { recursive: true })

const PASSWORD = 'E2e-pass-123'
const shot = (page: Page, name: string) => page.screenshot({ path: resolve(SHOTS, `${name}.png`), fullPage: true })

async function login(page: Page, user: string) {
  await page.goto('/login')
  // El servidor de desarrollo de Nuxt a veces tarda en compilar la primera carga de una sesión nueva.
  await page.getByPlaceholder('Ingresa tu correo').waitFor({ timeout: 90_000 })
  await page.getByPlaceholder('Ingresa tu correo').fill(user)
  await page.getByPlaceholder('Ingresa tu contraseña').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
}

const proof = writeFileSync.bind(null, resolve(SHOTS, 'receipt.png'), Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
))

test.describe.serial('Operaciones China + Pagos Socio', () => {
  test.beforeAll(() => proof())

  test('China: borrador por aprobar, aprobación y operación manual', async ({ page }) => {
    await login(page, 'china@e2e.test')
    await page.goto('/operaciones-china')
    await expect(page.getByRole('heading', { name: 'Operaciones' })).toBeVisible()

    // El borrador trae el CBM China del consolidado cerrado (12.5 + 7.5; excluye PENDIENTE y proveedor WAIT).
    const draftRow = page.locator('tr', { hasText: 'Socio Ecuador Demo' })
    await expect(draftRow).toContainText('Por aprobar')
    await expect(draftRow).toContainText('20 CBM')
    await shot(page, '01-china-operaciones-borrador')

    await draftRow.getByRole('button', { name: 'Aprobar' }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toContainText('Aprobar operación')
    await modal.getByPlaceholder('Ej. Consolidado, Inspección').fill('Consolidado')
    // UInputNumber confirma el valor al salir del campo, como haría una persona (Tab).
    for (const [label, value] of [['Tarifa por CBM (USD)', '50'], ['FOB (USD)', '200'], ['Flete (USD)', '300']]) {
      await modal.getByLabel(label).fill(value)
      await modal.getByLabel(label).press('Tab')
    }
    // 20 CBM × 50 = 1000 + 200 + 300 = 1500, calculado en vivo.
    await expect(modal).toContainText('$1,500.00')
    await shot(page, '02-china-aprobar-modal')
    await modal.getByRole('button', { name: 'Aprobar operación' }).click()
    await expect(page.locator('tr', { hasText: 'OP-0001' })).toBeVisible()
    await shot(page, '03-china-operacion-creada')
  })

  test('China: datos bancarios y cobro registrado por China', async ({ page }) => {
    await login(page, 'china@e2e.test')
    await page.goto('/operaciones-china')

    await page.getByRole('button', { name: 'Datos bancarios' }).click()
    const bank = page.getByRole('dialog')
    await bank.getByLabel('Empresa').fill('Global Shop International Co. Ltd. (GSI)')
    await bank.getByLabel('Beneficiario').fill('Global Shop International Co. Ltd.')
    await bank.getByLabel('Banco intermediario').fill('Bank of China')
    await bank.getByLabel('Banco pagador').fill('HSBC Hong Kong')
    await bank.getByLabel('Número de cuenta').fill('123-456-789')
    await shot(page, '04-china-datos-bancarios')
    await bank.getByRole('button', { name: 'Guardar' }).click()
    await expect(bank).toBeHidden()

    // Selecciona OP-0001 y registra un pago de $1,000 (reparto automático).
    await page.locator('tr', { hasText: 'OP-0001' }).getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Registrar pago', exact: true }).click()
    const modal = page.getByRole('dialog')
    await modal.getByLabel('Monto enviado (USD)').fill('1000')
    await modal.getByLabel('Monto enviado (USD)').press('Tab')
    await modal.getByRole('button', { name: 'Distribuir automáticamente' }).click()
    await modal.locator('input[type="file"]').setInputFiles(resolve(SHOTS, 'receipt.png'))
    await shot(page, '05-china-registrar-pago')
    await modal.getByRole('button', { name: 'Registrar pago' }).click()
    await expect(modal).toBeHidden()

    await page.getByRole('button', { name: /^Cobros/ }).click()
    const row = page.locator('tr', { hasText: 'PG-0001' })
    await expect(row).toContainText('Por confirmar')
    await shot(page, '06-china-cobros-por-confirmar')
  })

  test('Socio: indicadores, factura y pago propio', async ({ page }) => {
    await login(page, 'socio@e2e.test')
    await page.goto('/pagos-socio')
    await expect(page.getByRole('heading', { name: 'Pagos' })).toBeVisible()

    await expect(page.getByText('Total facturado').locator('..')).toContainText('$1,500.00')
    await expect(page.getByText('En confirmación').first().locator('..')).toContainText('$1,000.00')
    await expect(page.getByText('Saldo por pagar').first().locator('..')).toContainText('$500.00')
    await shot(page, '07-socio-facturas')

    await page.getByRole('button', { name: /Nuestra cuenta bancaria en China/ }).click()
    await expect(page.getByText('Bank of China')).toBeVisible()

    await page.getByRole('button', { name: 'Registrar pago', exact: true }).first().click()
    const modal = page.getByRole('dialog')
    await modal.getByLabel('Monto enviado (USD)').fill('500')
    await modal.getByLabel('Monto enviado (USD)').press('Tab')
    await modal.getByRole('button', { name: 'Distribuir automáticamente' }).click()
    // El comprobante es obligatorio para el socio.
    await modal.getByRole('button', { name: 'Registrar pago' }).click()
    await expect(modal).toContainText('Adjunta el comprobante')
    await modal.locator('input[type="file"]').setInputFiles(resolve(SHOTS, 'receipt.png'))
    await shot(page, '08-socio-registrar-pago')
    await modal.getByRole('button', { name: 'Registrar pago' }).click()
    await expect(modal).toBeHidden()

    await page.getByRole('button', { name: /^Mis pagos/ }).click()
    await expect(page.locator('tr', { hasText: 'PG-0002' })).toContainText('Por confirmar')
    await shot(page, '09-socio-mis-pagos')
  })

  test('China: confirma con faltante, pasa a caja y emite la factura', async ({ page }) => {
    await login(page, 'china@e2e.test')
    await page.goto('/operaciones-china')
    await page.getByRole('button', { name: /^Cobros/ }).click()

    // PG-0001: llegaron $900 de $1,000 → faltante de $100 cargado a OP-0001.
    await page.locator('tr', { hasText: 'PG-0001' }).getByRole('button', { name: 'Gestionar' }).click()
    const drawer = page.getByRole('dialog')
    await drawer.getByLabel('Monto realmente recibido (USD)').fill('900')
    await drawer.getByLabel('Monto realmente recibido (USD)').press('Tab')
    await drawer.getByText('Elige la operación').click()
    await page.getByRole('option').first().click()
    await shot(page, '10-china-confirmar-faltante')
    await drawer.getByRole('button', { name: 'Confirmar ingreso' }).click()
    await expect(drawer.getByText('Paso 3 · Pasar a RMB')).toBeVisible()
    await drawer.getByLabel('Tipo de cambio').fill('7.2')
    await drawer.getByLabel('Tipo de cambio').press('Tab')
    await drawer.getByRole('button', { name: 'Pasar a caja' }).click()
    await expect(page.locator('tr', { hasText: 'PG-0001' })).toContainText('En caja')

    // PG-0002 del socio: confirmado completo.
    await page.keyboard.press('Escape')
    await page.locator('tr', { hasText: 'PG-0002' }).getByRole('button', { name: 'Gestionar' }).click()
    await drawer.getByLabel('Monto realmente recibido (USD)').fill('500')
    await drawer.getByLabel('Monto realmente recibido (USD)').press('Tab')
    await drawer.getByRole('button', { name: 'Confirmar ingreso' }).click()
    await expect(drawer.getByText('Paso 3 · Pasar a RMB')).toBeVisible()
    await page.keyboard.press('Escape')
    await shot(page, '11-china-cobros-confirmados')

    // OP-0001: queda $100 por cobrar por el faltante.
    await page.getByRole('button', { name: /^Operaciones/ }).click()
    const op = page.locator('tr', { hasText: 'OP-0001' })
    await expect(op).toContainText('$100.00')
    await expect(op).toContainText('Por cobrar')
    await expect(op).toContainText('¥6,480.00')
    await shot(page, '12-china-operacion-con-diferencia')

    // Factura en PDF desde el backend, con historial.
    await op.getByRole('button', { name: 'Gestionar' }).click()
    await page.getByRole('button', { name: 'Ver factura' }).click()
    const documents = page.getByRole('dialog').last()
    const issued = page.waitForResponse((r) => r.url().includes('/documents') && r.request().method() === 'POST')
    await documents.getByRole('button', { name: 'Generar documento nuevo' }).click()
    const response = await issued
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data.url).toContain('.pdf')
    await expect(documents.getByRole('link', { name: 'Descargar PDF' })).toHaveCount(1)
    await shot(page, '13-china-factura-historial')
  })
})
