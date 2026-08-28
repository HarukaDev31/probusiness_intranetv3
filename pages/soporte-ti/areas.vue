<template>
  <div class="p-6">
    <PageHeader title="Áreas de Soporte TI" icon="i-heroicons-squares-2x2" />

    <p class="mb-4 max-w-2xl text-sm text-muted">
      Estas áreas aparecen al crear una solicitud. Asocia cada área a uno o más roles de la
      plataforma para preseleccionarla según el perfil del usuario.
    </p>

    <div class="mb-4 flex flex-wrap gap-3">
      <UInput
        v-model="search"
        placeholder="Buscar área o rol..."
        icon="i-heroicons-magnifying-glass"
        class="w-64"
      />
      <div class="flex-1" />
      <UButton icon="i-heroicons-plus" label="Nueva área" @click="openModal()" />
    </div>

    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default">
              <th class="py-3 px-4 text-left">Área</th>
              <th class="py-3 px-4 text-left">Roles asociados</th>
              <th class="py-3 px-4 text-center">Orden</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="py-8 text-center">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Cargando...
              </td>
            </tr>
            <tr v-else-if="filtradas.length === 0">
              <td colspan="5" class="py-8 text-center text-muted">No hay áreas</td>
            </tr>
            <tr
              v-for="a in filtradas"
              :key="a.id"
              class="border-b border-default hover:bg-muted/40"
            >
              <td class="py-2 px-4 font-medium">{{ a.nombre }}</td>
              <td class="py-2 px-4">
                <div v-if="a.roles.length" class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="r in a.roles"
                    :key="r.id"
                    variant="soft"
                    color="primary"
                    size="sm"
                  >
                    {{ r.nombre }}
                  </UBadge>
                </div>
                <span v-else class="text-muted">Sin roles</span>
              </td>
              <td class="py-2 px-4 text-center text-muted">{{ a.orden }}</td>
              <td class="py-2 px-4 text-center">
                <UBadge :color="a.activo ? 'success' : 'neutral'">
                  {{ a.activo ? 'Activa' : 'Inactiva' }}
                </UBadge>
              </td>
              <td class="py-2 px-4 text-center">
                <div class="flex justify-center gap-2">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="primary"
                    variant="ghost"
                    @click="openModal(a)"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-trash"
                    color="error"
                    variant="ghost"
                    @click="confirmDelete(a)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UModal v-model:open="showModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editing ? 'Editar área' : 'Nueva área' }}
              </h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showModal = false" />
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="submitForm">
            <UFormField label="Nombre" required>
              <UInput v-model="form.nombre" placeholder="Ej. Operaciones" maxlength="80" class="w-full" />
            </UFormField>

            <UFormField
              label="Roles de la plataforma"
              hint="Un rol solo puede pertenecer a un área. Se preselecciona al crear la solicitud."
            >
              <USelectMenu
                v-model="form.grupo_ids"
                :items="gruposItems"
                value-key="value"
                label-key="label"
                multiple
                placeholder="Seleccionar roles"
                class="w-full"
                :search-input="{ placeholder: 'Buscar rol...' }"
              />
            </UFormField>

            <UFormField label="Estado">
              <USelect
                v-model="form.activo"
                :items="[
                  { label: 'Activa', value: 1 },
                  { label: 'Inactiva', value: 0 }
                ]"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>
          </form>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showModal = false" />
              <UButton
                label="Guardar"
                icon="i-heroicons-check"
                :loading="saving"
                @click="submitForm"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiArea, SoporteTiAreaRol } from '~/types/soporteTi'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  middleware: 'auth'
})

const { showSuccess, showError, showConfirmation } = useModal()

const areas = ref<SoporteTiArea[]>([])
const grupos = ref<SoporteTiAreaRol[]>([])
const loading = ref(false)
const search = ref('')
const showModal = ref(false)
const editing = ref<SoporteTiArea | null>(null)
const saving = ref(false)

const form = reactive({
  nombre: '',
  grupo_ids: [] as number[],
  activo: 1 as 0 | 1
})

const gruposItems = computed(() =>
  grupos.value.map((g) => ({ label: g.nombre, value: g.id }))
)

const filtradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return areas.value
  return areas.value.filter((a) => {
    if (a.nombre.toLowerCase().includes(q)) return true
    return a.roles.some((r) => r.nombre.toLowerCase().includes(q))
  })
})

async function load() {
  loading.value = true
  try {
    const res = await SoporteTiService.listarAreasGestion()
    if (!res.success || !res.data) {
      throw new Error(res.message || 'No se pudieron cargar las áreas')
    }
    areas.value = res.data.areas
    grupos.value = res.data.grupos
  } catch (e: unknown) {
    showError('Error', e instanceof Error ? e.message : 'No se pudieron cargar las áreas')
  } finally {
    loading.value = false
  }
}

function openModal(area?: SoporteTiArea) {
  editing.value = area ?? null
  form.nombre = area?.nombre ?? ''
  form.grupo_ids = area?.grupo_ids ? [...area.grupo_ids] : []
  form.activo = area ? (area.activo ? 1 : 0) : 1
  showModal.value = true
}

async function submitForm() {
  const nombre = form.nombre.trim()
  if (!nombre) {
    showError('Validación', 'El nombre del área es obligatorio.')
    return
  }
  saving.value = true
  try {
    const payload = {
      nombre,
      activo: form.activo === 1,
      grupo_ids: form.grupo_ids
    }
    const res = editing.value
      ? await SoporteTiService.actualizarArea(editing.value.id, payload)
      : await SoporteTiService.crearArea(payload)
    if (!res.success) {
      throw new Error(res.message || 'No se pudo guardar')
    }
    showSuccess('Listo', editing.value ? 'Área actualizada' : 'Área creada')
    showModal.value = false
    await load()
  } catch (e: unknown) {
    showError('Error', e instanceof Error ? e.message : 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}

function confirmDelete(area: SoporteTiArea) {
  showConfirmation(
    'Confirmar eliminación',
    `¿Eliminar el área «${area.nombre}»? Si ya hay solicitudes, se desactivará.`,
    async () => {
      try {
        const res = await SoporteTiService.eliminarArea(area.id)
        if (!res.success) {
          throw new Error(res.message || 'No se pudo eliminar')
        }
        showSuccess('Listo', res.message || 'Área eliminada')
        await load()
      } catch (e: unknown) {
        showError('Error', e instanceof Error ? e.message : 'No se pudo eliminar')
      }
    },
    undefined,
    { confirmLabel: 'Eliminar' }
  )
}

onMounted(load)
</script>
