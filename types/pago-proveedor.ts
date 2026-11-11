export interface PagoProveedorCodigoCc {
  id_proveedor_cc: number
  code_supplier: string
  producto?: string | null
  nombre?: string | null
}

export interface PagoProveedorSugerenciaCc {
  cod_cotizacion_cc: string
  cliente_nombre: string | null
  cliente_documento: string | null
  consolidado: string | null
}

export interface PagoProveedorBusquedaCc {
  cod_cotizacion_cc: string
  calculadora_importacion_id: number
  id_cotizacion_cc: number | null
  cliente: {
    nombre: string | null
    documento: string | null
    whatsapp: string | null
    correo: string | null
  }
  consolidado: string | null
  proveedores: PagoProveedorCodigoCc[]
  ya_usada: boolean
  aviso: string | null
}

export interface PagoProveedorCalculoLinea {
  orden: number
  moneda: string
  modalidad_abono: string
  modalidad_pago: string
  valor_carga_usd: number
  bancaria: number
  administrativa: number
  total: number
  total_ahora: number
  etiqueta_bancaria: string | null
  comision_bancaria?: boolean
  bancaria_por_cuota?: boolean
  cuotas: Array<{ numero: number; porcentaje: number; carga: number; bancaria: number; administrativa: number; total: number }>
  pagos_proveedor: Array<{ numero: number; porcentaje: number; carga: number }>
}

export interface PagoProveedorProveedor {
  id?: number
  orden: number
  code_supplier: string | null
  nombre_proveedor: string | null
  producto: string | null
  moneda: 'RMB' | 'USD'
  tipo_pago: 'transferencia' | 'tt' | 'tarjeta'
  valor_carga_usd: number
  modalidad_abono: 'total' | 'fraccionado'
  modalidad_pago: 'total' | 'fraccionado'
  porcentaje_1: number
  porcentaje_2: number | null
  fecha_cuota_2: string | null
  comision_bancaria: boolean
  comision_administrativa: boolean
  proforma_nombre?: string | null
  proforma_url?: string | null
  calculo?: PagoProveedorCalculoLinea | null
}

export interface PagoProveedorCotizacion {
  id: number
  codigo: string
  solicitud_id?: number | null
  estado: 'pendiente' | 'confirmada'
  cod_cotizacion_cc: string
  consolidado: string | null
  cliente_nombre: string | null
  cliente_documento: string | null
  cliente_whatsapp: string | null
  cliente_correo: string | null
  tipo_cambio: number | null
  tipo_cambio_fecha?: string | null
  tipo_cambio_confirmado: boolean
  vigencia_fin: string | null
  vigencia_texto: string
  vigencia_hasta?: string | null
  resumen_enviado?: boolean
  vencida: boolean
  antiguedad_dias?: number | null
  antiguedad_texto?: string | null
  resaltar?: boolean
  proveedores_cantidad: number
  total: number
  total_ahora: number
  comisiones: number
  puede_editar: boolean
  puede_anular?: boolean
  observacion?: { motivo: string; detalle?: string | null; plazo?: string | null } | null
  puede_eliminar: boolean
  puede_enviar: boolean
  puede_descargar_pdf?: boolean
  puede_crear_solicitud: boolean
  puede_renovar: boolean
  faltantes_pdf: string[]
  faltantes: string[]
  codigos_disponibles: PagoProveedorCodigoCc[]
  proveedores: PagoProveedorProveedor[]
  documento?: PagoProveedorDocumento | null
  creado_en: string | null
  historial: Array<{ accion: string; detalle: string | null; usuario: string; fecha: string | null }>
}

/**
 * PDF emitido y su paso del flujo. Se regenera solo si cambian los datos o el paso.
 */
export interface PagoProveedorDocumento {
  paso: number
  paso_nombre: string
  paso_actual?: number
  paso_actual_nombre?: string
  desactualizado?: boolean
  generado_en: string | null
  emitido_el: string | null
  descargas: number
  generado: boolean
}

export interface PagoProveedorDocumentoEmitido extends PagoProveedorDocumento {
  filename: string
  base64: string
}

