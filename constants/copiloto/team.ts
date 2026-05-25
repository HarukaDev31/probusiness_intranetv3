import type { CopilotoKpiMetric, CopilotoTeamMember } from '~/types/copiloto/lead'

export const COPILOTO_TEAM_MEMBERS: CopilotoTeamMember[] = [
  {
    id: 'all',
    initials: 'EQ',
    name: 'Todo el equipo',
    dealsMes: 18,
    metaDeals: 24,
    pipeline: 'S/ 186k',
    conversion: '34%',
    alertas: 5,
    leadsActivos: 12
  },
  {
    id: 'gianella',
    initials: 'GR',
    name: 'Gianella Ríos',
    dealsMes: 7,
    metaDeals: 8,
    pipeline: 'S/ 72k',
    conversion: '41%',
    alertas: 1,
    leadsActivos: 4
  },
  {
    id: 'pedro',
    initials: 'PS',
    name: 'Pedro Soto',
    dealsMes: 6,
    metaDeals: 8,
    pipeline: 'S/ 58k',
    conversion: '32%',
    alertas: 2,
    leadsActivos: 5
  },
  {
    id: 'lucia',
    initials: 'LV',
    name: 'Lucía Vega',
    dealsMes: 5,
    metaDeals: 8,
    pipeline: 'S/ 56k',
    conversion: '29%',
    alertas: 2,
    leadsActivos: 3
  }
]

export const COPILOTO_KPI_METRICS: CopilotoKpiMetric[] = [
  {
    id: 'deals',
    label: 'Deals cerrados (mes)',
    shortLabel: 'Deals',
    value: '18/24',
    sub: 'Meta mes',
    icon: 'i-heroicons-check-circle',
    accent: '#15803d'
  },
  {
    id: 'pipeline',
    label: 'Pipeline activo',
    shortLabel: 'Pipeline',
    value: '186k',
    sub: '8 neg.',
    icon: 'i-heroicons-funnel',
    accent: '#ea580c'
  },
  {
    id: 'conv',
    label: 'Conversión equipo',
    shortLabel: 'Conv.',
    value: '34%',
    sub: '30 días',
    icon: 'i-heroicons-chart-bar',
    accent: '#1d4ed8'
  },
  {
    id: 'alertas',
    label: 'Alertas críticas',
    shortLabel: 'Alertas',
    value: '5',
    sub: 'Hoy',
    icon: 'i-heroicons-exclamation-triangle',
    accent: '#dc2626'
  }
]
