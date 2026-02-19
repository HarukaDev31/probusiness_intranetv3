<template>
  <div>
  <UModal
    :open="modalOpen"
    :close="{ onClick: handleClose }"
    :dismissible="!loading"
    @update:open="(v: boolean) => { if (v === false) handleClose() }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ readOnly ? 'Ver permiso' : (isEdit ? 'Editar permiso' : 'Crear trámite') }}
          </h3>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p v-if="!isEdit" class="text-sm text-gray-500 dark:text-gray-400">
          Creando permiso:
        </p>

        <!-- Consolidado * -->
        <UFormField label="Selecciona el consolidado" required :error="errors.id_consolidado">
          <USelectMenu
            v-model="selectedConsolidado"
            :items="consolidadoOptions"
            value-attribute="value"
            placeholder="Seleccionar consolidado"
            size="lg"
            class="w-full"
            searchable
            searchable-placeholder="Buscar consolidado..."
            :loading="loadingConsolidados"
            :disabled="readOnly"
            @update:model-value="onConsolidadoChange"
          />
        </UFormField>

        <!-- Cliente * (del consolidado) -->
        <UFormField label="Selecciona el cliente" required :error="errors.id_cliente">
          <USelectMenu
            v-model="selectedCliente"
            :items="clienteOptions"
            value-attribute="value"
            placeholder="Seleccionar cliente"
            size="lg"
            class="w-full"
            searchable
            searchable-placeholder="Buscar cliente..."
            :loading="loadingClientes"
            :disabled="readOnly || !form.id_consolidado"
            @update:model-value="onClienteChange"
          />
        </UFormField>

        <!-- Entidad * -->
        <UFormField label="Selecciona la entidad" required :error="errors.id_entidad">
          <div class="flex gap-2 items-center">
            <USelectMenu
              v-model="selectedEntidad"
              :items="entidadOptions"
              value-attribute="value"
              placeholder="Seleccionar entidad"
              size="lg"
              class="flex-1"
              searchable
              searchable-placeholder="Buscar entidad..."
              :loading="loadingEntidades"
              :disabled="readOnly"
              @update:model-value="onEntidadChange"
            />
            <UButton
              v-if="!readOnly && props.onCreateEntidad"
              icon="i-heroicons-plus"
              color="primary"
              variant="outline"
              size="lg"
              title="Nueva entidad"
              @click="openCreateEntidadModal = true"
            />
          </div>
        </UFormField>

        <!-- Labels encabezado de filas (solo visible cuando hay filas) -->
        <div v-if="tiposPermisoRows.length > 0" class="grid gap-2" style="grid-template-columns: 1fr 9rem 2rem">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">T. Permiso <span class="text-red-500">*</span></span>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Derecho (S/.) <span class="text-red-500">*</span></span>
          <span />
        </div>

        <!-- Filas dinámicas: T. Permiso + Derecho de trámite -->
        <div class="space-y-2">
          <div
            v-for="(row, i) in tiposPermisoRows"
            :key="i"
            class="grid gap-2 items-start"
            style="grid-template-columns: 1fr 9rem 2rem"
          >
            <!-- T. Permiso -->
            <div>
              <div class="flex gap-1 items-center">
                <USelectMenu
                  v-model="row.selectedOption"
                  :items="tipoPermisoOptions"
                  value-attribute="value"
                  placeholder="Seleccionar tipo..."
                  size="lg"
                  class="flex-1"
                  searchable
                  searchable-placeholder="Buscar tipo..."
                  :loading="loadingTiposPermiso"
                  :disabled="readOnly"
                  @update:model-value="(p: any) => onTipoPermisoRowChange(i, p)"
                />
                <UButton
                  v-if="!readOnly"
                  icon="i-heroicons-plus"
                  color="primary"
                  variant="outline"
                  size="lg"
                  title="Crear tipo de permiso"
                  @click="openCreateTipoPermisoForRow(i)"
                />
              </div>
              <p v-if="rowErrors[i]?.id_tipo_permiso" class="text-xs text-red-500 mt-1">
                {{ rowErrors[i].id_tipo_permiso }}
              </p>
            </div>

            <!-- Derecho de trámite -->
            <div>
              <UInput
                v-model="row.derecho_entidad"
                type="text"
                inputmode="decimal"
                placeholder="0.00"
                size="lg"
                class="w-full"
                :disabled="readOnly"
                @blur="row.derecho_entidad = formatDecimalOnBlur(row.derecho_entidad)"
              />
              <p v-if="rowErrors[i]?.derecho_entidad" class="text-xs text-red-500 mt-1">
                {{ rowErrors[i].derecho_entidad }}
              </p>
            </div>

            <!-- Botón eliminar fila -->
            <div class="flex items-center justify-center pt-1">
              <UButton
                v-if="!readOnly && tiposPermisoRows.length > 1"
                icon="i-heroicons-x-mark"
                color="error"
                variant="ghost"
                size="sm"
                title="Eliminar fila"
                @click="removeRow(i)"
              />
            </div>
          </div>
        </div>

        <!-- Botón agregar fila -->
        <UButton
          v-if="!readOnly"
          label="Agregar tipo de permiso"
          icon="i-heroicons-plus"
          variant="soft"
          color="primary"
          size="sm"
          @click="addRow"
        />

        <!-- Tramitador (S/.) — compartido por permiso, decimal 10,2 -->
        <UFormField label="Tramitador (S/.)" :error="errors.tramitador">
          <UInput
            v-model="form.tramitador"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            size="lg"
            class="w-full"
            :disabled="readOnly"
            @blur="form.tramitador = formatDecimalOnBlur(form.tramitador)"
          />
        </UFormField>

        <!-- Precio * (S/.) — campo compartido -->
        <UFormField label="Precio (S/.)" required :error="errors.precio">
          <UInput
            v-model="form.precio"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            size="lg"
            class="w-full"
            :disabled="readOnly"
            @blur="form.precio = formatDecimalOnBlur(form.precio)"
          />
        </UFormField>

        <!-- Modales secundarios -->
        <CreateEntidadModal
          :open="openCreateEntidadModal"
          :loading="savingEntidad"
          @close="openCreateEntidadModal = false"
          @create="handleCreateEntidad"
        />
        <CreateTipoPermisoModal
          :open="openCreateTipoPermisoModal"
          :loading="savingTipoPermiso"
          @close="openCreateTipoPermisoModal = false"
          @create="handleCreateTipoPermiso"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton :label="readOnly ? 'Cerrar' : 'Cancelar'" variant="ghost" :disabled="loading" @click="handleClose" />
        <UButton
          v-if="!readOnly"
          :label="isEdit ? 'Guardar cambios' : 'Guardar'"
          color="primary"
          :loading="loading"
          :disabled="!canSave"
          @click="submit"
        />
      </div>
    </template>

  </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TramiteAduana, CreateTramiteAduanaRequest, TramiteEstado } from '~/types/basedatos/tramiteAduana'
