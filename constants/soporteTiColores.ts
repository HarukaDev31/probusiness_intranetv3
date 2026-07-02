import type { SoporteTiTipo } from '~/types/soporteTi'
import { SOPORTE_TI_ESTADOS } from '~/constants/soporteTiEstados'

/** Colores Tailwind para selects / badges custom (borde + fondo + texto). */
export type SoporteTiClasesColor = string

export type SoporteTiBadgeColorNuxt =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutral'

/** Estado del ticket (código API). */
export const SOPORTE_TI_COLOR_ESTADO: Record<
  string,
  { badge: SoporteTiClasesColor; select: SoporteTiClasesColor; uBadge: SoporteTiBadgeColorNuxt }
> = {
  pendiente: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-600',
    select:
      'ring-1 ring-slate-200 bg-slate-50 text-slate-800 dark:ring-slate-600 dark:bg-slate-900/60 dark:text-slate-100',
    uBadge: 'neutral'
  },
  en_maqueta: {
    badge: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800',
    select:
      'ring-1 ring-violet-200 bg-violet-50 text-violet-900 dark:ring-violet-800 dark:bg-violet-950/40 dark:text-violet-100',
    uBadge: 'primary'
  },
  en_progreso: {
    badge: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800',
    select:
      'ring-1 ring-sky-200 bg-sky-50 text-sky-900 dark:ring-sky-800 dark:bg-sky-950/40 dark:text-sky-100',
    uBadge: 'info'
  },
  hecho: {
    badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800',
    select:
      'ring-1 ring-teal-200 bg-teal-50 text-teal-900 dark:ring-teal-800 dark:bg-teal-950/40 dark:text-teal-100',
    uBadge: 'success'
  },
  desplegado: {
    badge: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
    select:
      'ring-1 ring-amber-200 bg-amber-50 text-amber-950 dark:ring-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    uBadge: 'warning'
  },
  observado: {
    badge: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800',
    select:
      'ring-1 ring-orange-200 bg-orange-50 text-orange-900 dark:ring-orange-800 dark:bg-orange-950/40 dark:text-orange-100',
    uBadge: 'error'
  },
  operativo: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800',
    select:
      'ring-1 ring-emerald-200 bg-emerald-50 text-emerald-900 dark:ring-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
    uBadge: 'success'
  }
}

/** Prioridad 1 = Alta, 2 = Media, 3 = Baja */
export const SOPORTE_TI_COLOR_PRIORIDAD: Record<
  number,
  { badge: SoporteTiClasesColor; select: SoporteTiClasesColor; uBadge: SoporteTiBadgeColorNuxt; label: string }
> = {
  1: {
    label: 'Alta',
    badge: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800',
    select:
      'ring-1 ring-red-200 bg-red-50 text-red-900 dark:ring-red-800 dark:bg-red-950/40 dark:text-red-100',
    uBadge: 'error'
  },
  2: {
    label: 'Media',
    badge: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
    select:
      'ring-1 ring-amber-200 bg-amber-50 text-amber-950 dark:ring-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    uBadge: 'warning'
  },
  3: {
    label: 'Baja',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-600',
    select:
      'ring-1 ring-slate-200 bg-slate-50 text-slate-700 dark:ring-slate-600 dark:bg-slate-900/60 dark:text-slate-200',
    uBadge: 'neutral'
  }
}

