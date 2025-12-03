<template>
  <UModal @close="closeModal">
    <template #header>
      <div class="flex items-center gap-2">
        <UButton 
          v-if="currentStep > 1"
          color="primary" 
          variant="ghost"
          icon="i-heroicons-arrow-left"
          size="xs"
          @click="goBack"
        />
        <div class="flex items-center gap-2 flex-col">
        <div class="text-sm text-gray-500">Selecciona la acción de tu preferencia para:</div>
        <div class="text-lg font-semibold">
          {{ props.clienteName }}
        </div>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 w-full">
        <!-- Paso 1: Selección de Acción -->
        <div v-if="currentStep === 1" class="space-y-4">
          <USelect
            v-model="selectedAction"
            :items="actionOptions"
            placeholder="Seleccionar"
            class="w-full"
          />
        </div>

        <!-- Paso 2: Recordatorios (tabs General y por proveedor) -->
        <div v-if="currentStep === 2 && selectedAction === 'recordatorio'" class="space-y-4">
          <div class="text-sm font-medium text-gray-700 mb-3">
            Selecciona el alcance y los documentos a recordar.
          </div>

          <!-- Nota: Selecciona en General o por proveedor -->
          <div class="text-xs text-gray-500 mb-2">Puedes seleccionar documentos en la pestaña General o por proveedor.</div>

          <!-- Tabs: General + por proveedor (proveedoresPendingDocuments) -->
          <div class="flex gap-2 mb-4 flex-wrap">
            <button
              @click="setRecordatorioTab('general')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                recordatorioActiveTab === 'general' ? 'border-gray-300' : 'border-gray-200'
              ]"
            >
              General
            </button>

            <button
              v-for="prov in proveedoresPendingDocuments"
              :key="prov.id"
              @click="setRecordatorioTab(prov.id)"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                recordatorioActiveTab === prov.id ? 'border-gray-300' : 'border-gray-200'
              ]"
            >
              <span class="mr-2">{{ prov.code_supplier }}</span>
              <UBadge v-if="(selectedDocsByProveedor[prov.id] || []).length > 0" color="primary" variant="soft">Enviando</UBadge>
            </button>
          </div>

          <!-- Contenido de la tab activa -->
          <div v-if="recordatorioActiveTab === 'general'" class="border border-gray-200 rounded-lg p-4 space-y-3">
            <div class="text-xs text-gray-600">Selecciona los documentos a recordar para <span class="font-semibold">todos</span> los proveedores. Si marcas aquí, se limpiará la selección individual de ese documento.</div>
            <div class="flex items-center gap-3">
              <UCheckbox :model-value="isDocSelectedGeneral('commercial_invoice')" @update:model-value="(v: boolean) => toggleDocGeneral('commercial_invoice', v)" />
              <span class="font-medium">Commercial Invoice</span>
            </div>
            <div class="flex items-center gap-3">
              <UCheckbox :model-value="isDocSelectedGeneral('packing_list')" @update:model-value="(v: boolean) => toggleDocGeneral('packing_list', v)" />
              <span class="font-medium">Packing List</span>
            </div>
            <div class="flex items-center gap-3">
              <UCheckbox :model-value="isDocSelectedGeneral('excel_confirmacion')" @update:model-value="(v: boolean) => toggleDocGeneral('excel_confirmacion', v)" />
              <span class="font-medium">Excel Confirmación</span>
            </div>
          </div>

          <div v-else class="border border-gray-200 rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-3">
                <UCheckbox :disabled="isDocSelectedGeneral('commercial_invoice')" :model-value="isDocSelectedForCurrent('commercial_invoice')" @update:model-value="(v: boolean) => onProviderDocToggle('commercial_invoice', v)" />
                <span class="font-medium">Commercial Invoice</span>
              </label>
              <UBadge v-if="currentProveedorTab?.factura_comercial" color="primary" variant="soft">Enviado</UBadge>
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-3">
                <UCheckbox :disabled="isDocSelectedGeneral('packing_list')" :model-value="isDocSelectedForCurrent('packing_list')" @update:model-value="(v: boolean) => onProviderDocToggle('packing_list', v)" />
                <span class="font-medium">Packing List</span>
              </label>
              <UBadge v-if="currentProveedorTab?.packing_list" color="primary" variant="soft">Enviado</UBadge>
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-3">
                <UCheckbox :disabled="isDocSelectedGeneral('excel_confirmacion')" :model-value="isDocSelectedForCurrent('excel_confirmacion')" @update:model-value="(v: boolean) => onProviderDocToggle('excel_confirmacion', v)" />
                <span class="font-medium">Excel Confirmación</span>
              </label>
              <UBadge v-if="currentProveedorTab?.excel_confirmacion" color="primary" variant="soft">Enviado</UBadge>
            </div>
          </div>
        </div>

        <!-- Paso 2: Tipo de producto por item (si seleccionó Recordatorio) -->
        <div v-if="currentStep === 2 && selectedAction === 'pedir_documentos'" class="space-y-4">
          <div class="text-sm font-medium text-gray-700 mb-3">
            Categoriza el tipo de producto x item:
          </div>

          <!-- Tabs de items -->
          <div class="flex gap-2 mb-4">
            <UButton
              v-for="item in items"
              :key="item.id"
              @click="selectedItem = item.id"
              color="secondary"
              :variant="selectedItem === item.id ? 'solid' : 'outline'"
            >
              {{ item.nombre }}
            </UButton>
          </div>

          <!-- Lista de productos con selectores de categoría -->
          <div class="border border-gray-200 rounded-lg p-4 space-y-3">
            <div
              v-for="producto in productosPorItem"
              :key="producto.id"
              class="flex items-center justify-between border-b border-gray-100 pb-3"
            >
              <span class="font-medium">{{ producto.nombre }}</span>
              <USelect
              v-model="producto.tipo_producto_seleccionado"
                :items="categorias"
                placeholder="Seleccionar"
                size="sm"
                class="w-48"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          v-if="currentStep === 1"
          color="primary"
          :disabled="!selectedAction"
          @click="goNext"
        >
          Continuar
        </UButton>
        <UButton
          v-else
          color="primary"
          :disabled="!canSave"
          @click="handleSave"
        >
          {{ selectedAction === 'pedir_documentos' ? 'Solicitar documentos' : 'Enviar recordatorio'  }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGeneral } from '~/composables/cargaconsolidada/clientes/useGeneral'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
