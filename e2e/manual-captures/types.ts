export const CAPTURE_TYPES = ['control', 'fila', 'modal', 'destino', 'seccion', 'page'] as const
export type CaptureType = typeof CAPTURE_TYPES[number]

export type SelectorRef =
  | string
  | { css: string }
  | { testId: string }
  | { manualCapture: string }
  | { role: string; name?: string; exact?: boolean }
  | { text: string; exact?: boolean }

export type CaptureAction =
  | { type: 'click'; target: SelectorRef; timeout?: number }
  | { type: 'fill'; target: SelectorRef; value: string; timeout?: number }
  | { type: 'select'; target: SelectorRef; value: string | string[]; timeout?: number }
  | { type: 'goto'; url: string; waitUntil?: 'commit' | 'domcontentloaded' | 'load' | 'networkidle' }
  | { type: 'wait'; target?: SelectorRef; state?: 'attached' | 'detached' | 'visible' | 'hidden'; ms?: number; timeout?: number }

export interface CaptureShot {
  id: string
  type: CaptureType
  target?: SelectorRef
  url?: string
  actions?: CaptureAction[]
  expectedText?: string | string[]
  targetText?: string[]
  padding?: number
  minWidth?: number
  minHeight?: number
  masks?: SelectorRef[]
  piiAllow?: string[]
  expectedHash?: string | Record<string, string>
  enabled?: boolean
  output?: string
  intent?: {
    title?: string
    hint?: string
  }
}

export interface CaptureScreen {
  id: string
  url: string
  sourceId?: string
  expectedText?: string | string[]
  actions?: CaptureAction[]
  shots: CaptureShot[]
  enabled?: boolean
}

export interface CaptureRole {
  slug: string
  usernameEnv?: string
  passwordEnv?: string
  screens: CaptureScreen[]
  enabled?: boolean
}

export interface CaptureManifest {
  version: number
  baseUrl?: string
  login?: {
    endpoint?: string
    usernameField?: string
    passwordField?: string
  }
  roles: CaptureRole[]
}

export interface BackendCaptureEntry {
  capture_key: string | null
  roles: string[]
  screen: string | { id?: string; key?: string; url?: string } | null
  modulo?: string | null
  flow?: string | null
  step?: string | { number?: number; title?: string } | null
  hint?: string | null
  output?: string | null
  url?: string | null
  type?: CaptureType
  target?: SelectorRef
  actions?: CaptureAction[]
  expected_text?: string | string[]
  target_text?: string[]
  padding?: number
  min_width?: number
  min_height?: number
  masks?: SelectorRef[]
  pii_allow?: string[]
  expected_hash?: string | Record<string, string>
  enabled?: boolean
}

export interface BackendCaptureManifest {
  schema_version: number
  captures: BackendCaptureEntry[]
  screens?: Record<string, string | { url: string }> | Array<{ id?: string; key?: string; url: string }>
  login?: CaptureManifest['login']
  base_url?: string
}

export interface AuthState {
  token: string
  user: Record<string, unknown>
  menu: unknown[]
}

export interface CaptureMetadata {
  role: string
  screen: string
  shot: string
  type: CaptureType
  viewport: string
  path: string
  sha256: string
  bytes: number
  manifestSha256: string
}
