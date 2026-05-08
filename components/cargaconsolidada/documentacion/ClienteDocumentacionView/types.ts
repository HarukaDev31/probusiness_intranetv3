export interface ClienteDocumentacionViewProps {
clienteId: number
  returnUrl: string
  title?: string
  subtitle?: string
  showDocumentacionPeru?: boolean
  showDocumentacionChina?: boolean
  showInspeccion?: boolean
  showTopSaveButton?: boolean
  showClipboardButtons?: boolean
  readOnly?: boolean
  forceShowChinaInspection?: boolean
  peruvianTitle?: string
  chinaTitle?: string
  inspeccionTitle?: string
}