const { withSpinner } = useSpinner()
const { getProveedoresItems, solicitarDocumentos, getProveedoresPendingDocuments, enviarRecordatorios } = useGeneral()
const { showSuccess, showError } = useModal()
interface Props {
  show: boolean
  clienteId?: number
  clienteName?: string
  onSelected?: (data: any) => void
  validateMaxDate?:boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selected', data: any): void
}>()

// Estado del modal
const currentStep = ref(1)
const selectedAction = ref('')

// Opciones del select principal
const actionOptions = [
  { label: 'Pedir documentos', value: 'pedir_documentos' },
  { label: 'Recordatorio', value: 'recordatorio' }
]

// Estado para "Pedir documentos"
const proveedores = ref<{ id: number; code_supplier: string; items: { id: number; initial_name: string; tipo_producto: string }[] }[]>([])
const selectedProveedor = ref<number | null>(null)
const proveedoresPendingDocuments = ref<{ packing_list: string | null; factura_comercial: string | null; excel_confirmacion: string | null; id: number; code_supplier: string }[]>([])
const documentos = ref([
  { label: 'Commercial Invoice', value: 'commercial_invoice' },
  { label: 'Packing list', value: 'packing_list' },
  { label: 'Excel confirmacion', value: 'excel_confirmacion' }
])
// Selección de documentos por proveedor (independiente)
const selectedDocsByProveedor = ref<Record<number, string[]>>({})
// Selección general (para todos los proveedores)
const selectedDocsGeneral = ref<string[]>([])

