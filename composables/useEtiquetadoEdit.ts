import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {EtiquetadoService} from '~/services/etiquetadoService'

// Interface para la respuesta del backend
interface EtiquetadoResponse {
  id: number
  id_rubro: number
  observaciones: string
  created_at: string
  updated_at: string
  rubro: {
    id: number
    nombre: string
    created_at: string
    updated_at: string
  }
  media: Array<{
    id: number
    id_regulacion: number
    extension: string
    peso: number
    nombre_original: string
    ruta: string
    created_at: string
    updated_at: string
  }>
}
export function useEtiquetadoEdit(regulationId: string) {
  const router = useRouter()


  // Form data
  const formData = ref({
    producto: null as any,
    observaciones: ''
  })

  // Validation errors
  const validationErrors = ref({
    producto: ''
  })

  // Loading states
  const loading = ref(true)
  const isSubmitting = ref(false)

  // Error state
  const error = ref<string | null>(null)

  // Callback for setting existing images
  let setExistingImagesCallback: ((images: any[]) => void) | null = null

  const setExistingImagesCallbackFn = (callback: (images: any[]) => void) => {
    setExistingImagesCallback = callback
  }

  const loadRegulation = async () => {
    loading.value = true
    error.value = null

    try {
      const id = parseInt(regulationId)
      const response = await EtiquetadoService.getEtiquetadoById(id)

      if (response.success && response.data) {
        const regulation = response.data as unknown as EtiquetadoResponse
        
        // Cargar datos del formulario
        formData.value = {
          producto: {
            label: regulation.rubro.nombre,
            value: regulation.rubro.id.toString()
          },
          observaciones: regulation.observaciones || ''
        }

        // Set existing images if callback is available
        if (setExistingImagesCallback && regulation.media) {
          setExistingImagesCallback(regulation.media)
        }

        
        
      } else {
        error.value = response.error || 'No se pudo cargar la regulación'
      }
    } catch (err) {
      console.error('Error loading regulation:', err)
      error.value = 'Error al cargar la regulación'
    } finally {
      loading.value = false
    }
  }

  const saveForm = async (imagesToDeleteBackend: number[], imageSlots: any[]) => {
    isSubmitting.value = true
    try {
      const id = parseInt(regulationId)

      // Preparar payload parcial para el servicio update
      const payload: any = {
        id_rubro: formData.value.producto?.value ? parseInt(formData.value.producto.value) : undefined,
        observaciones: formData.value.observaciones || undefined
      }

      // Nuevas imágenes
      const newImages = imageSlots.filter(slot => slot.file).map(slot => slot.file)
      if (newImages.length > 0) {
        payload.imagenes = newImages
      }

      // Realizar actualización principal
      // Incluir imágenes a eliminar si existen
      if (imagesToDeleteBackend.length > 0) {
        payload.imagenes_eliminar = imagesToDeleteBackend
      }
      const response = await EtiquetadoService.updateEtiquetado(id, payload)
      if (!response.success) {
        console.error('Error al actualizar la regulación de etiquetado (datos principales):', response.error)
        alert('Error al actualizar el etiquetado: ' + (response.error || 'Error desconocido'))
        return
      }

      // Si hay imágenes por eliminar y el backend lo requiere en un endpoint separado, aquí podríamos hacer otra llamada.
      // Si tu backend acepta eliminaciones en el mismo update, ajusta el servicio para incluir "imagenes_eliminar".
      if (imagesToDeleteBackend.length > 0) {
        // TODO: Implementar si existe endpoint para eliminar imágenes individualmente.
        :', imagesToDeleteBackend)
      }

      
      router.push('/basedatos/regulaciones?tab=etiquetado')
    } catch (err) {
      console.error('Error updating etiquetado:', err)
      alert('Error al actualizar el etiquetado')
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    formData,
    validationErrors,
    loading,
    isSubmitting,
    error,
    loadRegulation,
    saveForm,
    setExistingImagesCallbackFn
  }
} 