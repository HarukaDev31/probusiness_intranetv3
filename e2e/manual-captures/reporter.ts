import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { capturesRoot } from './manifest'
import type { CaptureMetadata } from './types'

interface ReportItem extends Partial<CaptureMetadata> {
  captureTest: boolean
  title: string
  status: string
  durationMs: number
  error?: string
}

export default class ManualCapturesReporter implements Reporter {
  private readonly startedAt = new Date().toISOString()
  private readonly items: ReportItem[] = []

  onTestEnd(test: TestCase, result: TestResult): void {
    const attachment = result.attachments.find(item => item.name === 'manual-capture-metadata')
    let metadata: Partial<CaptureMetadata> = {}
    if (attachment?.body) {
      try {
        metadata = JSON.parse(attachment.body.toString()) as CaptureMetadata
      } catch {
        metadata = {}
      }
    }
    this.items.push({
      ...metadata,
      captureTest: test.location.file.endsWith('manual-captures.spec.ts'),
      title: test.titlePath().join(' > '),
      status: result.status,
      durationMs: result.duration,
      error: result.error?.message,
    })
  }

  onEnd(result: FullResult): void {
    const captures = this.items.filter(item => item.captureTest)
    if (captures.length === 0) return
    mkdirSync(capturesRoot, { recursive: true })
    const report = {
      version: 1,
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      status: result.status,
      totals: {
        tests: captures.length,
        passed: captures.filter(item => item.status === 'passed').length,
        failed: captures.filter(item => item.status !== 'passed' && item.status !== 'skipped').length,
        skipped: captures.filter(item => item.status === 'skipped').length,
      },
      captures,
    }
    writeFileSync(join(capturesRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  }
}
