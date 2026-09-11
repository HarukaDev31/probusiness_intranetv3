export type HomeStatsCardKey = 'cbm' | 'customers' | 'codes' | 'warehouse' | 'containers'

export interface HomeStatsCountryRow {
  country: string
  value: number
}

export interface HomeStatsCard {
  key: HomeStatsCardKey
  value: number
  by_country: HomeStatsCountryRow[]
}

export interface HomeStatsData {
  scope: 'global' | 'organizacion'
  cards: HomeStatsCard[]
}

export interface HomeStatsResponse {
  success: boolean
  data: HomeStatsData
  message?: string
}
