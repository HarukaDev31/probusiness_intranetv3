<template>
  <div class="p-6">
    <PageHeader title="Gestión de Organizaciones" icon="i-heroicons-building-office-2" />

    <!-- Filtros -->
    <div class="mb-4 flex flex-wrap gap-3">
      <USelect
        v-model="filtroEmpresaId"
        :items="[{ label: 'Todas las empresas', value: 0 }, ...empresasOptions]"
        placeholder="Filtrar por empresa"
        class="w-64"
        @update:model-value="loadOrganizaciones"
      />
      <div class="flex-1" />
      <UButton
        icon="i-heroicons-plus"
        label="Agregar Organización"
        @click="openModal()"
      />
    </div>

    <!-- Tabla -->
    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4">Empresa</th>
              <th class="text-left py-3 px-4">Organización</th>
              <th class="text-left py-3 px-4">Descripción</th>
              <th class="text-center py-3 px-4">Estado</th>
              <th class="text-center py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-8">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Cargando...
              </td>
            </tr>
            <tr v-else-if="organizaciones.length === 0">
              <td colspan="5" class="text-center py-8 text-gray-500">No hay registros</td>
            </tr>
            <tr
              v-for="o in organizaciones"
              :key="o.id"
              class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="py-2 px-4 text-gray-500 text-xs">{{ o.empresa || '—' }}</td>
              <td class="py-2 px-4 font-medium">{{ o.no_organizacion }}</td>
              <td class="py-2 px-4 text-gray-500">{{ o.txt_organizacion || '—' }}</td>
              <td class="py-2 px-4 text-center">
                <UBadge :color="o.estado === 1 ? 'success' : 'neutral'">
                  {{ o.estado === 1 ? 'Activo' : 'Inactivo' }}
                </UBadge>
              </td>
              <td class="py-2 px-4 text-center">
                <div class="flex justify-center gap-2">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="primary"
                    variant="ghost"
                    @click="openModal(o)"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-trash"
                    color="error"
                    variant="ghost"
                    @click="confirmDelete(o)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal Crear/Editar -->
    <UModal v-model:open="showModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingOrganizacion ? 'Editar Organización' : 'Nueva Organización' }}
              </h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showModal = false" />
            </div>
          </template>

          <form @submit.prevent="submitForm" class="space-y-4">
            <UFormField label="Empresa" required>
              <USelect
                v-model="form.id_empresa"
                :items="empresasOptions"
                placeholder="Seleccionar empresa"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Nombre de la organización" required>
              <UInput
                v-model="form.no_organizacion"
                placeholder="Ej. PROBUSINESS COLOMBIA"
                maxlength="100"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Descripción">
              <UInput
                v-model="form.txt_organizacion"
                placeholder="Descripción (opcional)"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Estado" required>
              <USelect
                v-model="form.estado"
                :items="[{ label: 'Activo', value: 1 }, { label: 'Inactivo', value: 0 }]"
                class="w-full"
              />
            </UFormField>

            <p v-if="formError" class="text-red-500 text-sm">{{ formError }}</p>
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

    <!-- Modal Confirmar Eliminación -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-red-600">Confirmar Desactivación</h3>
          </template>
          <p>
            ¿Deseas desactivar la organización <strong>{{ deletingOrganizacion?.no_organizacion }}</strong>?
            No se elimina físicamente (hay usuarios y datos vinculados); queda inactiva y no aparecerá
            como opción al crear usuarios nuevos.
          </p>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showDeleteModal = false" />
              <UButton
                color="error"
                label="Desactivar"
                icon="i-heroicons-trash"
                :loading="deleting"
                @click="deleteOrganizacion"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { OrganizacionService } from '~/services/panelAcceso/organizacionService'
import type { Organizacion, CreateOrganizacionRequest } from '~/services/panelAcceso/organizacionService'
import { OptionsService } from '~/services/panelAcceso/optionsService'

const empresasOptions = ref<{ label: string; value: number }[]>([])

const organizaciones = ref<Organizacion[]>([])
const loading  = ref(false)
const filtroEmpresaId = ref(0)

const showModal = ref(false)
const editingOrganizacion = ref<Organizacion | null>(null)
const saving    = ref(false)
const formError = ref('')

const showDeleteModal = ref(false)
const deletingOrganizacion = ref<Organizacion | null>(null)
const deleting = ref(false)

const form = reactive<CreateOrganizacionRequest>({
  id_empresa: 0,
  no_organizacion: '',
  txt_organizacion: '',
  estado: 1,
})

async function loadEmpresas() {
  const empresas = await OptionsService.getEmpresas()
  empresasOptions.value = empresas.map(e => ({ label: e.nombre, value: e.id }))
}

async function loadOrganizaciones() {
  loading.value = true
  const res = await OrganizacionService.getOrganizaciones({
    empresa_id: filtroEmpresaId.value || undefined,
  })
  organizaciones.value = res.data ?? []
  loading.value = false
}

async function openModal(organizacion?: Organizacion) {
  formError.value = ''

  if (empresasOptions.value.length === 0) {
    await loadEmpresas()
  }

  if (organizacion) {
    editingOrganizacion.value = organizacion
    form.id_empresa = organizacion.id_empresa
    form.no_organizacion = organizacion.no_organizacion
    form.txt_organizacion = organizacion.txt_organizacion ?? ''
    form.estado = organizacion.estado
  } else {
    editingOrganizacion.value = null
    form.id_empresa = empresasOptions.value[0]?.value ?? 0
    form.no_organizacion = ''
    form.txt_organizacion = ''
    form.estado = 1
  }

  showModal.value = true
}

async function submitForm() {
  if (!form.id_empresa) {
    formError.value = 'Debes seleccionar una empresa'
    return
  }
  if (!form.no_organizacion.trim()) {
    formError.value = 'El nombre de la organización es requerido'
    return
  }
  formError.value = ''
  saving.value = true

  const payload = {
    id_empresa: form.id_empresa,
    no_organizacion: form.no_organizacion.trim(),
    txt_organizacion: form.txt_organizacion || undefined,
    estado: Number(form.estado),
  }

  const res = editingOrganizacion.value
    ? await OrganizacionService.updateOrganizacion(editingOrganizacion.value.id, payload)
    : await OrganizacionService.createOrganizacion(payload)

  saving.value = false

  if (res.success) {
    showModal.value = false
    await loadOrganizaciones()
  } else {
    formError.value = typeof (res as any).message === 'string' ? (res as any).message : 'Error al guardar'
  }
}

function confirmDelete(organizacion: Organizacion) {
  deletingOrganizacion.value = organizacion
  showDeleteModal.value = true
}

async function deleteOrganizacion() {
  if (!deletingOrganizacion.value) return
  deleting.value = true
  const res = await OrganizacionService.deleteOrganizacion(deletingOrganizacion.value.id)
  deleting.value = false
  showDeleteModal.value = false
  if (res.success) {
    await loadOrganizaciones()
  } else {
    alert(res.message ?? 'No se pudo desactivar la organización')
  }
}

onMounted(async () => {
  await loadEmpresas()
  await loadOrganizaciones()
})
</script>
