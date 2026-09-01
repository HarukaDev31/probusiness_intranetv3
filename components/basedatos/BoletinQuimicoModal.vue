<template>
  <UModal :model-value="true" @update:model-value="emit('close')" class="sm:max-w-2xl">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ embedded ? 'Detalle Boletín Químico (BQ)' : 'Nuevo Boletín Químico' }}
      </h3>
      <p v-if="embedded && clienteNombre" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Cliente: {{ clienteNombre }}
      </p>
    </template>
    <template #body>
      <div class="space-y-4">
        <template v-if="!embedded">
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
          </template>
        </template>

        <template v-if="embedded || selectedClienteId != null">
          <UFormField :label="embedded ? 'Items de la cotización' : 'Items (de la cotización del cliente)'">
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
                <th v-if="!embedded" class="text-left p-2">Cliente</th>
                <th class="text-left p-2">Item</th>
                <th class="text-left p-2 w-32">Monto (S/)</th>
                <th class="w-10" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in rows" :key="idx" class="border-t dark:border-gray-700">
                <td v-if="!embedded" class="p-2">{{ r.clienteNombre }}</td>
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
                      :disabled="r.hasPagos"
                    />
                  </div>
                </td>
                <td class="p-2">
                  <UButton
                    v-if="!r.hasPagos"
                    icon="i-heroicons-trash"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click="removeRow(idx)"
                  />
                </td>
              </tr>
            </tbody>
            <tfoot v-if="embedded" class="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
              <tr>
                <td class="p-2 font-medium">Total BQ (cargos extra)</td>
                <td class="p-2 font-semibold">S/ {{ totalMonto.toFixed(2) }}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
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
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{
  onSaved?: () => void
  onClose?: () => void
  /** Desde cargos extra: oculta consolidado/cliente y sincroniza línea BQ */
  embedded?: boolean
  idContenedor?: number
  idCotizacion?: number
  clienteNombre?: string
}>()

const emit = defineEmits<{ saved: []; close: [] }>()
const { showError, showSuccess } = useModal()

const embedded = computed(() => Boolean(props.embedded && props.idContenedor && props.idCotizacion))
const clienteNombre = computed(() => props.clienteNombre || '')

type SelectOption = { label: string; value: number } | null
const idContenedor = ref<SelectOption>(null)
const contenedores = ref<Array<{ id: number; carga: string }>>([])
const clientes = ref<Array<{ id: number; nombre: string }>>([])
const items = ref<Array<{ id: number; id_cotizacion: number; nombre: string }>>([])
const selectedClienteId = ref<SelectOption>(null)
const selectedItems = ref<Array<SelectOption | number>>([])
const rows = ref<Array<{
  id_cotizacion: number
  id_cotizacion_proveedor_item: number | null
  clienteNombre: string
  itemNombre: string
  monto_boletin: number
  hasPagos: boolean
}>>([])
const saving = ref(false)
const loadingConsolidados = ref(false)
const loadingClientes = ref(false)
const loadingItems = ref(false)

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
const totalMonto = computed(() =>
  rows.value.reduce((acc, r) => acc + (Number(r.monto_boletin) || 0), 0)
)

function selectValueToNum (v: SelectOption | number | null): number | null {
  if (v == null) return null
  if (typeof v === 'object' && 'value' in v) return v.value
  if (typeof v === 'number') return v
  return null
}
const selectedClienteIdNum = computed(() => selectValueToNum(selectedClienteId.value))

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

