# Implementación de Chart.js en Dashboard

## Descripción
Implementación completa de gráficos interactivos usando Chart.js para el dashboard de ventas consolidado.

## Dependencias Instaladas

```bash
npm install chart.js vue-chartjs
```

## Componentes Creados

### 1. VolumeBarChart (`components/charts/VolumeBarChart.vue`)

**Propósito**: Gráfico de barras para mostrar la evolución de volúmenes por contenedor.

**Características**:
- ✅ Gráfico de barras agrupadas
- ✅ 3 series de datos: Volumen China, Volumen Vendido, Volumen Pendiente
- ✅ Colores diferenciados por serie
- ✅ Tooltips con formateo de volúmenes (m³)
- ✅ Responsive y adaptable
- ✅ Actualización reactiva de datos
- ✅ **Paginación automática** para grandes conjuntos de datos
- ✅ **Controles de navegación** con botones anterior/siguiente
- ✅ **Indicadores de página** con información de registros
- ✅ **Configuración flexible** de elementos por página

**Props**:
```typescript
interface Props {
  data: VolumeData[]
  itemsPerPage?: number // ✅ Elementos por página (default: 10)
}

interface VolumeData {
  contenedor: string
  volumenChina: number
  volumenVendido: number
  volumenPendiente: number
}
```

**Colores**:
- Volumen China: Azul (`rgba(59, 130, 246, 0.8)`)
- Volumen Vendido: Verde (`rgba(16, 185, 129, 0.8)`)
- Volumen Pendiente: Amarillo (`rgba(245, 158, 11, 0.8)`)

**Paginación**:
- **Automática**: Se activa cuando hay más datos que `itemsPerPage`
- **Controles**: Botones anterior/siguiente y navegación directa
- **Información**: Muestra rango actual y total de elementos
- **Responsive**: Máximo 5 páginas visibles en controles
- **Reset**: Vuelve a página 1 cuando cambian los datos

**Manejo de Altura**:
- **Flexbox Layout**: Usa `flex-col h-full` para distribución vertical
- **Gráfico**: `flex-1 min-h-0` para ocupar espacio disponible
- **Controles**: `h-10 flex-shrink-0` para altura fija de paginación
- **ResizeObserver**: Ajuste automático al redimensionar contenedor
- **Sin Props**: Ya no requiere `width` o `height` como props

### 2. SalesPieChart (`components/charts/SalesPieChart.vue`)

**Propósito**: Gráfico circular para mostrar la distribución de ventas por vendedor.

**Características**:
- ✅ Gráfico circular (pie chart)
- ✅ Datos basados en volumen vendido por vendedor
- ✅ Leyenda con porcentajes calculados
- ✅ Colores automáticos para hasta 8 vendedores
- ✅ Tooltips con valores y porcentajes
- ✅ Responsive y adaptable

**Props**:
```typescript
interface Props {
  data: SalesData[]
  width?: number
  height?: number
}

interface SalesData {
  vendedor: string
  volumenTotal: number
  volumenVendido: number
  volumenPendiente: number
}
```

**Paleta de Colores**:
- 8 colores predefinidos con transparencia
- Rotación automática de colores para múltiples vendedores

## Plugin de Configuración (`plugins/chart.client.ts`)

**Propósito**: Configuración global de Chart.js para toda la aplicación.

**Configuraciones**:
- ✅ Registro de componentes necesarios (BarController, PieController, DoughnutController)
- ✅ Fuente por defecto: Inter
- ✅ Colores globales consistentes
- ✅ Configuración responsive por defecto

## Integración en Dashboard

### Uso en la Página Principal

```vue
<template>
  <div class="h-96">
    <VolumeBarChart 
      v-if="datosGraficoVolumenes.length > 0"
      :data="datosGraficoVolumenes" 
      :items-per-page="8"
    />
  </div>
  
  <div class="h-64">
    <SalesPieChart 
      v-if="datosGraficoVendedores.length > 0"
      :data="datosGraficoVendedores" 
      :height="256"
    />
  </div>
</template>
```

### Datos del Composable

Los datos para los gráficos se obtienen del composable `useDashboard`:

