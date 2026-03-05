<template>
  <UModal :model-value="true" @update:model-value="emit('close')" class="sm:max-w-2xl">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Boletín Químico</h3>
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Consolidado">
          <USelectMenu
            v-model="idContenedor"
            :items="contenedorOptions"
            value-attribute="value"
            placeholder="Seleccionar consolidado"
            size="md"
            class="w-full"
            searchable
            searchable-placeholder="Buscar consolidado..."
            :loading="loadingConsolidados"
            @update:model-value="onContenedorChange"
          />
        </UFormField>

        <template v-if="idContenedor != null">
          <UFormField label="Cliente">
            <USelectMenu
              v-model="selectedClienteId"
              :items="clienteOptions"
              value-attribute="value"
              placeholder="Seleccionar cliente"
              size="md"
              class="w-full"
              searchable
              searchable-placeholder="Buscar cliente..."
              :loading="loadingClientes"
              @update:model-value="onClienteChange"
            />
          </UFormField>

          <template v-if="selectedClienteId != null">
            <UFormField label="Items (de la cotización del cliente)">
              <USelectMenu
                :model-value="selectedItems as Array<SelectOption>"
                :items="itemOptions"
                value-attribute="value"
                placeholder="Seleccionar uno o más items"
                size="md"
                class="w-full"
                multiple
                searchable
                searchable-placeholder="Buscar item..."
                :loading="loadingItems"
                @update:model-value="onSelectedItemsChange"
              />
            </UFormField>
          </template>

          <div v-if="rows.length" class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="text-left p-2">Cliente</th>
                  <th class="text-left p-2">Item</th>
                  <th class="text-left p-2 w-32">Monto (S/)</th>
                  <th class="w-10" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in rows" :key="idx" class="border-t dark:border-gray-700">
                  <td class="p-2">{{ r.clienteNombre }}</td>
                  <td class="p-2">{{ r.itemNombre }}</td>
                  <td class="p-2">
                    <div class="flex items-center gap-1">
                      <span class="text-gray-500 dark:text-gray-400 text-sm">S/</span>
                      <UInput
                        v-model.number="r.monto_boletin"
                        type="number"
                        step="0.01"
                        min="0"
                        size="sm"
                      />
                    </div>
                  </td>
                  <td class="p-2">
                    <UButton
                      icon="i-heroicons-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      @click="removeRow(idx)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('close')">Cancelar</UButton>
        <UButton
          color="primary"
          :loading="saving"
          :disabled="rows.length === 0 || saving"
          @click="handleSave"
        >
          Guardar
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BoletinQuimicoService } from '~/services/basedatos/boletinQuimicoService'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'
import { CotizacionService } from '~/services/cargaconsolidada/cotizacionService'
import { ROLES } from '~/constants/roles'

const props = defineProps<{ onSaved?: () => void; onClose?: () => void }>()
const emit = defineEmits<{ saved: []; close: [] }>()

/** Valor que USelectMenu asigna con value-attribute="value" (objeto completo de la opción). */
type SelectOption = { label: string; value: number } | null
const idContenedor = ref<SelectOption>(null)
const contenedores = ref<Array<{ id: number; carga: string }>>([])
const clientes = ref<Array<{ id: number; nombre: string }>>([])
const items = ref<Array<{ id: number; id_cotizacion: number; nombre: string }>>([])
const selectedClienteId = ref<SelectOption>(null)
/** Selección múltiple de ítems; al cambiar se sincronizan las filas automáticamente. */
const selectedItems = ref<Array<SelectOption | number>>([])
const rows = ref<Array<{
  id_cotizacion: number
  id_cotizacion_proveedor_item: number | null
  clienteNombre: string
  itemNombre: string
  monto_boletin: number
}>>([])
const saving = ref(false)
const loadingConsolidados = ref(false)
const loadingClientes = ref(false)
const loadingItems = ref(false)

/** Mismo formato que permisos: { label, value } para USelectMenu value-attribute="value" */
const contenedorOptions = computed(() =>
  contenedores.value.map(c => ({
    label: c.carga ? `#${c.carga}` : `#${c.id}`,
    value: Number(c.id),
  }))
)
const clienteOptions = computed(() =>
  clientes.value.map(c => ({ label: c.nombre || `#${c.id}`, value: Number(c.id) }))
)
const itemOptions = computed(() =>
  items.value.map(i => ({ label: `${i.nombre} (Cot. ${i.id_cotizacion})`, value: Number(i.id) }))
)

function selectValueToNum (v: SelectOption | number | null): number | null {
  if (v == null) return null
  if (typeof v === 'object' && 'value' in v) return v.value
  if (typeof v === 'number') return v
  return null
}
const selectedClienteIdNum = computed(() => selectValueToNum(selectedClienteId.value))

