import { computed, onMounted, ref } from 'vue'
import { YUAN_BUCKET } from '~/constants/supplierPayment'
import { useModal } from '~/composables/commons/useModal'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentYuanIndicators, SupplierPaymentYuanRequest } from '~/types/pago-proveedor'

const emptyIndicators = (): SupplierPaymentYuanIndicators => ({
  usd_received: 0,
  yuan_obtained: 0,
  yuan_paid: 0,
  to_collect: 0,
  to_collect_yuan: 0,
  to_collect_count: 0
})

export function useSupplierPaymentYuan() {
  const { showError } = useModal()
  const bucket = ref<string>(YUAN_BUCKET.ALL)
  const search = ref('')
  const country = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const rows = ref<SupplierPaymentYuanRequest[]>([])
  const indicators = ref<SupplierPaymentYuanIndicators>(emptyIndicators())
  const counts = ref({ all: 0, pending: 0, observed: 0, paid: 0 })
  const countries = ref<string[]>([])
  const partnersByCountry = ref<Record<string, string[]>>({})
  const clientsByCountry = ref<Record<string, string[]>>({})
  const pagination = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const loading = ref(false)

  const selectedId = ref<number | null>(null)
  const selected = computed(() => rows.value.find((row) => row.request_id === selectedId.value) || null)

  const cards = computed(() => {
    const data = indicators.value
    const pendingCount = data.to_collect_count
    return [
      { label: 'USD recibido de socios', value: usd(data.usd_received), sub: '', danger: false },
      { label: 'RMB obtenido', value: rmb(data.yuan_obtained), sub: 'Al tipo de cambio de cada ingreso', danger: false },
      { label: 'RMB pagado a proveedores', value: rmb(data.yuan_paid), sub: '', danger: false },
      {
        label: 'Diferencia por cobrar',
        value: rmb(data.to_collect_yuan),
        sub: pendingCount ? `≈ ${usd(data.to_collect)} · ${pendingCount} ${pendingCount === 1 ? 'solicitud' : 'solicitudes'}` : 'Sin diferencias pendientes',
        danger: true
      }
    ]
  })

  const states = computed(() => [
    { key: YUAN_BUCKET.ALL, label: 'Todos', count: counts.value.all, dot: 'bg-inverted' },
    { key: YUAN_BUCKET.PENDING, label: 'Pendiente', count: counts.value.pending, dot: 'bg-primary' },
    { key: YUAN_BUCKET.OBSERVED, label: 'Observado', count: counts.value.observed, dot: 'bg-error' },
    { key: YUAN_BUCKET.PAID, label: 'Pagado', count: counts.value.paid, dot: 'bg-success' }
  ])

  async function load() {
    loading.value = true
    try {
      const response = await PagoProveedorService.listYuan({
        bucket: bucket.value,
        search: search.value.trim(),
        country: country.value,
        date_from: dateFrom.value,
        date_to: dateTo.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      })
      rows.value = response.data || []
      indicators.value = { ...emptyIndicators(), ...response.indicators }
      counts.value = response.counts || counts.value
      countries.value = response.countries || []
      partnersByCountry.value = response.partners_by_country || {}
      clientsByCountry.value = response.clients_by_country || {}
      if (response.pagination) pagination.value = response.pagination
    } catch (error: any) {
      showError('Pago a proveedores', error?.data?.message || 'No se pudo cargar la lista.')
    } finally {
      loading.value = false
    }
  }

  function reload() {
    pagination.value.current_page = 1
    return load()
  }

  function changeBucket(next: string) {
    bucket.value = next
    reload()
  }

  onMounted(load)

  return {
    bucket,
    search,
    country,
    dateFrom,
    dateTo,
    rows,
    countries,
    partnersByCountry,
    clientsByCountry,
    pagination,
    loading,
    selectedId,
    selected,
    cards,
    states,
    load,
    reload,
    changeBucket
  }
}
