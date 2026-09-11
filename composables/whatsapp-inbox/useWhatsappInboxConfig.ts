import { ref } from 'vue'
import { WhatsappInboxConfigService } from '~/services/whatsappInbox/whatsappInboxConfigService'
import type { WaInboxOrgConfig, WaInboxOrgConfigPayload } from '~/types/whatsapp-inbox'

function emptyForm(): WaInboxOrgConfigPayload {
  return {
    enabled: false,
    phone_number_id: '',
    waba_id: '',
    display_number: '',
    graph_api_version: 'v19.0',
    default_language: 'es_PE',
    webhook_verify_token: '',
    access_token: '',
    app_secret: '',
    legacy_fallback: true,
    preview_from_template: true,
    session_when_window_open: true,
  }
}

export function useWhatsappInboxConfig() {
  const loading = ref(false)
  const config = ref<WaInboxOrgConfig | null>(null)
  const form = ref<WaInboxOrgConfigPayload>(emptyForm())
  const tokenSet = ref(false)
  const secretSet = ref(false)
  const verifyTokenSet = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await WhatsappInboxConfigService.getConfig()
      if (!res.success || !res.data) {
        throw new Error(res.message || 'No se pudo cargar la configuración')
      }
      applyConfig(res.data)
      return { ok: true as const }
    } finally {
      loading.value = false
    }
  }

  async function save() {
    const payload: WaInboxOrgConfigPayload = { ...form.value }
    if (!payload.access_token?.trim()) delete payload.access_token
    if (!payload.app_secret?.trim()) delete payload.app_secret
    if (!payload.webhook_verify_token?.trim()) delete payload.webhook_verify_token

    const res = await WhatsappInboxConfigService.saveConfig(payload)
    if (!res.success || !res.data) {
      throw new Error(res.message || 'No se pudo guardar')
    }
    applyConfig(res.data)
    return { ok: true as const }
  }

  function applyConfig(data: WaInboxOrgConfig) {
    config.value = data
    tokenSet.value = data.access_token_set
    secretSet.value = data.app_secret_set
    verifyTokenSet.value = data.webhook_verify_token_set
    form.value = {
      enabled: data.enabled,
      phone_number_id: data.phone_number_id || '',
      waba_id: data.waba_id || '',
      display_number: data.display_number || '',
      graph_api_version: data.graph_api_version || 'v19.0',
      default_language: data.default_language || 'es_PE',
      webhook_verify_token: '',
      access_token: '',
      app_secret: '',
      legacy_fallback: data.legacy_fallback,
      preview_from_template: data.preview_from_template,
      session_when_window_open: data.session_when_window_open,
    }
  }

  return { loading, config, form, tokenSet, secretSet, verifyTokenSet, load, save }
}