// Estado para "Recordatorio"
// En esta vista, usaremos las pestañas para mostrar proveedores (usando su code_supplier)
const items = ref<{ id: number; nombre: string }[]>([])
const selectedItem = ref<number | null>(null)
const productosPorItem = ref<{ id: number; nombre: string; tipo_producto_seleccionado: string }[]>([])
// Tabs para recordatorio
const recordatorioActiveTab = ref<'general' | number>('general')
const currentProveedorTab = computed(() => {
  if (typeof recordatorioActiveTab.value === 'number') {
    return proveedoresPendingDocuments.value.find(p => p.id === recordatorioActiveTab.value) || null
  }
  return null
})
const setRecordatorioTab = (tab: 'general' | number) => {
  recordatorioActiveTab.value = tab
  selectedProveedor.value = typeof tab === 'number' ? tab : null
}
const isDocSelectedGeneral = (doc: string) => selectedDocsGeneral.value.includes(doc)
const toggleDocGeneral = (doc: string, checked: boolean) => {
  if (checked) {
    // Confirmación: esto limpiará selecciones individuales de este doc
    const ok = window.confirm('Marcar este documento en General limpiará la selección individual del mismo en cada proveedor. ¿Continuar?')
    if (!ok) return
    if (!selectedDocsGeneral.value.includes(doc)) selectedDocsGeneral.value.push(doc)
    // limpiar por proveedor
    for (const provIdStr of Object.keys(selectedDocsByProveedor.value)) {
      const provId = Number(provIdStr)
      const list = selectedDocsByProveedor.value[provId] || []
      const idx = list.indexOf(doc)
      if (idx !== -1) list.splice(idx, 1)
      selectedDocsByProveedor.value[provId] = [...list]
    }
  } else {
    const idx = selectedDocsGeneral.value.indexOf(doc)
    if (idx !== -1) selectedDocsGeneral.value.splice(idx, 1)
  }
}
const isDocSelectedForCurrent = (doc: string) => {
  if (typeof recordatorioActiveTab.value !== 'number') return false
  const provId = recordatorioActiveTab.value
  const list = selectedDocsByProveedor.value[provId] || []
  return list.includes(doc)
}
const toggleDocForCurrent = (doc: string, checked: boolean) => {
  if (typeof recordatorioActiveTab.value !== 'number') return
  const provId = recordatorioActiveTab.value
  const list = selectedDocsByProveedor.value[provId] || []
  const idx = list.indexOf(doc)
  if (checked && idx === -1) list.push(doc)
  if (!checked && idx !== -1) list.splice(idx, 1)
  selectedDocsByProveedor.value[provId] = [...list]
}
const onProviderDocToggle = (doc: string, checked: boolean) => {
  // si el doc está seleccionado a nivel general, impedir selección individual
  if (isDocSelectedGeneral(doc)) return
  toggleDocForCurrent(doc, checked)
}
// Mapa para persistir la categoría seleccionada por proveedor e ítem
// Estructura: { [proveedorId]: { [initial_name]: categoria } }
const tipoSeleccionadoPorProveedor = ref<Record<number, Record<string, string>>>({})
const categorias = [
  { label: 'General', value: 'GENERAL' },
  { label: 'Calzado', value: 'CALZADO' },
  { label: 'Ropa', value: 'ROPA' },
  { label: 'Tecnologia', value: 'TECNOLOGIA' },
  { label: 'Tela', value: 'TELA' },
  { label: 'Automotriz', value: 'AUTOMOTRIZ' },
  { label: 'Movilidad personal', value: 'MOVILIDAD PERSONAL' },
  { label: 'Maquinaria', value: 'MAQUINARIA' }
]

// Computed
const canSave = computed(() => {
  if (currentStep.value === 1) return false
  
  if (selectedAction.value === 'recordatorio') {
    const anyGeneral = selectedDocsGeneral.value.length > 0
    const anyProveedor = Object.values(selectedDocsByProveedor.value).some(list => (list || []).length > 0)
    return anyGeneral || anyProveedor
  }
  
  if (selectedAction.value === 'pedir_documentos') {
    return productosPorItem.value.every(p => p.tipo_producto_seleccionado !== '')
  }
  
  return false
})