export interface PagoProveedorSolicitud {
  id: number
  numero_orden: number
  cotizacion_id: number
  cotizacion_codigo?: string | null
  cod_cotizacion_cc: string
  cliente_nombre: string | null
  cliente_documento?: string | null
  cliente_whatsapp?: string | null
  cliente_correo?: string | null
  consolidado: string | null
  tipo_cambio?: number | null
  proveedores_cantidad?: number
  providers?: SupplierPaymentProviderRow[]
  total_cotizado?: number
  total_abonado?: number
  saldo_pendiente?: number
  excedente?: number
  creado_en: string | null
  proveedores?: PagoProveedorSolicitudProveedor[]
  abonos?: PagoProveedorAbono[]
  documentos?: PagoProveedorDocumentoEstado[]
  historial?: Array<{ accion: string; detalle: string | null; usuario: string; fecha: string | null }>
}

/** Documento emitido de la solicitud: resumen general (alcance 0) o balance por proveedor. */
export interface PagoProveedorDocumentoEstado {
  alcance_id: number
  documento: 'resumen' | 'balance'
  paso: number
  paso_nombre: string
  paso_actual?: number
  paso_actual_nombre?: string
  desactualizado?: boolean
  generado_en: string | null
  emitido_el: string | null
  descargas: number
}

export interface SupplierPaymentProviderRow {
  id: number
  request_id: number
  order_number: number
  supplier_code: string | null
  supplier_name: string | null
  product: string | null
  currency: string
  payment_type: string
  payment_shape: 'single' | 'client_installments' | 'supplier_installments'
  stage: number
  status: string
  request_code: string | null
  sales_task: 'provider_data' | 'receipt' | 'observed' | 'confirmation' | null
  owner: 'sales' | 'other'
  approval_status?: string | null
  collect_amount?: number | null
  exchange_result?: string | null
  second_payment_choice?: string | null
  second_installment_on?: string | null
  current_installment?: number
  decision_due_at?: string | null
  decision_due_text?: string | null
  observe_until?: string | null
  observe_text?: string | null
  observe_label?: string | null
}

export interface PagoProveedorSolicitudProveedor {
  id: number
  orden: number
  titulo: string
  code_supplier: string
  nombre_proveedor: string | null
  producto: string
  moneda: string
  tipo_pago: string
  valor_carga_usd: number
  bancaria_monto: number
  administrativa_monto: number
  total_monto: number
  etiqueta_bancaria: string | null
  importe_requerido: number
  importe_abonado: number
  saldo: number
  proforma_nombre: string | null
  proforma_url: string | null
  etapa: number
  etapa_nombre: string
  estado: string
  estado_nombre: string
  codigo_solicitud: string | null
  puede_editar_etapa1: boolean
  puede_registrar_diferencia?: boolean
  puede_levantar?: boolean
  cuota_actual?: number
  cuota_carga?: number | null
  observacion_china?: {
    reason: string
    label: string
    detail: string | null
    until: string | null
    until_text?: string | null
    overdue: boolean
  } | null
  observacion_ventas?: { motivo: string; fecha: string | null } | null
  motivo_anulacion?: string | null
  progreso?: SupplierPaymentProgress
  documento_balance?: PagoProveedorDocumento | null
  modalidad_abono: string
  modalidad_pago?: string
  datos: {
    estado: string
    origen: string | null
    vendedor_nombre: string | null
    wechat: string | null
    correccion_solicitada: boolean
    beneficiario_nombre: string | null
    beneficiario_cuenta?: string | null
    beneficiario_direccion?: string | null
    beneficiario_pais?: string | null
    beneficiario_ciudad?: string | null
    banco_tipo_codigo?: string | null
    banco_nombre: string | null
    banco_codigo: string | null
    banco_direccion?: string | null
    banco_pais?: string | null
    banco_ciudad?: string | null
    usa_intermediario?: boolean
    inter_tipo_codigo?: string | null
    inter_codigo?: string | null
    inter_nombre?: string | null
    inter_direccion?: string | null
    inter_pais?: string | null
    inter_ciudad?: string | null
  }
}

export interface SupplierPaymentProgressItem {
  key: string
  label: string
  done: boolean
  blocks: boolean
  owner: string
}

