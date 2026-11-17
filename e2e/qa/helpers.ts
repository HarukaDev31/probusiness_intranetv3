import { expect, type Locator, type Page } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Perfiles de QA. Usuario y contraseña SOLO por variables de entorno (nunca en el repo). */
export const PROFILES = {
  china: ['QA_CHINA_USER', 'QA_CHINA_PASS'],
  ventas: ['QA_VENTAS_USER', 'QA_VENTAS_PASS'],
  admin: ['QA_ADMIN_USER', 'QA_ADMIN_PASS'],
  socio: ['QA_SOCIO_USER', 'QA_SOCIO_PASS'],
  importador: ['QA_IMPORTADOR_USER', 'QA_IMPORTADOR_PASS']
} as const

export function credentials(profile: keyof typeof PROFILES) {
  const [u, p] = PROFILES[profile]
  const user = process.env[u]
  const pass = process.env[p]
  if (!user || !pass) throw new Error(`Faltan ${u} / ${p} en el entorno`)
  return { user, pass }
}

export async function login(page: Page, profile: keyof typeof PROFILES) {
  const { user, pass } = credentials(profile)
  await page.goto('/login')
  await page.getByPlaceholder('Ingresa tu correo').fill(user)
  await page.getByPlaceholder('Ingresa tu contraseña').fill(pass)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
}

/** PNG de 1×1 para adjuntar como comprobante. */
export function receiptFile(dir: string) {
  const path = resolve(dir, 'QA_E2E_comprobante.png')
  writeFileSync(path, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'))
  return path
}

/** Texto plano de un locator (espacios colapsados). */
export async function text(locator: Locator) {
  return (await locator.innerText()).replace(/\s+/g, ' ')
}

/** Botón visible cuya fila (tr) contiene `code` (DataTable duplica tablas para la columna fija). */
export async function rowButton(page: Page, name: string | RegExp, code: string) {
  const buttons = page.getByRole('button', { name })
  for (let i = 0; i < await buttons.count(); i++) {
    const b = buttons.nth(i)
    if (!(await b.isVisible())) continue
    if ((await b.evaluate((e) => e.closest('tr')?.textContent || '')).includes(code)) return b
  }
  throw new Error(`No hay botón «${name}» visible en la fila ${code}`)
}

/** Confirma el diálogo de confirmación estándar si aparece. */
export async function confirmIfAsked(page: Page) {
  const c = page.getByRole('button', { name: /^(Confirmar|Sí|Aceptar)$/ }).last()
  if (await c.isVisible({ timeout: 1500 }).catch(() => false)) await c.click()
}

export async function expectNoServerErrors(errors: string[]) {
  expect(errors, errors.join('\n')).toEqual([])
}

export function trackApiErrors(page: Page) {
  const errors: string[] = []
  page.on('response', (r) => {
    if (r.status() >= 500 && r.url().includes('/api/')) errors.push(`${r.status()} ${r.request().method()} ${r.url()}`)
  })
  page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`))
  return errors
}
