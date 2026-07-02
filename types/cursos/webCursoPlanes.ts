/** Plan de la landing curso membresía (tabla web_curso_planes en Laravel). */
export interface WebCursoPlan {
  id: number
  page_key: string
  tipo_pago: number | null
  title: string
  subtitle: string | null
  price_current: string
  price_original: string | null
  /** Monto numérico en PEN que se usa para Izipay CreatePayment (×100 = céntimos). */
  price_amount: number | null
  benefits: string[]
  button_label: string
  button_css_classes: string | null
  card_css_classes: string | null
  is_visible: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

/** Cuerpo enviado al API de administración (JWT). tipo_pago lo asigna el backend (= sort_order). */
export interface WebCursoPlanPayload {
  page_key: string
  title: string
  subtitle: string | null
  price_current: string
  price_original: string | null
  price_amount: number | null
  benefits: string[]
  button_label: string
  button_css_classes: string | null
  card_css_classes: string | null
  is_visible: boolean
  sort_order: number
}