export interface SupplierPaymentProgressDeposit {
  id: number
  number?: number
  amount: number
  applied_amount: number
  recorded_amount: number | null
  corrections: Array<{ field: string; from: string; to: string }>
  modified: boolean
  shared: boolean
  bank_label: string
  voucher_url: string | null
  can_edit: boolean
  verified_at: string | null
  verified_by: string | null
  deadline_text: string | null
  deadline_overdue: boolean
  observation: { reason: string; detail: string | null; deadline_text: string | null } | null
  status: string
  status_label: string
  paid_on: string | null
  operation_number: string
}

export interface SupplierPaymentApprovalSummary {
  state: 'approved' | 'to_collect' | 'registration_error' | 'waiting_money' | 'waiting_shared' | 'missing_data' | 'difference' | 'waiting_verification' | 'evaluating'
  automatic: boolean
  decided_at: string | null
  decided_by: string | null
  assumed_amount: number | null
  assumed_reason: string | null
  collect_amount: number | null
  deadline_text: string | null
  note: string | null
  surplus: number
  surplus_applied: boolean
  difference: number
  tolerance: number
}

export interface SupplierPaymentSurplusRow {
  deposit_id: number
  amount: number
  decision: string
  refund_status: string | null
  rejection: string | null
  voucher_url: string | null
  can_apply_installment: boolean
}

export interface SupplierPaymentProgress {
  verification: {
    deposits: SupplierPaymentProgressDeposit[]
    approval: SupplierPaymentApprovalSummary
    surpluses: SupplierPaymentSurplusRow[]
    approval_status: string | null
    approval_label: string
  }
  executions: Array<{ id: number; cargo_amount: number; executed_on: string | null; registered_at: string | null; registered_by: string | null; paid_yuan: number | null; receipt_name: string | null; receipt_url: string | null }>
  confirmation: {
    visible: boolean
    completed: boolean
    items: SupplierPaymentProgressItem[]
    done_count: number
    total: number
    missing: string[]
    can_decide_installment: boolean
    can_decide_payment: boolean
    second_installment_choice: string | null
    second_payment_choice: string | null
    can_register_exchange: boolean
    can_send_balance: boolean
    can_download_balance: boolean
    can_request_refund: boolean
    can_complete?: boolean
    complete_label?: string
    exchange_due_usd: number
    exchange_result: string | null
    exchange_amount_usd: number
    exchange_covered: boolean
    exchange_validating: boolean
    balance_sent: boolean
    payment_two_refund: { cargo: number; admin: number; total: number } | null
    decision_due_at: string | null
    decision_overdue: boolean
    decision_due_text?: string | null
    pending_refund?: {
      amount: number
      status: string
      status_label: string
      origin_label: string
      rejection?: string | null
      blocks_close: boolean
      voucher_url?: string | null
    } | null
    exchange_rate_pending: boolean
  }
}

export interface PagoProveedorAbono {
  id: number
  numero?: number
  importe: number
  fecha_pago: string
  numero_operacion: string
  banco: string
  interbancaria: boolean
  voucher_nombre: string
  voucher_url: string | null
  estado: string
  estado_nombre: string
  excedente: number
  excedente_decision: string | null
  excedente_decide_until?: string | null
  excedente_decide_overdue?: boolean
  excedente_decide_text?: string | null
  operacion_repetida: boolean
  puede_editar: boolean
  puede_anular?: boolean
  observacion?: { motivo: string; detalle?: string | null; plazo?: string | null } | null
  puede_elegir_continuacion?: boolean
  aplicaciones: Array<{ solicitud_proveedor_id: number; monto: number; continua?: boolean | null }>
}

export interface SupplierPaymentRefund {
  id: number
  request_id: number
  provider_id: number | null
  order_number: number | null
  client_name: string | null
  consolidation: string | null
  supplier_code: string | null
  supplier_name?: string | null
  product?: string | null
  request_code?: string | null
  currency?: string | null
  origin: string
  origin_label: string
  status: string
  status_label: string
  amount: number
  approved_amount: number | null
  reason: string | null
  calculation: string
  calculation_lines: string[]
  requested_at: string | null
  paid_on: string | null
  bank: string | null
  bank_label: string | null
  operation_number: string | null
  voucher_name: string | null
  voucher_url: string | null
  can_approve: boolean
  can_reject: boolean
}