// Métodos
const goNext = () => {
  if (currentStep.value === 1 && selectedAction.value) {
    currentStep.value = 2
  }
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const closeModal = () => {
  // Resetear estado
  currentStep.value = 1
  selectedAction.value = ''
  selectedProveedor.value = null
  selectedDocsByProveedor.value = {}
  selectedDocsGeneral.value = []
  selectedItem.value = null
  productosPorItem.value = []
  proveedores.value = []
  items.value = []
  tipoSeleccionadoPorProveedor.value = {}
  
  emit('close')
}

const handleSave = async () => {
  let result: any
  
  if (selectedAction.value === 'pedir_documentos') {
    // Construir payload con TODOS los proveedores y sus items con tipo seleccionado
    const proveedoresPayload = proveedores.value.map(prov => {
      const saved = tipoSeleccionadoPorProveedor.value[prov.id] || {}
      return {
        id: prov.id,
        items: prov.items.map(it => ({
            id: it.id,
          initial_name: it.initial_name,
          tipo_producto: saved[it.initial_name] || ''
        }))
      }
    })
    // Llamar al composable para realizar la petición
    await withSpinner(async () => {
      try{
     const res = await solicitarDocumentos(props.clienteId as number, { proveedores: proveedoresPayload },props.validateMaxDate)
     if(res?.success){
      showSuccess('Solicitud enviada correctamente', 'success')
      currentStep.value = 1
    }else{
      showError('Error al enviar solicitud', 'error')
     }
    }catch(error){
      showError('Error  al solicitar Documentos',error)
    }
    }, 'Enviando solicitud...')
    // Emitir resultado simple por si el padre requiere reaccionar
    result = { action: 'pedir_documentos', success: true }
  } else {
    // Recordatorio: combinar selección general con selección por proveedor
    const proveedoresPayload = proveedoresPendingDocuments.value.map(p => {
      const individuales = selectedDocsByProveedor.value[p.id] || []
      // union de general + individuales (sin duplicados)
      const set = new Set<string>([...selectedDocsGeneral.value, ...individuales])
      return { id: p.id, documentos: Array.from(set) }
    })
    await withSpinner(async () => {
      const payload = { id_cotizacion: props.clienteId as number, proveedores: proveedoresPayload }
      const res = await enviarRecordatorios(payload as any)
      if(res?.success){
        showSuccess('Recordatorio enviado correctamente', 'success')
        currentStep.value = 1
      }else{
        showError('Error al enviar recordatorio', 'error')
      }
    }, 'Enviando recordatorios...')
    result = { action: 'recordatorio', success: true }
  }
  
  // Llamar al callback si está disponible
  if (props.onSelected) {
    props.onSelected(result)
  }
  
  closeModal()
}

// Cargar datos cuando se monta el componente
onMounted(async () => {
  
})
//watch selectedAction
watch(selectedAction, async (newVal) => {
  if (newVal === 'pedir_documentos') {
    await withSpinner(async () => {
      const res = await getProveedoresItems(props.clienteId as number)
      if (res?.success && Array.isArray(res.data)) {
        // Guardar proveedores crudos
        proveedores.value = res.data.map(p => ({
          id: p.id,
          code_supplier: p.code_supplier,
          items: p.items.map(it => ({
            id: it.id,
            initial_name: it.initial_name,
            tipo_producto: it.tipo_producto
          }))
        }))
        // Inicializar mapa de tipos por proveedor con valores del backend
        tipoSeleccionadoPorProveedor.value = {}
        for (const prov of res.data) {
          const mapItems: Record<string, string> = {}
          for (const it of prov.items) {
            mapItems[it.initial_name] = it.tipo_producto || ''
          }
          tipoSeleccionadoPorProveedor.value[prov.id] = mapItems
        }
        // Usaremos las pestañas para listar proveedores por su code_supplier
        items.value = res.data.map(p => ({ id: p.id, nombre: p.code_supplier }))
        // Seleccionar el primero por defecto
        if (items.value.length > 0) {
          selectedItem.value = items.value[0].id
        }
        // Poblar productos del primer proveedor
        const first = res.data.find(p => p.id === selectedItem.value)
        if (first) {
          const saved = tipoSeleccionadoPorProveedor.value[first.id] || {}
          productosPorItem.value = first.items.map((it, idx) => ({
            id: idx + 1,
            nombre: it.initial_name,
            tipo_producto_seleccionado: saved[it.initial_name] ?? (it.tipo_producto || '')
          }))
        } else {
          productosPorItem.value = []
        }
        currentStep.value = 2
      }
    }, 'Cargando proveedores...')
  }else if (newVal === 'recordatorio') {
    await withSpinner(async () => {
      const res = await getProveedoresPendingDocuments(props.clienteId as number)
      if (res?.success && Array.isArray(res.data)) {
        proveedoresPendingDocuments.value = res.data
        recordatorioActiveTab.value = 'general'
        selectedProveedor.value = null
        // inicializar selección por proveedor vacía
        const map: Record<number, string[]> = {}
        for (const p of res.data) map[p.id] = []
        selectedDocsByProveedor.value = map
        selectedDocsGeneral.value = []
        currentStep.value = 2
      }
    }, 'Cargando proveedores pendientes de documentos...')
  }
})

// Actualizar productos al cambiar de pestaña (proveedor seleccionado)
watch(selectedItem, (newId) => {
  if (!newId) {
    productosPorItem.value = []
    return
  }
  const prov = proveedores.value.find(p => p.id === newId)
  if (!prov) {
    productosPorItem.value = []
    return
  }
  const saved = tipoSeleccionadoPorProveedor.value[prov.id] || {}
  productosPorItem.value = prov.items.map((it, idx) => ({
    id: idx + 1,
    nombre: it.initial_name,
    tipo_producto_seleccionado: saved[it.initial_name] ?? (it.tipo_producto || '')
  }))
})

// Sincronizar cambios del usuario en categorías con el mapa persistente
watch(productosPorItem, (list) => {
  if (!selectedItem.value) return
  const provId = selectedItem.value
  if (!tipoSeleccionadoPorProveedor.value[provId]) {
    tipoSeleccionadoPorProveedor.value[provId] = {}
  }
  const mapRef = tipoSeleccionadoPorProveedor.value[provId]
  for (const p of list) {
    mapRef[p.nombre] = p.tipo_producto_seleccionado || ''
  }
}, { deep: true })
</script>