```typescript
const datosGraficoVolumenes = computed(() => {
  return resumenData.value.map(item => ({
    contenedor: item.carga,
    volumenChina: item.volumenes.china,
    volumenVendido: item.volumenes.vendido,
    volumenPendiente: item.volumenes.pendiente
  }))
})

const datosGraficoVendedores = computed(() => {
  return vendedoresData.value.map(item => ({
    vendedor: item.vendedor,
    volumenTotal: item.volumenes.total,
    volumenVendido: item.volumenes.vendido,
    volumenPendiente: item.volumenes.pendiente
  }))
})
```

## Características Técnicas

### Responsive Design
- Los gráficos se adaptan automáticamente al tamaño del contenedor
- Configuración `maintainAspectRatio: false` para control total
- Grid responsive en la página del dashboard

### Performance
- Componentes Vue optimizados con lifecycle hooks
- Destrucción automática de instancias de Chart.js
- Actualización eficiente con `update('none')`

### Accesibilidad
- Tooltips descriptivos con unidades
- Colores con suficiente contraste
- Leyendas informativas con porcentajes

### Reactividad
- Watchers para actualización automática de datos
- Computed properties para transformación de datos
- Estados de carga y vacío manejados

## Estados de los Gráficos

### Estado de Carga
Los gráficos muestran automáticamente un estado vacío cuando no hay datos:

```vue
<div v-else class="h-full flex items-center justify-center">
  <div class="text-center text-gray-500">
    <UIcon name="i-heroicons-chart-bar" class="text-4xl mb-2" />
    <p>No hay datos para mostrar</p>
  </div>
</div>
```

### Actualización de Datos
Los gráficos se actualizan automáticamente cuando:
- Se aplican filtros en el dashboard
- Se cargan nuevos datos desde la API
- Se cambian los parámetros de búsqueda

## Consideraciones de Desarrollo

### Tipos TypeScript
- Interfaces completas para props y datos
- Tipado estricto de Chart.js
- Compatibilidad con el sistema de tipos de Vue 3

### Manejo de Memoria
- Destrucción automática de instancias Chart.js en `onUnmounted`
- Limpieza de watchers y referencias
- Prevención de memory leaks

### Extensibilidad
- Fácil agregar nuevos tipos de gráficos
- Configuración modular y reutilizable
- Componentes independientes y testeable

## Troubleshooting

### Error: "bar" is not a registered controller

**Problema**: Este error aparece cuando Chart.js no puede encontrar el controlador para el tipo de gráfico especificado.

**Solución**: Asegúrate de importar y registrar el controlador correspondiente:

```typescript
import {
  Chart as ChartJS,
  BarController,  // Para gráficos de barras
  PieController,  // Para gráficos circulares
  // ... otros componentes
} from 'chart.js'

ChartJS.register(
  BarController,
  PieController,
  // ... otros componentes
)
```

### Error: "pie" is not a registered controller

**Problema**: Similar al anterior, pero para gráficos circulares.

**Solución**: Registrar `PieController` y `DoughnutController`:

```typescript
ChartJS.register(
  PieController,
  DoughnutController,
  ArcElement,
  // ... otros componentes
)
```

### Gráficos no se muestran

**Posibles causas y soluciones**:

1. **Canvas no encontrado**: Verificar que el ref esté correctamente asignado
2. **Datos vacíos**: Verificar que los datos tengan el formato correcto
3. **Plugin no cargado**: Asegurarse de que el plugin `chart.client.ts` se ejecute
4. **Dimensiones**: Verificar que el contenedor tenga altura definida

## Próximas Mejoras

### 🔄 Funcionalidades Adicionales
- Gráficos de líneas para tendencias temporales
- Gráficos de área para comparativas
- Animaciones más suaves
- Exportar gráficos como imágenes

### 🔄 Interactividad
- Click en elementos para filtrar
- Zoom y pan en gráficos grandes
- Selección múltiple de series
- Comparativas entre períodos

### 🔄 Personalización
- Temas claro/oscuro
- Paletas de colores personalizables
- Configuración de usuario
- Opciones de formato avanzadas