export interface SupplierPaymentDepositProvider {
  id: number
  supplier_code: string | null
  supplier_name: string | null
  request_code: string | null
  amount: number
}

export interface SupplierPaymentSla {
  registered_at: string | null
  deadline_at: string | null
  server_now: string | null
  hours: number
  remaining_minutes: number | null
  overdue: boolean
  text: string | null
}

export interface SupplierPaymentDepositComparison {
  recorded_amount: number
  bank_amount: number | null
  difference: number | null
  tolerance: number
  exception_limit: number
}

export interface SupplierPaymentDeposit {
  id: number
  number?: number
  request_id: number
  order_number: number | null
  client_name: string | null
  client_document: string | null
  client_whatsapp: string | null
  consolidation: string | null
  bank: string
  bank_label: string
  interbank: boolean
  paid_on: string | null
  operation_number: string
  amount: number
  bank_amount: number | null
  recorded_amount: number | null
  voucher_name: string | null
  voucher_url: string | null
  status: string
  status_label: string
  /** `client_deposit` (abono del cliente) o `exchange_difference` (diferencia de cambio). */
  purpose?: string
  purpose_label?: string
  deadline_text: string | null
  deadline_overdue: boolean
  sla: SupplierPaymentSla
  comparison: SupplierPaymentDepositComparison
  observation_reason: string | null
  observation_detail: string | null
  observe_until: string | null
  corrected_by_admin: boolean
  verified_at: string | null
  providers: SupplierPaymentDepositProvider[]
  shared: boolean
  can_validate: boolean
  can_undo: boolean
  can_extend: boolean
  can_cancel_payment: boolean
  undo_notifies_sales: boolean
}

export interface SupplierPaymentApprovalDeposit {
  id: number
  number?: number
  paid_on: string | null
  bank: string
  bank_label: string
  operation_number: string
  status: string
  status_label: string
  bank_amount: number
  recorded_amount: number | null
  applied_amount: number
  shared: boolean
  shared_count: number
  voucher_url: string | null
}

export interface SupplierPaymentApproval {
  modality_label?: string
  cargo_amount?: number | null
  bank_fee_amount?: number | null
  admin_fee_amount?: number | null
  id: number
  request_id: number
  order_number: number | null
  client_name: string | null
  consolidation: string | null
  supplier_name: string | null
  supplier_code: string | null
  product: string | null
  request_code: string | null
  payment_type: string
  currency: string
  installment_label: string | null
  charged_amount: number
  received_amount: number
  difference: number
  category: string
  comparison_label: string
  tolerance: number
  exception_limit: number
  status: string | null
  status_label: string
  observation: string
  observation_for_admin: boolean
  deadline_text: string | null
  deadline_overdue: boolean
  approved_at: string | null
  approval_mode: string | null
  assumed_amount: number | null
  assumed_reason: string | null
  collect_amount: number | null
  deposits: SupplierPaymentApprovalDeposit[]
  can_approve: boolean
  can_collect: boolean
  can_mark_registration_error: boolean
  can_extend: boolean
  can_cancel: boolean
  needs_reason: boolean
}

export interface SupplierPaymentBankData {
  beneficiary_name: string | null
  beneficiary_account: string | null
  beneficiary_address: string | null
  beneficiary_country: string | null
  beneficiary_city: string | null
  bank_code_type: string | null
  bank_code: string | null
  bank_name: string | null
  bank_address: string | null
  bank_country: string | null
  bank_city: string | null
  uses_intermediary: boolean
  intermediary_name: string | null
  intermediary_code_type: string | null
  intermediary_code: string | null
  intermediary_address: string | null
  intermediary_country: string | null
  intermediary_city: string | null
}

