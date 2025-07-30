import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiCall } from '~/utils/api'

export interface RegulationFormData {
  [key: string]: any
}

export interface ValidationErrors {
  [key: string]: string
}

export interface RegulationFormConfig {
  endpoint: string
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

export function useRegulationForm(config: RegulationFormConfig) {
  const router = useRouter()

  // Form data
  const formData = ref<RegulationFormData>({})
  const validationErrors = ref<ValidationErrors>({})
  const loading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Initialize form data based on config
  const initializeFormData = () => {
    const initialData: RegulationFormData = {}
    Object.keys(config.fields).forEach(field => {
      initialData[field] = ''
    })
    formData.value = initialData
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
    const errors: ValidationErrors = {}
    
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
      const dataToSend = { ...formData.value, ...additionalData }
      
      const response = await apiCall<any>(config.endpoint, {
        method: 'POST',
        body: dataToSend
      })

      if (response.success) {
        console.log('Regulación guardada exitosamente:', response.data)
        router.push('/basedatos/regulaciones')
        return true
      } else {
        error.value = response.error || 'Error al guardar la regulación'
        return false
      }
    } catch (err) {
      console.error('Error saving regulation:', err)
      error.value = 'Error al guardar la regulación'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Navigation
  const goBack = () => {
    router.back()
  }

  // Initialize form on mount
  initializeFormData()

  return {
    formData,
    validationErrors,
    loading,
    isSubmitting,
    error,
    validateForm,
    clearFieldError,
    saveForm,
    goBack,
    config
  }
} 