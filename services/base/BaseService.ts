export class BaseService {
  protected static nuxtApp: any = null

  static initializeAllServices(app: any) {
    this.nuxtApp = app
  }

  protected static async apiCall<T>(endpoint: string, options: any = {}): Promise<T> {
    try{
    if (!this.nuxtApp) {
      throw new Error('Nuxt app not initialized')
    }
    return await this.nuxtApp.$api.call<T>(endpoint, options)
    } catch (error) {
      console.error('Error in apiCall:', error.data.message)
      throw new Error(error.data.message)
    }
  }
} 