export interface SupplierPaymentExecution {
  id: number
  provider_id: number
  request_id: number
  order_number: number | null
  client_name: string | null
  consolidation: string | null
  supplier_name: string | null
  supplier_code: string | null
  product: string | null
  request_code: string | null
  currency: string
  payment_type: string
  /** Etiqueta legible que manda el backend: `USD / T-T` o `USD / Tarjeta`. */
  payment_type_label?: string | null
  /** Texto de modalidad de la maqueta: `Total`, `2 cuotas 40%–60%`, etc. */
  modality_label?: string | null
  proforma_name?: string | null
  proforma_url?: string | null
  installment_label: string | null
  supplier_payment_label: string | null
  status: string
  status_label: string
  observation: string
  cargo_amount: number
  charged_bank_fee: number
  real_bank_fee: number | null
  charged_admin_fee: number
  bank_difference: number | null
  profit: number | null
  executed_on: string | null
  receipt_name: string | null
  receipt_url: string | null
  bank_ready: boolean
  can_register: boolean
  deposit_bank?: string | null
  bank: SupplierPaymentBankData
  bank_copy_text: string
}

export interface SupplierPaymentExecutionTotals {
  count: number
  cargo: number
  charged_bank_fee: number
  real_bank_fee: number
  bank_difference: number
  admin_fee: number
  profit: number
}

export interface SupplierPaymentYuan {
  provider_id: number
  request_id: number
  order_number: number | null
  request_code: string | null
  supplier_code: string | null
  supplier_name: string | null
  product: string | null
  wechat: string | null
  seller_name: string | null
  client: string | null
  client_name: string | null
  consolidation: string | null
  partner: string
  manual: boolean
  usd_amount: number
  quoted_rate: number
  yuan_amount: number
  yuan_obtained: number | null
  yuan_paid: number | null
  real_exchange_rate: number | null
  difference_yuan: number | null
  difference_usd: number | null
  difference_result: string | null
  difference_label: string | null
  status: string
  status_label: string
  proforma_name: string | null
  proforma_url: string | null
  receipt_name: string | null
  receipt_url: string | null
  paid_on: string | null
  current_payment: number
  supplier_payments: number
  can_register: boolean
  can_observe: boolean
  can_undo: boolean
  can_lift: boolean
  needs_notice: boolean
  needs_receipt: boolean
  observation_reason: string | null
  observation_label: string | null
  observation_detail: string | null
  observation_until: string | null
  observation_until_text?: string | null
  observation_overdue: boolean
  tolerance: number
}

export interface SupplierPaymentYuanIndicators {
  usd_received: number
  yuan_obtained: number
  yuan_paid: number
  to_collect: number
  to_collect_yuan: number
  to_collect_count: number
}

export interface SupplierPaymentYuanIncome {
  id: number
  usd_amount: number
  exchange_rate: number
  yuan_amount: number
  received_on: string
  receipt_name: string | null
  receipt_url: string | null
  can_remove: boolean
}

export interface SupplierPaymentYuanOrganization {
  id: number
  name: string
  country: string
}

export interface SupplierPaymentYuanSuggestions {
  partners: Record<number, string[]>
  clients: Record<number, string[]>
}

export interface SupplierPaymentYuanRequest {
  request_id: number
  number: number | null
  code: string
  date: string
  country: string
  partner: string
  client: string | null
  organization_id: number | null
  organization: string | null
  manual: boolean
  consolidation: string | null
  exchange_rate: number
  usd_total: number
  yuan_total: number
  usd_received: number
  yuan_obtained: number
  income_rates: number[]
  yuan_paid: number
  yuan_pending: number
  difference: number
  difference_usd: number
  difference_status: 'collect' | 'missing' | 'favor' | null
  last_rate: number
  status: string
  status_label: string
  paid_count: number
  provider_count: number
  can_edit: boolean
  providers: SupplierPaymentYuan[]
  incomes: SupplierPaymentYuanIncome[]
}

export interface SupplierPaymentApprovalSettings {
  tolerance: number
  exception_limit: number
  remedy_days: number
  verify_hours: number
  undo_minutes: number
  undo_hours: number
  decision_hours: number
  auto_approve: boolean
}

export interface SupplierPaymentObservationReason {
  code: string
  label: string
}

export interface PagoProveedorPaginacion {
  current_page: number
  last_page: number
  per_page: number
  total: number
}
