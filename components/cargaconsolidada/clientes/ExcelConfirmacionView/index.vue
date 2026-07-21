<script setup lang="ts">
import ExcelConfirmacionItemForm from '~/components/cargaconsolidada/clientes/ExcelConfirmacionItemForm/index.vue'
import ExcelConfirmacionSkeleton from '~/components/cargaconsolidada/clientes/ExcelConfirmacionSkeleton/index.vue'
import {
  ExcelConfirmacionCoordinacionService,
  type ExcelConfirmacionData
} from '~/services/cargaconsolidada/clientes/excelConfirmacionCoordinacionService'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { STATUS_BG_CLASSES } from '~/constants/ui'
import {
  MANUAL_STATUS_TO_STATUS_BG_KEY,
  PROVIDER_MANUAL_STATUSES,
  isCoord2DocsEmail
} from '~/components/cargaconsolidada/clientes/ClientesView/constants'
import type { ProveedorManualStatus } from '~/components/cargaconsolidada/clientes/ClientesView/types'
import { useUserRole } from '~/composables/auth/useUserRole'
import {
  apiItemToFormState,
  formStateToSaveItem,
  labelsForTipo,
  type IntranetItemFormState,
  type IntranetProveedorFormState,
  type LabelsPorTipoProducto
} from '~/utils/cargaconsolidada/excelConfirmacion'
import { getRequiredCaracteristicaValues } from '~/utils/cargaconsolidada/caracteristicaFields'

const props = defineProps<{
  basePath: string
  backBasePath: string
}>()

const route = useRoute()
const uuid = computed(() => String(route.params.uuid || ''))
const contenedorId = computed(() => String(route.query.contenedor || ''))
const tabQuery = computed(() => String(route.query.tab || 'general'))
const clienteQueryName = computed(() => String(route.query.cliente || ''))

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const { updateProveedor } = useCotizacionProveedor()
const { userEmail, fetchCurrentUser } = useUserRole()
const isCoord2Docs = computed(() => isCoord2DocsEmail(userEmail.value))

fetchCurrentUser()

const loading = ref(true)
const data = ref<ExcelConfirmacionData | null>(null)
const labels = ref<LabelsPorTipoProducto>({})
const formState = ref<IntranetProveedorFormState[]>([])
const activeProveedorIndex = ref(0)
const openProductIds = ref<string[]>([])

const activeProveedor = computed(() => formState.value[activeProveedorIndex.value] ?? null)

const excelConfStatusItems = computed(() =>
  PROVIDER_MANUAL_STATUSES.map((status) => {
    const key = MANUAL_STATUS_TO_STATUS_BG_KEY[status] ?? status
    return {
      label: status,
      value: status,
      class: (STATUS_BG_CLASSES as Record<string, string>)[key] ?? ''
    }
  })
)

const statusSelectClass = (status: string | null | undefined) => {
  const key = MANUAL_STATUS_TO_STATUS_BG_KEY[(status || 'Pendiente') as ProveedorManualStatus] ?? 'WAIT'
  return `w-36 shrink-0 ${(STATUS_BG_CLASSES as Record<string, string>)[key] ?? ''}`
}

const excelConfStatusClass = computed(() =>
  statusSelectClass(activeProveedor.value?.excel_conf_status)
)

const excelConfStatusFinalClass = computed(() =>
  statusSelectClass(activeProveedor.value?.excel_conf_status_final)
)

const proveedorTabs = computed(() =>
  formState.value.map((proveedor, index) => ({
    label: proveedor.code_supplier || `Proveedor ${index + 1}`,
    value: index
  }))
)

const pageTitle = computed(() => clienteQueryName.value || data.value?.nombre_cliente || 'Cliente')
const pageSubtitle = computed(() => {
  const parts = ['Confirmación web del cliente']
  if (data.value?.carga) parts.push(`Carga #${data.value.carga}`)
  return parts.join(' · ')
})

const productKey = (id: number) => String(id)

const isOptionalLabel = (label: string) => {
  const key = label.replace(/:$/g, '').trim().toLowerCase()
  return key === 'marca' || key === 'modelo'
}

const isItemComplete = (item: IntranetItemFormState, itemLabels: string[]) => {
  const values = [
    item.nombre_comercial,
    item.foto_url,
    item.qty,
    item.precio_unitario,
    item.hs_code,
    item.link_producto,
    ...getRequiredCaracteristicaValues(itemLabels, item.caracteristicas, isOptionalLabel)
  ]
  return values.every((value) => value !== null && value !== undefined && String(value).trim() !== '')
}

