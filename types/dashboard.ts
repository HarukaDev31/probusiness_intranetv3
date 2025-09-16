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
