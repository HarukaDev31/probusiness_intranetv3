export interface CalendarEvent {
  id?: number
  title: string
  description?: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  is_all_day?: boolean
  is_for_me?: boolean
  role_id?: number | null
  role_name?: string | null
  is_public?: boolean
  created_by?: number
  created_by_name?: string
  created_at?: string
  updated_at?: string
  color?: string
  type?: 'evento' | 'tarea'
  parent_task_id?: number | null
  task_day_id?: number | null
}

export interface CreateEventRequest {
  title: string
  description?: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  is_all_day?: boolean
  is_for_me?: boolean
  is_for_my_role?: boolean
  is_public?: boolean
  type?: 'evento' | 'tarea'
}

export interface UpdateEventRequest extends CreateEventRequest {
  id: number
  task_day_id?: number | null
}

export interface MoveEventRequest {
  id: number
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
}

export interface CalendarResponse {
  data: CalendarEvent[]
  success: boolean
  message?: string
}

export interface CalendarFilters {
  start_date?: string
  end_date?: string
  role_id?: number
}

