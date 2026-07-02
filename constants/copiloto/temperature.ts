export interface CopilotoTempConfig {
  bar: string
  bg: string
  color: string
  lbl: string
  icon: string
  sBg: string
  sBrd: string
  sLbl: string
  sTxt: string
}

export function getCopilotoTempConfig(p: number): CopilotoTempConfig {
  if (p >= 70) {
    return {
      bar: '#ef4444',
      bg: '#fef2f2',
      color: '#991b1b',
      lbl: 'Caliente',
      icon: 'i-heroicons-fire',
      sBg: '#fff7ed',
      sBrd: '#fed7aa',
      sLbl: '#c2410c',
      sTxt: '#7c2d12'
    }
  }
  if (p >= 45) {
    return {
      bar: '#eab308',
      bg: '#fef9c3',
      color: '#854d0e',
      lbl: 'Tibio',
      icon: 'i-heroicons-sun',
      sBg: '#fffbeb',
      sBrd: '#fde68a',
      sLbl: '#b45309',
      sTxt: '#78350f'
    }
  }
  if (p >= 25) {
    return {
      bar: '#3b82f6',
      bg: '#dbeafe',
      color: '#1e40af',
      lbl: 'Enfriando',
      icon: 'i-heroicons-cloud',
      sBg: '#eff6ff',
      sBrd: '#bfdbfe',
      sLbl: '#1d4ed8',
      sTxt: '#1e3a8a'
    }
  }
  return {
    bar: '#94a3b8',
    bg: '#f1f5f9',
    color: '#475569',
    lbl: 'Frío',
    icon: 'i-heroicons-snowflake',
    sBg: '#f8fafc',
    sBrd: '#e2e8f0',
    sLbl: '#475569',
    sTxt: '#334155'
  }
}
