/** Códigos de país conocidos (pais_flags.phone_code), el más largo primero. */
const KNOWN_CALLING_CODES = [
  '1809', '1787', '593', '591', '595', '598', '507', '506', '502', '503', '504', '505',
  '51', '52', '53', '54', '55', '56', '57', '58', '86', '34', '1'
]

function hasKnownCallingCode(digits: string): boolean {
  return KNOWN_CALLING_CODES.some((code) => {
    if (!digits.startsWith(code)) return false
    const rest = digits.length - code.length
    return code.length === 1 ? rest === 10 : rest >= 7 && rest <= 10
  })
}

/**
 * Normaliza teléfono para preview (misma regla que backend): si no trae código de país
 * se antepone el de la organización (51 por defecto). Un 0 inicial es formato nacional.
 */
export function normalizeWaInboxPhoneE164(phone: string, phoneCode = '51'): string {
  const digits = phone.replace(/\D+/g, '').replace(/^0+/, '')
  if (!digits) return ''
  // 11+ dígitos ya es internacional; o empieza con un código conocido
  if (digits.length > 10 || hasKnownCallingCode(digits)) return digits
  const code = phoneCode.replace(/\D+/g, '') || '51'
  return `${code}${digits}`
}

export function formatWaInboxPhonePreview(phoneE164: string): string {
  const d = phoneE164.replace(/\D+/g, '')
  if (d.length === 11 && d.startsWith('51')) {
    return `+51 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  }
  return d ? `+${d}` : ''
}

export function isValidWaInboxPhone(phone: string, phoneCode = '51'): boolean {
  const e164 = normalizeWaInboxPhoneE164(phone, phoneCode)
  return e164.length >= 10 && e164.length <= 15
}
