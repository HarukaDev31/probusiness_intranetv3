

// Interfaces
export interface Entity {
  id: number
  nombre: string
  descripcion: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateEntityRequest {
  nombre: string
  descripcion: string
}

export interface EntityResponse {
  success: boolean
  data: Entity
  error?: string
}

export interface EntityListResponse {
  success: boolean
  data: Entity[]
  error?: string
}
import { BaseService } from "~/services/base/BaseService"

// Service class
class EntityService extends BaseService {
  private static instance: EntityService

  private constructor() { 
    super()
  }

  public static getInstance(): EntityService {
    if (!EntityService.instance) {
      EntityService.instance = new EntityService()
    }
    return EntityService.instance
  }

  /**
   * Crear una nueva entidad
   */
  async createEntity(entityData: CreateEntityRequest): Promise<EntityResponse> {
    try {
      const response = await this.apiCall<EntityResponse>('/api/base-datos/regulaciones/entidades', {
        method: 'POST',
        body: JSON.stringify(entityData)
      })
      return response
    } catch (error) {
      console.error('Error creating entity:', error)
      return {
        success: false,
        data: {} as Entity,
        error: 'Error al crear la entidad'
      }
    }
  }

  /**
   * Obtener lista de entidades
   */
  async getEntities(search?: string): Promise<EntityListResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (search && search !== '') {
        queryParams.append('search', search)
      }

      const response = await this.apiCall<EntityListResponse>(
        `/api/base-datos/regulaciones/entidades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      return response
    } catch (error) {
      console.error('Error fetching entities:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener las entidades'
      }
    }
  }

  /**
   * Obtener una entidad por ID
   */
  async getEntityById(id: number): Promise<EntityResponse> {
    try {
      const response = await this.apiCall<EntityResponse>(`/api/base-datos/regulaciones/entidades/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching entity:', error)
      return {
        success: false,
        data: {} as Entity,
        error: 'Error al obtener la entidad'
      }
    }
  }

  /**
   * Actualizar una entidad
   */
  async updateEntity(id: number, entityData: Partial<CreateEntityRequest>): Promise<EntityResponse> {
    try {
      const response = await this.apiCall<EntityResponse>(`/api/base-datos/regulaciones/entidades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(entityData)
      })
      return response
    } catch (error) {
      console.error('Error updating entity:', error)
      return {
        success: false,
        data: {} as Entity,
        error: 'Error al actualizar la entidad'
      }
    }
  }

  /**
   * Eliminar una entidad
   */
  async deleteEntity(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(
        `/api/base-datos/regulaciones/entidades/${id}`,
        {
          method: 'DELETE'
        }
      )
      return response
    } catch (error) {
      console.error('Error deleting entity:', error)
      return {
        success: false,
        error: 'Error al eliminar la entidad'
      }
    }
  }

  /**
   * Cambiar estado de una entidad (activar/desactivar)
   */
  async toggleEntityStatus(id: number, status: 'active' | 'inactive'): Promise<EntityResponse> {
    try {
      const response = await this.apiCall<EntityResponse>(`/api/base-datos/regulaciones/entidades/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      return response
    } catch (error) {
      console.error('Error toggling entity status:', error)
      return {
        success: false,
        data: {} as Entity,
        error: 'Error al cambiar el estado de la entidad'
      }
    }
  }

  /**
   * Verificar si un código de entidad ya existe
   */
  async checkEntityCodeExists(code: string): Promise<{ exists: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ exists: boolean }>(
        `/api/base-datos/regulaciones/entidades/check-code?code=${encodeURIComponent(code)}`
      )
      return response
    } catch (error) {
      console.error('Error checking entity code:', error)
      return {
        exists: false,
        error: 'Error al verificar el código de entidad'
      }
    }
  }

  /**
   * Obtener entidades activas para formularios
   */
  async getActiveEntities(): Promise<EntityListResponse> {
    try {
      const response = await this.apiCall<EntityListResponse>('/api/base-datos/regulaciones/entidades/active')
      return response
    } catch (error) {
      console.error('Error fetching active entities:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener las entidades activas'
      }
    }
  }
}

export default EntityService 