/** Mismo endpoint que basedatos/permisos: ConsolidadoService.getConsolidadoData */
async function loadContenedores () {
  loadingConsolidados.value = true
  try {
    const res = await ConsolidadoService.getConsolidadoData({ limit: 500, page: 1 })
    const data = res?.data ?? []
    contenedores.value = data.map((c: { id: number; carga?: string }) => ({
      id: Number(c.id),
      carga: c.carga ?? '',
    }))
  } catch (e) {
    console.error(e)
    contenedores.value = []
  } finally {
    loadingConsolidados.value = false
  }
}

/** Al cambiar consolidado: solo cargar clientes (cotizaciones). Los ítems se cargan al seleccionar cliente. */
async function onContenedorChange (payload?: SelectOption | unknown) {
  const raw = payload !== undefined && payload !== null ? payload : idContenedor.value
  const id = typeof raw === 'object' && raw !== null && 'value' in raw ? Number((raw as SelectOption)!.value) : Number(raw)
  selectedClienteId.value = null
  selectedItems.value = []
  items.value = []
  if (id == null || Number.isNaN(id)) {
    clientes.value = []
    return
  }
  loadingClientes.value = true
  try {
    const cotizacionesRes = await CotizacionService.getCotizaciones(id, {
      role: ROLES.COORDINACION,
      limit: 500,
      page: 1,
    } as any)
    const list = cotizacionesRes?.data ?? []
    clientes.value = Array.isArray(list) ? list.map((c: { id: number; nombre?: string }) => ({
      id: Number(c.id),
      nombre: c.nombre ?? '',
    })) : []
    rows.value = []
  } catch (e) {
    console.error(e)
    clientes.value = []
  } finally {
    loadingClientes.value = false
  }
}

/** Al seleccionar cliente: cargar solo los ítems de su cotización (solo id cotización). */
async function onClienteChange (payload?: SelectOption | unknown) {
  const raw = payload !== undefined && payload !== null ? payload : selectedClienteId.value
  const idCotizacion = typeof raw === 'object' && raw !== null && 'value' in raw ? (raw as SelectOption)!.value : Number(raw)
  selectedItems.value = []
  items.value = []
  rows.value = []
  if (idCotizacion == null || Number.isNaN(idCotizacion)) return
  loadingItems.value = true
  try {
    const res = await BoletinQuimicoService.getItemsByCotizacion(idCotizacion)
    items.value = res?.success ? (res.data ?? []) : []
  } catch (e) {
    console.error(e)
    items.value = []
  } finally {
    loadingItems.value = false
  }
}

/** Convierte un elemento del array de selección múltiple a id numérico. */
function selectedItemToId (v: SelectOption | number): number | null {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'value' in v) return v.value
  return null
}

/** Sincroniza filas con la selección múltiple de ítems: cada ítem seleccionado tiene una fila. */
function onSelectedItemsChange (payload?: Array<SelectOption | number>) {
  const raw = Array.isArray(payload) ? payload : []
  selectedItems.value = raw
  const ids = raw.map(selectedItemToId).filter((id): id is number => id != null)
  const idCliente = selectedClienteIdNum.value
  const c = idCliente != null ? clientes.value.find(x => x.id === idCliente) : null
  if (!c) return
  const existingByItemId = new Map(rows.value.map(r => [r.id_cotizacion_proveedor_item, r]))
  const newRows: typeof rows.value = []
  for (const idItem of ids) {
    const i = items.value.find(x => x.id === idItem)
    if (!i) continue
    const existing = existingByItemId.get(i.id)
    newRows.push({
      id_cotizacion: i.id_cotizacion,
      id_cotizacion_proveedor_item: i.id,
      clienteNombre: c.nombre,
      itemNombre: i.nombre,
      monto_boletin: existing ? existing.monto_boletin : 0
    })
  }
  rows.value = newRows
}

function removeRow (idx: number) {
  const row = rows.value[idx]
  if (!row) return
  const idItem = row.id_cotizacion_proveedor_item
  rows.value.splice(idx, 1)
  // Quitar también de la selección múltiple para que el select y las filas coincidan
  selectedItems.value = selectedItems.value.filter(v => selectedItemToId(v) !== idItem)
}

function idContenedorNum (): number | null {
  return selectValueToNum(idContenedor.value)
}

async function handleSave () {
  const idCont = idContenedorNum()
  if (idCont == null || rows.value.length === 0) return
  saving.value = true
  try {
    await BoletinQuimicoService.store({
      id_contenedor: idCont,
      items: rows.value.map(r => ({
        id_cotizacion: r.id_cotizacion,
        id_cotizacion_proveedor_item: r.id_cotizacion_proveedor_item,
        monto_boletin: Number(r.monto_boletin) || 0
      }))
    })
    props.onSaved?.()
    emit('saved')
    emit('close')
    props.onClose?.()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadContenedores()
})
</script>