async function loadItemsForCotizacion (idCotizacion: number) {
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

async function loadEmbeddedData () {
  if (!embedded.value || !props.idCotizacion) return
  await loadItemsForCotizacion(props.idCotizacion)
  try {
    const res = await BoletinQuimicoService.getRegistrosByCotizacion(props.idCotizacion)
    const registros = res?.success ? (res.data ?? []) : []
    if (registros.length > 0) {
      selectedItems.value = registros
        .map(r => r.id_cotizacion_proveedor_item)
        .filter((id): id is number => id != null)
      rows.value = registros.map(r => ({
        id_cotizacion: r.id_cotizacion,
        id_cotizacion_proveedor_item: r.id_cotizacion_proveedor_item,
        clienteNombre: props.clienteNombre || '',
        itemNombre: r.item_nombre,
        monto_boletin: r.monto_boletin,
        hasPagos: r.has_pagos,
      }))
    }
  } catch (e) {
    console.error(e)
  }
}

async function onClienteChange (payload?: SelectOption | unknown) {
  const raw = payload !== undefined && payload !== null ? payload : selectedClienteId.value
  const idCotizacion = typeof raw === 'object' && raw !== null && 'value' in raw ? (raw as SelectOption)!.value : Number(raw)
  selectedItems.value = []
  items.value = []
  rows.value = []
  if (idCotizacion == null || Number.isNaN(idCotizacion)) return
  await loadItemsForCotizacion(idCotizacion)
}

function selectedItemToId (v: SelectOption | number): number | null {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'value' in v) return v.value
  return null
}

function onSelectedItemsChange (payload?: Array<SelectOption | number>) {
  const raw = Array.isArray(payload) ? payload : []
  selectedItems.value = raw
  const ids = raw.map(selectedItemToId).filter((id): id is number => id != null)
  const idCliente = embedded.value ? props.idCotizacion : selectedClienteIdNum.value
  const c = embedded.value
    ? { id: props.idCotizacion, nombre: props.clienteNombre || '' }
    : (idCliente != null ? clientes.value.find(x => x.id === idCliente) : null)
  if (!c) return
  const existingByItemId = new Map(rows.value.map(r => [r.id_cotizacion_proveedor_item, r]))
  const newRows: typeof rows.value = []
  for (const idItem of ids) {
    const i = items.value.find(x => x.id === idItem)
    if (!i) continue
    const existing = existingByItemId.get(i.id)
    newRows.push({
      id_cotizacion: embedded.value ? (props.idCotizacion as number) : i.id_cotizacion,
      id_cotizacion_proveedor_item: i.id,
      clienteNombre: embedded.value ? (props.clienteNombre || '') : (c as { nombre: string }).nombre,
      itemNombre: i.nombre,
      monto_boletin: existing ? existing.monto_boletin : 0,
      hasPagos: existing?.hasPagos ?? false,
    })
  }
  rows.value = newRows
}

function removeRow (idx: number) {
  const row = rows.value[idx]
  if (!row || row.hasPagos) return
  const idItem = row.id_cotizacion_proveedor_item
  rows.value.splice(idx, 1)
  selectedItems.value = selectedItems.value.filter(v => selectedItemToId(v) !== idItem)
}

function idContenedorNum (): number | null {
  if (embedded.value && props.idContenedor) return props.idContenedor
  return selectValueToNum(idContenedor.value)
}

async function handleSave () {
  const idCont = idContenedorNum()
  if (idCont == null || rows.value.length === 0) return
  saving.value = true
  try {
    const res = await BoletinQuimicoService.store({
      id_contenedor: idCont,
      items: rows.value.map(r => ({
        id_cotizacion: r.id_cotizacion,
        id_cotizacion_proveedor_item: r.id_cotizacion_proveedor_item,
        monto_boletin: Number(r.monto_boletin) || 0,
      })),
      replace_cotizacion_items: embedded.value,
      sync_cargos_extra_bq: embedded.value,
    })
    if (!res?.success) {
      showError('Error', (res as any)?.message || 'No se pudo guardar')
      return
    }
    showSuccess('Guardado', embedded.value ? 'BQ vinculado a cargos extra' : 'Boletín químico guardado')
    props.onSaved?.()
    emit('saved')
    emit('close')
    props.onClose?.()
  } catch (e: any) {
    console.error(e)
    showError('Error', e?.message || 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (embedded.value) {
    await loadEmbeddedData()
    return
  }
  await loadContenedores()
})
</script>
