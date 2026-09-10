import type { APIRequestContext, BrowserContext } from '@playwright/test'
import { envName } from './manifest'
import type { AuthState, CaptureManifest, CaptureRole } from './types'

const cache = new Map<string, AuthState>()

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta la variable de entorno ${name}; el runner nunca almacena credenciales`)
  return value
}

function normalizeUser(raw: Record<string, unknown>): Record<string, unknown> {
  if ('raw' in raw && 'id' in raw) return raw
  return {
    id: raw.ID_Usuario ?? raw.id,
    email: raw.Txt_Email ?? raw.No_Usuario ?? raw.email ?? '',
    name: raw.No_Usuario ?? raw.name ?? '',
    role: raw.role ?? 'user',
    avatar: null,
    lastLogin: raw.Fe_Creacion ?? null,
    isActive: raw.Nu_Estado == null ? true : raw.Nu_Estado === 1,
    raw,
  }
}

export async function authenticateRole(
  request: APIRequestContext,
  role: CaptureRole,
  manifest: CaptureManifest,
  frontendBaseUrl: string,
): Promise<AuthState> {
  const cached = cache.get(role.slug)
  if (cached) return cached

  const usernameEnv = role.usernameEnv ?? envName(role.slug, 'USER')
  const passwordEnv = role.passwordEnv ?? envName(role.slug, 'PASSWORD')
  const username = requiredEnv(usernameEnv)
  const password = requiredEnv(passwordEnv)
  const endpoint = manifest.login?.endpoint ?? '/api/auth/login'
  const apiBaseUrl = process.env.MANUAL_CAPTURE_API_URL ?? manifest.baseUrl ?? frontendBaseUrl
  const response = await request.post(new URL(endpoint, apiBaseUrl).toString(), {
    data: {
      [manifest.login?.usernameField ?? 'No_Usuario']: username,
      [manifest.login?.passwordField ?? 'No_Password']: password,
    },
  })

  if (!response.ok()) {
    throw new Error(`Login API falló para ${role.slug}: HTTP ${response.status()} ${await response.text()}`)
  }

  const body = await response.json() as Record<string, any>
  const payload = body.data && typeof body.data === 'object' ? { ...body, ...body.data } : body
  if (payload.success === false || !payload.token || !payload.user) {
    throw new Error(`Login API inválido para ${role.slug}: ${payload.message ?? 'faltan token o user'}`)
  }

  const auth: AuthState = {
    token: String(payload.token),
    user: normalizeUser(payload.user),
    menu: Array.isArray(payload.menus) ? payload.menus : [],
  }
  cache.set(role.slug, auth)
  return auth
}

export async function injectAuth(context: BrowserContext, auth: AuthState): Promise<void> {
  await context.addInitScript((state: AuthState) => {
    localStorage.setItem('auth_token', state.token)
    localStorage.setItem('auth_user', JSON.stringify(state.user))
    localStorage.setItem('auth_menu', JSON.stringify(state.menu))
  }, auth)
}