import type { Entity } from '~/services/entityService'
import CreateEntidadModal from '~/components/basedatos/CreateEntidadModal.vue'
import CreateTipoPermisoModal from '~/components/basedatos/CreateTipoPermisoModal.vue'

interface TipoPermisoRow {
  id_tipo_permiso: number | null
  selectedOption: { label: string; value: number } | null
  derecho_entidad: string
}

interface Props {
  open?: boolean
  tramite?: TramiteAduana | null
  readOnly?: boolean
  loading?: boolean
  consolidadoOptions: { label: string; value: number }[]
  clienteOptions: { label: string; value: number }[]
  entidadOptions: { label: string; value: number }[]
  tipoPermisoOptions: { label: string; value: number }[]
  loadingConsolidados?: boolean
  loadingClientes?: boolean
  loadingEntidades?: boolean
  loadingTiposPermiso?: boolean
  onSave?: (payload: CreateTramiteAduanaRequest) => void | Promise<void>
  onClose?: (() => void) | (() => void)[]
  onCreateTipoPermiso?: (name: string, entidadId: number | null) => Promise<{ id: number; nombre_permiso: string } | null>
  onConsolidadoChange?: (idConsolidado: number) => void
  onEntityCreated?: (entity: Entity | { id: number; nombre: string }) => void
  onCreateEntidad?: (nombre: string) => Promise<{ id: number; nombre: string } | null>
}

