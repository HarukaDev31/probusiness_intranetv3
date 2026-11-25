import { computed, ref } from 'vue'
import { useChinaAction } from '~/composables/china-caja/useChinaAction'
import { CHINA_CONTAINER_CHIPS, CHINA_CONTAINER_GROUP, CHINA_CONTAINER_TAB, CHINA_FILTER_ALL } from '~/constants/chinaCaja'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaContainer, ChinaContainerGroup, ChinaContainerValues } from '~/types/china-caja'
import { usd } from '~/utils/yuanFormat'

const GROUP_ORDER = Object.keys(CHINA_CONTAINER_GROUP) as ChinaContainerGroup[]

/** Estado de contenedores: lista, filtros y pagos de flete. Los estados vienen calculados del backend. */
export function useChinaContainers() {
  const { run } = useChinaAction('Estado de contenedores')
  const rows = ref<ChinaContainer[]>([])
  const loading = ref(true)
  const error = ref('')
  const tab = ref<string>(CHINA_CONTAINER_TAB.OPEN)
  const search = ref('')
  const country = ref(CHINA_FILTER_ALL)
  const group = ref(CHINA_FILTER_ALL)
  const chip = ref('')
  const selectedId = ref<number | null>(null)

  const isOpenTab = computed(() => tab.value === CHINA_CONTAINER_TAB.OPEN)
  const base = computed(() => {
    const text = search.value.trim().toLowerCase()
    return rows.value.filter((row) => (country.value === CHINA_FILTER_ALL || row.country === country.value)
      && (!text || [row.client, row.label, row.data.bl_number, row.data.bl_consignee, row.data.shipper, row.data.shipping_line].join(' ').toLowerCase().includes(text)))
  })
  const inTab = computed(() => base.value.filter((row) => row.status.completed !== isOpenTab.value))
  const shown = computed(() => {
    if (!isOpenTab.value) return inTab.value
    const match = CHINA_CONTAINER_CHIPS.find((item) => item.key === chip.value)?.match
    return inTab.value
      .filter((row) => (group.value === CHINA_FILTER_ALL || row.status.group === group.value) && (!match || match(row)))
      .sort((a, b) => GROUP_ORDER.indexOf(a.status.group) - GROUP_ORDER.indexOf(b.status.group))
  })
  const tabs = computed(() => [
    { label: 'Abiertos', value: CHINA_CONTAINER_TAB.OPEN, count: base.value.filter((row) => !row.status.completed).length },
    { label: 'Completados', value: CHINA_CONTAINER_TAB.COMPLETED, count: base.value.filter((row) => row.status.completed).length }
  ])
  const chips = computed(() => CHINA_CONTAINER_CHIPS.map((item) => ({ ...item, count: inTab.value.filter(item.match).length })))
  const cards = computed(() => {
    const sum = (list: ChinaContainer[]) => list.reduce((total, row) => total + (row.data.freight_usd || 0), 0)
    const paid = shown.value.filter((row) => row.freight.paid)
    const unpaid = shown.value.filter((row) => !row.freight.paid && row.data.freight_usd)
    return [
      { label: 'SUMA TOTAL DEL FLETE', value: usd(sum(shown.value)), sub: `${shown.value.length} contenedores`, accent: 'var(--cc-ink)', tone: 'cc-t-ink' },
      { label: 'FLETE PAGADO', value: usd(sum(paid)), sub: `${paid.length} pagados`, accent: 'var(--cc-green)', tone: 'cc-t-green' },
      { label: 'FLETE POR PAGAR', value: usd(sum(unpaid)), sub: `${unpaid.length} pendientes`, accent: 'var(--cc-orange)', tone: 'text-(--cc-orange-ink)' }
    ]
  })
  const countryItems = computed(() => [{ value: CHINA_FILTER_ALL, label: 'Todos' }, ...[...new Set(rows.value.map((row) => row.country))].filter(Boolean).map((value) => ({ value, label: value }))])
  const groupItems = [{ value: CHINA_FILTER_ALL, label: 'Todos' }, ...GROUP_ORDER.filter((key) => key !== 'completed').map((value) => ({ value, label: CHINA_CONTAINER_GROUP[value].label }))]
  const hasFilters = computed(() => !!(search.value || chip.value || country.value !== CHINA_FILTER_ALL || group.value !== CHINA_FILTER_ALL))
  const footer = computed(() => `Mostrando ${shown.value.length} de ${inTab.value.length} ${isOpenTab.value ? 'abiertos' : 'completados'} · BL / TLX / COB / FLT: verde listo, naranja pendiente`)
  const selected = computed(() => shown.value.find((row) => row.id === selectedId.value) || null)
  const payable = computed(() => rows.value.filter((row) => !row.freight.paid && !!row.data.freight_usd))

  async function load() {
    try {
      rows.value = (await ChinaCajaService.containers()).data
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
    })
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

  function changeTab(value: string) {
    tab.value = value
    selectedId.value = null
  }

  function clearFilters() {
    search.value = ''
    chip.value = ''
    country.value = CHINA_FILTER_ALL
    group.value = CHINA_FILTER_ALL
  }

  /** «Ir →» del Inicio y del Flujo: abre la ficha exacta en su pestaña, sin filtros que la oculten. */
  function open(id: number) {
    const target = rows.value.find((row) => row.id === id)
    if (!target) return
    clearFilters()
    tab.value = target.status.completed ? CHINA_CONTAINER_TAB.COMPLETED : CHINA_CONTAINER_TAB.OPEN
    selectedId.value = id
  }

  return {
    rows, loading, error, tab, tabs, isOpenTab, search, country, group, chip, chips, countryItems, groupItems, hasFilters, shown, footer, cards,
    selectedId, selected, payable, load, update, payFreight, cancelFreight, changeTab, clearFilters, open
  }
}
