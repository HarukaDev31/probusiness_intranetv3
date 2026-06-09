import { ref, computed } from 'vue'
import { EntregaService } from '~/services/cargaconsolidada/entrega/entregaService'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

/** PDF público en CDN: fetch simple sin Authorization (evita preflight OPTIONS). */
function isCdnPublicUrl(url: string): boolean {
  return /^https?:\/\/cdn\.probusiness\.pe\//i.test(url)
}

function buildPdfFetchInit(absoluteUrl: string): RequestInit {
  if (isCdnPublicUrl(absoluteUrl)) {
    return { mode: 'cors', credentials: 'omit' }
  }

  const token = import.meta.client ? localStorage.getItem('auth_token') : null
  return {
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }
}

/** Ruta relativa del storage Laravel → URL absoluta (mismo criterio que factura-guía). */
export function resolveStorageFileUrl(url: string): string {
  const cleaned = (url || '').replace(/\\\//g, '/').trim()
  if (!cleaned) return ''
  if (/^https?:\/\//i.test(cleaned)) return cleaned

  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
  const origin = apiBase.replace(/\/api\/?$/i, '')
  const path = cleaned.replace(/^\/+/, '')

  if (path.startsWith('storage/')) {
    return `${origin}/${path}`
  }
  return `${origin}/storage/${path}`
}

export interface FirmaCargaData {
  pdf_url: string
  pdf_url_firmado?: string
  nombre?: string
  telefono?: string
}

export function useFirmaCarga() {
  const { withSpinner } = useSpinner()
  const { showError, showSuccess } = useModal()

  const cargaData = ref<FirmaCargaData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isSigning = ref(false)

  const hasPdf = computed(() => {
    const d = cargaData.value
    return !!(d?.pdf_url || d?.pdf_url_firmado)
  })
  const hasSignedPdf = computed(() => !!cargaData.value?.pdf_url_firmado)
  const pdfUrl = computed(() => {
    if (!cargaData.value) return ''
    const raw = cargaData.value.pdf_url_firmado || cargaData.value.pdf_url || ''
    return resolveStorageFileUrl(raw)
  })

  const fetchPdfArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const absoluteUrl = resolveStorageFileUrl(url)
    if (!absoluteUrl) {
      throw new Error('URL del PDF no disponible')
    }

    const res = await fetch(absoluteUrl, buildPdfFetchInit(absoluteUrl))

    if (!res.ok) {
      throw new Error(`No se pudo descargar el PDF (${res.status})`)
    }

    const buffer = await res.arrayBuffer()
    const header = new Uint8Array(buffer.slice(0, 5))
    const signature = String.fromCharCode(...header)
    if (!signature.startsWith('%PDF')) {
      throw new Error('El archivo recibido no es un PDF válido')
    }

    return buffer
  }

  const getCargoEntregaPdf = async (
    idContenedor: number,
    idCotizacion: number,
    useGlobalSpinner = true
  ): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const loadPdf = async () => {
        const response = await EntregaService.getCargoEntregaPdf(idContenedor, idCotizacion)
        const d = response.data
        if (!d) throw new Error(response.error || 'No se pudo obtener el PDF')
        const original = (d.cargo_entrega_pdf_url ?? d.pdf_url) || ''
        const firmado = (d.cargo_entrega_pdf_firmado_url ?? d.pdf_url_firmado) || ''
        if (!original && !firmado) throw new Error('No hay PDF de cargo de entrega')
        const clean = (s: string) => (s || '').replace(/\\\//g, '/')
        cargaData.value = {
          pdf_url: clean(original || firmado),
          pdf_url_firmado: firmado ? clean(firmado) : undefined,
          nombre: d.nombre,
          telefono: d.telefono
        }
      }

      if (useGlobalSpinner) {
        await withSpinner(loadPdf, 'Obteniendo documento...')
      } else {
        await loadPdf()
      }
    } catch (err: any) {
      console.error('Error obteniendo PDF cargo entrega:', err)
      error.value = err.message
      showError('Error al obtener el documento', err.message || 'No se pudo cargar el PDF.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signCargoEntrega = async (payload: {
    id_contenedor: number
    id_cotizacion: number
    nombre: string
    dni: string
    signature: string
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      isSigning.value = true
      error.value = null

      const response = await withSpinner(
        () => EntregaService.signCargoEntrega(payload),
        'Guardando firma...'
      )

      if (response?.success) {
        showSuccess('Firma guardada', 'La firma se ha guardado correctamente y se ha enviado el mensaje por WhatsApp.')
        return { success: true }
      }

      return { success: false, error: response?.error }
    } catch (err: any) {
      error.value = err.message
      showError('Error al firmar', err.message || 'No se pudo guardar la firma.')
      return { success: false, error: err.message }
    } finally {
      isSigning.value = false
    }
  }

  const downloadCargoEntrega = async (): Promise<void> => {
    const raw = cargaData.value?.pdf_url_firmado || cargaData.value?.pdf_url
    if (!raw) {
      showError('Error', 'No hay documento disponible para descargar.')
      return
    }
    try {
      await withSpinner(async () => {
        const res = await fetch(pdfUrl.value, buildPdfFetchInit(pdfUrl.value))
        const blob = await res.blob()
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `cargo-entrega-firmado-${Date.now()}.pdf`
        link.click()
        URL.revokeObjectURL(link.href)
      }, 'Descargando...')
    } catch (err: any) {
      showError('Error al descargar', err.message || 'No se pudo descargar el documento.')
    }
  }

  const clearData = () => {
    cargaData.value = null
    error.value = null
  }

  return {
    cargaData: computed(() => cargaData.value),
    isLoading: computed(() => isLoading.value),
    isSigning: computed(() => isSigning.value),
    error: computed(() => error.value),
    hasPdf,
    hasSignedPdf,
    pdfUrl,
    getCargoEntregaPdf,
    fetchPdfArrayBuffer,
    signCargoEntrega,
    downloadCargoEntrega,
    clearData
  }
}
