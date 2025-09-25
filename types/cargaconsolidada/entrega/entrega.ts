import type { PaginationInfo } from '~/types/data-table'

export interface Entrega {
  id_cotizacion: number
  nombre: string
  documento: string
  telefono: string
  name?: string            // Tipo cliente (en otros módulos se usa name)
  tipo_cliente?: string    // Alias adicional según otras respuestas
  tipo_entrega: 'Lima' | 'Provincia' | null
  registrado: boolean      // Si llenó el formulario
  entregado: boolean       // Si ya se subió evidencia / foto
  estado_pago: 'Pagado' | 'Pendiente' | 'Parcial' | 'Sobrepago' | string
  direccion_entrega: string | null
  fecha_programada: string | null
  estado_entrega: 'PENDIENTE' | 'PROGRAMADA' | 'ENTREGADO'
}

export interface EntregaResponse {
  success: boolean
  data: Entrega[]
  pagination: PaginationInfo
}
