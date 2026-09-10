import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { resolveLocator, runActions } from './actions'
import { authenticateRole, injectAuth } from './auth'
import { resolveIntentTarget } from './intent'
import { capturesRoot, loadManifest } from './manifest'
import { detectPii } from './pii'
import { sanitizeSensitiveData } from './privacy'
import { assertCaptureSize, assertNotVisualDuplicate, assertTargetTerms, captureMinimums } from './quality'
import { prepareCapturePage, waitUntilStable } from './stabilize'
import type { CaptureMetadata, CaptureShot } from './types'

const loaded = loadManifest()

function expectedTexts(...values: Array<string | string[] | undefined>): string[] {
  return values.flatMap(value => value == null ? [] : Array.isArray(value) ? value : [value])
}

async function assertExpectedText(page: Page, texts: string[]): Promise<void> {
  for (const text of texts) await expect(page.getByText(text, { exact: false }).first()).toBeVisible()
}

async function expandIfSmall(page: Page, target: Locator, shot: CaptureShot): Promise<Locator> {
  const box = await target.boundingBox()
  const { minWidth, minHeight } = captureMinimums(shot)
  if (box && box.width >= minWidth && box.height >= minHeight) return target

  const container = target.locator(
    'xpath=ancestor-or-self::*[@data-manual-capture or @role="dialog" or self::form or self::article or self::main or self::section][1]',
  )
  if (await container.isVisible().catch(() => false)) {
    const expanded = await container.boundingBox()
    if (expanded && expanded.width * expanded.height > (box?.width ?? 0) * (box?.height ?? 0)) return container
  }
  if (shot.type !== 'control') {
    const main = page.getByRole('main').or(page.locator('main')).first()
    if (await main.isVisible().catch(() => false)) return main
  }
  return target
}

async function targetFor(page: Page, shot: CaptureShot): Promise<Locator> {
  const resolved = shot.target ? resolveLocator(page, shot.target) : await resolveIntentTarget(page, shot)
  await expect(resolved.first(), `Target no visible para ${shot.id}`).toBeVisible()
  return expandIfSmall(page, resolved.first(), shot)
}

function variantOutput(output: string, project: string): string {
  if (project === '1920x1200') return output
  if (/--1920x1200\.png$/i.test(output)) return output.replace(/--1920x1200\.png$/i, `--${project}.png`)
  return output.replace(/\.png$/i, `--${project}.png`)
}

async function screenshotClip(page: Page, target: Locator, padding: number) {
  const box = await target.boundingBox()
  if (!box) throw new Error('No se pudo calcular el área visible del target')
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('El proyecto Playwright no tiene viewport')
  const x = Math.max(0, box.x - padding)
  const y = Math.max(0, box.y - padding)
  return {
    x,
    y,
    width: Math.min(viewport.width - x, box.width + padding * 2),
    height: Math.min(viewport.height - y, box.height + padding * 2),
  }
}

for (const role of loaded.roles) {
  for (const screen of role.screens) {
    for (const shot of screen.shots) {
      test(`${role.slug} / ${screen.id} / ${shot.id}`, async ({ page, context, request, baseURL }, testInfo) => {
        const frontendBaseUrl = baseURL ?? process.env.MANUAL_CAPTURE_BASE_URL ?? 'http://127.0.0.1:3000'
        const auth = await authenticateRole(request, role, loaded.manifest, frontendBaseUrl)
        await injectAuth(context, auth)

        await page.goto(screen.url, { waitUntil: 'domcontentloaded' })
        await waitUntilStable(page)
        await runActions(page, screen.actions)
        if (shot.url) await page.goto(shot.url, { waitUntil: 'domcontentloaded' })
        await runActions(page, shot.actions)
        await prepareCapturePage(page)
        await waitUntilStable(page)
        await sanitizeSensitiveData(page)

        await assertExpectedText(page, expectedTexts(screen.expectedText, shot.expectedText))
        const target = await targetFor(page, shot)
        await assertTargetTerms(target, shot)
        const pii = detectPii(await target.innerText(), shot.piiAllow)
        if (pii.length > 0) {
          throw new Error(`PII residual en ${shot.id}: ${[...new Set(pii.map(item => item.type))].join(', ')}`)
        }

        const project = testInfo.project.name
        const filePath = shot.output
          ? join(capturesRoot, variantOutput(shot.output, project))
          : join(capturesRoot, role.slug, screen.id, `${shot.id}--${project}.png`)
        mkdirSync(dirname(filePath), { recursive: true })
        const masks = (shot.masks ?? []).map(mask => resolveLocator(page, mask))
        const clip = await screenshotClip(page, target, shot.padding ?? 24)
        assertCaptureSize(shot, clip)
        const buffer = await page.screenshot({
          animations: 'disabled',
          caret: 'hide',
          clip,
          mask: masks,
          maskColor: '#CBD5E1',
          scale: 'css',
        })
        await assertNotVisualDuplicate(buffer, project, shot.id)
        writeFileSync(filePath, buffer)
        const sha256 = createHash('sha256').update(buffer).digest('hex')
        const expectedHash = typeof shot.expectedHash === 'string'
          ? shot.expectedHash
          : shot.expectedHash?.[project]
        if (expectedHash) expect(sha256, `Hash inesperado para ${role.slug}/${screen.id}/${shot.id}`).toBe(expectedHash)

        const metadata: CaptureMetadata = {
          role: role.slug,
          screen: screen.id,
          shot: shot.id,
          type: shot.type,
          viewport: project,
          path: filePath,
          sha256,
          bytes: buffer.byteLength,
          manifestSha256: loaded.sha256,
        }
        await testInfo.attach('manual-capture-metadata', {
          body: Buffer.from(JSON.stringify(metadata)),
          contentType: 'application/json',
        })
      })
    }
  }
}

test('el manifiesto contiene al menos una captura habilitada', async () => {
  expect(
    loaded.roles.flatMap(role => role.screens).flatMap(screen => screen.shots).length,
    `No hay capturas habilitadas en ${loaded.path}; revisa filtros MANUAL_CAPTURE_ROLE/SCREEN/SHOT`,
  ).toBeGreaterThan(0)
})
