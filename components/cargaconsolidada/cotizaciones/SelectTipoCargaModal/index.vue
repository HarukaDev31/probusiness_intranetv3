<template>
  <UModal :show="show" @close="closeModal" class="sm:max-w-4xl max-h-[85vh]">
    <template #header>
      <div class="text-lg font-semibold">
        Enviar rotulado de proveedores 
      </div>
    </template>

    <template #body>
      <div class="space-y-6 w-full">
        <!-- Loading state -->
        <div v-if="loadingItems" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
        </div>

        <!-- Items disponibles con checkboxes -->
        <div v-if="!loadingItems" class="space-y-4">
          <div class=" p-4 rounded-lg">
            <h3 class="text-sm font-medium text-gray-700 mb-3">
              {{ usarTipoGuardado
                ? 'Aparecen todos los proveedores de la fila. Asigna el tipo y envía si al menos uno no está en PENDIENTE.'
                : 'Selecciona los items y su tipo de rotulado' }}
            </h3>
            
            <!-- Lista de items con checkboxes -->
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <UCheckboxGroup 
                v-model="selectedItems"
                :items="checkboxItems"
              />
              
              <!-- Selector de tipo de carga para items seleccionados -->
              <div v-if="selectedItems.length > 0" class="mt-4 space-y-3">
                <h4 class="text-sm font-medium text-gray-700">
                  {{ usarTipoGuardado ? 'Asigna el tipo de rotulado a cada proveedor:' : 'Selecciona el tipo de rotulado para cada item:' }}
                </h4>
                <div
                  v-for="itemId in selectedItems"
                  :key="itemId"
                  class=" border border-gray-200 rounded-lg p-3"
                >
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <span class="font-medium">{{ getItemName(itemId) }}</span>
                        <span class="text-sm text-gray-600">Products: {{ getItemProducts(itemId) }}</span>
                        <UBadge 
                          v-if="getItemSendStatus(itemId) === 'SENDED'"
                          color="success" 
                          variant="soft" 
                          size="xs"
                        >
                          Enviado
                        </UBadge>
                      </div>
                      <USelect
                        v-model="itemTipoCarga[itemId]"
                        :items="tiposCarga"
                        item-value="value"
                        item-title="label"
                        placeholder="Seleccionar tipo"
                        size="sm"
                        class="min-w-40"
                      />
                    </div>
                    
                    <!-- Checkbox para forzar envío si ya fue enviado -->
                    <div 
                      v-if="getItemSendStatus(itemId) === 'SENDED'" 
                      class="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-md p-2"
                    >
                      <UCheckbox
                        v-model="itemForceSend[itemId]"
                        :id="`force-send-${itemId}`"
                        size="sm"
                      />
                      <label 
                        :for="`force-send-${itemId}`" 
                        class="text-sm text-yellow-800 cursor-pointer select-none"
                      >
                        {{ usarTipoGuardado ? 'Reenviar' : 'Forzar reenvío (Ya se ha enviado el rotulado a este proveedor)' }}
                      </label>
                    </div>
                  </div>
                  <div
                    v-if="itemTipoCarga[itemId] === 'movilidad_personal' && getMovilidadItems(itemId).length"
                    class="mt-3 space-y-2 rounded-lg border border-dashed border-gray-200  p-3 text-sm "
                  >
                    <div class="font-medium ">
                      Detalle de movilidad personal
                    </div>
                    <div
                      v-for="(movilidadItem, movilidadIdx) in getMovilidadItems(itemId)"
                      :key="getMovilidadItemKey(itemId, movilidadItem, movilidadIdx)"
                      class="flex flex-wrap items-center gap-3 rounded border border-gray-200  px-3 py-2"
                    >
                      <UCheckbox
                        :model-value="isMovilidadItemChecked(itemId, movilidadItem, movilidadIdx)"
                        @update:model-value="value => toggleMovilidadItem(itemId, movilidadItem, movilidadIdx, Boolean(value))"
                        size="sm"
                      />
                      <div class="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between font-medium" >
                        <span class="font-medium ">{{ movilidadItem.initial_name ?? 'Sin nombre' }}</span>
                        <div class="flex flex-wrap items-center gap-4 text-sm">
                          <span class="flex items-center gap-1">
                            <span class="text-gray-500">Cantidad  :</span>
                            <span class="font-semibold ">{{ movilidadItem.initial_qty ?? '—' }}</span>
                          </span>
                        
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="totalMovilidadPersonalSeleccionada > 0"
              class="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700"
            >
              <span class="font-medium">Total movilidad personal seleccionada:</span>
              <span class="ml-1 font-semibold">{{ totalMovilidadPersonalSeleccionada }}</span>
            </div>
          </div>

          <!-- Mensaje de validación -->
          <div v-if="!canSave && (usarTipoGuardado || selectedItems.length > 0)" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-600" />
              <span class="text-sm text-yellow-800">
                {{ mensajeValidacion }}
              </span>
            </div>
          </div>
         
        </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
          color="neutral"
          variant="outline"
          @click="closeModal"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          :disabled="loading || !canSave"
          @click="handleSelect"
        >
          Enviar rotulado
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useSpinner } from '~/composables/commons/useSpinner'

