<template>
  <DataTable
    title="Gestión de Usuarios"
    icon="i-heroicons-users"
    :data="usuarios"
    :columns="columns"
    :loading="loading"
    :current-page="pagination.current_page"
    :total-pages="pagination.last_page"
    :total-records="pagination.total"
    :items-per-page="pagination.per_page"
    :show-primary-search="true"
    primary-search-placeholder="Buscar usuario..."
    :show-new-button="true"
    new-button-label="Agregar Usuario"
    :on-new-button-click="() => openModal()"
    empty-state-message="No hay usuarios registrados."
    :hide-back-button="true"
    @update:primary-search="onSearch"
    @page-change="onPageChange"
    @items-per-page-change="onItemsPerPageChange"
  />

  <!-- Modal Crear/Editar -->
  <UModal v-model:open="showModal">
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
            <USelectMenu
              v-model="selectedGrupo"
              :items="gruposOptions"
              placeholder="Seleccionar cargo"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Email (usuario)" required>
              <UInput
                v-model="form.usuario"
                placeholder="email@empresa.com"
                type="email"
                maxlength="100"
                class="w-full"
              />
            </UFormField>

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
            <UFormField
              :label="editingUsuario ? 'Nueva contraseña (opcional)' : 'Contraseña'"
              :required="!editingUsuario"
            >
              <UInput
                :key="showPasswordInModal ? 'pwd-text' : 'pwd-hidden'"
                v-model="form.password"
                :type="showPasswordInModal ? 'text' : 'password'"
                placeholder="Contraseña"
                autocomplete="new-password"
                :ui="{ trailing: 'pe-1' }"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    :icon="showPasswordInModal ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    variant="link"
                    color="neutral"
                    size="sm"
                    type="button"
                    @click.prevent.stop="showPasswordInModal = !showPasswordInModal"
                  />
                </template>
              </UInput>
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Celular">
              <UInput
                v-model="form.celular"
                placeholder="9 dígitos"
                maxlength="9"
                class="w-full"
              />
            </UFormField>
          </div>

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
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UsuarioAdminService } from '~/services/panelAcceso/usuarioAdminService'
import { OptionsService }      from '~/services/panelAcceso/optionsService'
import type { UsuarioAdmin }   from '~/services/panelAcceso/usuarioAdminService'
import AuthService from '~/services/authService'

// Render components
const UButton = resolveComponent('UButton')
const UBadge  = resolveComponent('UBadge')

const authUser  = (AuthService.getInstance() as any).currentUser
const empresaId = computed(() => authUser?.raw?.ID_Empresa ?? 1)
const orgId     = computed(() => authUser?.raw?.ID_Organizacion ?? 1)

// ─── Columnas ─────────────────────────────────────────────────────────────────
const columns: TableColumn<UsuarioAdmin>[] = [
  {
    accessorKey: 'cargo',
    header: 'Cargo',
    cell: ({ row }) => h(UBadge as any, { variant: 'soft', color: 'primary' }, () => row.original.cargo || '—'),
  },
  {
    accessorKey: 'usuario',
    header: 'Usuario (Email)',
  },
  {
    accessorKey: 'password_sin_encriptar',
    header: 'Contraseña actual',
    cell: ({ row }) => {
      const id = row.original.id
      const isVisible = !!visiblePasswords.value[id]
      const value = row.original.password_sin_encriptar || ''
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-mono text-xs' }, value ? (isVisible ? value : '••••••••') : '—'),
        value
          ? h(UButton as any, {
              size: 'xs',
              variant: 'ghost',
              color: 'neutral',
              icon: isVisible ? 'i-heroicons-eye-slash' : 'i-heroicons-eye',
              onClick: () => togglePasswordVisibility(id),
            })
          : null,
      ])
    },
  },
  {
    accessorKey: 'nombres_apellidos',
    header: 'Nombres y Apellidos',
    cell: ({ row }) => row.original.nombres_apellidos || '—',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => h(
      UBadge as any,
      { color: row.original.estado === 1 ? 'success' : 'neutral' },
      () => row.original.estado === 1 ? 'Activo' : 'Inactivo'
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton as any, {
        size: 'xs',
        icon: 'i-heroicons-pencil',
        color: 'primary',
        variant: 'ghost',
        onClick: () => openModal(row.original),
      }),
      h(UButton as any, {
        size: 'xs',
        icon: 'i-heroicons-trash',
        color: 'error',
        variant: 'ghost',
        onClick: () => confirmDelete(row.original),
      }),
    ]),
  },
]

// ─── Tabla ─────────────────────────────────────────────────────────────────────
const usuarios = ref<UsuarioAdmin[]>([])
const loading  = ref(false)
const search = ref('')
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0,
})

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
const showPasswordInModal = ref(false)
const visiblePasswords = ref<Record<number, boolean>>({})
const originalPassword = ref('')

const form = reactive({
  usuario:           '',
  nombres_apellidos: '',
  password:          '',
  celular:           '',
})

function togglePasswordVisibility(id: number) {
  visiblePasswords.value[id] = !visiblePasswords.value[id]
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadUsuarios(params?: { search?: string; page?: number; per_page?: number }) {
  loading.value = true
  const res = await UsuarioAdminService.getUsuarios({
    empresa_id: empresaId.value,
    org_id:     orgId.value,
    search:     params?.search || undefined,
    page:       params?.page || pagination.value.current_page,
    per_page:   params?.per_page || pagination.value.per_page,
  })
  usuarios.value = res.data ?? []
  if (res.pagination) {
    pagination.value = {
      current_page: res.pagination.current_page,
      last_page: res.pagination.last_page,
      per_page: res.pagination.per_page,
      total: res.pagination.total,
      from: res.pagination.from,
      to: res.pagination.to,
    }
  } else {
    const total = res.data?.length ?? 0
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: Math.max(total, 10),
      total,
      from: total > 0 ? 1 : 0,
      to: total,
    }
  }
  loading.value = false
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearch(value: string) {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    search.value = value
    void loadUsuarios({
      search: value,
      page: 1,
      per_page: pagination.value.per_page,
    })
  }, 300)
}

function onPageChange(page: number) {
  void loadUsuarios({
    search: search.value,
    page,
    per_page: pagination.value.per_page,
  })
}

function onItemsPerPageChange(perPage: number) {
  void loadUsuarios({
    search: search.value,
    page: 1,
    per_page: perPage,
  })
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
    form.password          = usuario.password_sin_encriptar ?? ''
    originalPassword.value = usuario.password_sin_encriptar ?? ''
    form.celular           = usuario.celular ?? ''
    selectedGrupo.value    = gruposOptions.value.find(g => g.value === usuario.id_grupo) ?? null
    selectedEstado.value   = estadoOptions.find(e => e.value === usuario.estado) ?? estadoOptions[0]
  } else {
    editingUsuario.value   = null
    form.usuario           = ''
    form.nombres_apellidos = ''
    form.password          = ''
    originalPassword.value = ''
    form.celular           = ''
    selectedGrupo.value    = null
    selectedEstado.value   = estadoOptions[0]
  }
  showPasswordInModal.value = false
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
  const trimmedPassword = form.password.trim()
  if (!editingUsuario.value) {
    if (trimmedPassword) {
      payload.password = trimmedPassword
      payload.password_sin_encriptar = trimmedPassword
    }
  } else if (trimmedPassword && trimmedPassword !== originalPassword.value) {
    // En edición, cuando cambia la contraseña, enviamos ambos campos
    // para asegurar sincronía entre texto plano y encriptado.
    payload.password = trimmedPassword
    payload.password_sin_encriptar = trimmedPassword
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
