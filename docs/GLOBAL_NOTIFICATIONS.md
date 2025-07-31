# Sistema de Notificaciones Globales y Spinners

Este sistema proporciona modales de éxito y error globales, así como spinners de carga para mejorar la experiencia del usuario en toda la aplicación.

## Componentes

### 1. SuccessModal.vue
Modal de éxito con diseño moderno y animaciones.

**Props:**
- `isOpen: boolean` - Controla la visibilidad del modal
- `title?: string` - Título del modal (default: "¡Éxito!")
- `subtitle?: string` - Subtítulo del modal (default: "Operación completada")
- `message: string` - Mensaje principal
- `primaryButtonText?: string` - Texto del botón principal (default: "Aceptar")
- `showSecondaryButton?: boolean` - Mostrar botón secundario (default: false)
- `secondaryButtonText?: string` - Texto del botón secundario (default: "Cancelar")

**Events:**
- `close` - Se emite al cerrar el modal
- `secondary-action` - Se emite al hacer clic en el botón secundario

### 2. ErrorModal.vue
Modal de error con opción de reintentar.

**Props:**
- `isOpen: boolean` - Controla la visibilidad del modal
- `title?: string` - Título del modal (default: "Error")
- `subtitle?: string` - Subtítulo del modal (default: "Algo salió mal")
- `message: string` - Mensaje principal
- `details?: string` - Detalles técnicos del error
- `primaryButtonText?: string` - Texto del botón principal (default: "Cerrar")
- `showRetryButton?: boolean` - Mostrar botón de reintentar (default: false)

**Events:**
- `close` - Se emite al cerrar el modal
- `retry` - Se emite al hacer clic en "Reintentar"

### 3. LoadingSpinner.vue
Spinner de carga reutilizable con diferentes tamaños.

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Tamaño del spinner (default: "md")
- `text?: string` - Texto de carga opcional
- `fullScreen?: boolean` - Spinner de pantalla completa (default: false)

### 4. GlobalNotifications.vue
Componente contenedor que maneja todos los modales y spinners globales.

## Composables

### useNotifications()
Composable para mostrar notificaciones de éxito y error.

```typescript
const {
  // Estado
  showSuccessModal,
  showErrorModal,
  successConfig,
  errorConfig,

  // Métodos principales
  showSuccess,
  showError,
  showSuccessWithSecondary,
  closeSuccessModal,
  closeErrorModal,
  handleRetry,
  handleSecondaryAction,

  // Métodos de conveniencia
  showCreateSuccess,
  showUpdateSuccess,
  showDeleteSuccess,
  showNetworkError,
  showValidationError,
  showServerError
} = useNotifications()
```

### useLoading()
Composable para manejar estados de carga.

```typescript
const {
  // Estado
  globalLoading,
  loadingStates,
  loadingMessages,

  // Métodos
  setGlobalLoading,
  setLoading,
  isLoading,
  getLoadingMessage,
  clearLoading,
  clearAllLoading,
  withLoading,
  withGlobalLoading
} = useLoading()
```

## Ejemplos de Uso

### 1. Mostrar Notificación de Éxito

```typescript
// Notificación básica
showCreateSuccess('Producto')

// Notificación personalizada
showSuccess({
  title: '¡Guardado!',
  subtitle: 'Los cambios se han aplicado',
  message: 'El producto se ha actualizado correctamente en la base de datos.',
  autoClose: true,
  duration: 5000
})
```

### 2. Mostrar Notificación de Error

```typescript
// Error de servidor con reintentar
showServerError('guardar el producto', 'Error 500: Internal Server Error', () => {
  // Función de reintento
  saveProduct()
})

// Error de validación
showValidationError('El campo "Nombre" es requerido')

// Error de red
showNetworkError('cargar datos', () => {
  // Función de reintento
  loadData()
})
```

### 3. Usar Spinners de Carga

```typescript
// Carga global
setGlobalLoading(true, 'Procesando solicitud...')

// Carga específica
setLoading('saveProduct', true, 'Guardando producto...')

// Wrapper para operaciones asíncronas
const result = await withLoading(
  () => apiService.createProduct(productData),
  'createProduct',
  'Creando producto...'
)
```

### 4. Ejemplo Completo en un Componente

```vue
<template>
  <div>
    <UButton 
      @click="saveProduct" 
      :loading="isLoading('saveProduct')"
    >
      Guardar Producto
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'
import { useLoading } from '~/composables/useLoading'

const { showUpdateSuccess, showServerError, showValidationError } = useNotifications()
const { withLoading, isLoading } = useLoading()

const saveProduct = async () => {
  try {
    // Validar formulario
    if (!validateForm()) {
      showValidationError('Por favor, completa todos los campos requeridos.')
      return
    }

    // Guardar con loading
    const response = await withLoading(
      () => productService.updateProduct(productId, productData),
      'saveProduct',
      'Guardando cambios...'
    )

    if (response.success) {
      showUpdateSuccess('Producto')
    } else {
      showServerError('actualizar el producto', response.error)
    }
  } catch (error: any) {
    showServerError('actualizar el producto', error.message)
  }
}
</script>
```

## Configuración en el Layout

El componente `GlobalNotifications` debe estar incluido en el layout principal:

```vue
<template>
  <div>
    <!-- Contenido de la aplicación -->
    <slot />
    
    <!-- Notificaciones globales -->
    <GlobalNotifications />
  </div>
</template>
```

## Características

### ✅ **Modales Automáticos**
- Los modales de éxito se cierran automáticamente después de 3 segundos
- Los modales de error permanecen abiertos hasta que el usuario los cierre

### ✅ **Spinners Inteligentes**
- Spinners de pantalla completa para operaciones globales
- Spinners específicos para operaciones individuales
- Mensajes de carga personalizables

### ✅ **Manejo de Errores**
- Diferentes tipos de errores (validación, servidor, red)
- Opción de reintentar operaciones fallidas
- Detalles técnicos para debugging

### ✅ **Notificaciones Contextuales**
- Mensajes específicos para crear, actualizar y eliminar
- Personalización completa de títulos y mensajes
- Soporte para acciones secundarias

### ✅ **Integración con APIs**
- Wrapper `withLoading` para operaciones asíncronas
- Manejo automático de estados de carga
- Integración con servicios existentes

## Mejores Prácticas

1. **Usar métodos de conveniencia** para operaciones comunes
2. **Proporcionar mensajes claros** y específicos
3. **Incluir opciones de reintento** para operaciones críticas
4. **Usar spinners apropiados** según el tipo de operación
5. **Manejar errores específicos** en lugar de errores genéricos
6. **Proporcionar feedback inmediato** al usuario

## Personalización

Los modales pueden personalizarse completamente:

```typescript
showSuccess({
  title: '¡Personalizado!',
  subtitle: 'Subtítulo personalizado',
  message: 'Mensaje personalizado',
  primaryButtonText: 'Entendido',
  showSecondaryButton: true,
  secondaryButtonText: 'Ver detalles',
  autoClose: false,
  duration: 10000
})
``` 