interface Props {
  show: boolean
  cotizacionId?: number
  usarTipoGuardado?: boolean
  onSelected?: (categorizacion: any, extras?: any) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selected', categorizacion: any): void
}>()

const { getProveedoresByCotizacion } = useCotizacionProveedor()
const { withSpinner } = useSpinner()
const usarTipoGuardado = computed(() => Boolean(props.usarTipoGuardado))

const esTipoPendiente = (tipo?: string) => {
  return !tipo || String(tipo).trim().toLowerCase() === 'pendiente'
}

const labelTipoGuardado = (tipo?: string) => {
  const t = String(tipo || '').trim().toLowerCase()
  if (t === 'rotulado') return 'GENERAL'
  return t.replace(/_/g, ' ') || '—'
}

const loading = ref(false)
const loadingItems = ref(false)
const availableItems = ref<any[]>([])
const selectedItems = ref<string[]>([])
const itemTipoCarga = ref<Record<string, string>>({})
const movilidadItemsSeleccionados = ref<Record<string, string[]>>({})
const itemForceSend = ref<Record<string, boolean>>({})

const selectedListos = computed(() => {
  return selectedItems.value.filter(itemId => !esTipoPendiente(itemTipoCarga.value[itemId]))
})

const checkboxItems = computed(() => {
  return availableItems.value.map(item => {
    const id = item.id.toString()
    const tipoActual = itemTipoCarga.value[id] || item.tipo_rotulado
    return {
      label: usarTipoGuardado.value
        ? `${item.code_supplier || 'Sin código'} · ${labelTipoGuardado(tipoActual)}`
        : item.code_supplier,
      value: id
    }
  })
})

const itemListoParaEnviar = (itemId: string) => {
  const tipo = itemTipoCarga.value[itemId]?.trim()
  if (!tipo || esTipoPendiente(tipo)) {
    return false
  }
  if (usarTipoGuardado.value && getItemSendStatus(itemId) === 'SENDED' && !itemForceSend.value[itemId]) {
    return false
  }
  if (tipo === 'movilidad_personal') {
    return (movilidadItemsSeleccionados.value[itemId] ?? []).length > 0
  }
  return true
}

const canSave = computed(() => {
  if (usarTipoGuardado.value) {
    return selectedListos.value.length > 0 && selectedListos.value.every(itemListoParaEnviar)
  }
  if (selectedItems.value.length === 0) {
    return false
  }
  return selectedItems.value.every((itemId) => {
    const tipo = itemTipoCarga.value[itemId]?.trim()
    if (!tipo) {
      return false
    }
    if (tipo === 'movilidad_personal') {
      return (movilidadItemsSeleccionados.value[itemId] ?? []).length > 0
    }
    return true
  })
})

const mensajeValidacion = computed(() => {
  if (usarTipoGuardado.value) {
    if (selectedListos.value.length === 0) {
      return 'Asigna un tipo distinto de PENDIENTE a al menos un proveedor para poder enviar.'
    }
    return 'Si el proveedor ya fue enviado, marca Reenviar para incluirlo.'
  }
  return 'Todos los items seleccionados deben tener un tipo de carga asignado para poder guardar.'
})

