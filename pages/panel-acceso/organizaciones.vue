<template>
  <div class="p-6">
    <PageHeader title="Gestión de Organizaciones" icon="i-heroicons-building-office-2" />

    <UTabs v-model="tab" :items="tabs" variant="pill" class="mb-4 w-80" />

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
        v-if="tab === 'organizaciones'"
        icon="i-heroicons-plus"
        label="Agregar Organización"
        @click="openModal()"
      />
    </div>

    <!-- Organizaciones -->
    <UCard v-if="tab === 'organizaciones'">
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

    <!-- Portales -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4">Organización</th>
              <th class="text-left py-3 px-4">Portal clientes</th>
              <th class="text-left py-3 px-4">Excel</th>
              <th class="text-left py-3 px-4">Datos proveedor</th>
              <th class="text-left py-3 px-4">Nombre público</th>
              <th class="text-center py-3 px-4">Estado</th>
              <th class="text-center py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-8">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Cargando...
              </td>
            </tr>
            <tr v-else-if="organizaciones.length === 0">
              <td colspan="7" class="text-center py-8 text-gray-500">No hay organizaciones</td>
            </tr>
            <tr
              v-for="o in organizaciones"
              :key="`portal-${o.id}`"
              class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="py-2 px-4">
                <p class="font-medium">{{ o.no_organizacion }}</p>
                <p class="text-xs text-gray-500">{{ o.empresa || '—' }}</p>
              </td>
              <td class="py-2 px-4 text-xs text-gray-600 max-w-[12rem] truncate" :title="o.url_clientes || ''">
                {{ o.url_clientes || '—' }}
              </td>
              <td class="py-2 px-4 text-xs text-gray-600 max-w-[10rem] truncate" :title="o.url_excel_confirmacion || ''">
                {{ o.url_excel_confirmacion || '—' }}
              </td>
              <td class="py-2 px-4 text-xs text-gray-600 max-w-[10rem] truncate" :title="o.url_datos_proveedor || ''">
                {{ o.url_datos_proveedor || '—' }}
              </td>
              <td class="py-2 px-4 text-gray-600">{{ o.nombre_publico || '—' }}</td>
              <td class="py-2 px-4 text-center">
                <UBadge :color="portalConfigurado(o) ? 'success' : 'warning'">
                  {{ portalConfigurado(o) ? 'Configurado' : 'Pendiente' }}
                </UBadge>
              </td>
              <td class="py-2 px-4 text-center">
                <UButton
                  size="xs"
                  icon="i-heroicons-globe-alt"
                  color="primary"
                  variant="ghost"
                  :label="portalConfigurado(o) ? 'Editar' : 'Configurar'"
                  @click="openPortalModal(o)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal Organización -->
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

    <!-- Modal Portal -->
    <UModal v-model:open="showPortalModal" :ui="{ width: 'max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold">Portal de {{ editingPortal?.no_organizacion }}</h3>
                <p class="text-xs text-gray-500">Links públicos de firma, formularios y reset</p>
              </div>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showPortalModal = false" />
            </div>
          </template>

          <form @submit.prevent="submitPortal" class="space-y-4">
            <UFormField label="URL portal clientes">
              <UInput
                v-model="portalForm.url_clientes"
                placeholder="https://clientes.elsocio.com"
                class="w-full"
              />
            </UFormField>
            <UFormField label="URL Excel confirmación">
              <UInput
                v-model="portalForm.url_excel_confirmacion"
                placeholder="Vacío = misma URL del portal"
                class="w-full"
              />
            </UFormField>
            <UFormField label="URL datos proveedor">
              <UInput
                v-model="portalForm.url_datos_proveedor"
                placeholder="https://proveedor.elsocio.com"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Nombre público">
              <UInput
                v-model="portalForm.nombre_publico"
                placeholder="Nombre que ve el cliente"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Carpeta Drive">
              <UInput
                v-model="portalForm.drive_folder_id"
                placeholder="ID de carpeta (opcional)"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Logo">
              <UInput
                v-model="portalForm.logo_url"
                placeholder="https://…"
                class="w-full"
              />
            </UFormField>

            <div v-if="editingPortal?.public_key" class="rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <p class="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">Key del front (X-Org-Key)</p>
              <div class="flex items-center gap-2">
                <code class="min-w-0 flex-1 truncate text-xs">{{ editingPortal.public_key }}</code>
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-heroicons-clipboard"
                  @click="copiarKey(editingPortal.public_key)"
                />
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-heroicons-arrow-path"
                  label="Nueva"
                  @click="regenerarKey"
                />
              </div>
            </div>

            <p v-if="portalError" class="text-red-500 text-sm">{{ portalError }}</p>
          </form>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showPortalModal = false" />
              <UButton
                label="Guardar portal"
                icon="i-heroicons-check"
                :loading="savingPortal"
                @click="submitPortal"
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
import type { Organizacion, CreateOrganizacionRequest } from '~/services/panelAcceso/organizacionService'
import { useOrganizaciones } from '~/composables/panel-acceso/useOrganizaciones'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

const tab = ref<'organizaciones' | 'portales'>('organizaciones')
const tabs = [
  { label: 'Organizaciones', value: 'organizaciones' },
  { label: 'Portales', value: 'portales' },
]

