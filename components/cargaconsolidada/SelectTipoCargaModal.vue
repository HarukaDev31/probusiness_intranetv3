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
            <h3 class="text-sm font-medium text-gray-700 mb-3">Selecciona los items y su tipo de rotulado</h3>
            
            <!-- Lista de items con checkboxes -->
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <UCheckboxGroup 
                v-model="selectedItems"
                :items="checkboxItems"
              />
              
              <!-- Selector de tipo de carga para items seleccionados -->
              <div v-if="selectedItems.length > 0" class="mt-4 space-y-3">
                <h4 class="text-sm font-medium text-gray-700">Selecciona el tipo de rotulado para cada item:</h4>
                <div
                  v-for="itemId in selectedItems"
                  :key="itemId"
                  class=" border border-gray-200 rounded-lg p-3"
                >
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
                </div>
              </div>
            </div>
          </div>

          <!-- Mensaje de validación -->
          <div v-if="selectedItems.length > 0 && !canSave" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-600" />
              <span class="text-sm text-yellow-800">
                Todos los items seleccionados deben tener un tipo de carga asignado para poder guardar.
              </span>
            </div>
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
  onSelected?: (categorizacion: any) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selected', categorizacion: any): void
}>()

const { getProveedoresByCotizacion } = useCotizacionProveedor()
const { withSpinner } = useSpinner()

const loading = ref(false)
const loadingItems = ref(false)
const availableItems = ref<any[]>([])
const selectedItems = ref<string[]>([])
const itemTipoCarga = ref<Record<string, string>>({})

// Computed para crear los items del checkbox en el formato correcto
const checkboxItems = computed(() => {
  return availableItems.value.map(item => ({
    label: item.code_supplier,
    value: item.id.toString()
  }))
})

// Computed para validar si se puede guardar
const canSave = computed(() => {
  // Debe tener al menos un item seleccionado
  if (selectedItems.value.length === 0) {
    return false
  }
  
  // Todos los items seleccionados deben tener un tipo de carga asignado
  return selectedItems.value.every(itemId => {
    return itemTipoCarga.value[itemId] && itemTipoCarga.value[itemId].trim() !== ''
  })
})

// Opciones de tipos de carga con iconos
const tiposCarga = [
  { value: 'rotulado', label: 'Rotulado', icon: 'i-heroicons-tag' },
  { value: 'calzado', label: 'Calzado', icon: 'i-heroicons-shoe-prints' },
  { value: 'ropa', label: 'Ropa', icon: 'i-heroicons-clothing' },
  { value: 'ropa_interior', label: 'Ropa interior', icon: 'i-heroicons-cube' },
  { value: 'maquinaria', label: 'Maquinaria', icon: 'i-heroicons-wrench-screwdriver' },
  { value: 'movilidad_personal', label: 'Movilidad personal', icon: 'i-heroicons-truck' }
]

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
        availableItems.value = response.data || []
        console.log('Available items loaded:', availableItems.value.length)
        // Inicializar el objeto de tipos de carga
        availableItems.value.forEach(item => {
          itemTipoCarga.value[item.id.toString()] = ''
        })
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
  // Limpiar tipos de carga para items que ya no están seleccionados
  if (oldValue) {
    oldValue.forEach(itemId => {
      if (!newValue.includes(itemId)) {
        itemTipoCarga.value[itemId] = ''
      }
    })
  }
})

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
  emit('close')
}

const handleSelect = () => {
  if (selectedItems.value.length === 0) return

  loading.value = true
  try {
    // Crear array de proveedores con id y tipo de rotulado
    const proveedores = selectedItems.value.map(itemId => {
      const tipoRotulado = itemTipoCarga.value[itemId]
      return {
        id: parseInt(itemId),
        tipo_rotulado: tipoRotulado
      }
    })
    
    const result = {
      idCotizacion: props.cotizacionId,
      proveedores: proveedores
    }
    
    // Llamar al callback si está disponible
    if (props.onSelected) {
      props.onSelected(result)
    }
    emit('selected', result)
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

// Cargar items cuando cambia el show o cotizacionId
watch([() => props.show, () => props.cotizacionId], ([newShow, newCotizacionId]) => {
  console.log('Watch triggered - show:', newShow, 'cotizacionId:', newCotizacionId)
  if (newShow && newCotizacionId) {
    console.log('Calling loadItems from watch')
    loadItems()
  }
}, { immediate: true })

</script>
