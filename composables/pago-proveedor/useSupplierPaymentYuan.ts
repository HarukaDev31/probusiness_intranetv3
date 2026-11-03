import { computed, onMounted, reactive, ref, watch } from 'vue'
import { EXCHANGE_RESULT, YUAN_BUCKET } from '~/constants/supplierPayment'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentObservationReason, SupplierPaymentYuan, SupplierPaymentYuanIndicators } from '~/types/pago-proveedor'

const emptyIndicators = (): SupplierPaymentYuanIndicators => ({
  usd_received: 0,
  yuan_obtained: 0,
  yuan_paid: 0,
  to_collect: 0,
  to_collect_yuan: 0
})

export function useSupplierPaymentYuan() {
  const { showError, showSuccess } = useModal()
  const { withSpinner } = useSpinner()
  const bucket = ref<string>(YUAN_BUCKET.PENDING)
  const search = ref('')
  const partner = ref('')
  const partners = ref<string[]>([])
  const rows = ref<SupplierPaymentYuan[]>([])
  const reasons = ref<SupplierPaymentObservationReason[]>([])
  const indicators = ref<SupplierPaymentYuanIndicators>(emptyIndicators())
  const counts = ref({ all: 0, pending: 0, observed: 0, paid: 0 })
  const loading = ref(false)
  const saving = ref(false)
  const opened = ref(false)
  const readOnly = ref(false)
  const manualOpen = ref(false)
  const editingId = ref<number | null>(null)
  const proforma = ref<File | null>(null)
  const manual = reactive({
    partner: '',
    client_name: '',
    consolidation: '',
    product: '',
    supplier_code: '',
    supplier_name: '',
    seller_name: '',
    wechat: '',
    usd_amount: 0,
    yuan_amount: 0
  })
  const selected = ref<SupplierPaymentYuan | null>(null)
  const rate = ref<number | null>(null)
  const yuanPaid = ref<number | null>(null)
  const receipt = ref<File | null>(null)
  const reason = ref('')
  const newReason = ref('')
  const detail = ref('')
  const notice = ref('')
  const noticeSentFor = ref<number | null>(null)

  const tabs = [
    { key: YUAN_BUCKET.ALL, label: 'Todos' },
    { key: YUAN_BUCKET.PENDING, label: 'Pendiente' },
    { key: YUAN_BUCKET.OBSERVED, label: 'Observado' },
    { key: YUAN_BUCKET.PAID, label: 'Pagado' }
  ]

  const cards = computed(() => [
    { label: 'USD recibido de socios', value: `$${money(indicators.value.usd_received)}`, danger: false },
    { label: 'RMB obtenido', value: `¥${money(indicators.value.yuan_obtained)}`, danger: false },
    { label: 'RMB pagado', value: `¥${money(indicators.value.yuan_paid)}`, danger: false },
    { label: 'Diferencia por cobrar', value: `¥${money(indicators.value.to_collect_yuan)}`, danger: indicators.value.to_collect_yuan > 0 }
  ])

  const manualRate = computed(() => manual.usd_amount > 0 ? (manual.yuan_amount / manual.usd_amount).toFixed(4) : '—')
  const obtained = computed(() => round2(Number(selected.value?.usd_amount || 0) * Number(rate.value || 0)))
  const differenceYuan = computed(() => round2(obtained.value - Number(yuanPaid.value || 0)))
  const differenceUsd = computed(() => {
    const real = Number(rate.value || 0)
    if (real <= 0) return 0
    return round2(differenceYuan.value / real)
  })
  const differenceResult = computed(() => {
    const tolerance = Number(selected.value?.tolerance || 1)
    if (Math.abs(differenceUsd.value) <= tolerance + 0.001) return EXCHANGE_RESULT.WITHIN
    return differenceUsd.value < 0 ? EXCHANGE_RESULT.COLLECT : EXCHANGE_RESULT.REFUND
  })
  const differenceText = computed(() => {
    if (differenceResult.value === EXCHANGE_RESULT.WITHIN) {
      return 'Dentro de la tolerancia. Lo asume Pro Business.'
    }
    if (selected.value?.manual) {
      return differenceResult.value === EXCHANGE_RESULT.COLLECT
        ? 'Faltan yuanes. Esta solicitud no avisa a Ventas ni al cliente.'
        : 'Sobran yuanes. Esta solicitud no avisa a Ventas ni al cliente.'
    }
    if (differenceResult.value === EXCHANGE_RESULT.COLLECT) {
      return 'Faltan yuanes. Ventas cobra la diferencia al cliente.'
    }
    return 'Sobran yuanes. Ventas le pregunta al cliente si lo deja a favor o lo devuelve.'
  })
  const noticeReady = computed(() => noticeSentFor.value !== null && noticeSentFor.value === round2(Number(yuanPaid.value || 0)))
  const canSave = computed(() => {
    const amounts = Number(rate.value) > 0 && Number(yuanPaid.value) > 0 && !!receipt.value
    return amounts && (selected.value?.manual || noticeReady.value)
  })

  watch(yuanPaid, () => {
    if (noticeSentFor.value !== round2(Number(yuanPaid.value || 0))) {
      noticeSentFor.value = null
    }
  })

  function money(value: number | null | undefined) {
    return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }

  function tabCount(key: string) {
    if (key === YUAN_BUCKET.ALL) return counts.value.all
    if (key === YUAN_BUCKET.PENDING) return counts.value.pending
    if (key === YUAN_BUCKET.OBSERVED) return counts.value.observed
    return counts.value.paid
  }

  function statusColor(status: string): 'success' | 'error' | 'warning' {
    if (status === 'pagado') return 'success'
    if (status === 'observado') return 'error'
    return 'warning'
  }

  function changeBucket(next: string) {
    bucket.value = next
    load()
  }

  async function load() {
    loading.value = true
    try {
      const response = await PagoProveedorService.listYuan({
        bucket: bucket.value,
        search: search.value.trim(),
        partner: partner.value,
        per_page: 50
      })
      rows.value = response.data || []
      indicators.value = { ...emptyIndicators(), ...response.indicators }
      counts.value = response.counts || counts.value
      partners.value = response.partners || []
      reasons.value = response.reasons || []
    } catch (error: any) {
      showError('Pagos en yuanes', error?.data?.message || 'No se pudo cargar la lista.')
    } finally {
      loading.value = false
    }
  }

  async function open(row: SupplierPaymentYuan, viewing = false) {
    readOnly.value = viewing
    selected.value = row
    rate.value = row.quoted_rate || null
    yuanPaid.value = row.yuan_amount || null
    receipt.value = null
    reason.value = ''
    newReason.value = ''
    detail.value = ''
    notice.value = ''
    noticeSentFor.value = null
    opened.value = true
    if (row.manual) return
    try {
      const response = await PagoProveedorService.yuanNoticeText(row.provider_id)
      notice.value = response.data?.message || ''
    } catch (error: any) {
      showError('Aviso al cliente', error?.data?.message || 'No se pudo armar el aviso.')
    }
  }

  function onFile(event: Event) {
    receipt.value = (event.target as HTMLInputElement).files?.[0] || null
  }

  function onProforma(event: Event) {
    proforma.value = (event.target as HTMLInputElement).files?.[0] || null
  }

  async function copy(value: string | null | undefined) {
    const text = (value || '').trim()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Copiado', text)
    } catch {
      showError('Copiar', 'No se pudo copiar.')
    }
  }

  async function sendNotice() {
    if (!selected.value || !yuanPaid.value || yuanPaid.value <= 0) return
    const paid = round2(yuanPaid.value)
    saving.value = true
    try {
      await withSpinner(async () => {
        await PagoProveedorService.confirmYuanNotice(selected.value!.provider_id, paid)
      }, 'Enviando aviso…')
      noticeSentFor.value = paid
      showSuccess('Aviso al cliente', 'Quedó listo. Ya puedes registrar el pago.')
    } catch (error: any) {
      showError('Aviso al cliente', error?.data?.message || 'No se pudo guardar el aviso.')
    } finally {
      saving.value = false
    }
  }

  async function save() {
    if (!selected.value || !receipt.value || !rate.value || !yuanPaid.value || !canSave.value) return
    saving.value = true
    try {
      await withSpinner(async () => {
        await PagoProveedorService.registerYuan(selected.value!.provider_id, rate.value!, yuanPaid.value!, receipt.value!)
      }, 'Registrando pago…')
      showSuccess('Pago en yuanes', 'Quedó registrado. La constancia queda en el sistema.')
      opened.value = false
      await load()
    } catch (error: any) {
      showError('Pago en yuanes', error?.data?.message || 'No se pudo registrar el pago.')
    } finally {
      saving.value = false
    }
  }

  async function observe() {
    if (!selected.value || !reason.value) return
    if (reason.value === 'other' && !newReason.value.trim()) {
      showError('Observación', 'Escribe el motivo.')
      return
    }
    saving.value = true
    try {
      await withSpinner(async () => {
        await PagoProveedorService.observeYuan(selected.value!.provider_id, {
          reason: reason.value === 'other' ? '' : reason.value,
          new_reason: reason.value === 'other' ? newReason.value : '',
          detail: detail.value
        })
      }, 'Guardando observación…')
      showSuccess('Observación', 'Quedó observada por 48 horas.')
      opened.value = false
      await load()
    } catch (error: any) {
      showError('Observación', error?.data?.message || 'No se pudo observar el pago.')
    } finally {
      saving.value = false
    }
  }

  function blankManual() {
    manual.partner = ''
    manual.client_name = ''
    manual.consolidation = ''
    manual.product = ''
    manual.supplier_code = ''
    manual.supplier_name = ''
    manual.seller_name = ''
    manual.wechat = ''
    manual.usd_amount = 0
    manual.yuan_amount = 0
    proforma.value = null
    editingId.value = null
  }

  function startManual(row?: SupplierPaymentYuan) {
    blankManual()
    if (row) {
      editingId.value = row.provider_id
      manual.partner = row.partner === 'Pro Business' ? '' : row.partner
      manual.client_name = row.client_name || ''
      manual.consolidation = row.consolidation || ''
      manual.product = row.product || ''
      manual.supplier_code = row.supplier_code === 'Sin código' ? '' : (row.supplier_code || '')
      manual.supplier_name = row.supplier_name || ''
      manual.seller_name = row.seller_name || ''
      manual.wechat = row.wechat || ''
      manual.usd_amount = row.usd_amount
      manual.yuan_amount = row.yuan_amount
    }
    manualOpen.value = true
  }

  async function createManual() {
    const title = editingId.value ? 'Editar solicitud' : 'Nueva solicitud'
    if (manual.partner.toLowerCase().includes('pro business')) {
      showError(title, 'Las de Pro Business llegan desde Aprobación. Aquí van las de otros socios.')
      return
    }
    if (!manual.supplier_code.trim() && !manual.supplier_name.trim()) {
      showError(title, 'Indica el código o el nombre del proveedor.')
      return
    }
    if (!/^\d{5,20}$/.test(manual.wechat.replace(/\s+/g, ''))) {
      showError(title, 'El WeChat es un número de 5 a 20 dígitos.')
      return
    }
    saving.value = true
    try {
      const form = new FormData()
      Object.entries(manual).forEach(([key, value]) => form.append(key, String(value ?? '')))
      if (proforma.value) form.append('proforma', proforma.value)
      const id = editingId.value
      await withSpinner(async () => {
        if (id) await PagoProveedorService.updateManualYuan(id, form)
        else await PagoProveedorService.createManualYuan(form)
      }, id ? 'Guardando solicitud…' : 'Creando solicitud…')
      manualOpen.value = false
      showSuccess(title, id ? 'Quedó actualizada.' : 'Quedó en pendientes. No se avisa a Ventas ni al cliente.')
      bucket.value = YUAN_BUCKET.PENDING
      await load()
    } catch (error: any) {
      showError(title, error?.data?.message || 'No se pudo guardar la solicitud.')
    } finally {
      saving.value = false
    }
  }

  async function lift(row: SupplierPaymentYuan) {
    saving.value = true
    try {
      await withSpinner(async () => {
        await PagoProveedorService.liftManualYuan(row.provider_id)
      }, 'Levantando observación…')
      showSuccess('Observación', 'Volvió a pendiente.')
      await load()
    } catch (error: any) {
      showError('Observación', error?.data?.message || 'No se pudo levantar.')
    } finally {
      saving.value = false
    }
  }

  async function remove(row: SupplierPaymentYuan) {
    saving.value = true
    try {
      await withSpinner(async () => {
        await PagoProveedorService.deleteManualYuan(row.provider_id)
      }, 'Eliminando…')
      showSuccess('Solicitud', 'Se eliminó.')
      await load()
    } catch (error: any) {
      showError('Solicitud', error?.data?.message || 'No se pudo eliminar.')
    } finally {
      saving.value = false
    }
  }

  onMounted(load)

  return {
    bucket,
    search,
    partner,
    partners,
    rows,
    reasons,
    loading,
    saving,
    opened,
    readOnly,
    manualOpen,
    editingId,
    startManual,
    manual,
    selected,
    rate,
    yuanPaid,
    receipt,
    reason,
    newReason,
    detail,
    notice,
    noticeReady,
    tabs,
    cards,
    manualRate,
    obtained,
    differenceYuan,
    differenceUsd,
    differenceText,
    canSave,
    money,
    tabCount,
    statusColor,
    changeBucket,
    load,
    open,
    onFile,
    onProforma,
    copy,
    sendNotice,
    save,
    observe,
    createManual,
    lift,
    remove
  }
}