const empresasOptions = ref<{ label: string; value: number }[]>([])
const organizaciones = ref<Organizacion[]>([])
const loading = ref(false)
const filtroEmpresaId = ref(0)

const showModal = ref(false)
const editingOrganizacion = ref<Organizacion | null>(null)
const saving = ref(false)
const formError = ref('')

const showPortalModal = ref(false)
const editingPortal = ref<Organizacion | null>(null)
const savingPortal = ref(false)
const portalError = ref('')

const showDeleteModal = ref(false)
const deletingOrganizacion = ref<Organizacion | null>(null)
const deleting = ref(false)

const { listar, listarEmpresas, crear, actualizar, guardarPortal, desactivar } = useOrganizaciones()
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

const form = reactive<CreateOrganizacionRequest>({
  id_empresa: 0,
  no_organizacion: '',
  txt_organizacion: '',
  estado: 1,
})

const portalForm = reactive({
  url_clientes: '',
  url_excel_confirmacion: '',
  url_datos_proveedor: '',
  nombre_publico: '',
  drive_folder_id: '',
  logo_url: '',
})

function portalConfigurado(o: Organizacion) {
  return Boolean(o.url_clientes || o.public_key)
}

async function loadEmpresas() {
  empresasOptions.value = await listarEmpresas()
}

async function loadOrganizaciones() {
  loading.value = true
  const res = await listar({
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

function openPortalModal(organizacion: Organizacion) {
  portalError.value = ''
  editingPortal.value = organizacion
  portalForm.url_clientes = organizacion.url_clientes ?? ''
  portalForm.url_excel_confirmacion = organizacion.url_excel_confirmacion ?? ''
  portalForm.url_datos_proveedor = organizacion.url_datos_proveedor ?? ''
  portalForm.nombre_publico = organizacion.nombre_publico ?? ''
  portalForm.drive_folder_id = organizacion.drive_folder_id ?? ''
  portalForm.logo_url = organizacion.logo_url ?? ''
  showPortalModal.value = true
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

  try {
    const res = await withSpinner(async () => {
      const result = editingOrganizacion.value
        ? await actualizar(editingOrganizacion.value.id, payload)
        : await crear(payload)
      if (!result.success) {
        throw new Error(typeof result.message === 'string' ? result.message : 'No se pudo guardar')
      }
      return result
    }, 'Guardando…')

    showModal.value = false
    showSuccess('Guardado', 'La organización quedó actualizada.')
    await loadOrganizaciones()
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al guardar'
    formError.value = msg
    showError('No se pudo guardar', msg)
  } finally {
    saving.value = false
  }
}

async function submitPortal() {
  if (!editingPortal.value) return
  portalError.value = ''
  savingPortal.value = true

  try {
    await withSpinner(async () => {
      const result = await guardarPortal(editingPortal.value!, { ...portalForm })
      if (!result.success) {
        throw new Error(typeof result.message === 'string' ? result.message : 'No se pudo guardar el portal')
      }
      if ('data' in result && result.data) {
        editingPortal.value = result.data
      }
    }, 'Guardando portal…')

    showPortalModal.value = false
    showSuccess('Portal guardado', 'Los links públicos de esta organización ya aplican.')
    await loadOrganizaciones()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al guardar el portal'
    portalError.value = msg
    showError('No se pudo guardar', msg)
  } finally {
    savingPortal.value = false
  }
}

async function regenerarKey() {
  if (!editingPortal.value) return
  try {
    await withSpinner(async () => {
      const result = await guardarPortal(editingPortal.value!, {
        ...portalForm,
        regenerar_public_key: true,
      })
      if (!result.success) {
        throw new Error(typeof result.message === 'string' ? result.message : 'No se pudo generar la key')
      }
      if ('data' in result && result.data) {
        editingPortal.value = result.data
      }
    }, 'Generando key…')
    showSuccess('Key nueva', 'Copia la key y actualízala en el front del socio.')
    await loadOrganizaciones()
  } catch (e) {
    showError('No se pudo generar', e instanceof Error ? e.message : 'Inténtalo de nuevo.')
  }
}

async function copiarKey(key: string) {
  try {
    await navigator.clipboard.writeText(key)
    showSuccess('Copiado', 'Key lista para el front del socio.')
  } catch {
    showError('No se copió', 'Copia la key a mano.')
  }
}

function confirmDelete(organizacion: Organizacion) {
  deletingOrganizacion.value = organizacion
  showDeleteModal.value = true
}

async function deleteOrganizacion() {
  if (!deletingOrganizacion.value) return
  deleting.value = true
  try {
    await withSpinner(async () => {
      const res = await desactivar(deletingOrganizacion.value!.id)
      if (!res.success) {
        throw new Error(res.message ?? 'No se pudo desactivar la organización')
      }
    }, 'Desactivando…')
    showDeleteModal.value = false
    showSuccess('Desactivada', 'La organización ya no aparece para usuarios nuevos.')
    await loadOrganizaciones()
  } catch (e) {
    showError('No se pudo desactivar', e instanceof Error ? e.message : 'Inténtalo de nuevo.')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadEmpresas()
  await loadOrganizaciones()
})
</script>
