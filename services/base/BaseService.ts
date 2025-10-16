export class BaseService {
  protected static nuxtApp: any = null

  static initializeAllServices(app: any) {
    this.nuxtApp = app
  }

  protected static async apiCall<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      if (!this.nuxtApp) {
        throw new Error('Nuxt app not initialized')
      }
      
      console.log('🌐 BaseService - Enviando petición:', {
        endpoint,
        method: options.method || 'GET',
        hasBody: !!options.body,
        headers: options.headers
      })
      
      const result = await this.nuxtApp.$api.call(endpoint, options)
      
      
      return result as T
    } catch (error: any) {
      const status = error?.status || error?.statusCode
      const backendMessage = error?.data?.message || error?.message || 'Error desconocido'
      
      console.error('❌ BaseService - Error en apiCall:', {
        status,
        message: backendMessage,
        endpoint,
        fullError: error
      })
      
      throw new Error(backendMessage)
    }
  }
} 