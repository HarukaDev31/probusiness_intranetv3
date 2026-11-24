export interface ChinaStage { number: number; title: string; done: number; total: number; locked: boolean; lock_message: string }

export interface ChinaContainerData {
  freight_usd: number | null; filling_on: string | null; sailing_on: string | null; arrival_on: string | null
  shipping_line: string | null; destination_port: string | null; free_days: string | null; container_type: string | null; shipper: string | null
  list_updated: boolean; bl_consignee: string | null; bl_description: string | null; bl_number: string | null
  bl_draft_name: string | null; bl_official_name: string | null; telex: boolean
}

export type ChinaContainerGroup = 'arrived' | 'this_week' | 'no_date' | 'in_transit' | 'to_sail' | 'completed'

export interface ChinaContainer {
  id: number; label: string; country: string; client: string; closed: boolean; closed_on: string | null; cbm: number
  data: ChinaContainerData
  bl_draft_url: string | null; bl_official_url: string | null
  operation: { id: number; code: string; status: string; pending: number } | null
  operation_to_approve: boolean
  collection: 'none' | 'pending' | 'partial' | 'paid'
  freight: { paid: boolean; payment_id: number | null; paid_on: string | null; manual: boolean; voucher_name: string | null; voucher_url: string | null }
  progress: { stages: ChinaStage[]; percent: number; current: number | null; complete: boolean; missing_reservation: string[] }
  status: { group: ChinaContainerGroup; completed: boolean; days_to_arrival: number | null; bl_due: boolean; arrival_due: boolean; bl_from: string | null; arrival_from: string | null }
}

export interface ChinaContainerOptions { lines: string[]; shippers: string[]; container_types: string[] }

export interface ChinaCashTotals { income: number; income_projected: number; expense: number; expense_projected: number; profit: number; profit_projected: number }

export interface ChinaCashMovement {
  date: string; type: 'in' | 'out'; origin: string; title: string; detail: string; amount: number; real: boolean
  link: 'operation' | 'payment' | 'container' | 'request' | 'investment' | null; link_id: number | null
  due_on?: string | null; days?: number | null; late?: boolean
}

export interface ChinaUsdToExchange { id: number; code: string; client: string; operations: string[]; confirmed_on: string; usd: number }

export interface ChinaCashWeek {
  index: number; starts_on: string; ends_on: string; due_on: string; totals: ChinaCashTotals
  closing: { balance: number; usd_pending: number; screenshot_name: string; screenshot_url: string | null } | null
  can_close: boolean; overdue: boolean; usd_to_exchange: ChinaUsdToExchange[]
}

export interface ChinaCashMonth {
  month: string; today: string; current: boolean; closed: boolean; exchange_rate: number | null
  opening_balance: number | null; opening_editable: boolean; balance: number | null; projected_closing: number | null
  totals: ChinaCashTotals; previous_totals: ChinaCashTotals; weeks: ChinaCashWeek[]
  real: ChinaCashMovement[]; pending: ChinaCashMovement[]; late: ChinaCashMovement[]
  fixed_costs: Array<{ id: number; name: string; amount: number; active: boolean }>
  investments: Array<{ id: number; name: string; amount: number; due_on: string; paid_on: string | null }>
  can_close_month: boolean; close_month_blocker: string | null
}

export interface ChinaCashHistory {
  month: string; closed: boolean; opening: number | null; income: number; expense: number; profit: number
  calculated: number | null; bank: number | null; difference: number | null
}

export interface ChinaPending { section: string; kind: string; urgent: boolean; tag: string; title: string; detail: string; to: string; count: number }
