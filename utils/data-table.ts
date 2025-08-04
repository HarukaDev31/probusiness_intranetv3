/**
 * Convierte una fecha del formato DD/MM/YYYY a YYYY-MM-DD para inputs de tipo date
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ''
  const parts = dateString.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return dateString
}

/**
 * Convierte una fecha del formato YYYY-MM-DD a DD/MM/YYYY
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return ''
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return dateString
} 