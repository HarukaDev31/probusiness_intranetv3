import { ref, computed } from 'vue'
import type { WebCursoPlan, WebCursoPlanPayload } from '~/types/cursos/webCursoPlanes'
import { WebCursoMembresiaPlanesService } from '~/services/webCursoMembresiaPlanesService'
import { formatPrecioPlanSoles, parseEnteroPenDesdeTexto } from '~/utils/cursos'

/** Siguiente orden libre (max + 1) para no chocar con unique en backend. */
function nextSortOrderFromPlanes(list: WebCursoPlan[]): number {
  if (!list.length) return 1
  const max = list.reduce((m, p) => {
    const s = Number(p.sort_order)
    return Number.isFinite(s) && s > m ? s : m
  }, 0)
  return max + 1
}

const defaultForm = (sortOrder = 1) => ({
  title: '',
  subtitle: '',
  /** Monto principal en PEN (entero): mismo valor para tarjeta + Izipay CreatePayment */
  price_amount: null as number | null,
  tiene_descuento: false,
  /** Precio de lista (entero PEN); al guardar se envía como "S/. N" a la web */
  price_original_amount: null as number | null,
  benefitsText: '',
  sort_order: sortOrder,
  // Campos internos (no editables en el modal)
  page_key: 'curso_membresia',
  button_label: 'Ir a pagar',
  button_css_classes: '',
  card_css_classes: '',
  is_visible: true,
})

export function useWebCursoMembresiaPlanes() {
  const planes = ref<WebCursoPlan[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const pageKey = ref('curso_membresia')
  const form = ref(defaultForm(1))
  const editingId = ref<number | null>(null)

  const loadPlanes = async () => {
    loading.value = true
    try {
      const res = await WebCursoMembresiaPlanesService.list(pageKey.value)
      planes.value = res.data ?? []
    } finally {
      loading.value = false
    }
  }

  const toPayload = (): WebCursoPlanPayload => {
    const f = form.value
    const order = Number(f.sort_order) || 1
    const monto = f.price_amount != null && f.price_amount > 0 ? Math.floor(Number(f.price_amount)) : null
    const benefits = f.benefitsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const desc =
      f.tiene_descuento &&
      f.price_original_amount != null &&
      Number(f.price_original_amount) > 0
        ? formatPrecioPlanSoles(Math.floor(Number(f.price_original_amount)))
        : null
    return {
      page_key: f.page_key,
      title: f.title,
      subtitle: f.subtitle || null,
      price_current: monto != null ? formatPrecioPlanSoles(monto) : '',
      price_original: desc,
      price_amount: monto,
      benefits,
      button_label: f.button_label || 'Ir a pagar',
      button_css_classes: f.button_css_classes || null,
      card_css_classes: f.card_css_classes || null,
      is_visible: f.is_visible,
      sort_order: order
    }
  }

  const openCreate = () => {
    editingId.value = null
    form.value = defaultForm(nextSortOrderFromPlanes(planes.value))
  }

  const openEdit = (plan: WebCursoPlan) => {
    editingId.value = plan.id
    const monto =
      plan.price_amount != null && plan.price_amount > 0
        ? plan.price_amount
        : parseEnteroPenDesdeTexto(plan.price_current)
    const descParsed = parseEnteroPenDesdeTexto(plan.price_original)
    form.value = {
      page_key: plan.page_key,
      title: plan.title,
      subtitle: plan.subtitle ?? '',
      price_amount: monto,
      tiene_descuento: descParsed != null,
      price_original_amount: descParsed,
      benefitsText: (plan.benefits ?? []).join('\n'),
      button_label: plan.button_label,
      button_css_classes: plan.button_css_classes ?? '',
      card_css_classes: plan.card_css_classes ?? '',
      is_visible: plan.is_visible,
      sort_order: plan.sort_order
    }
  }

  const save = async () => {
    saving.value = true
    try {
      const payload = toPayload()
      if (editingId.value == null) {
        await WebCursoMembresiaPlanesService.create(payload)
      } else {
        await WebCursoMembresiaPlanesService.update(editingId.value, payload)
      }
      await loadPlanes()
      return true
    } finally {
      saving.value = false
    }
  }

  const remove = async (id: number) => {
    await WebCursoMembresiaPlanesService.delete(id)
    await loadPlanes()
  }

  const isEditing = computed(() => editingId.value != null)

  return {
    planes,
    loading,
    saving,
    pageKey,
    form,
    editingId,
    isEditing,
    loadPlanes,
    openCreate,
    openEdit,
    save,
    remove,
    toPayload
  }
}