const props = withDefaults(defineProps<Props>(), {
  open: true,
  tramite: null,
  readOnly: false,
  loading: false,
  loadingConsolidados: false,
  loadingClientes: false,
  loadingEntidades: false,
  loadingTiposPermiso: false,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: CreateTramiteAduanaRequest): void
  (e: 'entity-created', entity: Entity | { id: number; nombre: string }): void
  (e: 'consolidado-change', idConsolidado: number): void
  (e: 'after:leave'): void
}>()

const isEdit = computed(() => !!props.tramite?.id)

const form = ref({
  id_consolidado: null as number | null,
  id_cliente: null as number | null,
  id_cotizacion: null as number | null,
  id_entidad: null as number | null,
  precio: '' as string,
  estado: null as TramiteEstado | null,
  tramitador: '' as string, // decimal 10,2, se envía como número
})

function emptyRow(): TipoPermisoRow {
  return { id_tipo_permiso: null, selectedOption: null, derecho_entidad: '' }
}

const tiposPermisoRows = ref<TipoPermisoRow[]>([emptyRow()])
const errors = ref<Record<string, string>>({})
const rowErrors = ref<Array<{ id_tipo_permiso?: string; derecho_entidad?: string }>>([{}])

const selectedConsolidado = ref<{ label: string; value: number } | null>(null)
const selectedCliente = ref<{ label: string; value: number } | null>(null)
const selectedEntidad = ref<{ label: string; value: number } | null>(null)

const openCreateTipoPermisoModal = ref(false)
const savingTipoPermiso = ref(false)
const activeRowIndex = ref(0)
const openCreateEntidadModal = ref(false)
const savingEntidad = ref(false)

const modalOpen = ref(true)
watch(
  () => props.open,
  (v) => { modalOpen.value = v !== false },
  { immediate: true }
)

watch(
  () => [props.open, props.tramite],
  () => { if (props.open) initializeForm() },
  { immediate: true }
)

watch(
  () => [props.consolidadoOptions, props.clienteOptions, props.entidadOptions, props.tipoPermisoOptions],
  () => {
    if (!props.tramite) return
    if (props.consolidadoOptions?.length && form.value.id_consolidado != null) {
      const opt = props.consolidadoOptions.find(o => o.value === form.value.id_consolidado)
      if (opt) selectedConsolidado.value = opt
    }
    if (props.clienteOptions?.length && form.value.id_cliente != null) {
      const opt = props.clienteOptions.find(o => o.value === form.value.id_cliente)
      if (opt) selectedCliente.value = opt
    }
    if (props.entidadOptions?.length && form.value.id_entidad != null) {
      const opt = props.entidadOptions.find(o => o.value === form.value.id_entidad)
      if (opt) selectedEntidad.value = opt
    }
    if (props.tipoPermisoOptions?.length) {
      tiposPermisoRows.value.forEach(row => {
        if (row.id_tipo_permiso != null && !row.selectedOption) {
          const opt = props.tipoPermisoOptions.find(o => o.value === row.id_tipo_permiso)
          if (opt) row.selectedOption = opt
        }
      })
    }
  },
  { deep: true }
)

function addRow() {
  tiposPermisoRows.value.push(emptyRow())
  rowErrors.value.push({})
}

function removeRow(index: number) {
  tiposPermisoRows.value.splice(index, 1)
  rowErrors.value.splice(index, 1)
}

function openCreateTipoPermisoForRow(index: number) {
  activeRowIndex.value = index
  openCreateTipoPermisoModal.value = true
}

function formatDecimalOnBlur(v: string): string {
  const s = String(v).trim().replace(',', '.')
  if (s === '') return ''
  const n = parseFloat(s)
  if (Number.isNaN(n) || n < 0) return ''
  return n.toFixed(2)
}

