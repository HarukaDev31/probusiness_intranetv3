import { ID_ORGANIZACION_ADMIN, ROLES } from '~/constants/roles'

export default defineNuxtRouteMiddleware(() => {
  if (process.server) return

  const authUser = localStorage.getItem('auth_user')
  const token = localStorage.getItem('auth_token')
  if (!authUser || !token) {
    return navigateTo('/login')
  }

  try {
    const user = JSON.parse(authUser) as {
      raw?: { grupo?: { nombre?: string }; organizacion?: { id?: number }; nombre?: string }
      grupo?: { nombre?: string }
      organizacion?: { id?: number }
      nombre?: string
    }
    const role = String(user.raw?.grupo?.nombre || user.grupo?.nombre || '').trim()
    const orgId = Number(user.raw?.organizacion?.id || user.organizacion?.id || 0)
    const username = String(user.raw?.nombre || user.nombre || '').trim().toLowerCase()

    const allowed = orgId === ID_ORGANIZACION_ADMIN
      ? username === 'root' || role === ROLES.GERENCIA || role === ROLES.GERENTE_GENERAL
      : role === ROLES.SOCIO

    if (!allowed) {
      return navigateTo('/')
    }
  } catch {
    return navigateTo('/login')
  }
})
