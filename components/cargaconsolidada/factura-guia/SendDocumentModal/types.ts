export interface SendDocumentModalProps {
idCotizacion: number
  clienteNombre: string
  hasFactura: boolean
  hasGuia: boolean
  onClose?: () => void
  onSend?: (documentType: 'factura' | 'guia') => void
}
