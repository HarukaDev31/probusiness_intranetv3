import { useSpinner } from '../composables/commons/useSpinner'
export default defineNuxtPlugin(() => {
  const spinner = useSpinner()

  return {
    provide: {
      spinner
    }
  }
}) 