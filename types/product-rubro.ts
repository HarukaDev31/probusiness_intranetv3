export interface ProductRubro {
    id: number
    nombre: string
}
export interface CreateProductRubroRequest {
    nombre: string
}
export interface ProductRubroResponse {
    success: boolean
    data: ProductRubro
    message?: string
    error?: string
}
export interface ProductRubroListResponse {
    success: boolean
    data: ProductRubro[]
    message?: string
    error?: string
}
