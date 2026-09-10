export interface PiiMatch {
  type: 'email' | 'telefono' | 'dni' | 'ruc'
  masked: string
}

const patterns: Array<{ type: PiiMatch['type']; regex: RegExp }> = [
  { type: 'email', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: 'ruc', regex: /(?<!\d)(?:10|15|17|20)\d{9}(?!\d)/g },
  { type: 'telefono', regex: /(?<!\d)(?:\+?51[\s-]?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}(?!\d)/g },
  { type: 'dni', regex: /(?<!\d)\d{8}(?!\d)/g },
]

function mask(value: string): string {
  if (value.length <= 4) return '*'.repeat(value.length)
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(8, value.length - 4))}${value.slice(-2)}`
}

export function detectPii(text: string, allow: string[] = []): PiiMatch[] {
  let candidate = text
  for (const allowed of allow) candidate = candidate.split(allowed).join('')

  const matches: PiiMatch[] = []
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0
    for (const match of candidate.matchAll(pattern.regex)) {
      matches.push({ type: pattern.type, masked: mask(match[0]) })
    }
  }
  return matches
}
