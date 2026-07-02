/** Estados de entrega Meta/WhatsApp (mensajes salientes). */
export type WhatsappDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | string

export function deliveryIcon(status?: string | null): string {
  if (status === 'read') return '✓✓'
  if (status === 'delivered') return '✓✓'
  if (status === 'sent') return '✓'
  if (status === 'failed') return '✗'
  return ''
}

export function deliveryStatusClass(status?: string | null): string {
  if (status === 'failed') return 'text-error'
  if (status === 'read') return 'text-info'
  if (status === 'delivered') return 'text-highlighted'
  if (status === 'sent') return 'text-muted'
  return 'text-muted'
}

export function deliveryTooltip(
  status?: string | null,
  failedReason?: string | null
): string {
  if (status === 'failed') {
    return failedReason?.trim() || 'No se entregó al WhatsApp del cliente'
  }
  if (status === 'pending') return 'Enviando…'
  if (status === 'sent') return 'Enviado (aceptado por Meta)'
  if (status === 'delivered') return 'Entregado al teléfono'
  if (status === 'read') return 'Leído por el cliente'
  return 'Estado de envío'
}
