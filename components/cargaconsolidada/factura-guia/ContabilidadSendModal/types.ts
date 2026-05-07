export interface ContabilidadSendModalProps {
idCotizacion: number
  clienteNombre: string
  onClose?: () => void
  onSend?: (action: ContabilidadAction) => void
}
