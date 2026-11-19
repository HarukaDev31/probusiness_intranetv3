<template>
  <div class="p-6 space-y-5">
    <PageHeader
      title="Orden del menú (sidebar)"
      icon="i-heroicons-bars-arrow-down"
      subtitle="Arrastra para definir el orden al login. El orden por usuario pisa el del cargo."
    />

    <UCard>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormField v-if="puedeElegirOrganizacion" label="Organización" class="min-w-48">
          <USelect
            v-model="selectedOrgId"
            :items="opciones.organizaciones"
            class="w-full"
            @update:model-value="onOrgChange"
          />
        </UFormField>

        <UFormField label="Ámbito" class="min-w-72">
          <UTabs
            v-model="ambito"
            :items="ambitoTabs"
            color="neutral"
            variant="pill"
            size="sm"
            class="w-full"
            @update:model-value="onAmbitoChange"
          />
        </UFormField>

        <UFormField v-if="ambito === 'grupo'" label="Cargo" class="min-w-64 flex-1">
          <USelect
            v-model="selectedGrupoId"
            :items="opciones.grupos"
            placeholder="Seleccionar cargo"
            class="w-full"
            @update:model-value="loadItems"
          />
        </UFormField>

        <UFormField v-else label="Usuario" class="min-w-72 flex-1">
          <USelect
            v-model="selectedUsuarioId"
            :items="opciones.usuarios"
            placeholder="Seleccionar usuario"
            class="w-full"
            @update:model-value="loadItems"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard v-if="items.length > 0">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          <template v-if="ambito === 'grupo'">
            Orden del cargo. Afecta a todos los usuarios de ese rol (salvo override de usuario).
          </template>
          <template v-else>
            Orden solo de este usuario.
            <UBadge v-if="tieneOverride" color="warning" variant="soft" class="ml-2">Override activo</UBadge>
            <UBadge v-else color="neutral" variant="soft" class="ml-2">Sin override (usa el del cargo)</UBadge>
          </template>
        </p>
        <div class="flex gap-2">
          <UButton
            v-if="ambito === 'usuario' && tieneOverride"
            color="neutral"
            variant="outline"
            :loading="saving"
            @click="limpiarOverride"
          >
            Quitar override
          </UButton>
          <UButton color="primary" :loading="saving" icon="i-heroicons-check" @click="guardar">
            Guardar orden
          </UButton>
        </div>
      </div>

      <draggable
        v-model="items"
        item-key="id"
        handle=".drag-handle"
        class="space-y-2"
        :animation="180"
      >
        <template #item="{ element }">
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div class="flex items-center gap-2 px-3 py-2">
              <UButton
                class="drag-handle cursor-grab"
                icon="i-heroicons-bars-3"
                color="neutral"
                variant="ghost"
                size="sm"
                title="Arrastrar"
              />
              <UBadge color="neutral" variant="subtle" size="sm">{{ element.orden }}</UBadge>
              <span class="font-medium text-sm flex-1">{{ element.nombre }}</span>
              <span v-if="element.ruta" class="text-xs text-gray-400 truncate max-w-48">{{ element.ruta }}</span>
            </div>
            <draggable
              v-if="element.children.length > 0"
              v-model="element.children"
              item-key="id"
              handle=".drag-handle-child"
              class="border-t border-gray-100 dark:border-gray-800 pl-8 pr-2 py-1 space-y-1"
              :animation="180"
            >
              <template #item="{ element: child }">
                <div class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <UButton
                    class="drag-handle-child cursor-grab"
                    icon="i-heroicons-bars-3"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    title="Arrastrar"
                  />
                  <UBadge color="neutral" variant="subtle" size="sm">{{ child.orden }}</UBadge>
                  <span class="text-sm flex-1">{{ child.nombre }}</span>
                  <span v-if="child.ruta" class="text-xs text-gray-400 truncate max-w-40">{{ child.ruta }}</span>
                </div>
              </template>
            </draggable>
          </div>
        </template>
      </draggable>
    </UCard>

    <UCard v-else-if="!loading">
      <p class="text-center py-8 text-gray-500">
        Selecciona un {{ ambito === 'grupo' ? 'cargo' : 'usuario' }} para ordenar su menú.
      </p>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import AuthService from '~/services/authService'
import { resolveAuthOrgEmpresa } from '~/composables/auth/useUserRole'
import { useMenuOrden } from '~/composables/panel-acceso/useMenuOrden'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import type {
  MenuOrdenItem,
  MenuOrdenOpciones,
  SelectOption,
} from '~/types/panel-acceso/menuOrden'

