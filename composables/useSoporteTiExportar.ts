import { ref } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiExportacion } from '~/types/soporteTi'

/** Exportar el ticket completo como texto (solo rol Soporte): carga, copia y descarga .txt. */
export function useSoporteTiExportar() {
  const cargando = ref(false)
  const error = ref('')
  const exportacion = ref<SoporteTiExportacion | null>(null)
  const copiado = ref(false)

  async function cargar(solicitudId: number): Promise<void> {
    cargando.value = true
    error.value = ''
    exportacion.value = null
    try {
      const res = await SoporteTiService.exportar(solicitudId)
      if (!res.success || !res.data) throw new Error(res.message || 'No se pudo exportar el ticket.')
      exportacion.value = res.data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'No se pudo exportar el ticket.'
    } finally {
      cargando.value = false
    }
  }

  async function copiar(): Promise<boolean> {
    if (!exportacion.value) return false
    try {
      await navigator.clipboard.writeText(exportacion.value.texto)
      copiado.value = true
      setTimeout(() => {
        copiado.value = false
      }, 2000)
      return true
    } catch {
      return false
    }
  }

  function descargar(): void {
    if (!exportacion.value) return
    const blob = new Blob([exportacion.value.texto], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportacion.value.codigo}-export.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { cargando, error, exportacion, copiado, cargar, copiar, descargar }
}
