import type { CalendarColorSource, CalendarEventPriority, CalendarEventStatus } from '~/types/calendar'

/** Colores semánticos de NuxtUI (prop `color` de UButton/UBadge). */
export type UiColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export interface PriorityOption {
  label: string
  value: CalendarEventPriority
  color: UiColor
  /** Clases del badge (fondo + texto). */
  badgeClass: string
}

export interface StatusOption {
  label: string
  value: CalendarEventStatus
  icon: string
  /** Clases del badge (fondo + texto). */
  badgeClass: string
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { label: 'Bajo', value: 0, color: 'success', badgeClass: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' },
  { label: 'Medio', value: 1, color: 'warning', badgeClass: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' },
  { label: 'Alto', value: 2, color: 'error', badgeClass: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' }
]

export const STATUS_OPTIONS: StatusOption[] = [
  { label: 'Pendiente', value: 'PENDIENTE', icon: 'i-heroicons-clock', badgeClass: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' },
  { label: 'En progreso', value: 'PROGRESO', icon: 'i-heroicons-play-circle', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { label: 'Completado', value: 'COMPLETADO', icon: 'i-heroicons-check-circle', badgeClass: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' }
]

export const getPriorityOption = (priority: CalendarEventPriority): PriorityOption =>
  PRIORITY_OPTIONS.find(o => o.value === priority) ?? PRIORITY_OPTIONS[0]

export const getStatusOption = (status: CalendarEventStatus): StatusOption =>
  STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[0]

/** Color hex del evento según prioridad (fuente PRIORIDAD). */
export const PRIORITY_HEX: Record<CalendarEventPriority, string> = {
  0: '#22c55e',
  1: '#f59e0b',
  2: '#ef4444'
}

/** Gris para eventos/responsables completados. */
export const COMPLETED_HEX = '#9ca3af'
/** Color neutro cuando un usuario o consolidado no tiene color configurado. */
export const FALLBACK_HEX = '#6B7280'

export const DEFAULT_JEFE_COLOR_ORDER: CalendarColorSource[] = ['ACTIVIDAD', 'CONSOLIDADO', 'USUARIO', 'PRIORIDAD', 'COMPLETADO']
export const DEFAULT_MIEMBRO_COLOR_ORDER: CalendarColorSource[] = ['USUARIO', 'PRIORIDAD', 'ACTIVIDAD', 'CONSOLIDADO', 'COMPLETADO']

export const COLOR_SOURCE_LABELS: Record<CalendarColorSource, string> = {
  PRIORIDAD: 'Prioridad',
  ACTIVIDAD: 'Actividad',
  CONSOLIDADO: 'Consolidado',
  USUARIO: 'Por perfil',
  COMPLETADO: 'Completado'
}

/** Colores por defecto para responsables (se sobrescriben con los de la BD). */
export const DEFAULT_RESPONSABLE_COLORS: Record<string, string> = {
  'Danitza': '#8B5CF6',
  'Daniela': '#EC4899',
  'Patrick': '#3B82F6',
  'Meliza': '#10B981'
}

/** Colores predefinidos para el color picker. */
export const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#78716C', '#6B7280', '#1F2937'
]

/** Lunes primero (columnas de la grilla). */
export const WEEK_DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const PER_PAGE_OPTIONS = [10, 25, 50, 100].map(value => ({ label: `${value} por página`, value }))
