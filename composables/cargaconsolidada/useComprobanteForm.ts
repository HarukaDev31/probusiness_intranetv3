import { ComprobanteFormService } from "~/services/cargaconsolidada/comprobanteFormService"

export const useComprobanteForm = () => {
  const form = ref<any>(null)
  const loading = ref(false)

  const getFormByCotizacion = async (idCotizacion: number) => {
    loading.value = true
    try {
      const response = await ComprobanteFormService.getFormByCotizacion(idCotizacion)
      if (response?.success) {
        form.value = response.data
      } else {
        form.value = null
      }
      return response
    } catch (error) {
      console.error('Error al obtener formulario de comprobante:', error)
      form.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    form,
    loading,
    getFormByCotizacion,
  }
}
