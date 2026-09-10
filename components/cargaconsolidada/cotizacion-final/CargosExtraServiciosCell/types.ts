export interface ServicioLine {
  id: number
  tipo_servicio: string
  importe: number
}

export interface CargosExtraServiciosCellProps {
  idCotizacion: number
  idContenedor: number
  clienteNombre?: string
  servicios: ServicioLine[] | string | null | undefined
  editable: boolean
}