const tiposCargaBase = [
  { value: 'rotulado', label: 'Rotulado', icon: 'i-heroicons-tag' },
  { value: 'calzado', label: 'Calzado', icon: 'i-heroicons-shoe-prints' },
  { value: 'ropa', label: 'Ropa', icon: 'i-heroicons-clothing' },
  { value: 'ropa_interior', label: 'Ropa interior', icon: 'i-heroicons-cube' },
  { value: 'maquinaria', label: 'Maquinaria', icon: 'i-heroicons-wrench-screwdriver' },
  { value: 'movilidad_personal', label: 'Movilidad personal', icon: 'i-heroicons-truck' }
]

const tiposCarga = computed(() => {
  if (!usarTipoGuardado.value) {
    return tiposCargaBase
  }
  return [
    { value: 'pendiente', label: 'Pendiente', icon: 'i-heroicons-clock' },
    ...tiposCargaBase
  ]
})

// Cargar items por cotización - igual que en StatusOptionsModal
const loadItems = async () => {
  console.log('loadItems called with cotizacionId:', props.cotizacionId)
  if (!props.cotizacionId) {
    console.log('No cotizacionId provided')
    return
  }
  
  loadingItems.value = true
  try {
    await withSpinner(async () => {
      console.log('Calling getProveedoresByCotizacion with:', props.cotizacionId)
      const response = await getProveedoresByCotizacion(props.cotizacionId)
      console.log('Response from getProveedoresByCotizacion:', response)
      if (response?.success) {
        const rows = response.data || []
        availableItems.value = rows
        availableItems.value.forEach(item => {
          const id = item.id.toString()
          itemTipoCarga.value[id] = usarTipoGuardado.value
            ? (item.tipo_rotulado || 'pendiente')
            : ''
          movilidadItemsSeleccionados.value[id] = []
          itemForceSend.value[id] = false
        })
        if (usarTipoGuardado.value) {
          selectedItems.value = availableItems.value
            .filter((item: any) => !esTipoPendiente(item.tipo_rotulado))
            .map((item: any) => item.id.toString())
        }
      }
    }, 'Cargando items...')
  } catch (error) {
    console.error('Error cargando items:', error)
  } finally {
    loadingItems.value = false
  }
}

// Watch para detectar cambios en selectedItems
watch(selectedItems, (newValue, oldValue) => {
  if (oldValue) {
    oldValue.forEach(itemId => {
      if (!newValue.includes(itemId)) {
        if (!usarTipoGuardado.value) {
          itemTipoCarga.value[itemId] = ''
        }
        movilidadItemsSeleccionados.value[itemId] = []
        itemForceSend.value[itemId] = false
      }
    })
  }
})

watch(itemTipoCarga, newValue => {
  Object.entries(newValue).forEach(([itemId, tipo]) => {
    if (tipo !== 'movilidad_personal') {
      movilidadItemsSeleccionados.value[itemId] = []
    }
  })
}, { deep: true })

// Obtener el nombre de un item por su ID
const getItemName = (itemId: string) => {
  const item = availableItems.value.find(i => i.id.toString() === itemId)
  return item ? item.code_supplier : ''
}

// Obtener los productos de un item por su ID
const getItemProducts = (itemId: string) => {
  const item = availableItems.value.find(i => i.id.toString() === itemId)
  return item ? item.products || 'N/A' : 'N/A'
}

// Obtener el estado de envío de un item por su ID
const getItemSendStatus = (itemId: string) => {
  const item = availableItems.value.find(i => i.id.toString() === itemId)
  return item ? item.send_rotulado_status || '' : ''
}

interface MovilidadItem {
  id?: number | string
  initial_price?: number | string
  initial_qty?: number | string
  initial_name?: string
  [key: string]: any
}

const getMovilidadItems = (itemId: string): MovilidadItem[] => {
  const item = availableItems.value.find(i => i.id.toString() === itemId)
  if (!item) {
    return []
  }

  const movilidadItems = (item as Record<string, any>).items_movilidad_personal ?? (item as Record<string, any>).items ?? []

  return Array.isArray(movilidadItems) ? movilidadItems : []
}

