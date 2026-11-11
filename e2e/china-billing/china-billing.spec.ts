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
    await expect(page.getByRole('heading', { name: 'Operaciones' })).toBeVisible({ timeout: 60_000 })

    // Orden de la maqueta: encabezado → KPIs (Resumen) → pestañas → barra de estados → tabla.
    const summaryY = (await page.getByText('Resumen ·').boundingBox())!.y
    const tabsY = (await page.getByRole('button', { name: /^Cobros/ }).boundingBox())!.y
    const statesY = (await page.getByRole('button', { name: /^Por aprobar/ }).boundingBox())!.y
    expect(summaryY).toBeLessThan(tabsY)
    expect(tabsY).toBeLessThan(statesY)
    for (const kpi of ['Cantidad de operaciones', 'Monto por servicios', 'Saldo por cobrar USD', 'Ingresado a caja USD', 'Ingresado a caja RMB']) {
      await expect(page.getByText(kpi, { exact: true })).toBeVisible()
    }

    // El borrador trae el CBM China del consolidado cerrado (12.5 + 7.5; excluye PENDIENTE y proveedor WAIT).
    const draftRow = page.locator('tr:visible', { hasText: 'Socio Ecuador Demo' })
    await expect(draftRow).toContainText('Por aprobar')
    await expect(draftRow).toContainText('20 CBM')
    await shot(page, '01-china-operaciones-borrador')

    await draftRow.getByRole('button', { name: /Por aprobar/ }).click()
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
    await expect(page.locator('tr:visible', { hasText: 'OP-0001' })).toBeVisible()
    await shot(page, '03-china-operacion-creada')
  })

  test('China: datos bancarios y cobro registrado por China', async ({ page }) => {
    await login(page, 'china@e2e.test')
    await page.goto('/operaciones-china')

    await page.getByRole('button', { name: 'Datos bancarios' }).click()
    const bank = page.getByRole('dialog')
    await bank.getByLabel('Empresa').fill('Global Shop International Co. Ltd. (GSI)')
    await bank.getByLabel('Dirección de la oficina en China').fill('Shuangchuang Building 1, Room 1013, Yiwu')
    await bank.getByRole('textbox', { name: 'Código Swift' }).nth(0).fill('BKCHHKHH')
    await bank.getByRole('textbox', { name: 'Nombre del banco' }).nth(0).fill('Bank of China')
    await bank.getByRole('textbox', { name: 'Código Swift' }).nth(1).fill('HSBCHKHH')
    await bank.getByRole('textbox', { name: 'Nombre del banco' }).nth(1).fill('HSBC Hong Kong')
    await bank.getByRole('textbox', { name: 'Cuenta', exact: true }).fill('123-456-789')
    await bank.getByRole('textbox', { name: 'Beneficiario', exact: true }).fill('Global Shop International Co. Ltd.')
    await shot(page, '04-china-datos-bancarios')
    await bank.getByRole('button', { name: 'Guardar' }).click()
    await expect(bank).toBeHidden()

    // Selecciona OP-0001 y registra un pago de $1,000 (reparto automático).
    await page.locator('tr:visible', { hasText: 'OP-0001' }).getByRole('checkbox').check()
    await expect(page.getByText('1 operación seleccionada')).toBeVisible()
    await page.getByRole('button', { name: 'Registrar pago', exact: true }).first().click()
    const modal = page.getByRole('dialog')
    await modal.getByLabel('Monto enviado (USD)').fill('1000')
    await modal.getByLabel('Monto enviado (USD)').press('Tab')
    await modal.getByRole('button', { name: 'Distribuir automáticamente' }).click()
    await modal.locator('input[type="file"]').setInputFiles(resolve(SHOTS, 'receipt.png'))
    await shot(page, '05-china-registrar-pago')
    await modal.getByRole('button', { name: 'Registrar pago' }).click()
    await expect(modal).toBeHidden()

    await page.getByRole('button', { name: /^Cobros/ }).click()
    const row = page.locator('tr:visible', { hasText: 'PG-0001' })
    await expect(row).toContainText('Por confirmar')
    await expect(row).toContainText('Confirmar ingreso →')
    await expect(page.getByText('Resumen ·')).toBeVisible()
    await shot(page, '06-china-cobros-por-confirmar')
  })

  test('Socio: indicadores, factura y pago propio', async ({ page }) => {
    await login(page, 'socio@e2e.test')
    await page.goto('/pagos-socio')
    await expect(page.getByRole('heading', { name: 'Pagos' })).toBeVisible({ timeout: 60_000 })

    await expect(page.getByText('Total facturado').locator('..')).toContainText('$1,500.00')
    await expect(page.getByText('En confirmación').first().locator('..')).toContainText('$1,000.00')
    await expect(page.getByText('Saldo por pagar').first().locator('..')).toContainText('$500.00')
    await shot(page, '07-socio-facturas')

    await page.getByRole('button', { name: /Nuestra cuenta bancaria en China/ }).click()
    await expect(page.getByText('Bank of China')).toBeVisible()
    await expect(page.getByText('BKCHHKHH')).toBeVisible()

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
    await expect(page.locator('tr:visible', { hasText: 'PG-0002' })).toContainText('Por confirmar')
    await shot(page, '09-socio-mis-pagos')
  })

  test('China: confirma con faltante, pasa a caja y emite la factura', async ({ page }) => {
    await login(page, 'china@e2e.test')
    await page.goto('/operaciones-china')
    await page.getByRole('button', { name: /^Cobros/ }).click()

    // PG-0001: llegaron $900 de $1,000 → faltante de $100 cargado a OP-0001.
    await page.locator('tr:visible', { hasText: 'PG-0001' }).getByRole('button', { name: /Confirmar ingreso/ }).click()
    const drawer = page.getByRole('dialog')
    // Avance como en la maqueta: Por confirmar → Confirmado → En caja, y los 3 pasos del pago.
    for (const text of ['Por confirmar', 'Confirmado', 'En caja', '1 · Pago del cliente', '2 · Confirmar ingreso', '3 · Cambio a RMB']) {
      await expect(drawer.getByText(text, { exact: true }).first()).toBeVisible()
    }
    await drawer.getByLabel('Monto real recibido en el banco (USD)').fill('900')
    await drawer.getByLabel('Monto real recibido en el banco (USD)').press('Tab')
    await expect(drawer).toContainText('¿A qué operación cargas la diferencia?')
    await drawer.getByRole('button', { name: /OP-0001/ }).first().click()
    await shot(page, '10-china-confirmar-faltante')
    await drawer.getByRole('button', { name: 'Confirmar ingreso' }).click()
    await expect(drawer.getByText('Monto confirmado (USD)')).toBeVisible()
    await drawer.getByLabel('Tipo de cambio del banco').fill('7.2')
    await drawer.getByLabel('Tipo de cambio del banco').press('Tab')
    await expect(drawer).toContainText('¥6,480.00')
    await drawer.getByRole('button', { name: 'Pasar a caja' }).click()
    await expect(drawer.getByText('Deshacer cambio')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('tr:visible', { hasText: 'PG-0001' })).toContainText('En caja')

    // PG-0002 del socio: confirmado completo.
    await page.locator('tr:visible', { hasText: 'PG-0002' }).getByRole('button', { name: /Confirmar ingreso/ }).click()
    await drawer.getByLabel('Monto real recibido en el banco (USD)').fill('500')
    await drawer.getByLabel('Monto real recibido en el banco (USD)').press('Tab')
    await drawer.getByRole('button', { name: 'Confirmar ingreso' }).click()
    await expect(drawer.getByText('Monto confirmado (USD)')).toBeVisible()
    await page.keyboard.press('Escape')
    await shot(page, '11-china-cobros-confirmados')

    // OP-0001: queda $100 por cobrar por el faltante.
    await page.getByRole('button', { name: /^Operaciones/ }).click()
    const op = page.locator('tr:visible', { hasText: 'OP-0001' })
    await expect(op).toContainText('$100.00')
    await expect(op).toContainText('Trasladar a otra orden')
    await expect(op).toContainText('¥6,480.00')
    await shot(page, '12-china-operacion-con-diferencia')

    // KPIs del encabezado = los de la maqueta: ingresado a caja cuenta todo ingreso confirmado.
    const kpi = (label: string) => page.getByText(label, { exact: true }).locator('..')
    await expect(kpi('Cantidad de operaciones')).toContainText('1')
    await expect(kpi('Monto por servicios')).toContainText('$1,000.00')
    await expect(kpi('Saldo por cobrar USD')).toContainText('$100.00')
    await expect(kpi('Ingresado a caja USD')).toContainText('$1,400.00')
    await expect(kpi('Ingresado a caja RMB')).toContainText('¥6,480.00')

    // Factura en PDF desde el backend, con historial.
    await op.getByRole('button', { name: 'Descargar factura' }).click()
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

  test('China: clientes (importador, tarifas del socio) y tarifa precargada en la operación', async ({ page }) => {
    await login(page, 'china@e2e.test')
    await page.goto('/clientes-china')
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible({ timeout: 60_000 })
    for (const column of ['Total servicio', 'Total facturado', 'Total pagado', 'Por cobrar', 'Operaciones']) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
    }
    const partner = page.locator('tr:visible', { hasText: 'Socio Ecuador Demo' })
    await expect(partner).toContainText('Socio')
    await expect(partner.getByRole('button', { name: /Los socios se administran/ })).toBeDisabled()

    // Nuevo importador.
    await page.getByRole('button', { name: 'Nuevo cliente' }).click()
    const form = page.getByRole('dialog')
    await form.getByRole('button', { name: 'Importador' }).click()
    await form.getByLabel('Nombre o empresa').fill('Distribuidora Quito')
    await form.getByLabel('País').fill('Ecuador')
    await form.getByLabel('WhatsApp').fill('+593 98 220 1187')
    await shot(page, '14-clientes-nuevo-importador')
    await form.getByRole('button', { name: 'Crear cliente' }).click()
    await expect(form).toBeHidden()
    await expect(page.locator('tr:visible', { hasText: 'Distribuidora Quito' })).toContainText('Importador')

    // Nuevo socio: se crea su organización y queda como pestaña propia.
    await page.getByRole('button', { name: 'Nuevo cliente' }).click()
    await form.getByLabel('Nombre o empresa').fill('Socio Peru E2E')
    await form.getByText('Selecciona el país').click()
    await page.getByRole('option', { name: /Per/ }).click()
    await page.getByRole('listbox').waitFor({ state: 'hidden' })
    await form.getByLabel('WhatsApp').fill('+51 987 654 321')
    for (const [label, value] of [['Consolidado · tarifa 1 (USD/CBM)', '98'], ['Consolidado · tarifa 2 (USD/CBM)', '93']]) {
      await form.getByLabel(label).fill(value)
      await form.getByLabel(label).press('Tab')
    }
    await shot(page, '14b-clientes-nuevo-socio')
    await form.getByRole('button', { name: 'Crear cliente' }).click()
    await expect(form).toBeHidden()
    await expect(page.locator('tr:visible', { hasText: 'Socio Peru E2E' })).toContainText('Socio')
    await expect(page.getByRole('button', { name: /^(Socio Peru E2E|Perú)/ }).first()).toBeVisible()

    // Los clientes que registró cada organización, agrupados por pestaña (solo lectura).
    // Las pestañas se nombran por país (Ecuador = Socio Ecuador Demo) y usan la tabla v1 de Base de datos de clientes.
    await page.getByRole('button', { name: /^Ecuador/ }).click()
    await expect(page.getByText('Base de datos de clientes · Ecuador')).toBeVisible()
    const registered = page.locator('tr:visible', { hasText: 'Importadora Costa Azul' })
    await expect(registered).toContainText('0992345678001')
    await registered.getByRole('button', { name: 'Ver cliente' }).click()
    await expect(page.getByRole('dialog')).toContainText('solo lectura')
    await shot(page, '14c-clientes-por-organizacion')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: /^China/ }).click()

    // Tarifas del socio (obligatorias).
    await partner.getByRole('button', { name: 'Editar' }).click()
    await expect(form).toContainText('Precios del socio')
    await form.getByLabel('WhatsApp').fill('+593 99 812 4410')
    await form.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(form).toContainText('Ingresa las dos tarifas')
    for (const [label, value] of [['Consolidado · tarifa 1 (USD/CBM)', '95'], ['Consolidado · tarifa 2 (USD/CBM)', '90']]) {
      await form.getByLabel(label).fill(value)
      await form.getByLabel(label).press('Tab')
    }
    await shot(page, '15-clientes-tarifas-socio')
    await form.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(form).toBeHidden()

    // Filtro por tipo y detalle del socio con su balance.
    await page.getByRole('button', { name: 'Importadores' }).click()
    await expect(page.locator('tr:visible', { hasText: 'Socio Ecuador Demo' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Todos', exact: true }).click()
    await page.locator('tr:visible', { hasText: 'Socio Ecuador Demo' }).getByRole('button', { name: 'Ver cliente' }).click()
    const detail = page.getByRole('dialog')
    await expect(detail).toContainText('Total facturado')
    await expect(detail).toContainText('OP-0001')
    await expect(detail.getByRole('button', { name: 'Descargar balance de pago' })).toBeVisible()
    await shot(page, '16-clientes-detalle')
    await page.keyboard.press('Escape')

    // La tarifa 1 del socio se precarga al crear una operación por CBM.
    await page.goto('/operaciones-china')
    await page.getByRole('button', { name: 'Nueva operación' }).click()
    const operation = page.getByRole('dialog')
    await operation.getByText('Selecciona un cliente').click()
    await page.getByRole('option', { name: /Socio Ecuador Demo/ }).click()
    await operation.getByRole('button', { name: 'Por CBM' }).click()
    await expect(operation.getByLabel('Tarifa por CBM (USD)')).toHaveValue(/95/)
    await expect(operation).toContainText('Tarifa 2 · $90.00')
    await shot(page, '17-operacion-tarifa-precargada')
  })
})
