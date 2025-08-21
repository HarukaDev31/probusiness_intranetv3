export interface DocumentacionFolder {
  id: string
  id_contenedor: string | null
  folder_name: string
  categoria: 'ENVIO' | 'COMERCIAL' | 'LEGAL'
  only_doc_profile: string
  b_icon: string | null
  id_file: string | null
  file_url: string | null
  type: string | null
  lista_embarque_url: string | null
}

export interface DocumentacionResponse {
  success: boolean
  data: DocumentacionFolder[]
}

export interface DocumentacionFilters {
  categoria?: 'ENVIO' | 'COMERCIAL' | 'LEGAL' | 'TODAS'
  only_doc_profile?: string
}

export interface DocumentacionUpdateRequest {
  folder_name?: string
  categoria?: 'ENVIO' | 'COMERCIAL' | 'LEGAL'
  only_doc_profile?: string
  b_icon?: string | null
  id_file?: string | null
  file_url?: string | null
  type?: string | null
  lista_embarque_url?: string | null
}

export interface DocumentacionUploadRequest {
  folder_id: string
  file: File
  observaciones?: string
  id_proveedor?: number
}
