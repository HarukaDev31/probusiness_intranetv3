/** Opción lista para USelect / USelectMenu */
export interface SelectOption {
  label: string
  value: number
}

export interface MenuOrdenUsuarioOption extends SelectOption {
  id_grupo: number
  id_org: number
}

export interface MenuOrdenItem {
  id: number
  id_padre: number
  nombre: string
  orden: number
  ruta: string | null
  show_father: number
  children: MenuOrdenItem[]
}

export interface MenuOrdenPayload {
  ambito: 'grupo' | 'usuario'
  id_grupo?: number
  id_usuario?: number
  tiene_override: boolean
  items: MenuOrdenItem[]
}

export interface MenuOrdenOpciones {
  organizaciones: SelectOption[]
  grupos: SelectOption[]
  usuarios: MenuOrdenUsuarioOption[]
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiFailure {
  success: false
  data?: undefined
  message?: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure
