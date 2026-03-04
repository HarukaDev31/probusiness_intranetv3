<template>
  <div class="p-6">
    <PageHeader title="Permisos de Menú por Usuario" icon="i-heroicons-user-circle" />

    <!-- Selector de usuario -->
    <UCard class="mb-5">
      <div class="flex flex-wrap gap-4 items-end">
        <UFormField label="Usuario Externo" class="min-w-80 flex-1">
          <USelect
            v-model="selectedUserId"
            :items="usuariosOptions"
            placeholder="Seleccionar usuario"
            class="w-full"
            @update:model-value="loadMenuPermisos"
          />
        </UFormField>

        <UButton
          v-if="selectedUserId"
          size="sm"
          icon="i-heroicons-arrow-path"
          variant="outline"
          label="Recargar"
          :loading="loading"
          @click="loadMenuPermisos"
        />
      </div>
    </UCard>

    <!-- Info usuario seleccionado -->
    <div v-if="usuarioInfo" class="mb-4 text-sm text-gray-500">
      Configurando permisos para: <strong>{{ usuarioInfo.nombre_completo }}</strong> ({{ usuarioInfo.email }})
    </div>

    <!-- Tabla de permisos -->
    <UCard v-if="menus.length > 0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-800">
              <th class="text-center py-3 px-3 w-10">
                <UCheckbox v-model="checkAll" @change="toggleAll" />
              </th>
              <th class="text-left py-3 px-4">Menú</th>
              <th class="text-center py-3 px-3 w-28">
                <UButton
                  size="sm"
                  icon="i-heroicons-check"
                  label="Guardar"
                  color="success"
                  :loading="saving"
                  @click="guardarPermisos"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(grupo, key) in menusPorPadre" :key="key">
              <!-- Cabecera de grupo -->
              <tr class="bg-gray-50 dark:bg-gray-700">
                <td colspan="3" class="py-2 px-4 font-bold text-gray-700 dark:text-gray-200">
                  {{ key }}
                </td>
              </tr>
              <!-- Filas de menú -->
              <tr
                v-for="(menu, index) in grupo"
                :key="menu.ID_Menu"
                class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="text-right py-2 px-3 text-gray-400 text-xs">{{ index + 1 }}.</td>
                <td class="py-2 px-4">
                  {{ menu.No_Menu }}
                  <a
                    v-if="menu.Txt_Url_Video"
                    :href="menu.Txt_Url_Video"
                    target="_blank"
                    class="ml-2 text-red-500 hover:text-red-700"
                    title="Ver video"
                  >
                    <UIcon name="i-mdi-youtube" />
                  </a>
                </td>
                <td class="text-center py-2 px-3">
                  <UCheckbox v-model="accesos[menu.ID_Menu]" />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </UCard>

    <div v-else-if="selectedUserId && !loading" class="text-center text-gray-400 py-10">
      No hay menús disponibles.
    </div>

    <div v-else-if="!selectedUserId" class="text-center text-gray-400 py-10">
      Selecciona un usuario para gestionar sus permisos.
    </div>
  </div>
</template>

<script setup lang="ts">
import { UsuarioExternoService } from '~/services/panelAcceso/usuarioExternoService'
import { PermisoMenuUsuarioService } from '~/services/panelAcceso/permisoMenuUsuarioService'
import type { MenuUsuario } from '~/services/panelAcceso/permisoMenuUsuarioService'

// ─── Usuarios ─────────────────────────────────────────────────────────────────
const usuariosOptions = ref<{ label: string; value: number }[]>([])
const selectedUserId  = ref<number | null>(null)
const usuarioInfo     = ref<{ id: number; email: string; nombre_completo: string } | null>(null)

async function loadUsuarios() {
  const res = await UsuarioExternoService.getUsuarios()
  usuariosOptions.value = (res.data ?? []).map(u => ({
    label: `${u.nombre_completo} (${u.email})`,
    value: u.id,
  }))
}

// ─── Menús y permisos ─────────────────────────────────────────────────────────
const menus   = ref<MenuUsuario[]>([])
const accesos = ref<Record<number, boolean>>({})
const loading = ref(false)
const saving  = ref(false)

const menusPorPadre = computed(() => {
  const grupos: Record<string, MenuUsuario[]> = {}
  for (const m of menus.value) {
    const padre = m.nombre_padre || 'General'
    if (!grupos[padre]) grupos[padre] = []
    grupos[padre].push(m)
  }
  return grupos
})

const checkAll = computed({
  get: () => menus.value.length > 0 && menus.value.every(m => accesos.value[m.ID_Menu]),
  set: () => {},
})

function toggleAll() {
  const allChecked = menus.value.every(m => accesos.value[m.ID_Menu])
  for (const m of menus.value) {
    accesos.value[m.ID_Menu] = !allChecked
  }
}

async function loadMenuPermisos() {
  if (!selectedUserId.value) return
  loading.value = true
  const res = await PermisoMenuUsuarioService.getMenuPorUsuario(selectedUserId.value)
  loading.value = false

  if (res.success) {
    menus.value   = res.data ?? []
    usuarioInfo.value = res.usuario
    accesos.value = {}
    for (const m of menus.value) {
      accesos.value[m.ID_Menu] = m.tiene_acceso
    }
  }
}

async function guardarPermisos() {
  if (!selectedUserId.value) return
  saving.value = true

  const menuIds = menus.value
    .filter(m => accesos.value[m.ID_Menu])
    .map(m => m.ID_Menu)

  const res = await PermisoMenuUsuarioService.guardarPermisos({
    user_id:  selectedUserId.value,
    menu_ids: menuIds,
  })

  saving.value = false

  if (res.success) {
    useNuxtApp().$toast?.success?.('Permisos guardados correctamente')
  } else {
    alert(res.message ?? 'Error al guardar permisos')
  }
}

onMounted(loadUsuarios)
</script>
