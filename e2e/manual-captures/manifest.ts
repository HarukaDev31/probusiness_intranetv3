import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { inferCaptureType } from './intent'
import { captureOverride } from './capture-overrides'
import {
  CAPTURE_TYPES,
  type BackendCaptureEntry,
  type BackendCaptureManifest,
  type CaptureManifest,
  type CaptureRole,
  type CaptureScreen,
  type CaptureShot,
} from './types'

const projectRoot = resolve(import.meta.dirname, '../..')
export const backendRoot = resolve(projectRoot, process.env.MANUAL_CAPTURE_BACKEND ?? '../intranet_back')
export const capturesRoot = resolve(
  process.env.MANUAL_CAPTURE_OUTPUT ?? resolve(backendRoot, 'resources/manual/capturas'),
)

const defaultManifest = resolve(capturesRoot, 'manifest.json')
const exampleManifest = resolve(import.meta.dirname, 'manifest.example.json')
export const manifestPath = resolve(process.env.MANUAL_CAPTURE_MANIFEST ?? defaultManifest)

function assertId(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/i.test(value)) {
    throw new Error(`${label} debe ser un identificador seguro (letras, números, punto, guion o guion bajo)`)
  }
}

function validateShot(shot: CaptureShot, label: string): void {
  assertId(shot.id, `${label}.id`)
  if (!CAPTURE_TYPES.includes(shot.type)) throw new Error(`${label}.type no es válido`)
  if (!shot.target && !shot.intent?.title && !shot.intent?.hint) {
    throw new Error(`${label} necesita target explícito o step.title/hint para resolver una intención`)
  }
  if (shot.padding != null && (shot.padding < 0 || shot.padding > 200)) {
    throw new Error(`${label}.padding debe estar entre 0 y 200`)
  }
  if (shot.minWidth != null && shot.minWidth < 200) throw new Error(`${label}.minWidth debe ser al menos 200`)
  if (shot.minHeight != null && shot.minHeight < 100) throw new Error(`${label}.minHeight debe ser al menos 100`)
}

function validateManifest(value: unknown): asserts value is CaptureManifest {
  if (!value || typeof value !== 'object') throw new Error('El manifiesto debe ser un objeto JSON')
  const manifest = value as CaptureManifest
  if (!Number.isInteger(manifest.version) || manifest.version < 1) throw new Error('manifest.version debe ser un entero positivo')
  if (!Array.isArray(manifest.roles)) throw new Error('manifest.roles debe ser un arreglo')

  const roleIds = new Set<string>()
  for (const [roleIndex, role] of manifest.roles.entries()) {
    assertId(role.slug, `roles[${roleIndex}].slug`)
    if (roleIds.has(role.slug)) throw new Error(`Rol duplicado: ${role.slug}`)
    roleIds.add(role.slug)
    if (!Array.isArray(role.screens)) throw new Error(`roles[${roleIndex}].screens debe ser un arreglo`)
    if (role.enabled === false) continue
    for (const [screenIndex, screen] of role.screens.entries()) {
      assertId(screen.id, `roles[${roleIndex}].screens[${screenIndex}].id`)
      if (screen.enabled === false) continue
      if (typeof screen.url !== 'string' || !screen.url.startsWith('/')) {
        throw new Error(`La URL de ${role.slug}/${screen.id} debe ser relativa y comenzar con /`)
      }
      if (!Array.isArray(screen.shots)) throw new Error(`${role.slug}/${screen.id}.shots debe ser un arreglo`)
      screen.shots.forEach((shot, shotIndex) => {
        if (shot.enabled !== false) validateShot(shot, `${role.slug}/${screen.id}.shots[${shotIndex}]`)
      })
    }
  }
}

function safeId(value: string, fallback: string): string {
  const id = value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '--')
    .replace(/^-+|-+$/g, '')
  return id || fallback
}

function validateUrl(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    throw new Error(`${label} debe definir una URL relativa que comience con /`)
  }
  return value
}

