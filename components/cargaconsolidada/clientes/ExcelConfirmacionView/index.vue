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
  buildExcelConfirmacionSaveFormData,
  labelsForTipo,
  type IntranetItemFormState,
  type IntranetProveedorFormState,
  type LabelsPorTipoProducto
} from '~/utils/cargaconsolidada/excelConfirmacion'
import { getRequiredCaracteristicaValues } from '~/utils/cargaconsolidada/caracteristicaFields'

const props = withDefaults(defineProps<{
  basePath: string
  backBasePath: string
  /** UUID de la cotización; si no se pasa, se toma de la ruta */
  uuid?: string
  /** Contenedor para volver atrás; si no se pasa, se toma del query */
  contenedorId?: string | number
  /** Nombre del cliente (fallback mientras carga) */
  clienteNombre?: string
  /** Embebido dentro de documentación: sin PageHeader propio */
  embedded?: boolean
}>(), {
  uuid: undefined,
  contenedorId: undefined,
  clienteNombre: undefined,
  embedded: false
})

const route = useRoute()
const uuid = computed(() => String(props.uuid || route.params.uuid || '').trim())
const contenedorId = computed(() => String(props.contenedorId ?? route.query.contenedor ?? '').trim())
const tabQuery = computed(() => String(route.query.tab || 'general'))
const clienteQueryName = computed(() =>
  String(props.clienteNombre || route.query.cliente || '').trim()
)

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const { updateProveedor } = useCotizacionProveedor()
const { userEmail, fetchCurrentUser, getUserData } = useUserRole()
const isCoord2Docs = computed(() => isCoord2DocsEmail(getUserData() || userEmail.value))

fetchCurrentUser()

const loading = ref(true)
const data = ref<ExcelConfirmacionData | null>(null)
const labels = ref<LabelsPorTipoProducto>({})
const formState = ref<IntranetProveedorFormState[]>([])
const activeProveedorTab = ref('')
const openProductIds = ref<string[]>([])

const activeProveedorIndex = computed(() =>
  formState.value.findIndex((p) => String(p.id) === activeProveedorTab.value)
)

const activeProveedor = computed(() => {
  const idx = activeProveedorIndex.value
  if (idx >= 0) return formState.value[idx]
  return formState.value[0] ?? null
})

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
  statusSelectClass(
    isCoord2Docs.value
      ? activeProveedor.value?.excel_conf_status
      : activeProveedor.value?.excel_conf_status_final
  )
)

const excelConfStatusField = computed(() =>
  isCoord2Docs.value ? 'excel_conf_status' : 'excel_conf_status_final'
)

const excelConfStatusModel = computed(() => {
  const proveedor = activeProveedor.value
  if (!proveedor) return 'Pendiente' as ProveedorManualStatus
  const value = isCoord2Docs.value
    ? proveedor.excel_conf_status
    : proveedor.excel_conf_status_final
  return (value || 'Pendiente') as ProveedorManualStatus
})

