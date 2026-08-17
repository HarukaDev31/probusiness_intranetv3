import type { Locator, Page } from '@playwright/test'
import type { CaptureAction, SelectorRef } from './types'

export function resolveLocator(page: Page, target: SelectorRef): Locator {
  if (typeof target === 'string') return page.locator(target)
  if ('css' in target) return page.locator(target.css)
  if ('testId' in target) return page.getByTestId(target.testId)
  if ('manualCapture' in target) return page.locator(`[data-manual-capture=${JSON.stringify(target.manualCapture)}]`)
  if ('text' in target) return page.getByText(target.text, { exact: target.exact })
  return page.getByRole(target.role as any, { name: target.name, exact: target.exact })
}

export async function runActions(page: Page, actions: CaptureAction[] = []): Promise<void> {
  for (const action of actions) {
    if (action.type === 'goto') {
      await page.goto(action.url, { waitUntil: action.waitUntil ?? 'domcontentloaded' })
      continue
    }
    if (action.type === 'wait') {
      if (action.ms != null) await page.waitForTimeout(action.ms)
      if (action.target) {
        await resolveLocator(page, action.target).waitFor({
          state: action.state ?? 'visible',
          timeout: action.timeout,
        })
      }
      continue
    }

    const locator = resolveLocator(page, action.target)
    if (action.type === 'click') {
      await locator.click({ timeout: action.timeout })
    } else if (action.type === 'fill') {
      await locator.fill(action.value, { timeout: action.timeout })
    } else {
      await locator.selectOption(action.value, { timeout: action.timeout })
    }
  }
}
