import type { Locator } from '@playwright/test'
import sharp from 'sharp'
import type { CaptureShot } from './types'

const perceptualHashes = new Map<string, { key: string; hash: bigint }[]>()

export async function assertTargetTerms(target: Locator, shot: CaptureShot): Promise<void> {
  const required = shot.targetText ?? []
  if (required.length === 0) return
  const text = (await target.innerText()).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const missing = required.filter(term =>
    !text.includes(term.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()),
  )
  if (missing.length > 0) {
    throw new Error(`El target de ${shot.id} no contiene los términos requeridos: ${missing.join(', ')}`)
  }
}

export function captureMinimums(shot: CaptureShot): { minWidth: number; minHeight: number; minArea: number } {
  const compact = shot.type === 'control'
  return {
    minWidth: shot.minWidth ?? (compact ? 280 : 420),
    minHeight: shot.minHeight ?? (compact ? 80 : 180),
    minArea: compact ? 30_000 : 70_000,
  }
}

export function assertCaptureSize(
  shot: CaptureShot,
  clip: { width: number; height: number },
): void {
  const { minWidth, minHeight, minArea } = captureMinimums(shot)
  if (clip.width < minWidth || clip.height < minHeight) {
    throw new Error(
      `Recorte anómalo para ${shot.id}: ${Math.round(clip.width)}x${Math.round(clip.height)}; mínimo ${minWidth}x${minHeight}`,
    )
  }
  if (clip.width * clip.height < minArea) {
    throw new Error(`Recorte diminuto para ${shot.id}: área ${Math.round(clip.width * clip.height)} px²`)
  }
}

function hammingDistance(left: bigint, right: bigint): number {
  let value = left ^ right
  let distance = 0
  while (value > 0n) {
    distance += Number(value & 1n)
    value >>= 1n
  }
  return distance
}

async function differenceHash(buffer: Buffer): Promise<bigint> {
  const { data } = await sharp(buffer)
    .resize(9, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let hash = 0n
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      hash <<= 1n
      if (data[y * 9 + x] > data[y * 9 + x + 1]) hash |= 1n
    }
  }
  return hash
}

export async function assertNotVisualDuplicate(
  buffer: Buffer,
  project: string,
  captureKey: string,
): Promise<void> {
  const hash = await differenceHash(buffer)
  const projectHashes = perceptualHashes.get(project) ?? []
  const duplicate = projectHashes.find(item => item.key !== captureKey && hammingDistance(item.hash, hash) <= 2)
  if (duplicate) {
    throw new Error(`Duplicado visual detectado: ${captureKey} coincide perceptualmente con ${duplicate.key}`)
  }
  projectHashes.push({ key: captureKey, hash })
  perceptualHashes.set(project, projectHashes)
}
