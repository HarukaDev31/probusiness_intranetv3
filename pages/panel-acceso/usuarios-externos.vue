<template>
  <DataTable
    title="Usuarios Externos"
    icon="i-heroicons-user-group"
    :data="usuarios"
    :columns="columns"
    :loading="loading"
    :show-primary-search="true"
    primary-search-placeholder="Buscar usuario..."
    :show-new-button="true"
    new-button-label="Agregar Usuario"
    :on-new-button-click="() => openModal()"
    empty-state-message="No hay usuarios externos registrados."
    :hide-back-button="true"
    @update:primary-search="onSearch"
  />

  <!-- Modal Crear/Editar -->
  <UModal v-model:open="showModal">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingUsuario ? 'Editar Usuario Externo' : 'Nuevo Usuario Externo' }}
            </h3>
            <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showModal = false" />
          </div>
        </template>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Nombre" required>
              <UInput
                v-model="form.name"
                placeholder="Nombre"
                maxlength="100"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Apellido">
              <UInput
                v-model="form.lastname"
                placeholder="Apellido"
                maxlength="100"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Email" required>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="correo@ejemplo.com"
              maxlength="150"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
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

            <UFormField label="WhatsApp">
              <UInput
                v-model="form.whatsapp"
                placeholder="Ej: 999888777"
                maxlength="20"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="DNI">
            <UInput
              v-model="form.dni"
              placeholder="Número de documento"
              maxlength="20"
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
          ¿Deseas eliminar al usuario <strong>{{ deletingUsuario?.email }}</strong>?
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
import { UsuarioExternoService } from '~/services/panelAcceso/usuarioExternoService'
import type { UsuarioExterno } from '~/services/panelAcceso/usuarioExternoService'

const UButton = resolveComponent('UButton')
const UBadge  = resolveComponent('UBadge')

// ─── Columnas ─────────────────────────────────────────────────────────────────
const columns: TableColumn<UsuarioExterno>[] = [
  {
    accessorKey: 'nombre_completo',
    header: 'Nombre',
    cell: ({ row }) => row.original.nombre_completo || '—',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
    cell: ({ row }) => row.original.whatsapp || '—',
  },
  {
    accessorKey: 'dni',
    header: 'DNI',
    cell: ({ row }) => row.original.dni || '—',
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
const usuarios = ref<UsuarioExterno[]>([])
const loading  = ref(false)

// ─── Modal ─────────────────────────────────────────────────────────────────────
const showModal      = ref(false)
const editingUsuario = ref<UsuarioExterno | null>(null)
const saving         = ref(false)
const formError      = ref('')

const showDeleteModal = ref(false)
const deletingUsuario = ref<UsuarioExterno | null>(null)
const deleting        = ref(false)

const form = reactive({
  name:     '',
  lastname: '',
  email:    '',
  password: '',
  whatsapp: '',
  dni:      '',
})

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadUsuarios(search?: string) {
  loading.value = true
  const res = await UsuarioExternoService.getUsuarios({ search: search || undefined })
  usuarios.value = res.data ?? []
  loading.value = false
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearch(value: string) {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadUsuarios(value), 300)
}

// ─── Modal open ───────────────────────────────────────────────────────────────
function openModal(usuario?: UsuarioExterno) {
  formError.value = ''
  if (usuario) {
    editingUsuario.value = usuario
    form.name     = usuario.name
    form.lastname = usuario.lastname ?? ''
    form.email    = usuario.email
    form.password = ''
    form.whatsapp = usuario.whatsapp ?? ''
    form.dni      = usuario.dni ?? ''
  } else {
    editingUsuario.value = null
    form.name     = ''
    form.lastname = ''
    form.email    = ''
    form.password = ''
    form.whatsapp = ''
    form.dni      = ''
  }
  showModal.value = true
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submitForm() {
  formError.value = ''

  if (!form.name.trim()) {
    formError.value = 'El nombre es requerido'
    return
  }
  if (!form.email.trim()) {
    formError.value = 'El email es requerido'
    return
  }
  if (!editingUsuario.value && !form.password) {
    formError.value = 'La contraseña es requerida'
    return
  }

  saving.value = true

  const payload: any = {
    name:     form.name.trim(),
    lastname: form.lastname || undefined,
    email:    form.email.trim(),
    whatsapp: form.whatsapp || undefined,
    dni:      form.dni || undefined,
  }
  if (form.password) payload.password = form.password

  const res = editingUsuario.value
    ? await UsuarioExternoService.updateUsuario(editingUsuario.value.id, payload)
    : await UsuarioExternoService.createUsuario(payload)

  saving.value = false

  if (res.success) {
    showModal.value = false
    await loadUsuarios()
  } else {
    formError.value = typeof res.message === 'string' ? res.message : 'Error al guardar'
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
function confirmDelete(usuario: UsuarioExterno) {
  deletingUsuario.value = usuario
  showDeleteModal.value = true
}

async function deleteUsuario() {
  if (!deletingUsuario.value) return
  deleting.value = true
  const res = await UsuarioExternoService.deleteUsuario(deletingUsuario.value.id)
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
