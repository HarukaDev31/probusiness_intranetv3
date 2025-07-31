import type { CreateProductRubroRequest, ProductRubro, ProductRubroListResponse, ProductRubroResponse } from "~/types/product-rubro";
import { apiCall } from "~/utils/api";
class ProductRubroService {
    private static instance: ProductRubroService

    private constructor() { }

    public static getInstance(): ProductRubroService {
        if (!ProductRubroService.instance) {
            ProductRubroService.instance = new ProductRubroService()
        }
        return ProductRubroService.instance
    }

    async createProductRubro(productRubroData: CreateProductRubroRequest): Promise<ProductRubroResponse> {
        try {
            const response = await apiCall<ProductRubroResponse>('/api/base-datos/regulaciones/rubros', {
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
    async getProductRubros(search?: string): Promise<ProductRubroListResponse> {
        try {
            const queryParams = new URLSearchParams()
            if (search && search !== '') {
                queryParams.append('search', search)
            }

            const response = await apiCall<ProductRubroListResponse>(
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
    async getProductRubroById(id: number): Promise<ProductRubroResponse> {
        try {
            const response = await apiCall<ProductRubroResponse>(`/api/base-datos/regulaciones/rubros/${id}`)
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
}
export default ProductRubroService