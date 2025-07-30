import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiCall } from '~/utils/api'

export interface RegulationEditConfig {
  endpoint: string
  getByIdEndpoint: string
  title: string
  subtitle: string
  icon: string
  requiredFields: string[]
  fields: {
    [key: string]: {
      type: 'text' | 'textarea' | 'select' | 'number' | 'file' | 'image'
      label: string
      placeholder?: string
      required?: boolean
      icon?: string
      options?: { label: string; value: any }[]
    }
  }
}

export function useRegulationEdit(config: RegulationEditConfig, regulationId: string) {
  const router = useRouter()

  // Form data
  const formData = ref<any>({})
  const validationErrors = ref<{ [key: string]: string }>({})
  const loading = ref(true)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Callback for setting existing images/documents
  let setExistingMediaCallback: ((media: any[]) => void) | null = null

  const setExistingMediaCallbackFn = (callback: (media: any[]) => void) => {
    setExistingMediaCallback = callback
  }

  // Load regulation data
  const loadRegulation = async () => {
    loading.value = true
    error.value = null

    try {
      const id = parseInt(regulationId)
      const response = await apiCall<any>(`${config.getByIdEndpoint}/${id}`)

      if (response.success && response.data) {
        const regulation = response.data
        
        // Map backend data to form data
        const mappedData: any = {}
        Object.keys(config.fields).forEach(field => {
          if (regulation[field] !== undefined) {
            mappedData[field] = regulation[field]
          } else {
            mappedData[field] = ''
          }
        })
        
        formData.value = mappedData

        // Set existing media if callback is available
        if (setExistingMediaCallback && regulation.media) {
          setExistingMediaCallback(regulation.media)
        }

        console.log('Regulación cargada:', regulation)
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

  // Validation methods
  const validateField = (field: string, value: any): string => {
    const fieldConfig = config.fields[field]
    if (!fieldConfig) return ''

    if (fieldConfig.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${fieldConfig.label} es requerido`
    }

    return ''
  }

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}
    
    Object.keys(config.fields).forEach(field => {
      const error = validateField(field, formData.value[field])
      if (error) {
        errors[field] = error
      }
    })
    
    validationErrors.value = errors
    return Object.keys(errors).length === 0
  }

  const clearFieldError = (field: string) => {
    if (validationErrors.value[field]) {
      delete validationErrors.value[field]
    }
  }

  // Form submission
  const saveForm = async (additionalData?: any) => {
    if (!validateForm()) {
      return false
    }

    isSubmitting.value = true
    error.value = null

    try {
      const id = parseInt(regulationId)
      const dataToSend = { 
        id_regulacion: id,
        ...formData.value, 
        ...additionalData 
      }
      
      const response = await apiCall<any>(config.endpoint, {
        method: 'POST',
        body: dataToSend
      })

      if (response.success) {
        console.log('Regulación actualizada exitosamente:', response.data)
        router.push('/basedatos/regulaciones')
        return true
      } else {
        error.value = response.error || 'Error al actualizar la regulación'
        return false
      }
    } catch (err) {
      console.error('Error updating regulation:', err)
      error.value = 'Error al actualizar la regulación'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Navigation
  const goBack = () => {
    router.back()
  }

  return {
    formData,
    validationErrors,
    loading,
    isSubmitting,
    error,
    loadRegulation,
    validateForm,
    clearFieldError,
    saveForm,
    goBack,
    setExistingMediaCallbackFn,
    config
  }
} 