function onConsolidadoChange(p: { value: number } | number | null) {
  if (p == null) {
    form.value.id_consolidado = null
    selectedConsolidado.value = null
    form.value.id_cliente = null
    form.value.id_cotizacion = null
    selectedCliente.value = null
    return
  }
  const id = typeof p === 'object' && 'value' in p ? p.value : p
  form.value.id_consolidado = id
  form.value.id_cliente = null
  form.value.id_cotizacion = null
  selectedCliente.value = null
  emit('consolidado-change', id)
  props.onConsolidadoChange?.(id)
}

function onClienteChange(p: { value: number } | number | null) {
  if (p == null) {
    form.value.id_cliente = null
    form.value.id_cotizacion = null
    selectedCliente.value = null
    return
  }
  const id = typeof p === 'object' && 'value' in p ? p.value : p
  form.value.id_cliente = id
  form.value.id_cotizacion = null
}

function onEntidadChange(p: { value: number } | number | null) {
  if (p == null) {
    form.value.id_entidad = null
    selectedEntidad.value = null
    return
  }
  const id = typeof p === 'object' && 'value' in p ? p.value : p
  form.value.id_entidad = id
}

function onTipoPermisoRowChange(index: number, p: { value: number } | number | null) {
  if (p == null) {
    tiposPermisoRows.value[index].id_tipo_permiso = null
    tiposPermisoRows.value[index].selectedOption = null
    return
  }
  const id = typeof p === 'object' && 'value' in p ? p.value : p
  tiposPermisoRows.value[index].id_tipo_permiso = id
  const opt = props.tipoPermisoOptions.find(o => o.value === id)
  if (opt) tiposPermisoRows.value[index].selectedOption = opt
}

const canSave = computed(() => {
  if (form.value.id_consolidado == null) return false
  if (form.value.id_entidad == null) return false
  if (tiposPermisoRows.value.length === 0) return false
  const allRowsValid = tiposPermisoRows.value.every(row =>
    row.id_tipo_permiso != null &&
    row.derecho_entidad !== '' &&
    Number(row.derecho_entidad) >= 0
  )
  if (!allRowsValid) return false
  const pr = parseFloat(String(form.value.precio))
  return !Number.isNaN(pr) && pr >= 0
})

function validate(): boolean {
  errors.value = {}
  rowErrors.value = tiposPermisoRows.value.map(() => ({}))

  if (form.value.id_consolidado == null) errors.value.id_consolidado = 'Selecciona el consolidado'
  if (form.value.id_cliente == null && !isEdit.value) errors.value.id_cliente = 'Selecciona el cliente'
  if (form.value.id_entidad == null) errors.value.id_entidad = 'Selecciona la entidad'

  if (tiposPermisoRows.value.length === 0) {
    errors.value.tipos_permiso = 'Agrega al menos un tipo de permiso'
  } else {
    tiposPermisoRows.value.forEach((row, i) => {
      if (row.id_tipo_permiso == null) rowErrors.value[i].id_tipo_permiso = 'Selecciona el tipo'
      const der = parseFloat(String(row.derecho_entidad))
      if (Number.isNaN(der) || der < 0) rowErrors.value[i].derecho_entidad = 'Ingresa el derecho (S/.)'
    })
  }

  const pr = parseFloat(String(form.value.precio))
  if (Number.isNaN(pr) || pr < 0) errors.value.precio = 'Ingresa el precio (S/.)'

  const hasRowErrors = rowErrors.value.some(re => Object.keys(re).length > 0)
  return Object.keys(errors.value).length === 0 && !hasRowErrors
}

