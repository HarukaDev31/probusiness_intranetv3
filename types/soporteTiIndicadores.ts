export type SoporteTiIndicadorEstado = 'green' | 'amber' | 'red' | 'muted'

export interface SoporteTiIndicadorMes {
  value: string
  label: string
}

export interface SoporteTiIndicadorAlerta {
  nivel: SoporteTiIndicadorEstado
  texto: string
}

export interface SoporteTiIndicadorArea {
  nombre: string
  total: number
  tipo_a: number
  tipo_b: number
}

export interface SoporteTiIndicadorTarjetaTipo {
  total: number
  sla_pct: number | null
  sla_estado: SoporteTiIndicadorEstado
  vencidas: number
  vencidas_estado: SoporteTiIndicadorEstado
  cierre_pct: number | null
  cierre_estado: SoporteTiIndicadorEstado
}

export interface SoporteTiIndicadorEvolucion {
  mes: string
  label: string
  total: number
  sla_pct: number | null
  vencidas: number
  cierre_pct: number | null
}

export interface SoporteTiIndicadorNivel {
  nivel: string
  total: number
  con_plazo: number
  cumplidos: number
  pct: number | null
  estado: SoporteTiIndicadorEstado
  meta_horas: number | null
  promedio_horas: number | null
  tiempo_pct: number | null
  tiempo_estado: SoporteTiIndicadorEstado
}

export interface SoporteTiIndicadorEstadoFila {
  codigo: string
  nombre: string
  total: number
}

export interface SoporteTiIndicadorBloqueTipo {
  sla_pct: number | null
  sla_estado: SoporteTiIndicadorEstado
  sla_resueltas: number
  vencidas: number
  vencidas_pct: number
  vencidas_estado: SoporteTiIndicadorEstado
  abiertas: number
  cierre_pct: number | null
  cierre_estado: SoporteTiIndicadorEstado
  pendientes: number
  en_curso: number
  operativas: number
  recibidas: number
  niveles: SoporteTiIndicadorNivel[]
  por_estado: SoporteTiIndicadorEstadoFila[]
}

export interface SoporteTiIndicadorPaginacion {
  page: number
  per_page: number
  total: number
  last_page: number
}

export interface SoporteTiIndicadorTiempo {
  id: number
  codigo: string
  titulo: string
  area: string
  tipo: 'A' | 'B'
  estado: string
  complejidad: string
  horas: number
  sla_horas: number
  vencida: boolean
}

export interface SoporteTiIndicadorFinalizada {
  id: number
  codigo: string
  titulo: string
  area: string
  tipo: 'A' | 'B'
  estado: string
  complejidad: string
  finalizado_en: string
  horas: number
  sla_horas: number
  a_tiempo: boolean
}

export interface SoporteTiIndicadorAtencion {
  id: number
  codigo: string
  titulo: string
  area: string
  tipo: 'A' | 'B'
  estado: string
  prioridad: string
  complejidad: string
  pct: number
  zona: 'amber' | 'red'
  horas: number
  sla_horas: number
  atraso: string
}

export interface SoporteTiIndicadorTipoConteo {
  nombre: string
  tipo: 'A' | 'B'
  total: number
}

export interface SoporteTiIndicadores {
  tab?: 'resumen' | 'detalle' | 'tiempos'
  mes: string
  mes_label: string
  area: string | null
  actualizado_en: string
  meses: SoporteTiIndicadorMes[]
  areas: string[]
  resumen: {
    total: number
    total_estado: SoporteTiIndicadorEstado
    total_etiqueta: string
    total_detalle: string
    sla_pct: number | null
    sla_estado: SoporteTiIndicadorEstado
    sla_resueltas: number
    vencidas: number
    vencidas_pct: number
    vencidas_estado: SoporteTiIndicadorEstado
    abiertas: number
    cierre_pct: number | null
    cierre_estado: SoporteTiIndicadorEstado
    cierre_operativas: number
    cierre_total: number
    alertas: SoporteTiIndicadorAlerta[]
  }
  por_area: SoporteTiIndicadorArea[]
  comparacion: {
    proyectos: SoporteTiIndicadorTarjetaTipo
    requerimientos: SoporteTiIndicadorTarjetaTipo
  }
  evolucion: SoporteTiIndicadorEvolucion[]
  detalle: {
    por_tipo: SoporteTiIndicadorTipoConteo[]
    tipo_a: SoporteTiIndicadorBloqueTipo
    tipo_b: SoporteTiIndicadorBloqueTipo
    atencion?: SoporteTiIndicadorAtencion[]
    tiempos?: SoporteTiIndicadorTiempo[]
    tiempos_paginacion?: SoporteTiIndicadorPaginacion
    finalizadas?: SoporteTiIndicadorFinalizada[]
    finalizadas_paginacion?: SoporteTiIndicadorPaginacion
    mensual?: SoporteTiIndicadorEvolucion[]
  }
}
