import { computed, onMounted, ref, watch } from 'vue'
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
  // #2338: el panel de estados arranca en «Todos».
  const bucket = ref<string>('all')
  const search = ref('')
  const country = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const rows = ref<SupplierPaymentYuanRequest[]>([])
  const indicators = ref<SupplierPaymentYuanIndicators>(emptyIndicators())
  const counts = ref({ open: 0, completed: 0, all: 0, pending: 0, observed: 0, paid: 0 })
  const countries = ref<string[]>([])
  const organizations = ref<SupplierPaymentYuanOrganization[]>([])
  const suggestions = ref<SupplierPaymentYuanSuggestions>({ partners: {}, clients: {} })
  const pagination = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const loading = ref(false)

  const selectedId = ref<number | null>(null)
  /**
   * Última versión de la solicitud abierta: al registrar un pago puede pasar a otra pestaña
   * (Abiertos → Completados) y la ventana lateral debe seguir abierta (#1825).
   */
  const selectedSnapshot = ref<SupplierPaymentYuanRequest | null>(null)
  const selected = computed(() => rows.value.find((row) => row.request_id === selectedId.value)
    || (selectedSnapshot.value?.request_id === selectedId.value ? selectedSnapshot.value : null))
  watch(selected, (row) => { selectedSnapshot.value = row })

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
  // #2338/#2339: panel de estados de la maqueta (Todos / Pendiente / Observado / Pagado), que además filtra la lista.
  const statusPanel = computed(() => [
    { label: 'Todos', value: 'all', count: counts.value.all, dot: 'bg-gray-900' },
    { label: 'Pendiente', value: 'pendiente', count: counts.value.pending, dot: 'bg-primary' },
    { label: 'Observado', value: 'observed', count: counts.value.observed, dot: 'bg-error' },
    { label: 'Pagado', value: 'paid', count: counts.value.paid, dot: 'bg-success' }
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
        completed: Number(nextCounts.completed ?? nextCounts.paid ?? 0),
        all: Number(nextCounts.all ?? 0),
        pending: Number(nextCounts.pending_only ?? nextCounts.pending ?? 0),
        observed: Number(nextCounts.observed ?? 0),
        paid: Number(nextCounts.paid ?? nextCounts.completed ?? 0)
      }
      countries.value = response.countries || []
      organizations.value = response.organizations || []
      suggestions.value = response.suggestions || { partners: {}, clients: {} }
      if (response.pagination) pagination.value = response.pagination
      await refreshSelectedElsewhere()
    } catch (error: any) {
      showError('Pago a proveedores', error?.data?.message || 'No se pudo cargar la lista.')
    } finally {
      if (current === lastRequest) loading.value = false
    }
  }

  /** Si la solicitud abierta ya no está en esta pestaña, la busca en la otra para refrescar la ventana lateral. */
  async function refreshSelectedElsewhere() {
    const snapshot = selectedSnapshot.value
    if (!snapshot || snapshot.request_id !== selectedId.value || rows.value.some((row) => row.request_id === snapshot.request_id)) return
    try {
      const response = await PagoProveedorService.listYuan({
        bucket: bucket.value === YUAN_BUCKET.OPEN ? YUAN_BUCKET.COMPLETED : YUAN_BUCKET.OPEN,
        search: (snapshot.code || '').split(' / ')[0],
        per_page: 50
      })
      const fresh = (response.data || []).find((row) => row.request_id === snapshot.request_id)
      if (fresh && selectedId.value === fresh.request_id) selectedSnapshot.value = fresh
    } catch {
      // La ventana sigue abierta con los últimos datos conocidos.
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
    statusPanel,
    load,
    reload,
    changeBucket
  }
}
