/** Normaliza teléfono Perú para preview (misma regla que backend: 9 dígitos → 51). */
export function normalizeWaInboxPhoneE164(phone: string): string {
  const digits = phone.replace(/\D+/g, '')
  if (!digits) return ''
  if (digits.length === 9) return `51${digits}`
  return digits
}

export function formatWaInboxPhonePreview(phoneE164: string): string {
  const d = phoneE164.replace(/\D+/g, '')
  if (d.length === 11 && d.startsWith('51')) {
    return `+51 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  }
  return d ? `+${d}` : ''
}

export function isValidWaInboxPhone(phone: string): boolean {
  const e164 = normalizeWaInboxPhoneE164(phone)
  return e164.length >= 10 && e164.length <= 15
}
