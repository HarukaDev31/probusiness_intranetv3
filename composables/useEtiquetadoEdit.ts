import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EtiquetadoService from '~/services/etiquetadoService'
import { apiCall } from '~/utils/api'

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
  const etiquetadoService = EtiquetadoService.getInstance()

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
      const response = await etiquetadoService.getEtiquetadoById(id)

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

        console.log('Regulación cargada:', regulation)
        console.log('Producto seleccionado:', formData.value.producto)
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

      // Crear FormData para manejar archivos
      const formDataToSend = new FormData()

      // Agregar el ID de la regulación para indicar que es una actualización
      formDataToSend.append('id_regulacion', id.toString())

      // Agregar campos de texto
      formDataToSend.append('id_rubro', formData.value.producto?.value || '')
      formDataToSend.append('observaciones', formData.value.observaciones || '')

      // Agregar IDs de imágenes a eliminar
      if (imagesToDeleteBackend.length > 0) {
        imagesToDeleteBackend.forEach(imageId => {
          formDataToSend.append('imagenes_eliminar[]', imageId.toString())
        })
        console.log('Imágenes a eliminar en backend:', imagesToDeleteBackend)
      }

      // Agregar nuevas imágenes si existen
      const newImages = imageSlots.filter(slot => slot.file)
      if (newImages.length > 0) {
        newImages.forEach((slot, index) => {
          if (slot.file) {
            formDataToSend.append(`imagenes[${index}]`, slot.file)
          }
        })
        console.log('Nuevas imágenes a agregar:', newImages.length)
      }

      console.log('FormData contents for update:')
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value)
      }

      // Usar el mismo endpoint que crear pero con id_regulacion
      const response = await apiCall<any>('/api/base-datos/regulaciones/etiquetado', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.success) {
        console.log('Etiquetado actualizado exitosamente:', response.data)
        router.push('/basedatos/regulaciones')
      } else {
        console.error('Error al actualizar el etiquetado:', response.error)
        alert('Error al actualizar el etiquetado: ' + (response.error || 'Error desconocido'))
      }
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