function validateOutput(value: string, captureKey: string): string {
  const output = value.replace(/\\/g, '/')
  if (isAbsolute(output) || output.startsWith('/') || output.split('/').includes('..') || !output.toLowerCase().endsWith('.png')) {
    throw new Error(`output inválido para ${captureKey}: debe ser una ruta PNG relativa sin ".."`)
  }
  return output
}

function screenRegistry(manifest: BackendCaptureManifest): Map<string, string> {
  const result = new Map<string, string>()
  if (Array.isArray(manifest.screens)) {
    for (const [index, screen] of manifest.screens.entries()) {
      const key = screen.id ?? screen.key
      if (!key) throw new Error(`screens[${index}] necesita id o key`)
      result.set(key, validateUrl(screen.url, `screens[${index}].url`))
    }
  } else if (manifest.screens && typeof manifest.screens === 'object') {
    for (const [key, screen] of Object.entries(manifest.screens)) {
      result.set(key, validateUrl(typeof screen === 'string' ? screen : screen.url, `screens.${key}.url`))
    }
  }
  return result
}

function canonicalScreen(entry: BackendCaptureEntry, screens: Map<string, string>, index: number): { id: string; sourceId: string; url: string } {
  const raw = entry.screen
  const sourceId = typeof raw === 'string'
    ? raw
    : raw?.id ?? raw?.key ?? entry.modulo ?? `screen-${index + 1}`
  const url = entry.url
    ?? (typeof raw === 'object' && raw ? raw.url : undefined)
    ?? screens.get(sourceId)
    ?? (sourceId.startsWith('/') ? sourceId : undefined)
  return {
    id: safeId(sourceId, `screen-${index + 1}`),
    sourceId,
    url: validateUrl(url, `captures[${index}] (${entry.capture_key ?? 'sin capture_key'}).url o screen URL`),
  }
}

function canonicalShot(entry: BackendCaptureEntry, index: number): CaptureShot {
  const captureKey = entry.capture_key
  if (typeof captureKey !== 'string' || !captureKey.trim()) {
    throw new Error(`captures[${index}].capture_key es obligatorio; exporta el manifiesto backend con --strict`)
  }
  assertId(captureKey, `captures[${index}].capture_key`)
  const title = typeof entry.step === 'string' ? entry.step : entry.step?.title
  const hint = entry.hint ?? undefined
  const override = captureOverride(captureKey)
  return {
    id: captureKey,
    type: entry.type ?? inferCaptureType(title, hint),
    target: entry.target,
    actions: entry.actions,
    expectedText: entry.expected_text,
    targetText: entry.target_text,
    padding: entry.padding,
    minWidth: entry.min_width,
    minHeight: entry.min_height,
    masks: entry.masks,
    piiAllow: entry.pii_allow,
    expectedHash: entry.expected_hash,
    enabled: entry.enabled,
    output: validateOutput(entry.output || `${captureKey}.png`, captureKey),
    intent: { title, hint },
    ...override,
  }
}

