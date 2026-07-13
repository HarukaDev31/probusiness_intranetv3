<script setup lang="ts">
import ExcelConfirmacionItemForm from '~/components/cargaconsolidada/clientes/ExcelConfirmacionItemForm/index.vue'
import ExcelConfirmacionSkeleton from '~/components/cargaconsolidada/clientes/ExcelConfirmacionSkeleton/index.vue'
import {
  ExcelConfirmacionCoordinacionService,
  type ExcelConfirmacionData,
  type ExcelConfirmacionProveedor
} from '~/services/cargaconsolidada/clientes/excelConfirmacionCoordinacionService'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import {
  apiItemToFormState,
  formStateToSaveItem,
  labelsForTipo,
  type IntranetProveedorFormState,
  type LabelsPorTipoProducto
} from '~/utils/cargaconsolidada/excelConfirmacion'

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

const loading = ref(true)
const data = ref<ExcelConfirmacionData | null>(null)
const labels = ref<LabelsPorTipoProducto>({})
const formState = ref<IntranetProveedorFormState[]>([])
const activeProveedorIndex = ref(0)
const openProductIds = ref<string[]>([])

const activeProveedor = computed(() => formState.value[activeProveedorIndex.value] ?? null)

const proveedorTabs = computed(() =>
  formState.value.map((proveedor, index) => ({
    label: proveedor.code_supplier || `Proveedor ${index + 1}`,
    value: index,
    badge: proveedor.excel_conf_form_cerrado ? 'Cerrado' : undefined
  }))
)

const pageTitle = computed(() => clienteQueryName.value || data.value?.nombre_cliente || 'Cliente')
const pageSubtitle = computed(() => {
  const parts = ['Confirmación web del cliente']
  if (data.value?.carga) parts.push(`Carga #${data.value.carga}`)
  return parts.join(' · ')
})

const productKey = (id: number) => String(id)

const accordionItems = computed(() => {
  const proveedor = activeProveedor.value
  if (!proveedor) return []

  return proveedor.items.map((item, index) => ({
    value: productKey(item.id),
    label: item.nombre_comercial || item.initial_name || `Producto ${index + 1}`,
    item,
    index,
    labels: labelsForTipo(labels.value, item.tipo_producto)
  }))
})

const buildFormState = (payload: ExcelConfirmacionData) => {
  formState.value = payload.proveedores.map((proveedor) => ({
    id: proveedor.id,
    code_supplier: proveedor.code_supplier,
    excel_conf_form_cerrado: Boolean(proveedor.excel_conf_form_cerrado),
    items: proveedor.items.map((item) => apiItemToFormState(item, labels.value))
  }))
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

const handleSave = () => {
  if (!data.value) return

  showConfirmation(
    'Guardar cambios',
    'Se actualizará la confirmación del cliente con los datos editados. ¿Deseas continuar?',
    () => performSave()
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

const toggleCerrado = async (proveedor: ExcelConfirmacionProveedor | IntranetProveedorFormState) => {
  const isCerrado = proveedor.excel_conf_form_cerrado
  const title = isCerrado ? 'Reabrir formulario' : 'Cerrar formulario'
  const message = isCerrado
    ? 'El cliente podrá volver a editar este proveedor.'
    : 'El cliente ya no podrá editar este proveedor hasta que lo reabras.'

  showConfirmation(title, message, async () => {
    await withSpinner(async () => {
      const res = isCerrado
        ? await ExcelConfirmacionCoordinacionService.reabrirProveedor(proveedor.id)
        : await ExcelConfirmacionCoordinacionService.cerrarProveedor(proveedor.id)
      if (!res.success) throw new Error(res.message || 'No se pudo actualizar')
      showSuccess('Listo', res.message || 'Estado actualizado')
      await load()
    }, 'Actualizando...')
  })
}

const downloadExcel = async (proveedor: IntranetProveedorFormState) => {
  try {
    await withSpinner(async () => {
      const config = useRuntimeConfig()
      const base = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `${base}/api/carga-consolidada/contenedor/clientes/excel-confirmacion/proveedor/${proveedor.id}/export`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const body = await response.json().catch(() => null)
          throw new Error(body?.message || 'No se pudo generar el Excel')
        }
        throw new Error('No se pudo generar el Excel')
      }
      const blob = await response.blob()
      const fileName = `excel_confirmacion_${proveedor.code_supplier || proveedor.id}.xlsx`
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      a.click()
      URL.revokeObjectURL(objectUrl)
    }, 'Generando Excel...')
  } catch (e: any) {
    showError('Error', e?.message || 'No se pudo generar el Excel')
  }
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
  if (open) {
    if (!openProductIds.value.includes(id)) {
      openProductIds.value = [...openProductIds.value, id]
    }
    return
  }
  openProductIds.value = openProductIds.value.filter((value) => value !== id)
}

onMounted(load)
</script>

<template>
  <div class="md:p-6 pb-24">
    <PageHeader
      :title="loading ? (clienteQueryName || 'Cliente') : pageTitle"
      :subtitle="loading ? 'Cargando confirmación...' : pageSubtitle"
      icon="i-heroicons-clipboard-document-check"
      @back="goBack"
    >
      <template v-if="!loading" #actions>
        <UButton
          color="primary"
          icon="i-heroicons-check"
          label="Guardar cambios"
          @click="handleSave"
        />
      </template>
      <template v-else #actions>
        <USkeleton class="h-9 w-36 rounded-md" />
      </template>
    </PageHeader>

    <ExcelConfirmacionSkeleton v-if="loading" />

    <div v-else-if="data && formState.length" class="space-y-4">
      <UCard class="p-1.5">
        <UTabs
          v-model="activeProveedorIndex"
          :items="proveedorTabs"
          variant="pill"
          color="primary"
          class="w-full"
          :content="false"
        />
      </UCard>

      <div v-if="activeProveedor" class="space-y-4">
        <UCard>
          <div class="flex flex-wrap items-center gap-2 justify-between">
            <UBadge
              :color="activeProveedor.excel_conf_form_cerrado ? 'error' : 'success'"
              variant="subtle"
            >
              {{ activeProveedor.excel_conf_form_cerrado ? 'Cerrado para el cliente' : 'Abierto para el cliente' }}
            </UBadge>
            <div class="flex flex-wrap gap-2">
              <UButton
                size="sm"
                variant="outline"
                icon="i-heroicons-arrow-down-tray"
                @click="downloadExcel(activeProveedor)"
              >
                Generar Excel
              </UButton>
              <UButton
                size="sm"
                :color="activeProveedor.excel_conf_form_cerrado ? 'primary' : 'warning'"
                variant="soft"
                :icon="activeProveedor.excel_conf_form_cerrado ? 'i-heroicons-lock-open' : 'i-heroicons-lock-closed'"
                @click="toggleCerrado(activeProveedor)"
              >
                {{ activeProveedor.excel_conf_form_cerrado ? 'Reabrir' : 'Cerrar' }}
              </UButton>
            </div>
          </div>
        </UCard>

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
                  :readonly="activeProveedor.excel_conf_form_cerrado"
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
