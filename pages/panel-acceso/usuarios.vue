<template>
  <div class="p-6">
    <PageHeader title="Gestión de Usuarios" icon="i-heroicons-users" />

    <!-- Filtros -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        placeholder="Buscar usuario..."
        icon="i-heroicons-magnifying-glass"
        class="w-64"
        @input="onSearchInput"
      />
      <div class="flex-1" />
      <UButton
        icon="i-heroicons-plus"
        label="Agregar Usuario"
        @click="openModal()"
      />
    </div>

    <!-- Tabla -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :data="usuarios"
        :columns="columns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-users', label: 'No hay usuarios registrados' }"
        class="w-full"
      >
        <!-- Cargo -->
        <template #cargo-cell="{ row }">
          <UBadge variant="soft" color="primary">{{ (row.original as UsuarioAdmin).cargo || '—' }}</UBadge>
        </template>

        <!-- Estado -->
        <template #estado-cell="{ row }">
          <UBadge :color="(row.original as UsuarioAdmin).estado === 1 ? 'success' : 'neutral'">
            {{ (row.original as UsuarioAdmin).estado === 1 ? 'Activo' : 'Inactivo' }}
          </UBadge>
        </template>

        <!-- Acciones -->
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              size="xs"
              icon="i-heroicons-pencil"
              color="primary"
              variant="ghost"
              @click="openModal(row.original as UsuarioAdmin)"
            />
            <UButton
              size="xs"
              icon="i-heroicons-trash"
              color="error"
              variant="ghost"
              @click="confirmDelete(row.original as UsuarioAdmin)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Modal Crear/Editar -->
    <UModal v-model:open="showModal">
      <template #content>
        <UCard class="max-w-2xl mx-auto">
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
              <USelectMenu
                v-model="selectedGrupo"
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
              <UFormField
                :label="editingUsuario ? 'Nueva Contraseña (dejar vacío = no cambiar)' : 'Contraseña'"
                :required="!editingUsuario"
              >
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
              <USelectMenu
                v-model="selectedEstado"
                :items="estadoOptions"
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

const authUser  = (AuthService.getInstance() as any).currentUser
const empresaId = computed(() => authUser?.raw?.ID_Empresa ?? 1)
const orgId     = computed(() => authUser?.raw?.ID_Organizacion ?? 1)

// ─── Columnas ─────────────────────────────────────────────────────────────────
const columns = [
  { accessorKey: 'cargo',             header: 'Cargo' },
  { accessorKey: 'usuario',           header: 'Usuario (Email)' },
  { accessorKey: 'nombres_apellidos', header: 'Nombres y Apellidos' },
  { accessorKey: 'estado',            header: 'Estado' },
  { id: 'actions',                    header: '' },
]

// ─── Tabla ─────────────────────────────────────────────────────────────────────
const usuarios = ref<UsuarioAdmin[]>([])
const loading  = ref(false)
const search   = ref('')

// ─── Selects del modal ────────────────────────────────────────────────────────
const gruposOptions = ref<{ label: string; value: number }[]>([])
const estadoOptions = [
  { label: 'Activo',   value: 1 },
  { label: 'Inactivo', value: 0 },
]

const selectedGrupo  = ref<{ label: string; value: number } | null>(null)
const selectedEstado = ref<{ label: string; value: number }>(estadoOptions[0])

// ─── Modal ─────────────────────────────────────────────────────────────────────
const showModal      = ref(false)
const editingUsuario = ref<UsuarioAdmin | null>(null)
const saving         = ref(false)
const formError      = ref('')

const showDeleteModal = ref(false)
const deletingUsuario = ref<UsuarioAdmin | null>(null)
const deleting        = ref(false)

const form = reactive({
  usuario:           '',
  nombres_apellidos: '',
  password:          '',
  celular:           '',
})

// ─── Data loading ─────────────────────────────────────────────────────────────
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

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadUsuarios, 300)
}

async function loadGrupos() {
  const grupos = await OptionsService.getGrupos(empresaId.value, orgId.value)
  gruposOptions.value = grupos.map(g => ({ label: g.nombre, value: g.id }))
}

// ─── Modal open ───────────────────────────────────────────────────────────────
async function openModal(usuario?: UsuarioAdmin) {
  formError.value = ''
  await loadGrupos()

  if (usuario) {
    editingUsuario.value   = usuario
    form.usuario           = usuario.usuario
    form.nombres_apellidos = usuario.nombres_apellidos ?? ''
    form.password          = ''
    form.celular           = usuario.celular ?? ''
    selectedGrupo.value    = gruposOptions.value.find(g => g.value === usuario.id_grupo) ?? null
    selectedEstado.value   = estadoOptions.find(e => e.value === usuario.estado) ?? estadoOptions[0]
  } else {
    editingUsuario.value   = null
    form.usuario           = ''
    form.nombres_apellidos = ''
    form.password          = ''
    form.celular           = ''
    selectedGrupo.value    = null
    selectedEstado.value   = estadoOptions[0]
  }
  showModal.value = true
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submitForm() {
  formError.value = ''

  const grupoId  = typeof selectedGrupo.value === 'object' && selectedGrupo.value
    ? selectedGrupo.value.value
    : Number(selectedGrupo.value)

  const estadoId = typeof selectedEstado.value === 'object' && selectedEstado.value
    ? selectedEstado.value.value
    : Number(selectedEstado.value)

  if (!grupoId) {
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
    id_empresa:        empresaId.value,
    id_org:            orgId.value,
    id_grupo:          grupoId,
    usuario:           form.usuario.trim(),
    nombres_apellidos: form.nombres_apellidos || undefined,
    celular:           form.celular || undefined,
    estado:            estadoId,
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

// ─── Delete ───────────────────────────────────────────────────────────────────
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
  if (!res.success) {
    alert(res.message ?? 'No se pudo eliminar el usuario')
  } else {
    await loadUsuarios()
  }
}

onMounted(loadUsuarios)
</script>
