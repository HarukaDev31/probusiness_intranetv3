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

        <!-- Entidad * (catálogo desde nuevas tablas; crear abre modal) -->
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

        <!-- T. permiso * (catálogo desde nuevas tablas; crear abre modal) -->
        <UFormField label="Selecciona el T. permiso" required :error="errors.id_tipo_permiso">
          <div class="flex gap-2 items-center">
            <USelectMenu
              v-model="selectedTipoPermiso"
              :items="tipoPermisoOptions"
              value-attribute="value"
              placeholder="Seleccionar tipo de permiso"
              size="lg"
              class="flex-1"
              searchable
              searchable-placeholder="Buscar tipo..."
              :loading="loadingTiposPermiso"
              :disabled="readOnly"
              @update:model-value="onTipoPermisoChange"
            />
            <UButton
              v-if="!readOnly"
              icon="i-heroicons-plus"
              color="primary"
              variant="outline"
              size="lg"
              title="Crear tipo de permiso"
              @click="openCreateTipoPermisoModal = true"
            />
          </div>
        </UFormField>

        <!-- Derecho de trámite * (S/.) -->
        <UFormField label="Derecho de trámite (S/.)" required :error="errors.derecho_entidad">
          <UInput
            v-model="form.derecho_entidad"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            size="lg"
            class="w-full"
            :disabled="readOnly"
            @update:model-value="(v: string) => form.derecho_entidad = formatDecimalInput(v)"
          />
        </UFormField>

        <!-- Precio * (S/.) -->
        <UFormField label="Precio (S/.)" required :error="errors.precio">
          <UInput
            v-model="form.precio"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            size="lg"
            class="w-full"
            :disabled="readOnly"
            @update:model-value="(v: string) => form.precio = formatDecimalInput(v)"
          />
        </UFormField>

      

        <!-- Modales secundarios (como ActivityModal + CreateActivityNameModal) -->
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
import { TRAMITE_ESTADOS } from '~/types/basedatos/tramiteAduana'
import type { Entity } from '~/services/entityService'
import CreateEntidadModal from '~/components/basedatos/CreateEntidadModal.vue'
import CreateTipoPermisoModal from '~/components/basedatos/CreateTipoPermisoModal.vue'

interface Props {
  /** Cuando se usa con overlay puede omitirse (por defecto true). */
  open?: boolean
  tramite?: TramiteAduana | null
  /** Solo lectura (modo Ver): no se puede editar ni guardar. */
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
  /** Callback para cerrar (el overlay puede pasar función o array). */
  onClose?: (() => void) | (() => void)[]
  onCreateTipoPermiso?: (name: string, entidadId: number | null) => Promise<{ id: number; nombre_permiso: string } | null>
  /** Callback para uso con overlay (cuando cambia consolidado). */
  onConsolidadoChange?: (idConsolidado: number) => void
  /** Callback para uso con overlay (cuando se crea entidad). */
  onEntityCreated?: (entity: Entity | { id: number; nombre: string }) => void
  /** Si se proporciona, se usa para crear entidad en catálogo trámites (en lugar de CreateEntityButton). */
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
  // Eventos de transición del overlay (Radix/UI) para evitar warning de fragment root
  (e: 'after:leave'): void
}>()

const isEdit = computed(() => !!props.tramite?.id)

const form = ref({
  id_consolidado: null as number | null,
  id_cliente: null as number | null,
  id_cotizacion: null as number | null,
  id_entidad: null as number | null,
  id_tipo_permiso: null as number | null,
  derecho_entidad: '' as string,
  precio: '' as string,
  estado: null as TramiteEstado | null,
})

const errors = ref<Record<string, string>>({})
const selectedConsolidado = ref<{ label: string; value: number } | null>(null)
const selectedCliente = ref<{ label: string; value: number } | null>(null)
const selectedEntidad = ref<{ label: string; value: number } | null>(null)
const selectedTipoPermiso = ref<{ label: string; value: number } | null>(null)
const openCreateTipoPermisoModal = ref(false)
const savingTipoPermiso = ref(false)
const openCreateEntidadModal = ref(false)
const savingEntidad = ref(false)

// Controlar visibilidad con props.open para que el overlay pueda reabrir el modal (crear/ver/editar)
const modalOpen = ref(true)
watch(
  () => props.open,
  (v) => {
    modalOpen.value = v !== false
  },
  { immediate: true }
)

// Sincronizar formulario con props al abrir el modal (permite abrir primero y cargar datos después)
watch(
  () => [props.open, props.tramite],
  () => {
    if (props.open) initializeForm()
  },
  { immediate: true }
)

// Cuando llegan las opciones por patch (editar), actualizar selected* desde las opciones para que los selects muestren la opción correcta
watch(
  () => [
    props.consolidadoOptions,
    props.clienteOptions,
    props.entidadOptions,
    props.tipoPermisoOptions,
  ],
  () => {
    if (!props.tramite) return
    if (props.consolidadoOptions?.length && form.value.id_consolidado != null) {
      const opt = props.consolidadoOptions.find((o: { value: number }) => o.value === form.value.id_consolidado)
      if (opt) selectedConsolidado.value = opt
    }
    if (props.clienteOptions?.length && form.value.id_cliente != null) {
      const opt = props.clienteOptions.find((o: { value: number }) => o.value === form.value.id_cliente)
      if (opt) selectedCliente.value = opt
    }
    if (props.entidadOptions?.length && form.value.id_entidad != null) {
      const opt = props.entidadOptions.find((o: { value: number }) => o.value === form.value.id_entidad)
      if (opt) selectedEntidad.value = opt
    }
    if (props.tipoPermisoOptions?.length && form.value.id_tipo_permiso != null) {
      const opt = props.tipoPermisoOptions.find((o: { value: number }) => o.value === form.value.id_tipo_permiso)
      if (opt) selectedTipoPermiso.value = opt
    }
  },
  { deep: true }
)

