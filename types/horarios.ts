export interface TimeSlot {
  id: string
  time: string
  endTime?: string
  isAvailable: boolean
  maxCapacity?: number
  currentBookings?: number
  isHidden?: boolean
}

export interface ScheduleConfig {
  id: string
  name: string
  description?: string
  timeSlots: TimeSlot[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ScheduleFormData {
  name: string
  description?: string
  timeSlots: Omit<TimeSlot, 'id'>[]
  isActive?: boolean
}

export interface TimeSlotFormData {
  time: string
  isAvailable: boolean
  maxCapacity?: number
}
