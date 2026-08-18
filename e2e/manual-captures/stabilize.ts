import type { Page } from '@playwright/test'

const busySelectors = [
  '[aria-busy="true"]',
  '[data-loading="true"]',
  '.animate-spin',
].join(',')

export async function prepareCapturePage(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.addStyleTag({
    content: `
      html { zoom: 0.85 !important; scroll-behavior: auto !important; }
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  })

  const collapseButton = page.getByRole('button', { name: 'Minimizar menú' })
  if (await collapseButton.isVisible().catch(() => false)) await collapseButton.click()
}

export async function waitUntilStable(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  // Varias vistas mantienen polling; una espera larga de networkidle penaliza cada captura.
  await page.waitForLoadState('networkidle', { timeout: 1_000 }).catch(() => undefined)
  await page.evaluate(() => document.fonts?.ready)

  await page.waitForFunction((selector) => {
    const visible = [...document.querySelectorAll(selector)].filter((element) => {
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return style.visibility !== 'hidden'
        && style.display !== 'none'
        && Number(style.opacity) > 0
        && box.width > 0
        && box.height > 0
    })
    return visible.length === 0
  }, busySelectors, { timeout: 10_000 }).catch(async () => {
    const visibleCount = await page.locator(busySelectors).evaluateAll(elements =>
      elements.filter(element => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.visibility !== 'hidden'
          && style.display !== 'none'
          && Number(style.opacity) > 0
          && box.width > 0
          && box.height > 0
      }).length,
    )
    if (visibleCount > 0) throw new Error(`La vista conserva ${visibleCount} indicador(es) de carga reales`)
  })

  await page.waitForTimeout(350)
}