const getMovilidadItemIdentifier = (movilidadItem: MovilidadItem, index: number) => {
  return String(movilidadItem.id ?? index)
}

const getMovilidadItemKey = (itemId: string, movilidadItem: MovilidadItem, index: number) => {
  return `${itemId}-${getMovilidadItemIdentifier(movilidadItem, index)}`
}

const isMovilidadItemChecked = (itemId: string, movilidadItem: MovilidadItem, index: number) => {
  const identifier = getMovilidadItemIdentifier(movilidadItem, index)
  return movilidadItemsSeleccionados.value[itemId]?.includes(identifier) ?? false
}

const toggleMovilidadItem = (itemId: string, movilidadItem: MovilidadItem, index: number, checked: boolean) => {
  const identifier = getMovilidadItemIdentifier(movilidadItem, index)
  const current = movilidadItemsSeleccionados.value[itemId] ?? []

  if (checked) {
    if (!current.includes(identifier)) {
      movilidadItemsSeleccionados.value[itemId] = [...current, identifier]
    }
  } else {
    movilidadItemsSeleccionados.value[itemId] = current.filter(itemKey => itemKey !== identifier)
  }
}

const getSelectedMovilidadQtySum = (itemId: string) => {
  const identifiers = movilidadItemsSeleccionados.value[itemId] ?? []
  if (!identifiers.length) {
    return 0
  }

  const movilidadItems = getMovilidadItems(itemId)

  return identifiers.reduce((total, identifier) => {
    const matchingItem = movilidadItems.find((movilidadItem, index) => {
      return getMovilidadItemIdentifier(movilidadItem, index) === identifier
    })

    const qty = Number(matchingItem?.initial_qty ?? 0)
    return Number.isFinite(qty) ? total + qty : total
  }, 0)
}

const totalMovilidadPersonalSeleccionada = computed(() => {
  return selectedItems.value.reduce((total, itemId) => {
    const tipo = itemTipoCarga.value[itemId]
    if (tipo === 'movilidad_personal') {
      return total + getSelectedMovilidadQtySum(itemId)
    }
    return total
  }, 0)
})

// Obtener items en una categoría específica
const getItemsInCategory = (categoriaValue: string) => {
  return availableItems.value.filter(item => 
    selectedItems.value.includes(item.id.toString()) && itemTipoCarga.value[item.id.toString()] === categoriaValue
  )
}

const closeModal = () => {
  availableItems.value = []
  selectedItems.value = []
  itemTipoCarga.value = {}
  movilidadItemsSeleccionados.value = {}
  itemForceSend.value = {}
  emit('close')
}

const handleSelect = () => {
  const idsParaEnviar = usarTipoGuardado.value ? selectedListos.value : selectedItems.value
  if (idsParaEnviar.length === 0) return

  loading.value = true
  try {
    const proveedores = idsParaEnviar.map(itemId => {
      const tipoRotulado = itemTipoCarga.value[itemId]
      const totalMovilidadQty = tipoRotulado === 'movilidad_personal'
        ? getSelectedMovilidadQtySum(itemId)
        : 0
      const forceSend = itemForceSend.value[itemId] === true ? 1 : 0
      
      return {
        id: parseInt(itemId),
        tipo_rotulado: tipoRotulado,
        force_send: forceSend,
        ...(tipoRotulado === 'movilidad_personal' ? { total_initial_qty_movilidad_personal: totalMovilidadQty } : {})
      }
    })
    
    const totalMovilidadPersonal = totalMovilidadPersonalSeleccionada.value

    const result = {
      idCotizacion: props.cotizacionId,
      proveedores
    }
    
    // Llamar al callback si está disponible (el overlay maneja los eventos)
    if (props.onSelected) {
      props.onSelected(result, { total_movilidad_personal: totalMovilidadPersonal })
    }
    closeModal()
  } catch (error) {
    console.error('Error enviando rotulado:', error)
  } finally {
    loading.value = false
  }
}

// Cargar items cuando se monta el componente
onMounted(() => {
  if (props.show && props.cotizacionId) {
    loadItems()
  }
})

</script>

