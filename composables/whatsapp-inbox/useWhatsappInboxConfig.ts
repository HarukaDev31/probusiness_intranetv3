import { ref } from 'vue'
import { WhatsappInboxConfigService } from '~/services/whatsappInbox/whatsappInboxConfigService'
import type { WaInboxConfigIndex, WaInboxLinea, WaInboxLineaPayload, WaInboxRoleOption } from '~/types/whatsapp-inbox'

export interface WaInboxLineaForm {
  id: number | null
  nombre: string
  is_default: boolean
  enabled: boolean
  phone_number_id: string
  display_number: string
  waba_id: string
  graph_api_version: string
  default_language: string
  roles: string[]
  access_token: string
  app_secret: string
  webhook_verify_token: string
  access_token_set: boolean
  app_secret_set: boolean
  webhook_verify_token_set: boolean
}

const ROL_COORDINACION = 'Coordinación'

function lineaVacia(): WaInboxLineaForm {
  return {
    id: null,
    nombre: '',
    is_default: false,
    enabled: false,
    phone_number_id: '',
    display_number: '',
    waba_id: '',
    graph_api_version: 'v19.0',
    default_language: 'es_PE',
    roles: [ROL_COORDINACION],
    access_token: '',
    app_secret: '',
    webhook_verify_token: '',
    access_token_set: false,
    app_secret_set: false,
    webhook_verify_token_set: false,
  }
}

function desdeLinea(linea: WaInboxLinea): WaInboxLineaForm {
  return {
    id: linea.id,
    nombre: linea.nombre || '',
    is_default: linea.is_default,
    enabled: linea.enabled,
    phone_number_id: linea.phone_number_id || '',
    display_number: linea.display_number || '',
    waba_id: linea.waba_id || '',
    graph_api_version: linea.graph_api_version || 'v19.0',
    default_language: linea.default_language || 'es_PE',
    roles: linea.roles?.length ? [...linea.roles] : [],
    access_token: '',
    app_secret: '',
    webhook_verify_token: '',
    access_token_set: linea.access_token_set,
    app_secret_set: linea.app_secret_set,
    webhook_verify_token_set: linea.webhook_verify_token_set,
  }
}

export function useWhatsappInboxConfig() {
  const loading = ref(false)
  const organizacionNombre = ref('')
  const roles = ref<WaInboxRoleOption[]>([])
  const lineas = ref<WaInboxLineaForm[]>([])

  async function load() {
    loading.value = true
    try {
      const res = await WhatsappInboxConfigService.getConfig()
      if (!res.success || !res.data) {
        throw new Error(res.message || 'No se pudo cargar la configuración')
      }
      applyIndex(res.data)
      return { ok: true as const }
    } finally {
      loading.value = false
    }
  }

  function applyIndex(data: WaInboxConfigIndex, conservarBorrador = false) {
    organizacionNombre.value = data.organizacion_nombre || ''
    roles.value = data.roles || []
    const guardadas = (data.lineas || []).map(desdeLinea)
    const borrador = conservarBorrador ? lineas.value.find((l) => l.id == null) : undefined
    lineas.value = borrador ? [...guardadas, borrador] : guardadas
  }

  function agregarLinea() {
    if (lineas.value.some((l) => l.id == null)) return
    lineas.value = [...lineas.value, lineaVacia()]
  }

  async function saveLinea(form: WaInboxLineaForm) {
    const payload: WaInboxLineaPayload = {
      nombre: form.nombre.trim(),
      is_default: form.is_default,
      enabled: form.enabled,
      phone_number_id: form.phone_number_id.trim(),
      waba_id: form.waba_id.trim(),
      display_number: form.display_number.trim(),
      graph_api_version: form.graph_api_version.trim() || 'v19.0',
      default_language: form.default_language.trim() || 'es_PE',
      roles: form.roles
        .map((rol) => (typeof rol === 'string' ? rol : (rol as { value?: string })?.value || ''))
        .map((rol) => rol.trim())
        .filter((rol) => rol !== ''),
    }
    if (form.access_token.trim()) payload.access_token = form.access_token.trim()
    if (form.app_secret.trim()) payload.app_secret = form.app_secret.trim()
    if (form.webhook_verify_token.trim()) payload.webhook_verify_token = form.webhook_verify_token.trim()

    const res = await WhatsappInboxConfigService.saveLinea(form.id, payload)
    if (!res.success || !res.data) {
      throw new Error(res.message || 'No se pudo guardar')
    }
    applyIndex(res.data, form.id != null)
    return { ok: true as const }
  }

  return { loading, organizacionNombre, roles, lineas, load, agregarLinea, saveLinea }
}
