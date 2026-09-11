export interface OrganizacionPortalUrls {
  organizacion_id: number
  url_clientes: string
  url_excel_confirmacion: string
  url_datos_proveedor: string
  nombre_publico?: string | null
  logo_url?: string | null
  drive_folder_id?: string | null
  public_key?: string | null
}

export interface OrganizacionPortalResponse {
  success: boolean
  data?: OrganizacionPortalUrls
  message?: string
}