export function normalizeManifest(value: unknown): CaptureManifest {
  if (!value || typeof value !== 'object') throw new Error('El manifiesto debe ser un objeto JSON')
  if ('roles' in value) {
    const nested = value as CaptureManifest
    const normalized: CaptureManifest = {
      ...nested,
      roles: nested.roles.map(role => ({
        ...role,
        screens: role.screens.map(screen => ({
          ...screen,
          sourceId: screen.sourceId ?? screen.id,
          shots: screen.shots.map((shot) => {
            const manual = (shot as CaptureShot & {
              manual?: {
                output?: string
                hint?: string
                step?: { title?: string }
              }
            }).manual
            const override = captureOverride(shot.id)
            return {
              ...shot,
              output: shot.output ?? (manual?.output ? validateOutput(manual.output, shot.id) : undefined),
              intent: shot.intent ?? {
                title: manual?.step?.title,
                hint: manual?.hint,
              },
              ...override,
            }
          }),
        })),
      })),
    }
    validateManifest(normalized)
    return normalized
  }

  const backend = value as BackendCaptureManifest
  if (!Number.isInteger(backend.schema_version) || backend.schema_version < 1) {
    throw new Error('manifest.schema_version debe ser un entero positivo')
  }
  if (!Array.isArray(backend.captures)) throw new Error('manifest.captures debe ser un arreglo')

  const screens = screenRegistry(backend)
  const roles = new Map<string, CaptureRole>()
  backend.captures.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') throw new Error(`captures[${index}] debe ser un objeto`)
    if (entry.enabled === false) return
    if (!Array.isArray(entry.roles) || entry.roles.length === 0) {
      throw new Error(`captures[${index}] (${entry.capture_key ?? 'sin capture_key'}) necesita al menos un rol`)
    }
    const screen = canonicalScreen(entry, screens, index)
    const shot = canonicalShot(entry, index)
    for (const roleSlug of entry.roles) {
      assertId(roleSlug, `captures[${index}].roles`)
      let role = roles.get(roleSlug)
      if (!role) {
        role = { slug: roleSlug, screens: [] }
        roles.set(roleSlug, role)
      }
      let roleScreen = role.screens.find(item => item.sourceId === screen.sourceId)
      if (!roleScreen) {
        roleScreen = { ...screen, shots: [] }
        role.screens.push(roleScreen)
      } else if (roleScreen.url !== screen.url) {
        throw new Error(`URL conflictiva para screen "${screen.sourceId}" del rol ${roleSlug}`)
      }
      if (roleScreen.shots.some(item => item.id === shot.id)) {
        throw new Error(`capture_key duplicada para ${roleSlug}/${screen.sourceId}: ${shot.id}`)
      }
      roleScreen.shots.push({ ...shot })
    }
  })

  const normalized: CaptureManifest = {
    version: backend.schema_version,
    baseUrl: backend.base_url,
    login: backend.login,
    roles: [...roles.values()],
  }
  validateManifest(normalized)
  return normalized
}

function matches(value: string, filter?: string): boolean {
  if (!filter) return true
  return filter.split(',').map(item => item.trim()).filter(Boolean).some(item => value === item)
}

export interface LoadedManifest {
  manifest: CaptureManifest
  path: string
  sha256: string
  roles: CaptureRole[]
}

export function loadManifest(): LoadedManifest {
  const path = existsSync(manifestPath) ? manifestPath : exampleManifest
  const source = readFileSync(path, 'utf8')
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch (error) {
    throw new Error(`No se pudo leer el manifiesto JSON ${path}: ${(error as Error).message}`)
  }
  const manifest = normalizeManifest(raw)

  const roleFilter = process.env.MANUAL_CAPTURE_ROLE
  const screenFilter = process.env.MANUAL_CAPTURE_SCREEN
  const shotFilter = process.env.MANUAL_CAPTURE_SHOT
  const roles = manifest.roles
    .filter(role => role.enabled !== false && matches(role.slug, roleFilter))
    .map((role): CaptureRole => ({
      ...role,
      screens: role.screens
        .filter(screen => screen.enabled !== false && (matches(screen.id, screenFilter) || matches(screen.sourceId ?? screen.id, screenFilter)))
        .map((screen): CaptureScreen => ({
          ...screen,
          shots: screen.shots.filter(shot => shot.enabled !== false && matches(shot.id, shotFilter)),
        }))
        .filter(screen => screen.shots.length > 0),
    }))
    .filter(role => role.screens.length > 0)

  return {
    manifest,
    path,
    sha256: createHash('sha256').update(source).digest('hex'),
    roles,
  }
}

export function envName(role: string, kind: 'USER' | 'PASSWORD'): string {
  return `MANUAL_CAPTURE_${role.replace(/[^a-z0-9]/gi, '_').toUpperCase()}_${kind}`
}