function formatDecimalInput(v: string): string {
  const n = parseFloat(String(v).replace(',', '.'))
  if (Number.isNaN(n)) return ''
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
  // Si el backend requiere id_cotizacion a partir del cliente en el consolidado, se puede asignar aquí cuando el API lo devuelva
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

function onTipoPermisoChange(p: { value: number } | number | null) {
  if (p == null) {
    form.value.id_tipo_permiso = null
    selectedTipoPermiso.value = null
    return
  }
  const id = typeof p === 'object' && 'value' in p ? p.value : p
  form.value.id_tipo_permiso = id
}

function onEntityCreated(entity: Entity | { id: number; nombre: string }) {
  form.value.id_entidad = entity.id
  selectedEntidad.value = { label: entity.nombre, value: entity.id }
  emit('entity-created', entity)
  props.onEntityCreated?.(entity)
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

const canSave = computed(() => {
  return (
    form.value.id_consolidado != null &&
    form.value.id_entidad != null &&
    form.value.id_tipo_permiso != null &&
    form.value.derecho_entidad !== '' &&
    Number(form.value.derecho_entidad) >= 0 &&
    form.value.precio !== '' &&
    Number(form.value.precio) >= 0
  )
})

function validate(): boolean {
  errors.value = {}
  if (form.value.id_consolidado == null) errors.value.id_consolidado = 'Selecciona el consolidado'
  if (form.value.id_cliente == null && !isEdit.value) errors.value.id_cliente = 'Selecciona el cliente'
  if (form.value.id_entidad == null) errors.value.id_entidad = 'Selecciona la entidad'
  if (form.value.id_tipo_permiso == null) errors.value.id_tipo_permiso = 'Selecciona el tipo de permiso'
  const der = parseFloat(String(form.value.derecho_entidad))
  if (Number.isNaN(der) || der < 0) errors.value.derecho_entidad = 'Ingresa el derecho de trámite (S/.)'
  const pr = parseFloat(String(form.value.precio))
  if (Number.isNaN(pr) || pr < 0) errors.value.precio = 'Ingresa el precio (S/.)'
  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validate()) return
  const payload: CreateTramiteAduanaRequest = {
    id_consolidado: form.value.id_consolidado!,
    id_cliente: form.value.id_cliente ?? undefined,
    id_cotizacion: form.value.id_cotizacion ?? undefined,
    id_entidad: form.value.id_entidad!,
    id_tipo_permiso: form.value.id_tipo_permiso!,
    derecho_entidad: parseFloat(String(form.value.derecho_entidad)),
    precio: parseFloat(String(form.value.precio)),
    ...(form.value.estado != null ? { estado: form.value.estado } : {}),
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

async function handleCreateTipoPermiso(name: string) {
  if (!name.trim() || !props.onCreateTipoPermiso) return
  savingTipoPermiso.value = true
  try {
    const created = await props.onCreateTipoPermiso(name.trim(), form.value.id_entidad)
    if (created) {
      form.value.id_tipo_permiso = created.id
      selectedTipoPermiso.value = { label: created.nombre_permiso, value: created.id }
      openCreateTipoPermisoModal.value = false
    }
  } catch {
    // El padre muestra el error
  } finally {
    savingTipoPermiso.value = false
  }
}

function handleClose() {
  modalOpen.value = false
  errors.value = {}
  openCreateTipoPermisoModal.value = false
  openCreateEntidadModal.value = false
  emit('close')
  const fn = Array.isArray(props.onClose) ? props.onClose[0] : props.onClose
  if (typeof fn === 'function') {
    fn()
  }
}

function initializeForm() {
  errors.value = {}
  if (props.tramite) {
    form.value.id_consolidado = props.tramite.id_consolidado
    form.value.id_cliente = props.tramite.id_cliente ?? null
    form.value.id_cotizacion = props.tramite.id_cotizacion ?? null
    form.value.id_entidad = props.tramite.id_entidad
    form.value.id_tipo_permiso = props.tramite.id_tipo_permiso
    form.value.derecho_entidad = String(props.tramite.derecho_entidad ?? '')
    form.value.precio = String(props.tramite.precio ?? '')
    form.value.estado = props.tramite.estado ?? null
    const consolidadoOpt = props.consolidadoOptions?.find((o: { value: number }) => o.value === props.tramite!.id_consolidado)
    selectedConsolidado.value = consolidadoOpt ?? (props.tramite
      ? { label: `#${props.tramite.id_consolidado}`, value: props.tramite.id_consolidado }
      : null)
    selectedCliente.value = props.tramite.cliente
      ? { label: props.tramite.cliente.nombre || `#${props.tramite.cliente.id}`, value: props.tramite.cliente.id }
      : null
    selectedEntidad.value = props.tramite.entidad
      ? { label: props.tramite.entidad.nombre, value: props.tramite.entidad.id }
      : null
    selectedTipoPermiso.value = props.tramite.tipo_permiso
      ? { label: props.tramite.tipo_permiso.nombre_permiso, value: props.tramite.tipo_permiso.id }
      : null
  } else {
    form.value = {
      id_consolidado: null,
      id_cliente: null,
      id_cotizacion: null,
      id_entidad: null,
      id_tipo_permiso: null,
      derecho_entidad: '',
      precio: '',
      estado: 'PENDIENTE',
    }
    selectedConsolidado.value = null
    selectedCliente.value = null
    selectedEntidad.value = null
    selectedTipoPermiso.value = null
  }
}


</script>
