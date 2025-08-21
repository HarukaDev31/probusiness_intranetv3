import { useModal } from '../composables/commons/useModal'
export default defineNuxtPlugin(() => {
  const modal = useModal()
  
  return {
    provide: {
      modal
    }
  }
}) 