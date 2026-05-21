export interface ClienteFormularioEntrega {
  id: number
  nombre: string
  telefono?: string
  type_form: 0 | 1 | null
}

export interface FormularioEntregaSeleccion {
  id_cotizacion: number
  type_form?: 0 | 1 | null
}

export interface EnviarFormularioEntregaModalProps {
  modelValue?: boolean
  clientes: ClienteFormularioEntrega[]
  sending?: boolean
}