async function submit() {
  if (!validate()) return
  const payload: CreateTramiteAduanaRequest = {
    id_consolidado: form.value.id_consolidado!,
    id_cliente: undefined,
    id_cotizacion: form.value.id_cliente ?? form.value.id_cotizacion ?? undefined,
    id_entidad: form.value.id_entidad!,
    tipos_permiso: tiposPermisoRows.value.map(row => ({
      id_tipo_permiso: row.id_tipo_permiso!,
      derecho_entidad: parseFloat(String(row.derecho_entidad)),
    })),
    precio: parseFloat(String(form.value.precio)),
    ...(form.value.estado != null ? { estado: form.value.estado } : {}),
    ...(form.value.tramitador !== '' ? { tramitador: (() => { const n = parseFloat(String(form.value.tramitador).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : null; })() } : { tramitador: null }),
  }
  try {
    if (props.onSave) {
      await props.onSave(payload)
    } else {
      emit('save', payload)
    }
    handleClose()
  } catch {
    // Parent shows error
  }
}

async function handleCreateEntidad(name: string) {
  if (!props.onCreateEntidad || !name.trim()) return
  savingEntidad.value = true
  try {
    const created = await props.onCreateEntidad(name.trim())
    if (created) {
      form.value.id_entidad = created.id
      selectedEntidad.value = { label: created.nombre, value: created.id }
      emit('entity-created', created)
      props.onEntityCreated?.(created)
      openCreateEntidadModal.value = false
    }
  } finally {
    savingEntidad.value = false
  }
}

async function handleCreateTipoPermiso(name: string) {
  if (!name.trim() || !props.onCreateTipoPermiso) return
  savingTipoPermiso.value = true
  try {
    const created = await props.onCreateTipoPermiso(name.trim(), form.value.id_entidad)
    if (created) {
      const idx = activeRowIndex.value
      if (tiposPermisoRows.value[idx]) {
        tiposPermisoRows.value[idx].id_tipo_permiso = created.id
        tiposPermisoRows.value[idx].selectedOption = { label: created.nombre_permiso, value: created.id }
      }
      openCreateTipoPermisoModal.value = false
    }
  } catch {
    // Parent shows error
  } finally {
    savingTipoPermiso.value = false
  }
}

function handleClose() {
  modalOpen.value = false
  errors.value = {}
  rowErrors.value = [{}]
  openCreateTipoPermisoModal.value = false
  openCreateEntidadModal.value = false
  emit('close')
  const fn = Array.isArray(props.onClose) ? props.onClose[0] : props.onClose
  if (typeof fn === 'function') fn()
}

function initializeForm() {
  errors.value = {}
  if (props.tramite) {
    form.value.id_consolidado = props.tramite.id_consolidado
    form.value.id_cliente = props.tramite.id_cliente ?? null
    form.value.id_cotizacion = props.tramite.id_cotizacion ?? null
    form.value.id_entidad = props.tramite.id_entidad
    form.value.precio = String(props.tramite.precio ?? '')
    form.value.estado = props.tramite.estado ?? null
    form.value.tramitador = props.tramite.tramitador != null ? String(props.tramite.tramitador) : ''

    const tiposExistentes = props.tramite.tipos_permiso ?? []
    if (tiposExistentes.length > 0) {
      tiposPermisoRows.value = tiposExistentes.map(tp => ({
        id_tipo_permiso: tp.id,
        selectedOption: { label: tp.nombre_permiso, value: tp.id },
        derecho_entidad: String(tp.derecho_entidad ?? ''),
      }))
    } else {
      tiposPermisoRows.value = [emptyRow()]
    }
    rowErrors.value = tiposPermisoRows.value.map(() => ({}))

    const consolidadoOpt = props.consolidadoOptions?.find(o => o.value === props.tramite!.id_consolidado)
    selectedConsolidado.value = consolidadoOpt ?? { label: `#${props.tramite.id_consolidado}`, value: props.tramite.id_consolidado }
    selectedCliente.value = props.tramite.cliente
      ? { label: props.tramite.cliente.nombre || `#${props.tramite.cliente.id}`, value: props.tramite.cliente.id }
      : null
    selectedEntidad.value = props.tramite.entidad
      ? { label: props.tramite.entidad.nombre, value: props.tramite.entidad.id }
      : null
  } else {
    form.value = {
      id_consolidado: null,
      id_cliente: null,
      id_cotizacion: null,
      id_entidad: null,
      precio: '',
      estado: null,
      tramitador: '',
    }
    tiposPermisoRows.value = [emptyRow()]
    rowErrors.value = [{}]
    selectedConsolidado.value = null
    selectedCliente.value = null
    selectedEntidad.value = null
  }
}
</script>
