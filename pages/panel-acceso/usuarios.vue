<template>
  <div class="p-6">
    <PageHeader title="Gestión de Usuarios" icon="i-heroicons-users" />

    <!-- Filtros -->
    <div class="mb-4 flex flex-wrap gap-3">
      <UInput
        v-model="search"
        placeholder="Buscar usuario..."
        icon="i-heroicons-magnifying-glass"
        class="w-64"
        @input="loadUsuarios"
      />
      <div class="flex-1" />
      <UButton
        icon="i-heroicons-plus"
        label="Agregar Usuario"
        @click="openModal()"
      />
    </div>

    <!-- Tabla -->
    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4">Cargo</th>
              <th class="text-left py-3 px-4">Usuario (Email)</th>
              <th class="text-left py-3 px-4">Nombres y Apellidos</th>
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
            <tr v-else-if="usuarios.length === 0">
              <td colspan="5" class="text-center py-8 text-gray-500">No hay registros</td>
            </tr>
            <tr
              v-for="u in usuarios"
              :key="u.id"
              class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="py-2 px-4">
                <UBadge variant="soft" color="primary">{{ u.cargo || '—' }}</UBadge>
              </td>
              <td class="py-2 px-4">{{ u.usuario }}</td>
              <td class="py-2 px-4 text-gray-600">{{ u.nombres_apellidos || '—' }}</td>
              <td class="py-2 px-4 text-center">
                <UBadge :color="u.estado === 1 ? 'success' : 'neutral'">
                  {{ u.estado === 1 ? 'Activo' : 'Inactivo' }}
                </UBadge>
              </td>
              <td class="py-2 px-4 text-center">
                <div class="flex justify-center gap-2">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="primary"
                    variant="ghost"
                    @click="openModal(u)"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-trash"
                    color="error"
                    variant="ghost"
                    @click="confirmDelete(u)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal Crear/Editar -->
    <UModal v-model:open="showModal" :ui="{ width: 'max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario' }}
              </h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showModal = false" />
            </div>
          </template>

          <form @submit.prevent="submitForm" class="space-y-4">
            <!-- Cargo -->
            <UFormField label="Cargo / Grupo" required>
              <USelect
                v-model="form.id_grupo"
                :items="gruposOptions"
                placeholder="Seleccionar cargo"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <!-- Email / Usuario -->
              <UFormField label="Email (usuario)" required>
                <UInput
                  v-model="form.usuario"
                  placeholder="email@empresa.com"
                  type="email"
                  maxlength="100"
                  class="w-full"
                />
              </UFormField>

              <!-- Nombres -->
              <UFormField label="Nombres y Apellidos">
                <UInput
                  v-model="form.nombres_apellidos"
                  placeholder="Nombres completos"
                  maxlength="100"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Password -->
              <UFormField :label="editingUsuario ? 'Nueva Contraseña (dejar vacío = no cambiar)' : 'Contraseña'" :required="!editingUsuario">
                <UInput
                  v-model="form.password"
                  type="password"
                  placeholder="Contraseña"
                  class="w-full"
                />
              </UFormField>

              <!-- Celular -->
              <UFormField label="Celular">
                <UInput
                  v-model="form.celular"
                  placeholder="9 dígitos"
                  maxlength="9"
                  class="w-full"
                />
              </UFormField>
            </div>

            <!-- Estado -->
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
            <h3 class="text-lg font-semibold text-red-600">Confirmar Eliminación</h3>
          </template>
          <p>
            ¿Deseas eliminar el usuario <strong>{{ deletingUsuario?.usuario }}</strong>?
            Se eliminarán también sus permisos de menú.
          </p>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showDeleteModal = false" />
              <UButton
                color="error"
                label="Eliminar"
                icon="i-heroicons-trash"
                :loading="deleting"
                @click="deleteUsuario"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { UsuarioAdminService } from '~/services/panelAcceso/usuarioAdminService'
import { OptionsService }      from '~/services/panelAcceso/optionsService'
import type { UsuarioAdmin }   from '~/services/panelAcceso/usuarioAdminService'
import AuthService from '~/services/authService'

