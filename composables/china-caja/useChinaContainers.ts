import { computed, ref } from 'vue'
import { useChinaAction } from '~/composables/china-caja/useChinaAction'
import { CHINA_CONTAINER_GROUP, CHINA_CONTAINER_PENDING, CHINA_CONTAINER_TAB, CHINA_FILTER_ALL } from '~/constants/chinaCaja'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaContainer, ChinaContainerGroup, ChinaContainerOptions, ChinaContainerValues } from '~/types/china-caja'
import { usd } from '~/utils/yuanFormat'

const GROUP_ORDER = Object.keys(CHINA_CONTAINER_GROUP) as ChinaContainerGroup[]

/** Estado de contenedores: lista, filtros y pagos de flete. Los estados vienen calculados del backend. */
export function useChinaContainers() {
  const { run } = useChinaAction('Estado de contenedores')
  const rows = ref<ChinaContainer[]>([])
  const options = ref<ChinaContainerOptions>({ lines: [], shippers: [], container_types: [] })
  const loading = ref(true)
  const error = ref('')
  const tab = ref<string>(CHINA_CONTAINER_TAB.OPEN)
  const search = ref('')
  const filters = ref<Record<string, string>>({ country: CHINA_FILTER_ALL, group: CHINA_FILTER_ALL, pending: CHINA_FILTER_ALL })
  const selectedId = ref<number | null>(null)

  const base = computed(() => {
    const text = search.value.trim().toLowerCase()
    return rows.value.filter((row) => (filters.value.country === CHINA_FILTER_ALL || row.country === filters.value.country)
      && (!text || [row.client, row.label, row.data.bl_number, row.data.bl_consignee, row.data.shipper, row.data.shipping_line].join(' ').toLowerCase().includes(text)))
  })
  const openRows = computed(() => base.value.filter((row) => !row.status.completed))
  const shown = computed(() => {
    if (tab.value === CHINA_CONTAINER_TAB.COMPLETED) return base.value.filter((row) => row.status.completed)
    const pending = CHINA_CONTAINER_PENDING[filters.value.pending || '']
    return openRows.value
      .filter((row) => (filters.value.group === CHINA_FILTER_ALL || row.status.group === filters.value.group) && (!pending || pending.match(row)))
      .sort((a, b) => GROUP_ORDER.indexOf(a.status.group) - GROUP_ORDER.indexOf(b.status.group))
  })
  const tabs = computed(() => [
    { label: 'Abiertos', value: CHINA_CONTAINER_TAB.OPEN, count: openRows.value.length },
    { label: 'Completados', value: CHINA_CONTAINER_TAB.COMPLETED, count: base.value.length - openRows.value.length }
  ])
  const cards = computed(() => {
    const sum = (list: ChinaContainer[]) => usd(list.reduce((total, row) => total + (row.data.freight_usd || 0), 0))
    const paid = shown.value.filter((row) => row.freight.paid)
    const unpaid = shown.value.filter((row) => !row.freight.paid && row.data.freight_usd)
    return [
      { label: 'Suma total del flete', value: sum(shown.value), sub: `${shown.value.length} contenedores`, tone: 'text-highlighted' },
      { label: 'Flete pagado', value: sum(paid), sub: `${paid.length} pagados`, tone: 'text-success' },
      { label: 'Flete por pagar', value: sum(unpaid), sub: `${unpaid.length} pendientes`, tone: 'text-primary' }
    ]
  })
  const filterConfig = computed(() => {
    const country = {
      key: 'country', label: 'País', type: 'select', placeholder: 'País',
      options: [{ value: CHINA_FILTER_ALL, label: 'Todos los países' }, ...[...new Set(rows.value.map((row) => row.country))].filter(Boolean).map((value) => ({ value, label: value }))]
    }
    if (tab.value === CHINA_CONTAINER_TAB.COMPLETED) return [country]
    return [
      country,
      {
        key: 'group', label: 'Estado', type: 'select', placeholder: 'Estado',
        options: [{ value: CHINA_FILTER_ALL, label: 'Todos los estados' }, ...GROUP_ORDER.filter((key) => key !== 'completed').map((value) => ({ value, label: CHINA_CONTAINER_GROUP[value].label }))]
      },
      {
        key: 'pending', label: 'Pendiente', type: 'select', placeholder: 'Pendiente',
        options: [{ value: CHINA_FILTER_ALL, label: 'Todos los pendientes' }, ...Object.entries(CHINA_CONTAINER_PENDING).map(([value, item]) => ({ value, label: `${item.label} (${openRows.value.filter(item.match).length})` }))]
      }
    ]
  })
  const selected = computed(() => rows.value.find((row) => row.id === selectedId.value) || null)
  const payable = computed(() => rows.value.filter((row) => !row.freight.paid && !!row.data.freight_usd))

  async function load() {
    try {
      const response = await ChinaCajaService.containers()
      rows.value = response.data
      options.value = response.options
      error.value = ''
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'No se pudo cargar la lista.'
    } finally {
      loading.value = false
    }
  }

  function update(id: number, values: ChinaContainerValues) {
    return run(async () => {
      const updated = (await ChinaCajaService.updateContainer(id, values)).data
      rows.value = rows.value.map((row) => (row.id === updated.id ? updated : row))
    }, 'Datos guardados.')
  }

  /** Sin voucher = confirmado manualmente. */
  function payFreight(ids: number[], date: string, voucher: File | null) {
    return run(async () => {
      await ChinaCajaService.payFreight(ids, date, voucher)
      await load()
    }, 'Pago registrado en Flujo de caja.', 'Registrando pago…')
  }

  function cancelFreight(paymentId: number) {
    return run(async () => {
      await ChinaCajaService.cancelFreight(paymentId)
      await load()
    }, 'Pago anulado.', 'Anulando pago…')
  }

  function clearFilters() {
    search.value = ''
    filters.value = { country: CHINA_FILTER_ALL, group: CHINA_FILTER_ALL, pending: CHINA_FILTER_ALL }
  }

  /** «Ir →» del Inicio y del Flujo: abre la ficha exacta en su pestaña. */
  function open(id: number) {
    const target = rows.value.find((row) => row.id === id)
    if (!target) return
    tab.value = target.status.completed ? CHINA_CONTAINER_TAB.COMPLETED : CHINA_CONTAINER_TAB.OPEN
    selectedId.value = id
  }

  return { rows, options, loading, error, tab, tabs, search, filters, filterConfig, shown, cards, selectedId, selected, payable, load, update, payFreight, cancelFreight, clearFilters, open }
}
