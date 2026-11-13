import { computed, onMounted, ref } from 'vue'
import { YUAN_BUCKET } from '~/constants/supplierPayment'
import { useModal } from '~/composables/commons/useModal'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentYuanIndicators, SupplierPaymentYuanOrganization, SupplierPaymentYuanRequest, SupplierPaymentYuanSuggestions } from '~/types/pago-proveedor'

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
  const bucket = ref<string>(YUAN_BUCKET.OPEN)
  const search = ref('')
  const country = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const rows = ref<SupplierPaymentYuanRequest[]>([])
  const indicators = ref<SupplierPaymentYuanIndicators>(emptyIndicators())
  const counts = ref({ open: 0, completed: 0 })
  const countries = ref<string[]>([])
  const organizations = ref<SupplierPaymentYuanOrganization[]>([])
  const suggestions = ref<SupplierPaymentYuanSuggestions>({ partners: {}, clients: {} })
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

  const tabs = computed(() => [
    { label: 'Abiertos', value: YUAN_BUCKET.OPEN, count: counts.value.open },
    { label: 'Completados', value: YUAN_BUCKET.COMPLETED, count: counts.value.completed }
  ])

  let lastRequest = 0

  async function load() {
    const current = ++lastRequest
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
      // Una respuesta tardía no pisa la de un filtro más reciente.
      if (current !== lastRequest) return
      rows.value = response.data || []
      indicators.value = { ...emptyIndicators(), ...response.indicators }
      const nextCounts = response.counts || {}
      counts.value = {
        open: Number(nextCounts.open ?? nextCounts.pending ?? 0),
        completed: Number(nextCounts.completed ?? nextCounts.paid ?? 0)
      }
      countries.value = response.countries || []
      organizations.value = response.organizations || []
      suggestions.value = response.suggestions || { partners: {}, clients: {} }
      if (response.pagination) pagination.value = response.pagination
    } catch (error: any) {
      showError('Pago a proveedores', error?.data?.message || 'No se pudo cargar la lista.')
    } finally {
      if (current === lastRequest) loading.value = false
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
    organizations,
    suggestions,
    pagination,
    loading,
    selectedId,
    selected,
    cards,
    tabs,
    load,
    reload,
    changeBucket
  }
}