const accordionItems = computed(() => {
  const proveedor = activeProveedor.value
  if (!proveedor) return []

  return proveedor.items.map((item, index) => {
    const itemLabels = labelsForTipo(labels.value, item.tipo_producto)
    return {
      value: productKey(item.id),
      label: item.initial_name || `Producto ${index + 1}`,
      item,
      index,
      labels: itemLabels,
      complete: isItemComplete(item, itemLabels)
    }
  })
})

const buildFormState = (payload: ExcelConfirmacionData) => {
  formState.value = payload.proveedores.map((proveedor) => ({
    id: proveedor.id,
    code_supplier: proveedor.code_supplier,
    excel_conf_status: proveedor.excel_conf_status || 'Pendiente',
    excel_conf_status_final: proveedor.excel_conf_status_final || 'Pendiente',
    excel_conf_form_cerrado: Boolean(proveedor.excel_conf_form_cerrado)
      || proveedor.excel_conf_status === 'Revisado',
    items: proveedor.items.map((item) => apiItemToFormState(item, labels.value))
  }))
}

const updateExcelConfStatusField = async (
  field: 'excel_conf_status' | 'excel_conf_status_final',
  value: string | ProveedorManualStatus
) => {
  const next = String(value || '') as ProveedorManualStatus
  const proveedor = activeProveedor.value
  if (!proveedor || !next || next === proveedor[field]) return
  if (!PROVIDER_MANUAL_STATUSES.includes(next)) return

  const previous = proveedor[field]
  const previousCerrado = proveedor.excel_conf_form_cerrado
  proveedor[field] = next
  if (field === 'excel_conf_status') {
    proveedor.excel_conf_form_cerrado = next === 'Revisado'
  }

  try {
    await withSpinner(async () => {
      const formData = new FormData()
      formData.append('id', String(proveedor.id))
      formData.append(field, next)
      const response = await updateProveedor(formData)
      if (!response?.success) {
        throw new Error((response as any)?.message || 'No se pudo actualizar el estado')
      }
      if (field === 'excel_conf_status' && next === 'Revisado' && proveedor.excel_conf_status_final !== 'Revisado') {
        proveedor.excel_conf_status_final = 'Recibido'
      }
    }, 'Actualizando estado...')
    showSuccess('Actualización exitosa', 'El estado de Excel Conf. se guardó correctamente.')
  } catch (e: any) {
    proveedor[field] = previous
    if (field === 'excel_conf_status') {
      proveedor.excel_conf_form_cerrado = previousCerrado
    }
    showError('Error', e?.message || 'No se pudo guardar el estado')
  }
}

const updateExcelConfStatus = async (value: string | ProveedorManualStatus) => {
  await updateExcelConfStatusField('excel_conf_status', value)
}

const updateExcelConfStatusFinal = async (value: string | ProveedorManualStatus) => {
  await updateExcelConfStatusField('excel_conf_status_final', value)
}

const load = async () => {
  if (!uuid.value) {
    showError('Enlace inválido', 'No se encontró el UUID de confirmación.')
    return
  }

  loading.value = true
  try {
    const [labelsRes, dataRes] = await Promise.all([
      ExcelConfirmacionCoordinacionService.getLabels(),
      ExcelConfirmacionCoordinacionService.getByUuid(uuid.value)
    ])

    if (!labelsRes.success || !labelsRes.data) {
      throw new Error(labelsRes.message || 'No se pudieron cargar las características')
    }
    if (!dataRes.success || !dataRes.data) {
      throw new Error(dataRes.message || 'No se pudo cargar la confirmación')
    }

    labels.value = labelsRes.data
    data.value = dataRes.data
    buildFormState(dataRes.data)

    const first = formState.value[activeProveedorIndex.value]?.items[0]
    openProductIds.value = first ? [productKey(first.id)] : []
  } catch (e: any) {
    showError('Error', e?.message || 'No se pudo cargar')
  } finally {
    loading.value = false
  }
}

const buildSavePayload = () => ({
  proveedores: formState.value.map((proveedor) => ({
    id: proveedor.id,
    items: proveedor.items.map(formStateToSaveItem)
  }))
})

const SM_DEFAULT = 'S/M'

const normalizeCaracteristicaLabel = (label: string) =>
  label.replace(/:$/g, '').trim().toLowerCase()

