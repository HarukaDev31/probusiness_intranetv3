import { useSpinner } from '../composables/commons/useSpinner'

export default defineNuxtPlugin(() => {
  const spinner = useSpinner()
  const router = useRouter()

  // Al cambiar de sección, abortamos requests y a veces el overlay queda pegado → pantalla en blanco.
  router.afterEach(() => {
    spinner.resetSpinner()
  })

  return {
    provide: {
      spinner
    }
  }
})
