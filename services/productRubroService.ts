import type { CreateProductRubroRequest, ProductRubro, ProductRubroListResponse, ProductRubroResponse } from "../types/product-rubro";
import { BaseService } from "~/services/base/BaseService"

export class ProductRubroService extends BaseService {
    private static instance: ProductRubroService

    private constructor() { 
        super()
    }

 
    static async createProductRubro(productRubroData: CreateProductRubroRequest): Promise<ProductRubroResponse> {
        try {
            const response = await this.apiCall<ProductRubroResponse>('/api/base-datos/regulaciones/rubros', {
                method: 'POST',
                body: JSON.stringify(productRubroData)
            })
            return response
        } catch (error) {
            console.error('Error creating entity:', error)
            return {
                success: false,
                data: {} as ProductRubro,
                error: 'Error al crear el rubro'
            }
        }
    }

    /**
     * Obtener lista de rubros
     */
    static async getProductRubros(search?: string,tipo?: string): Promise<ProductRubroListResponse> {
        try {
            const queryParams = new URLSearchParams()
            if (search && search !== '') {
                queryParams.append('search', search)
            }
            if (tipo && tipo !== '') {
                queryParams.append('tipo', tipo)
            }
            const response = await this.apiCall<ProductRubroListResponse>(
                `/api/base-datos/regulaciones/rubros${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
            )
            return response
        } catch (error) {
            console.error('Error fetching rubros:', error)
            return {
                success: false,
                data: [],
                error: 'Error al obtener los rubros'
            }
        }
    }

    /**
     * Obtener un rubro por ID
     */
    static async getProductRubroById(id: number): Promise<ProductRubroResponse> {
        try {
            const response = await this.apiCall<ProductRubroResponse>(`/api/base-datos/regulaciones/rubros/${id}`)
            return response
        } catch (error) {
            console.error('Error fetching rubro:', error)
            return {
                success: false,
                data: {} as ProductRubro,
                error: 'Error al obtener el rubro'
            }
        }
    }

    /**
     * Actualizar un rubro por ID
     */
    static async updateProductRubro(id: number, payload: Partial<CreateProductRubroRequest>): Promise<ProductRubroResponse> {
        try {
            const response = await this.apiCall<ProductRubroResponse>(`/api/base-datos/regulaciones/rubros/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            })
            return response
        } catch (error) {
            console.error('Error updating rubro:', error)
            return {
                success: false,
                data: {} as ProductRubro,
                error: 'Error al actualizar el rubro'
            }
        }
    }
}
export default ProductRubroService