const findMissingMarcaModeloMessage = (): string | null => {
  const lines: string[] = []

  for (const proveedor of formState.value) {
    for (const item of proveedor.items) {
      const itemLabels = labelsForTipo(labels.value, item.tipo_producto)
      const missing: string[] = []

      for (const label of itemLabels) {
        const key = normalizeCaracteristicaLabel(label)
        if (key !== 'marca' && key !== 'modelo') continue
        if (String(item.caracteristicas[label] ?? '').trim() !== '') continue
        missing.push(key === 'marca' ? 'Marca' : 'Modelo')
      }

      if (missing.length) {
        lines.push(
          `• ${proveedor.code_supplier || 'Proveedor'} · ${item.nombre_comercial || item.initial_name || 'Producto'}: ${missing.join(' y ')}`
        )
      }
    }
  }

  return lines.length
    ? `Los siguientes productos no tienen Marca y/o Modelo. Al continuar se llenarán con «S/M»:\n\n${lines.join('\n')}\n\n¿Deseas continuar con el guardado?`
    : null
}

const applySmDefaults = () => {
  formState.value = formState.value.map((proveedor) => ({
    ...proveedor,
    items: proveedor.items.map((item) => {
      const itemLabels = labelsForTipo(labels.value, item.tipo_producto)
      let changed = false
      const caracteristicas = { ...item.caracteristicas }

      for (const label of itemLabels) {
        const key = normalizeCaracteristicaLabel(label)
        if (key !== 'marca' && key !== 'modelo') continue
        if (String(caracteristicas[label] ?? '').trim() !== '') continue
        caracteristicas[label] = SM_DEFAULT
        changed = true
      }

      return changed ? { ...item, caracteristicas } : item
    })
  }))
}

const handleSave = () => {
  if (!data.value) return

  const smMessage = findMissingMarcaModeloMessage()
  const baseMessage = 'Se actualizará la confirmación del cliente con los datos editados. ¿Deseas continuar?'

  showConfirmation(
    smMessage ? 'Marca / Modelo incompletos' : 'Guardar cambios',
    smMessage || baseMessage,
    async () => {
      if (smMessage) applySmDefaults()
      await performSave()
    }
  )
}

const performSave = async () => {
  if (!data.value) return

  try {
    await withSpinner(async () => {
      const res = await ExcelConfirmacionCoordinacionService.save(uuid.value, buildSavePayload())
      if (!res.success) throw new Error(res.message || 'No se pudo guardar')

      await navigateTo({
        path: `${props.basePath}/clientes/excel-confirmacion/${uuid.value}/guardado`,
        query: {
          ...(contenedorId.value ? { contenedor: contenedorId.value } : {}),
          ...(tabQuery.value ? { tab: tabQuery.value } : {}),
          cliente: clienteQueryName.value || data.value!.nombre_cliente || '',
          ...(data.value!.carga ? { carga: data.value!.carga } : {}),
          ...(res.message ? { mensaje: res.message } : {})
        },
        replace: true
      })
    }, 'Guardando confirmación...')
  } catch (e: any) {
    showError('Error', e?.message || 'No se pudo guardar')
  }
}

const downloadExcelFile = async (url: string, fileName: string, spinnerLabel: string) => {
  try {
    await withSpinner(async () => {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const body = await response.json().catch(() => null)
          throw new Error(body?.message || 'No se pudo generar el Excel')
        }
        throw new Error('No se pudo generar el Excel')
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      a.click()
      URL.revokeObjectURL(objectUrl)
    }, spinnerLabel)
  } catch (e: any) {
    showError('Error', e?.message || 'No se pudo generar el Excel')
  }
}

const downloadExcelGeneral = async () => {
  if (!uuid.value) return

  const clientSlug = (pageTitle.value || 'cliente').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'cliente'
  await downloadExcelFile(
    ExcelConfirmacionCoordinacionService.exportGeneralUrl(uuid.value),
    `excel_confirmacion_general_${clientSlug}.xlsx`,
    'Generando Excel general...'
  )
}

const updateItem = (proveedorIndex: number, itemIndex: number, item: IntranetProveedorFormState['items'][number]) => {
  formState.value = formState.value.map((proveedor, pIdx) => {
    if (pIdx !== proveedorIndex) return proveedor
    const items = proveedor.items.map((current, iIdx) => (iIdx === itemIndex ? item : current))
    return { ...proveedor, items }
  })
}

const goBack = () => {
  if (contenedorId.value) {
    navigateTo({
      path: `${props.backBasePath}/clientes/${contenedorId.value}`,
      query: { tab: tabQuery.value }
    })
    return
  }
  navigateTo(`${props.backBasePath}/clientes`)
}

watch(activeProveedorIndex, () => {
  const proveedor = formState.value[activeProveedorIndex.value]
  openProductIds.value = proveedor?.items[0] ? [productKey(proveedor.items[0].id)] : []
})

const setProductOpen = (id: string, open: boolean) => {
  openProductIds.value = open ? [id] : []
}

