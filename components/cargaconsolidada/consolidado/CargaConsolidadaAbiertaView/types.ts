export interface CargaConsolidadaAbiertaProps {
  role: string
  backRoute?: string | null
  basePath?: string
}

export interface ConsolidadoFormDatePart {
  year: string | number
  month: string | number
  day: string | number
}

export interface ConsolidadoFormData {
  id: number
  carga: string | number
  mes: string
  pais: string | number
  empresa: string
  fechaCierre: ConsolidadoFormDatePart
  fechaArribo: ConsolidadoFormDatePart
  fechaEntrega: ConsolidadoFormDatePart
  limiteCbmImo?: number | null
  tcYuan?: number | null
}
