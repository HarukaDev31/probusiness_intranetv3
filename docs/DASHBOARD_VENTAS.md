# Dashboard de Ventas - Documentación

## Descripción
Dashboard de ventas consolidado que proporciona métricas de volumen y totales por contenedor, fecha y vendedor.

## Estructura del Proyecto

### Archivos Creados/Modificados

1. **Tipos TypeScript** (`types/dashboard.ts`)
   - Interfaces para todas las respuestas de la API
   - Tipos para filtros y métricas

2. **Servicio** (`services/dashboard/dashboardService.ts`)
   - Extiende `BaseService` para manejo de tokens
   - Métodos para todos los endpoints de la API
   - Manejo de errores consistente

3. **Composable** (`composables/useDashboard.ts`)
   - Estado reactivo para datos del dashboard
   - Métodos para cargar datos y aplicar filtros
   - Utilidades de formateo

4. **Página** (`pages/dashboard/index.vue`)
   - Interfaz completa del dashboard
   - Métricas principales con tarjetas
   - Filtros avanzados
   - Tabla de transacciones
   - Placeholders para gráficos

5. **Navegación** (`layouts/default.vue`)
   - Mapeo de URL del dashboard
   - Iconos para el menú

## Características Implementadas

### ✅ Métricas Principales
- Volumen China
- Volumen Vendido  
- Volumen Pendiente
- Total Ventas
- Total Impuestos
- Total Logística

### ✅ Filtros
- Por contenedor
- Por vendedor
- Por rango de fechas
- Búsqueda en tiempo real

### ✅ Tabla de Transacciones
- Detalle completo de transacciones
- Formateo de monedas y volúmenes
- Búsqueda por vendedor o contenedor

### ✅ Responsive Design
- Adaptable a diferentes tamaños de pantalla
- Grid responsive para métricas
- Layout optimizado para móviles

## Endpoints de la API

### Base URL
```
/api/carga-consolidada/dashboard-ventas
```

### Endpoints Implementados
1. `GET /resumen` - Resumen de ventas por contenedor
2. `GET /por-vendedor` - Estadísticas por vendedor
3. `GET /evolucion-total` - Evolución total de volúmenes (✅ NUEVO)
4. `GET /filtros/contenedores` - Lista de contenedores
5. `GET /filtros/vendedores` - Lista de vendedores

## Uso

### Navegación
El dashboard está disponible en `/dashboard` y se puede acceder desde el menú principal del sidebar.

### Filtros
Los filtros se aplican automáticamente al hacer clic en "Aplicar Filtros":
- **Contenedor**: Filtra por contenedor específico
- **Vendedor**: Filtra por vendedor específico  
- **Fechas**: Rango de fechas inclusivo
- **Búsqueda**: Búsqueda en tiempo real en la tabla

### Datos en Tiempo Real
- Los datos se cargan automáticamente al acceder al dashboard
- Los filtros actualizan los datos en tiempo real
- Indicadores de carga durante las operaciones

## Próximas Mejoras

### 🔄 Gráficos
- Implementar gráfico de barras para volúmenes por contenedor
- Implementar gráfico circular para distribución por vendedor
- Usar Chart.js o similar

### 🔄 Funcionalidades Adicionales
- Exportar datos a Excel/PDF
- Filtros más avanzados
- Comparativas entre períodos
- Alertas y notificaciones

### 🔄 Optimizaciones
- Cache de datos
- Paginación en la tabla
- Lazy loading de gráficos

## Estructura de Datos

### Respuesta de Resumen
```typescript
interface DashboardResumenItem {
  id_contenedor: number
  carga: string
  fecha_zarpe: string
  vendedor: string
  total_clientes: number
  volumenes: {
    china: number
    total: number
    vendido: number
    pendiente: number
  }
  totales: {
    impuestos: number
    logistica: number
    fob: number
  }
  metricas: {
    porcentaje_avance: number
    meta_volumen: number
    meta_clientes: number
  }
}
```

### Filtros
```typescript
interface DashboardFilters {
  fecha_inicio?: string
  fecha_fin?: string
  id_vendedor?: number
  id_contenedor?: number
}
```

## Consideraciones Técnicas

### Autenticación
- Todos los endpoints requieren JWT token
- El servicio extiende `BaseService` para manejo automático de tokens

### Manejo de Errores
- Try-catch en todos los métodos del servicio
- Logging de errores en consola
- Manejo graceful de errores en la UI

### Performance
- Carga paralela de datos con `Promise.all`
- Computed properties para datos derivados
- Filtrado reactivo en la tabla

### Accesibilidad
- Labels descriptivos en filtros
- Iconos semánticos
- Contraste adecuado en colores
