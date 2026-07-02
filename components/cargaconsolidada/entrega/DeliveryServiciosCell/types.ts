export interface DeliveryServiciosCellProps {
idCotizacion: number
  servicios: ServicioLine[] | null | undefined
  editable: boolean
  fallbackTipo?: string
  fallbackImporte?: number
}
