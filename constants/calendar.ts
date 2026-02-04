import type { CalendarEventPriority, CalendarEventStatus } from '~/types/calendar'

// Opciones de prioridad para selects
export const PRIORITY_OPTIONS: { label: string; value: CalendarEventPriority; color: string }[] = [
  { label: 'Bajo', value: 0, color: 'success' },
  { label: 'Medio', value: 1, color: 'warning' },
  { label: 'Alto', value: 2, color: 'error' }
]

// Opciones de estado para selects
export const STATUS_OPTIONS: { label: string; value: CalendarEventStatus; color: string }[] = [
  { label: 'Pendiente', value: 'PENDIENTE', color: 'warning' },
  { label: 'En Progreso', value: 'PROGRESO', color: 'info' },
  { label: 'Completado', value: 'COMPLETADO', color: 'success' }
]

// Colores por defecto para responsables (se sobrescriben con los de la BD)
export const DEFAULT_RESPONSABLE_COLORS: Record<string, string> = {
  'Danitza': '#8B5CF6',   // Violeta
  'Daniela': '#EC4899',   // Rosa
  'Patrick': '#3B82F6',   // Azul
  'Meliza': '#10B981'     // Verde
}

// Opciones de vista del calendario
export const VIEW_OPTIONS = [
  { label: 'Día', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Actividades', value: 'activities' } // Nueva vista de tabla
]

// Colores predefinidos para el color picker
export const COLOR_PRESETS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#78716C', // Stone
  '#6B7280', // Gray
  '#1F2937'  // Dark
]

// Máximo de responsables por actividad
export const MAX_RESPONSABLES_PER_ACTIVITY = 2

// Días de la semana
export const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const WEEK_DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Meses
export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
