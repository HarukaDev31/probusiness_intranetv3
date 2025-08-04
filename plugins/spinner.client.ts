export default defineNuxtPlugin(() => {
  const spinner = useSpinner()
  
  return {
    provide: {
      spinner
    }
  }
}) 