/** Complejidad / criticidad */
export const SOPORTE_TI_COLOR_COMPLEJIDAD: Record<string, SoporteTiClasesColor & { uBadge: SoporteTiBadgeColorNuxt }> = {
  Baja: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800',
    select:
      'ring-1 ring-emerald-200 bg-emerald-50 text-emerald-900 dark:ring-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
    uBadge: 'success'
  },
  Media: {
    badge: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
    select:
      'ring-1 ring-amber-200 bg-amber-50 text-amber-950 dark:ring-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    uBadge: 'warning'
  },
  Alta: {
    badge: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800',
    select:
      'ring-1 ring-orange-200 bg-orange-50 text-orange-900 dark:ring-orange-800 dark:bg-orange-950/40 dark:text-orange-100',
    uBadge: 'warning'
  },
  Máxima: {
    badge: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800',
    select:
      'ring-1 ring-red-200 bg-red-50 text-red-900 dark:ring-red-800 dark:bg-red-950/40 dark:text-red-100',
    uBadge: 'error'
  },
  'Por definir': {
    badge: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-700',
    select:
      'ring-1 ring-slate-200 bg-slate-50 text-slate-500 dark:ring-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
    uBadge: 'neutral'
  }
}

const FALLBACK_ESTADO = SOPORTE_TI_COLOR_ESTADO.pendiente
const FALLBACK_PRIORIDAD = SOPORTE_TI_COLOR_PRIORIDAD[2]
const FALLBACK_COMPLEJIDAD = SOPORTE_TI_COLOR_COMPLEJIDAD['Por definir']

export function estadosCatalogoPorTipo(tipo: SoporteTiTipo) {
  return SOPORTE_TI_ESTADOS.filter((e) => e.ordenKanban != null)
    .filter((e) => e.tipoSolicitud == null || e.tipoSolicitud === tipo)
    .sort((a, b) => (a.ordenKanban ?? 0) - (b.ordenKanban ?? 0))
}

export function clasesBadgeEstado(codigo: string): SoporteTiClasesColor {
  return (SOPORTE_TI_COLOR_ESTADO[codigo] ?? FALLBACK_ESTADO).badge
}

export function clasesSelectEstado(codigo: string): SoporteTiClasesColor {
  return (SOPORTE_TI_COLOR_ESTADO[codigo] ?? FALLBACK_ESTADO).select
}

export function uBadgeColorEstado(codigo: string): SoporteTiBadgeColorNuxt {
  return (SOPORTE_TI_COLOR_ESTADO[codigo] ?? FALLBACK_ESTADO).uBadge
}

export function clasesBadgePrioridad(valor: number): SoporteTiClasesColor {
  return (SOPORTE_TI_COLOR_PRIORIDAD[valor] ?? FALLBACK_PRIORIDAD).badge
}

export function clasesSelectPrioridad(valor: number): SoporteTiClasesColor {
  return (SOPORTE_TI_COLOR_PRIORIDAD[valor] ?? FALLBACK_PRIORIDAD).select
}

export function uBadgeColorPrioridad(valor: number): SoporteTiBadgeColorNuxt {
  return (SOPORTE_TI_COLOR_PRIORIDAD[valor] ?? FALLBACK_PRIORIDAD).uBadge
}

export function clasesBadgeComplejidad(etiqueta: string | null | undefined): SoporteTiClasesColor {
  const key = normalizarComplejidad(etiqueta)
  return (SOPORTE_TI_COLOR_COMPLEJIDAD[key] ?? FALLBACK_COMPLEJIDAD).badge
}

export function clasesSelectComplejidad(etiqueta: string | null | undefined): SoporteTiClasesColor {
  const key = normalizarComplejidad(etiqueta)
  return (SOPORTE_TI_COLOR_COMPLEJIDAD[key] ?? FALLBACK_COMPLEJIDAD).select
}

export function uBadgeColorComplejidad(etiqueta: string | null | undefined): SoporteTiBadgeColorNuxt {
  const key = normalizarComplejidad(etiqueta)
  return (SOPORTE_TI_COLOR_COMPLEJIDAD[key] ?? FALLBACK_COMPLEJIDAD).uBadge
}

function normalizarComplejidad(etiqueta: string | null | undefined): string {
  const t = (etiqueta ?? '').trim()
  if (!t || t === 'Por definir' || t === 'Por asignar') return 'Por definir'
  const hit = Object.keys(SOPORTE_TI_COLOR_COMPLEJIDAD).find(
    (k) => k.toLowerCase() === t.toLowerCase()
  )
  return hit ?? t
}
