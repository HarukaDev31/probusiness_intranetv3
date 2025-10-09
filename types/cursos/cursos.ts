export interface EstadoDisponible {
    value: string
    label: string
  }
  
  export interface FiltrosResponse {
    success: boolean
    data: {
      campanas: CampanaFilter[]
      estados_pago: EstadoDisponible[]
    }
  }
  
  export interface CampanaFilter {
    id: number
    nombre: string
    fecha_inicio: string
    fecha_inicio_original: string
    fecha_fin: string
    fecha_fin_original: string
  }
  
  export interface FilterConfig {
    key: string
    label: string
    placeholder: string
    options: { label: string; value: any }[]
  }
  
  export interface Concepto {
    id: number
    name: string
    description?: string
  }
  
  export interface PagoDetalle {
    id: number
    monto: number
    monto_formateado: string
    status: string
  }
  
  export interface PagoDetalleItem {
    id: number
    id_pedido_curso: number
    id_concept: number
    monto: string
    status: string
    payment_date: string
    concepto: Concepto
  }
  
  export interface CursoItem {
    ID_Pedido_Curso: number
    Fe_Registro: string
    Fe_Registro_Original: string
    No_Entidad: string
    No_Tipo_Documento_Identidad_Breve: string
    Nu_Documento_Identidad: string
    Nu_Celular_Entidad: string
    Txt_Email_Entidad: string
    tipo_curso: number
    ID_Campana: number
    ID_Usuario: number
    Nu_Estado_Usuario_Externo: number
    Ss_Total: string
    Nu_Estado: number
    Fe_Fin: string
    Fe_Fin_Original: string
    pagos_count: number
    total_pagos: string
    estado_pago: string
    puede_constancia: boolean
    Fe_Nacimiento: string
    Fe_Nacimiento_Original: string
    Nu_Como_Entero_Empresa: number
    No_Otros_Como_Entero_Empresa: string | null
    No_Distrito: string
    No_Provincia: string | null
    No_Departamento: string | null
    No_Pais: string
    Nu_Tipo_Sexo: number
    Nu_Edad: number
    No_Signo: string
    No_Usuario: string
    Url_Constancia: string | null
    usuario_moodle: string | null
    password_moodle: string | null
  }

  export interface DatosClientePorPedido {
    id_entidad: number;
    nombres: string;
    sexo: string;
    dni: string;
    whatsapp: string;
    correo: string;
    nacimiento: string;
    red_social: string;
    id_pais: number;
    id_departamento: number;
    id_provincia: number;
    id_distrito: number;
    pais: string;
    departamento: string;
    provincia: string;
    distrito: string;
    id_usuario: number;
    usuario_moodle: string;
    password_moodle: string;
    ID_Campana: number;
    tipo_curso: number;
    Nu_Estado: number;
    Nu_Estado_Usuario_Externo: number;
    id_pedido_curso: number;
    url_constancia: string;
    mes_numero: number;
    mes_nombre: string;
}
  
  export interface PaginationInfo {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  
  export interface HeaderInfo {
    value: number
    label: string
  }
  
  export interface HeadersInfo {
    importe_total: HeaderInfo
    total_pedidos: HeaderInfo
  }
  
  export interface CursosResponse {
    success: boolean
    data: CursoItem[]
    pagination: PaginationInfo
    headers: HeadersInfo
    filters: {
      campanas: CampanaFilter[]
    }
  }
  
  export interface CursosDetalleResponse {
    success: boolean
    data: PagoDetalleItem[]
    nota: string
    total_a_pagar: number
    total_a_pagar_formateado: string
    total_pagado: number
    total_pagado_formateado: string
  }
  
  export interface CursosFilters {
    Filtro_Fe_Inicio?: string
    Filtro_Fe_Fin?: string
    campana?: number
    estado_pago?: string
    search?: string
    fecha_inicio?: string
    fecha_fin?: string
  }