type Ambito = 'grupo' | 'usuario'

const authUser = await AuthService.getInstance().getCurrentUser() as {
  name?: string
  raw?: { No_Usuario?: string; puedeGestionarOrganizaciones?: boolean }
} | null

const isRoot = computed(
  () => authUser?.name === 'root' || authUser?.raw?.No_Usuario === 'root',
)
const puedeGestionarOrganizaciones = computed(
  () => !!authUser?.raw?.puedeGestionarOrganizaciones,
)
const puedeElegirOrganizacion = computed(
  () => isRoot.value || puedeGestionarOrganizaciones.value,
)
const { orgId: defaultOrgId } = resolveAuthOrgEmpresa(authUser)

const { opciones: fetchOpciones, loadPorGrupo, loadPorUsuario, saveGrupo, saveUsuario, clearUsuario } =
  useMenuOrden()
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

const selectedOrgId = ref<number>(defaultOrgId)
const ambito = ref<Ambito>('grupo')
const ambitoTabs: { label: string; value: Ambito }[] = [
  { label: 'Por cargo', value: 'grupo' },
  { label: 'Por usuario', value: 'usuario' },
]
const selectedGrupoId = ref<number | undefined>(undefined)
const selectedUsuarioId = ref<number | undefined>(undefined)

const opciones = ref<MenuOrdenOpciones>({
  organizaciones: [] as SelectOption[],
  grupos: [] as SelectOption[],
  usuarios: [],
})
const items = ref<MenuOrdenItem[]>([])
const tieneOverride = ref(false)
const loading = ref(false)
const saving = ref(false)

async function refreshOpciones(): Promise<void> {
  const res = await fetchOpciones(
    puedeElegirOrganizacion.value ? selectedOrgId.value : undefined,
  )
  if (!res.success || !res.data) {
    showError('Error', res.message ?? 'No se pudieron cargar opciones')
    return
  }
  opciones.value = res.data
}

async function onOrgChange(): Promise<void> {
  selectedGrupoId.value = undefined
  selectedUsuarioId.value = undefined
  items.value = []
  await refreshOpciones()
}

function onAmbitoChange(): void {
  items.value = []
  tieneOverride.value = false
}

async function loadItems(): Promise<void> {
  items.value = []
  tieneOverride.value = false

  if (ambito.value === 'grupo' && !selectedGrupoId.value) return
  if (ambito.value === 'usuario' && !selectedUsuarioId.value) return

  loading.value = true
  try {
    await withSpinner(async () => {
      const res = ambito.value === 'grupo'
        ? await loadPorGrupo(selectedGrupoId.value!, selectedOrgId.value)
        : await loadPorUsuario(selectedUsuarioId.value!)
      if (!res.success || !res.data) {
        throw new Error(res.message ?? 'No se pudo cargar el orden')
      }
      items.value = res.data.items
      tieneOverride.value = res.data.tiene_override
    }, 'Cargando menús…')
  } catch (e: unknown) {
    showError('Error', e instanceof Error ? e.message : 'No se pudo cargar')
  } finally {
    loading.value = false
  }
}

async function guardar(): Promise<void> {
  if (items.value.length === 0) return
  saving.value = true
  try {
    await withSpinner(async () => {
      const res = ambito.value === 'grupo'
        ? await saveGrupo(selectedGrupoId.value!, items.value, selectedOrgId.value)
        : await saveUsuario(selectedUsuarioId.value!, items.value)
      if (!res.success) throw new Error(res.message ?? 'No se pudo guardar')
      if (ambito.value === 'usuario') tieneOverride.value = true
      showSuccess('Orden guardado', 'Se aplica en el próximo login o al refrescar sesión.')
    }, 'Guardando orden…')
  } catch (e: unknown) {
    showError('Error al guardar', e instanceof Error ? e.message : 'Intenta de nuevo')
  } finally {
    saving.value = false
  }
}

async function limpiarOverride(): Promise<void> {
  if (!selectedUsuarioId.value) return
  saving.value = true
  try {
    await withSpinner(async () => {
      const res = await clearUsuario(selectedUsuarioId.value!)
      if (!res.success) throw new Error(res.message ?? 'No se pudo limpiar')
      showSuccess('Override quitado', 'El usuario vuelve al orden de su cargo.')
      await loadItems()
    }, 'Quitando override…')
  } catch (e: unknown) {
    showError('Error', e instanceof Error ? e.message : 'Intenta de nuevo')
  } finally {
    saving.value = false
  }
}

await refreshOpciones()
</script>
