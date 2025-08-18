

export interface ClienteDocumentacion {
  id: number
  id_contenedor: number
  id_tipo_cliente: number
  id_cliente: number
  fecha: string
  nombre: string
  documento: string
  correo: string
  telefono: string
  volumen: number
  cotizacion_file_url: string | null
  cotizacion_final_file_url: string | null
  estado: string
  volumen_doc: number
  valor_doc: number
  valor_cot: number
  volumen_china: number
  factura_comercial: string | null
  id_usuario: number
  monto: number
  fob: number
  impuestos: number
  tarifa: number
  excel_comercial: string | null
  excel_confirmacion: string | null
  vol_selected: number
  estado_cliente: string
  peso: number
  tarifa_final: number
  monto_final: number
  volumen_final: number
  guia_remision_url: string | null
  factura_general_url: string | null
  cotizacion_final_url: string | null
  estado_cotizador: string
  fecha_confirmacion: string | null
  estado_pagos_coordinacion: string
  estado_cotizacion_final: string
  impuestos_final: number
  fob_final: number
  note_administracion: string | null
  status_cliente_doc: string
  logistica_final: number
  qty_item: number
  id_cliente_importacion: number
  files: DocumentoFile[]
  files_almacen_documentacion: DocumentoFile[]
  providers: Proveedor[]
  files_almacen_inspection: DocumentoFile[]
}

export interface DocumentoFile {
  id: number
  nombre: string
  url: string
  file_ext: string
  file_url: string
  file_name: string
  folder_name: string
  id_proveedor: number
}

export interface Proveedor {
  id: number
  nombre: string
  estado: string
  fecha_creacion: string
  code_supplier: string
  factura_comercial?: string | null
  excel_confirmacion?: string | null
  packing_list?: string | null
  volumen_doc?: number
  valor_doc?: number
}

export interface ClienteDocumentacionResponse {
  success: boolean
  data: ClienteDocumentacion
  error?: string
}

class ClienteDocumentacionService {
  private static instance: ClienteDocumentacionService

  private constructor() {}

  static getInstance(): ClienteDocumentacionService {
    if (!ClienteDocumentacionService.instance) {
      ClienteDocumentacionService.instance = new ClienteDocumentacionService()
    }
    return ClienteDocumentacionService.instance
  }

  async getClienteDocumentacion(id: string): Promise<ClienteDocumentacionResponse> {
    try {
      const response = await apiCall<ClienteDocumentacionResponse>(`/api/consolidado/cotizacion/clientes-documentacion/${id}`)
      return response
    } catch (error) {
      console.error('Error al obtener documentación del cliente:', error)
      return {
        success: false,
        data: {} as ClienteDocumentacion,
        error: 'Error al obtener la documentación del cliente'
      }
    }
  }

  async subirDocumento(id: string, tipo: string, archivo: File, observaciones?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      formData.append('tipo', tipo)
      if (observaciones) {
        formData.append('observaciones', observaciones)
      }

      await apiCall(`/api/consolidado/cotizacion/clientes-documentacion/${id}/subir`, {
        method: 'POST',
        body: formData
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error al subir documento:', error)
      return {
        success: false,
        error: 'Error al subir el documento'
      }
    }
  }

  async eliminarDocumento(id: string, fileId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await apiCall(`/api/consolidado/cotizacion/clientes-documentacion/${id}/documento/${fileId}`, {
        method: 'DELETE'
      })
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar documento:', error)
      return {
        success: false,
        error: 'Error al eliminar el documento'
      }
    }
  }

  async actualizarDocumentacionProveedor(id: string, proveedorId: number, datos: { volumen: number; valor: number }): Promise<{ success: boolean; error?: string }> {
    try {
      await apiCall(`/api/consolidado/cotizacion/clientes-documentacion/${id}/proveedor/${proveedorId}`, {
        method: 'PUT',
        body: datos
      })
      return { success: true }
    } catch (error) {
      console.error('Error al actualizar documentación del proveedor:', error)
      return {
        success: false,
        error: 'Error al actualizar la documentación del proveedor'
      }
    }
  }

  async actualizarDocumentacion(id: string, datos: Partial<ClienteDocumentacion>): Promise<{ success: boolean; error?: string }> {
    try {
      await apiCall(`/api/consolidado/cotizacion/clientes-documentacion/${id}`, {
        method: 'PUT',
        body: datos
      })
      return { success: true }
    } catch (error) {
      console.error('Error al actualizar documentación:', error)
      return {
        success: false,
        error: 'Error al actualizar la documentación'
      }
    }
  }
}

export const clienteDocumentacionService = ClienteDocumentacionService.getInstance() 