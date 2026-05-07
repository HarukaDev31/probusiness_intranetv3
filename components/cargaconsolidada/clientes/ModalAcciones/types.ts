export interface ModalAccionesProps {
  show: boolean
  clienteId?: number
  clienteName?: string
  onSelected?: (data: unknown) => void
  validateMaxDate?: boolean
}

export type ModalAccionesStep = 1 | 2
export type ModalAccionTipo = 'pedir_documentos' | 'recordatorio'
export type DocumentoTipo = 'commercial_invoice' | 'packing_list' | 'excel_confirmacion'
