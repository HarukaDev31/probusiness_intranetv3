import { ref } from 'vue'
import { OrganizacionPortalService } from '~/services/organizacion/organizacionPortalService'
import type { OrganizacionPortalUrls } from '~/types/organizacion-portal'

const FALLBACK_URL_CLIENTES = 'https://clientes.probusiness.pe'

function trimBase(url: string | null | undefined): string {
  return String(url || '').trim().replace(/\/+$/, '')
}

export function useOrganizacionPortal() {
  const portal = ref<OrganizacionPortalUrls | null>(null)
  const loading = ref(false)

  async function load(organizacionId?: number) {
    loading.value = true
    try {
      const res = await OrganizacionPortalService.getPortal(organizacionId)
      if (res.success && res.data) {
        portal.value = res.data
      }
      return portal.value
    } finally {
      loading.value = false
    }
  }

  function urlClientes(override?: string | null): string {
    return trimBase(override) || trimBase(portal.value?.url_clientes) || FALLBACK_URL_CLIENTES
  }

  function urlFirmaAcuerdo(uuid: string, override?: string | null): string {
    if (!uuid) return ''
    return `${urlClientes(override)}/firma-acuerdo-servicio/${uuid}`
  }

  function urlRecuperarContrasena(override?: string | null): string {
    return `${urlClientes(override)}/recuperar-contrasena`
  }

  return {
    portal,
    loading,
    load,
    urlClientes,
    urlFirmaAcuerdo,
    urlRecuperarContrasena,
  }
}
