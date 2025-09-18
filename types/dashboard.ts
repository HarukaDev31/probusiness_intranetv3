// Tipos para el Dashboard de Ventas

export interface DashboardResumenItem {
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

export interface DashboardResumenResponse {
  success: boolean
  data: DashboardResumenItem[]
  totales: {
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
  }
}

export interface DashboardVendedorItem {
  id_vendedor: number
  vendedor: string
  metricas: {
    total_cotizaciones: number
    cotizaciones_confirmadas: number
    porcentaje_efectividad: number
  }
  volumenes: {
    total: number
    vendido: number
    pendiente: number
  }
  totales: {
    logistica: number
    fob: number
  }
}

export interface DashboardVendedorResponse {
  success: boolean
  data: DashboardVendedorItem[]
}

export interface DashboardFiltroContenedor {
  value: number | null
  label: string
  carga?: string
  fecha_zarpe?: string
}

export interface DashboardFiltroContenedorResponse {
  success: boolean
  data: DashboardFiltroContenedor[]
}

export interface DashboardFiltroVendedor {
  value: number | null
  label: string
  total_cotizaciones?: number
  volumen_total?: number
}

export interface DashboardFiltroVendedorResponse {
  success: boolean
  data: DashboardFiltroVendedor[]
}

export interface DashboardFilters {
  fecha_inicio?: string
  fecha_fin?: string
  id_vendedor?: number | null
  id_contenedor?: number | null
}

export interface DashboardMetricas {
  volumenChina: number
  volumenVendido: number
  volumenPendiente: number
  totalVentas: number
  totalImpuestos: number
  totalLogistica: number
}

// Tipos para evolución de volúmenes
export interface DashboardEvolucionItem {
  contenedor: {
    id: number
    carga: string
    fecha: string
  }
  volumenes: {
    china: number
    vendido: number
    pendiente: number
    total: number
  }
}

export interface DashboardEvolucionTotales {
  volumenes: {
    china: number
    vendido: number
    pendiente: number
    total: number
  }
  porcentajes: {
    vendido: number
    pendiente: number
  }
}

export interface DashboardEvolucionPromedios {
  volumenes: {
    china: number
    vendido: number
    pendiente: number
    total: number
  }
}

export interface DashboardEvolucionData {
  evolucion: DashboardEvolucionItem[]
  totales: DashboardEvolucionTotales
  promedios: DashboardEvolucionPromedios
  total_contenedores: number
}

export interface DashboardEvolucionResponse {
  success: boolean
  data: DashboardEvolucionData
}

// Tipos para cotizaciones confirmadas por vendedor por día
export interface DashboardCotizacionesDiariasDataset {
  label: string
  data: number[]
  backgroundColor: string
  borderColor: string
  borderWidth: number
  fill: boolean
  tension: number
  yAxisID?: string
  type?: string
  borderDash?: number[]
}

export interface DashboardCotizacionesDiariasChart {
  labels: string[]
  datasets: DashboardCotizacionesDiariasDataset[]
}

export interface DashboardCotizacionesDiariasEstadisticas {
  total_cotizaciones: number
  total_volumen: number
  total_monto_logistica: number
  total_monto_fob: number
  total_monto_impuestos: number
  promedio_diario: number
  total_vendedores: number
  periodo: {
    inicio: string
    fin: string
    dias: number
  }
}

export interface DashboardCotizacionesDiariasDetalleVendedor {
  vendedor: string
  total_cotizaciones: number
  total_volumen: number
  total_monto_logistica: number
  promedio_diario: number
  dias_activos: number
}

export interface DashboardCotizacionesDiariasDatoDetalle {
  fecha: string
  vendedor: string
  cotizaciones_confirmadas: number
  volumen_confirmado: number
  monto_logistica: number
  monto_fob: number
  monto_impuestos: number
}

export interface DashboardCotizacionesDiariasData {
  chart: DashboardCotizacionesDiariasChart
  estadisticas: DashboardCotizacionesDiariasEstadisticas
  detalle_vendedores: DashboardCotizacionesDiariasDetalleVendedor[]
  datos_detalle: DashboardCotizacionesDiariasDatoDetalle[]
}

export interface DashboardCotizacionesDiariasResponse {
  success: boolean
  data: DashboardCotizacionesDiariasData
}