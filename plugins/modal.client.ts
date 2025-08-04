export default defineNuxtPlugin(() => {
  const modal = useModal()
  
  return {
    provide: {
      modal
    }
  }
}) 