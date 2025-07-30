import type { Ref } from 'vue'

export function useFormValidation(formData: Ref<any>, validationErrors: Ref<any>) {
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'producto':
        return !value || !value.value ? 'Producto es requerido' : ''
      default:
        return ''
    }
  }

  const validateForm = (): boolean => {
    const errors = {
      producto: validateField('producto', formData.value.producto)
    }
    
    validationErrors.value = errors
    
    return !Object.values(errors).some(error => error !== '')
  }

  const clearFieldError = (field: string) => {
    validationErrors.value[field as keyof typeof validationErrors.value] = ''
  }

  return {
    validateForm,
    clearFieldError
  }
} 