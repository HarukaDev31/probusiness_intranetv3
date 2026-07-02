import { ref, computed, readonly } from 'vue'
import { NotificationPreferenceService } from '~/services/notifications/notificationPreferenceService'
import type {
  WsNotificationChannel,
  WsNotificationPreferenceRecord,
  WsNotificationType,
} from '~/types/notifications/preferences'
import { WS_NOTIFICATION_TYPES, getWsNotificationType } from './constants'
import { getAvailableNotificationKeysForUser } from './getAvailableKeysForUser'
import { useUserRole } from '~/composables/auth/useUserRole'
import { collectMenuRoutes } from '~/utils/menuRoutes'
import type { AuthMenu } from '~/services/authService'

// Estado singleton: los handlers de socket viven fuera de un `setup`,
// por eso el estado es a nivel de módulo y se comparte entre todos los usos.
const overrides = ref<Record<string, boolean>>({})
const loaded = ref(false)
const loading = ref(false)
const saving = ref(false)
let loadPromise: Promise<void> | null = null

const overrideKey = (key: string, canal: WsNotificationChannel): string => `${key}::${canal}`

const applyRecords = (records: WsNotificationPreferenceRecord[]): void => {
  const next: Record<string, boolean> = {}
  records.forEach(record => {
    next[overrideKey(record.notification_key, record.canal)] = !!record.habilitado
  })
  overrides.value = next
}

/**
 * Resuelve si un aviso debe mostrarse: override del usuario > default del catálogo > true.
 * Los tipos no silenciables siempre devuelven true.
 */
const resolve = (key: string, canal: WsNotificationChannel): boolean => {
  const type = getWsNotificationType(key)
  if (!type) return true
  if (!type.silenciable) return true

  const override = overrides.value[overrideKey(key, canal)]
  if (override !== undefined) return override

  const fallback = type.defaults[canal]
  return fallback !== undefined ? fallback : true
}

/**
 * Carga las preferencias del usuario una sola vez (cacheado).
 * Idempotente: llamadas concurrentes comparten la misma promesa.
 */
export const loadNotificationPreferences = async (force = false): Promise<void> => {
  if (loaded.value && !force) return
  if (loadPromise && !force) return loadPromise

  loadPromise = (async () => {
    loading.value = true
    try {
      const records = await NotificationPreferenceService.getPreferences()
      applyRecords(records)
      loaded.value = true
    } catch (error) {
      // Si falla, se mantienen los defaults del catálogo (no bloquea avisos).
      console.error('No se pudieron cargar las preferencias de notificaciones:', error)
    } finally {
      loading.value = false
      loadPromise = null
    }
  })()

  return loadPromise
}

/** Limpia el estado (p. ej. en logout). */
export const resetNotificationPreferences = (): void => {
  overrides.value = {}
  loaded.value = false
  loadPromise = null
}

/**
 * Accesor sincrónico para handlers de websocket (fuera de `setup`).
 * Devuelve true si el aviso debe mostrarse por ese canal.
 */
export const canShowWsNotification = (
  key: string,
  canal: WsNotificationChannel = 'modal'
): boolean => resolve(key, canal)

function readMenuRoutes(): string[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem('auth_menu')
    if (!raw) return []
    return collectMenuRoutes(JSON.parse(raw) as AuthMenu[])
  } catch {
    return []
  }
}

export const useNotificationPreferences = () => {
  const { currentRole, fetchCurrentUser } = useUserRole()

  /** Claves que este usuario puede configurar (según rol + menú). */
  const availableKeys = computed(() => {
    const role = currentRole.value
    if (!role) return new Set<string>()
    return new Set(getAvailableNotificationKeysForUser(role, readMenuRoutes()))
  })

  /** Tipos del catálogo filtrados a los eventos asociados al usuario. */
  const availableTypes = computed(() =>
    WS_NOTIFICATION_TYPES.filter(type => availableKeys.value.has(type.key))
  )

  const isEnabled = (key: string, canal: WsNotificationChannel): boolean => resolve(key, canal)

  const setEnabled = async (
    key: string,
    canal: WsNotificationChannel,
    value: boolean
  ): Promise<void> => {
    const type = getWsNotificationType(key)
    if (!type || !type.silenciable) return
    if (!availableKeys.value.has(key)) return

    const prev = overrides.value[overrideKey(key, canal)]

    // Actualización optimista
    overrides.value = { ...overrides.value, [overrideKey(key, canal)]: value }
    saving.value = true
    try {
      await NotificationPreferenceService.savePreferences([
        { notification_key: key, canal, habilitado: value },
      ])
    } catch (error) {
      // Revertir si falla el guardado
      const reverted = { ...overrides.value }
      if (prev === undefined) {
        delete reverted[overrideKey(key, canal)]
      } else {
        reverted[overrideKey(key, canal)] = prev
      }
      overrides.value = reverted
      throw error
    } finally {
      saving.value = false
    }
  }

  /** Tipos agrupados por módulo (solo los del usuario). */
  const groupedTypes = computed<Record<string, WsNotificationType[]>>(() => {
    const groups: Record<string, WsNotificationType[]> = {}
    availableTypes.value.forEach(type => {
      if (!groups[type.modulo]) groups[type.modulo] = []
      groups[type.modulo].push(type)
    })
    return groups
  })

  const hasAvailableTypes = computed(() => availableTypes.value.length > 0)

  return {
    loading: readonly(loading),
    saving: readonly(saving),
    loaded: readonly(loaded),
    availableTypes,
    hasAvailableTypes,
    groupedTypes,
    isEnabled,
    setEnabled,
    load: loadNotificationPreferences,
    fetchCurrentUser,
  }
}
