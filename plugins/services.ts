// plugins/services.client.ts
  import { BaseService } from '../services/base/BaseService'

export default defineNuxtPlugin((nuxtApp) => {
  // Inicializar automáticamente todos los servicios que extienden BaseService
  BaseService.initializeAllServices(nuxtApp)

  // Opcional: Log para debugging
  if (process.dev) {
    
  }
})