const authUser  = AuthService.getInstance().currentUser as any
const empresaId = computed(() => authUser?.raw?.ID_Empresa ?? 1)
const orgId     = computed(() => authUser?.raw?.ID_Organizacion ?? 1)

const usuarios   = ref<UsuarioAdmin[]>([])
const loading    = ref(false)
const search     = ref('')

const gruposOptions = ref<{ label: string; value: number }[]>([])

const showModal      = ref(false)
const editingUsuario = ref<UsuarioAdmin | null>(null)
const saving         = ref(false)
const formError      = ref('')

const showDeleteModal = ref(false)
const deletingUsuario = ref<UsuarioAdmin | null>(null)
const deleting        = ref(false)

const form = reactive({
  id_empresa:         empresaId.value,
  id_org:             orgId.value,
  id_grupo:           0,
  usuario:            '',
  nombres_apellidos:  '',
  password:           '',
  celular:            '',
  estado:             1,
})

async function loadUsuarios() {
  loading.value = true
  const res = await UsuarioAdminService.getUsuarios({
    empresa_id: empresaId.value,
    org_id:     orgId.value,
    search:     search.value || undefined,
  })
  usuarios.value = res.data ?? []
  loading.value = false
}

async function loadGrupos() {
  const grupos = await OptionsService.getGrupos(empresaId.value, orgId.value)
  gruposOptions.value = grupos.map(g => ({ label: g.nombre, value: g.id }))
}

async function openModal(usuario?: UsuarioAdmin) {
  formError.value = ''
  await loadGrupos()

  if (usuario) {
    editingUsuario.value = usuario
    form.id_empresa        = usuario.id_empresa
    form.id_org            = usuario.id_org
    form.id_grupo          = usuario.id_grupo
    form.usuario           = usuario.usuario
    form.nombres_apellidos = usuario.nombres_apellidos ?? ''
    form.password          = ''
    form.celular           = usuario.celular ?? ''
    form.estado            = usuario.estado
  } else {
    editingUsuario.value = null
    form.id_empresa        = empresaId.value
    form.id_org            = orgId.value
    form.id_grupo          = 0
    form.usuario           = ''
    form.nombres_apellidos = ''
    form.password          = ''
    form.celular           = ''
    form.estado            = 1
  }
  showModal.value = true
}

async function submitForm() {
  formError.value = ''

  if (!form.id_grupo) {
    formError.value = 'Debes seleccionar un cargo'
    return
  }
  if (!form.usuario.trim()) {
    formError.value = 'El email es requerido'
    return
  }
  if (!editingUsuario.value && !form.password) {
    formError.value = 'La contraseña es requerida'
    return
  }

  saving.value = true

  const payload: any = {
    id_empresa:        form.id_empresa,
    id_org:            form.id_org,
    id_grupo:          Number(form.id_grupo),
    usuario:           form.usuario.trim(),
    nombres_apellidos: form.nombres_apellidos || undefined,
    celular:           form.celular || undefined,
    estado:            Number(form.estado),
  }

  if (form.password) {
    payload.password = form.password
  }

  const res = editingUsuario.value
    ? await UsuarioAdminService.updateUsuario(editingUsuario.value.id, payload)
    : await UsuarioAdminService.createUsuario(payload)

  saving.value = false

  if (res.success) {
    showModal.value = false
    await loadUsuarios()
  } else {
    formError.value = typeof res.message === 'string' ? res.message : 'Error al guardar'
  }
}

function confirmDelete(usuario: UsuarioAdmin) {
  deletingUsuario.value = usuario
  showDeleteModal.value = true
}

async function deleteUsuario() {
  if (!deletingUsuario.value) return
  deleting.value = true
  const res = await UsuarioAdminService.deleteUsuario(deletingUsuario.value.id)
  deleting.value = false
  showDeleteModal.value = false
  if (res.success) {
    await loadUsuarios()
  } else {
    alert(res.message ?? 'No se pudo eliminar el usuario')
  }
}

onMounted(loadUsuarios)
</script>
