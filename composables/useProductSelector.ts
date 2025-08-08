import { ref } from 'vue'
import ProductRubroService from '~/services/productRubroService'
import type { ProductRubro } from '~/types/product-rubro'

export function useProductSelector() {
  const productRubroService = ProductRubroService.getInstance()

  // Product options (reactive)
  const productOptions = ref<{ label: string; value: string; }[]>([])
  const loadingProducts = ref(false)

  const searchProducts = async (searchTerm: string) => {
    try {
      loadingProducts.value = true
      const response = await productRubroService.getProductRubros(searchTerm)

      if (response.success && response.data) {
        // Convertir productos a formato de opciones para autocomplete
        productOptions.value = response.data.map((productRubro: ProductRubro) => ({
          label: productRubro.nombre,
          value: productRubro.id.toString()
        }))
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      loadingProducts.value = false
    }
  }

  const createProduct = async (productName: string) => {
    try {
      // Validar campo requerido
      if (!productName) {
        console.error('Nombre es requerido')
        return null
      }
      
      const response = await productRubroService.createProductRubro({
        nombre: productName,
        tipo:
      })
      
      if (response.success) {
        const newProduct = {
          label: response.data.nombre,
          value: response.data.id.toString()
        }
        
        // Actualizar la lista de productos
        await searchProducts('')
        
        console.log('Rubro creado exitosamente:', response.data)
        return newProduct
      } else {
        console.error('Error al crear rubro:', response.error)
        return null
      }
    } catch (error) {
      console.error('Error al crear producto:', error)
      return null
    }
  }

  return {
    productOptions,
    loadingProducts,
    searchProducts,
    createProduct
  }
} 