onMounted(load)
</script>

<template>
  <div class="md:p-6 pb-24">
    <PageHeader
      :title="loading ? (clienteQueryName || 'Cliente') : pageTitle"
      :subtitle="loading ? 'Cargando confirmación...' : pageSubtitle"
      icon="i-heroicons-clipboard-document-check"
      :hide-back-button="false"
      @back="goBack"
    >
      <template v-if="!loading" #actions>
        <div class="flex flex-wrap items-center gap-2 justify-end">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-down-tray"
            label="Excel confirmación general"
            @click="downloadExcelGeneral"
          />
          <UButton
            color="primary"
            icon="i-heroicons-check"
            label="Guardar cambios"
            @click="handleSave"
          />
        </div>
      </template>
      <template v-else #actions>
        <USkeleton class="h-9 w-36 rounded-md" />
      </template>
    </PageHeader>

    <ExcelConfirmacionSkeleton v-if="loading" />

    <div v-else-if="data && formState.length" class="space-y-4">
      <UCard class="p-2 sm:p-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <UTabs
            v-model="activeProveedorIndex"
            :items="proveedorTabs"
            variant="pill"
            color="primary"
            class="min-w-0 flex-1"
            :content="false"
          />
          <div
            v-if="activeProveedor"
            class="flex flex-wrap items-center gap-2 shrink-0 lg:border-l lg:border-gray-200 lg:dark:border-gray-700 lg:pl-3"
          >
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Excel Conf.
            </span>
            <USelect
              :key="`excel-conf-${activeProveedor.id}`"
              :model-value="(activeProveedor.excel_conf_status || 'Pendiente') as ProveedorManualStatus"
              :items="excelConfStatusItems"
              :class="excelConfStatusClass"
              :disabled="!isCoord2Docs"
              size="sm"
              @update:model-value="(value: string) => updateExcelConfStatus(value)"
            />
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Excel Conf. VB
            </span>
            <USelect
              :key="`excel-conf-vb-${activeProveedor.id}`"
              :model-value="(activeProveedor.excel_conf_status_final || 'Pendiente') as ProveedorManualStatus"
              :items="excelConfStatusItems"
              :class="excelConfStatusFinalClass"
              :disabled="isCoord2Docs"
              size="sm"
              @update:model-value="(value: string) => updateExcelConfStatusFinal(value)"
            />
          </div>
        </div>
      </UCard>

      <div v-if="activeProveedor" class="space-y-4">
        <div v-if="activeProveedor.items.length" class="space-y-4">
          <UCard
            v-for="(accItem, index) in accordionItems"
            :key="accItem.value"
            class="overflow-hidden"
            :ui="{ body: 'p-0 sm:p-0' }"
          >
            <UCollapsible
              :open="openProductIds.includes(accItem.value)"
              :unmount-on-hide="false"
              @update:open="setProductOpen(accItem.value, $event)"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
              >
                <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold">
                  {{ accItem.index + 1 }}
                </span>
                <p class="font-medium text-gray-900 dark:text-white truncate text-sm min-w-0 flex-1">
                  {{ accItem.label }}
                  <UBadge v-if="accItem.item.isNew" color="success" variant="subtle" size="xs" class="ml-1">
                    Nuevo
                  </UBadge>
                </p>
                <div class="flex items-center gap-1.5 shrink-0 ms-auto">
                  <UBadge
                    :color="accItem.complete ? 'success' : 'warning'"
                    variant="subtle"
                    size="xs"
                    class="shrink-0"
                  >
                    {{ accItem.complete ? 'Listo' : 'Pendiente' }}
                  </UBadge>
                  <UBadge color="primary" variant="soft" size="xs" class="shrink-0">
                    {{ accItem.item.tipo_producto }}
                  </UBadge>
                  <UIcon
                    name="i-heroicons-chevron-down"
                    class="size-4 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': openProductIds.includes(accItem.value) }"
                  />
                </div>
              </button>
              <template #content>
                <ExcelConfirmacionItemForm
                  :item="accItem.item"
                  :labels="accItem.labels"
                  :readonly="false"
                  @update:item="updateItem(activeProveedorIndex, index, $event)"
                />
              </template>
            </UCollapsible>
          </UCard>
        </div>

        <UCard
          v-else
          class="border-2 border-dashed"
        >
          <p class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Este proveedor no tiene productos en la confirmación.
          </p>
        </UCard>
      </div>
    </div>

    <UAlert
      v-else
      color="warning"
      variant="soft"
      title="Sin datos"
      description="No se encontró información de confirmación para este cliente."
      class="mt-4"
    />
  </div>
</template>