const proveedorTabs = computed(() =>
  formState.value.map((proveedor, index) => ({
    label: proveedor.code_supplier || `Proveedor ${index + 1}`,
    value: String(proveedor.id)
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

const productosResumen = computed(() => {
  const items = accordionItems.value
  if (!items.length) return null
  const listos = items.filter((i) => i.complete).length
  return { listos, total: items.length }
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
  activeProveedorTab.value = formState.value[0] ? String(formState.value[0].id) : ''
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
  await updateExcelConfStatusField(
    isCoord2Docs.value ? 'excel_conf_status' : 'excel_conf_status_final',
    value
  )
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

    const first = activeProveedor.value?.items[0]
    openProductIds.value = first ? [productKey(first.id)] : []
  } catch (e: any) {
    showError('Error', e?.message || 'No se pudo cargar')
  } finally {
    loading.value = false
  }
}

const buildSavePayload = () => buildExcelConfirmacionSaveFormData(formState.value)

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

      if (props.embedded) {
        showSuccess('Guardado', res.message || 'La confirmación se actualizó correctamente.')
        await load()
        return
      }

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

watch(activeProveedorTab, () => {
  const proveedor = activeProveedor.value
  openProductIds.value = proveedor?.items[0] ? [productKey(proveedor.items[0].id)] : []
})

const setProductOpen = (id: string, open: boolean) => {
  openProductIds.value = open ? [id] : []
}

onMounted(load)
watch(uuid, (next, prev) => {
  if (next && next !== prev) void load()
})

defineExpose({
  handleSave,
  downloadExcelGeneral,
  loading
})
</script>

<template>
  <div :class="embedded ? 'pb-8' : 'md:p-6 pb-24'">
    <PageHeader
      v-if="!embedded"
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
            label="Descargar Excel"
            @click="downloadExcelGeneral"
          />
          <UButton
            color="primary"
            icon="i-heroicons-check"
            label="Guardar"
            @click="handleSave"
          />
        </div>
      </template>
      <template v-else #actions>
        <USkeleton class="h-9 w-36 rounded-md" />
      </template>
    </PageHeader>

    <ExcelConfirmacionSkeleton v-if="loading" />

    <div v-else-if="data && formState.length" :class="embedded ? 'mt-2 space-y-4' : 'mt-4 mx-auto w-full max-w-5xl space-y-4'">
      <!-- Tabs de proveedores (mismo markup que Documentación) -->
      <div class="md:mb-6 mb-3">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
        >
          <div
            :class="proveedorTabs.length >= 5 ? '-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto whitespace-nowrap' : ''"
          >
            <UTabs
              v-model="activeProveedorTab"
              :items="proveedorTabs"
              size="md"
              variant="pill"
              color="neutral"
              :content="false"
              :class="[
                {
                  'md:w-200': proveedorTabs.length >= 3,
                  'w-50': proveedorTabs.length < 3,
                  'md:w-300': proveedorTabs.length >= 5
                },
                'inline-flex'
              ]"
            >
              <template #default="{ item }">
                <div class="inline-flex items-center group">
                  <span>{{ item.label }}</span>
                </div>
              </template>
            </UTabs>
          </div>
          <div
            v-if="activeProveedor"
            class="flex flex-wrap items-center gap-2 lg:shrink-0"
          >
            <UBadge
              v-if="productosResumen"
              color="neutral"
              variant="subtle"
              size="sm"
              :label="`${productosResumen.listos}/${productosResumen.total} listos`"
            />
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-muted whitespace-nowrap">Estado</span>
              <USelect
                :key="`excel-conf-${activeProveedor.id}-${excelConfStatusField}`"
                :model-value="excelConfStatusModel"
                :items="excelConfStatusItems"
                :class="excelConfStatusClass"
                size="sm"
                @update:model-value="(value: string) => updateExcelConfStatus(value)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeProveedor" class="space-y-3">
        <div v-if="activeProveedor.items.length" class="space-y-3">
          <div
            v-for="(accItem, index) in accordionItems"
            :key="accItem.value"
            class="overflow-hidden rounded-xl border border-default bg-default shadow-sm"
          >
            <UCollapsible
              :open="openProductIds.includes(accItem.value)"
              :unmount-on-hide="false"
              @update:open="setProductOpen(accItem.value, $event)"
            >
              <button
                type="button"
                class="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors duration-200 hover:bg-elevated/60 sm:px-4"
              >
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  :class="accItem.complete
                    ? 'bg-success/15 text-success'
                    : 'bg-warning/15 text-warning'"
                >
                  {{ accItem.index + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-highlighted">
                    {{ accItem.label }}
                    <UBadge
                      v-if="accItem.item.isNew"
                      color="success"
                      variant="subtle"
                      size="xs"
                      class="ms-1.5 align-middle"
                    >
                      Nuevo
                    </UBadge>
                  </p>
                  <p class="mt-0.5 truncate text-[11px] text-muted">
                    {{ accItem.item.tipo_producto }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <UBadge
                    :color="accItem.complete ? 'success' : 'warning'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ accItem.complete ? 'Listo' : 'Pendiente' }}
                  </UBadge>
                  <UIcon
                    name="i-heroicons-chevron-down"
                    class="size-4 text-muted transition-transform duration-200"
                    :class="{ 'rotate-180': openProductIds.includes(accItem.value) }"
                  />
                </div>
              </button>
              <template #content>
                <ExcelConfirmacionItemForm
                  :item="accItem.item"
                  :labels="accItem.labels"
                  :readonly="false"
                  @update:item="updateItem(activeProveedorIndex >= 0 ? activeProveedorIndex : 0, index, $event)"
                />
              </template>
            </UCollapsible>
          </div>
        </div>

        <div
          v-else
          class="rounded-xl border border-dashed border-default bg-elevated/30 px-6 py-12 text-center"
        >
          <UIcon name="i-heroicons-cube" class="mx-auto size-8 text-muted opacity-50" />
          <p class="mt-2 text-sm text-muted">
            Este proveedor no tiene productos en la confirmación.
          </p>
        </div>
      </div>
    </div>

    <UAlert
      v-else-if="!loading"
      color="warning"
      variant="soft"
      title="Sin datos"
      description="No se encontró información de confirmación para este cliente."
      class="mt-4"
    />
  </div>
</template>
