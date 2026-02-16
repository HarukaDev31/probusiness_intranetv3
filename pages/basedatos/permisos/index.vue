<template>
  <DataTable
    title="Permisos"
    subtitle="Gestiona los trámites de permisos por consolidado y cliente"
    icon="i-heroicons-document-check"
    :show-title="true"
    :data="tramites"
    :columns="tableColumns"
    :loading="loading"
    :current-page="pagination.current_page"
    :total-pages="pagination.last_page"
    :total-records="totalItems"
    :items-per-page="pagination.per_page"
    :primary-search-value="search"
    :search-query-value="search"
    :show-primary-search="true"
    :show-primary-search-label="false"
    primary-search-placeholder="Buscar por"
    :show-filters="true"
    :filter-config="filterConfig"
    :filters-value="filters"
    :show-new-button="true"
    new-button-label="Crear permiso"
    :on-new-button-click="openCreateModal"
    empty-state-message="No hay trámites registrados. Haz clic en «Crear permiso» para agregar uno."
    :show-body-top="true"
    @update:primary-search="handlePrimarySearch"
    @update:search-query="handlePrimarySearch"
    @page-change="handlePageChange"
    @items-per-page-change="handleItemsPerPageChange"
    @filter-change="handleFilterChange"
    @clear-filters="handleClearFilters"
  >
  </DataTable>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useOverlay } from '#imports'
import DataTable from '~/components/DataTable.vue'
import PermisoTramiteModal from '~/components/basedatos/PermisoTramiteModal.vue'
import { useTramitesAduana } from '~/composables/basedatos/useTramitesAduana'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import type { TramiteAduana, CreateTramiteAduanaRequest } from '~/types/basedatos/tramiteAduana'
import { TRAMITE_ESTADOS } from '~/types/basedatos/tramiteAduana'
import { TramiteAduanaCatalogoService } from '~/services/basedatos/tramiteAduanaCatalogoService'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const USelect = resolveComponent('USelect')
const UPopover = resolveComponent('UPopover')
const UIcon = resolveComponent('UIcon')

definePageMeta({
  layout: 'default',
})

const {
  tramites,
  loading,
  error,
  pagination,
  search,
  filters,
  totalItems,
  loadTramites,
  getTramiteById,
  createTramite,
  updateTramite,
  deleteTramite,
  consolidados,
  loadConsolidados,
  clientesByConsolidado,
  loadClientesByConsolidado,
  loadingClientes,
  loadingConsolidados,
  entidades,
  loadEntidades,
  loadingEntidades,
  tiposPermiso,
  loadTiposPermiso,
  loadingTiposPermiso,
} = useTramitesAduana()

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const permisoModal = overlay.create(PermisoTramiteModal)

const selectedTramite = ref<TramiteAduana | null>(null)
const saving = ref(false)
const updatingEstadoId = ref<number | null>(null)

const estadoSelectOptions = computed(() =>
  TRAMITE_ESTADOS.map(e => ({ label: e.label, value: e.value }))
)

const filterConfig = computed(() => [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Estado',
    options: [
      { label: 'Todos', value: 'ALL' },
      ...TRAMITE_ESTADOS.map(e => ({ label: e.label, value: e.value })),
    ],
  },
])

const consolidadoOptions = computed(() =>
  consolidados.value.map(c => {
    const label = c.carga ? `#${c.carga}` : `#${c.id}`
    return { label, value: c.id }
  })
)
const clienteOptions = computed(() =>
  clientesByConsolidado.value.map(c => ({
    label: [c.nombre, c.ruc, c.telefono, c.email || 'Sin correo'].filter(Boolean).join(' — ') || `#${c.id}`,
    value: c.id,
  }))
)
const entidadOptions = computed(() =>
  entidades.value.map(e => ({ label: e.nombre, value: e.id }))
)
const tipoPermisoOptions = computed(() =>
  tiposPermiso.value.map(p => ({ label: p.nombre_permiso, value: p.id }))
)

const tableColumns = computed<TableColumn<TramiteAduana>[]>(() => [
  {
    accessorKey: 'cliente',
    header: 'Cliente',
    cell: ({ row }) => {
      const c = row.original.cliente
      if (!c) return h('span', { class: 'text-gray-400' }, '-')
      return h('div', { class: 'text-sm' }, [
        h('div', { class: 'font-medium' }, c.nombre || '-'),
        h('div', { class: 'text-gray-500' }, c.ruc || ''),
        h('div', { class: 'text-gray-500' }, c.telefono || ''),
        h('div', { class: 'text-gray-500' }, c.email || 'Sin correo'),
      ])
    },
  },
  {
    accessorKey: 'consolidado',
    header: 'Consolidado',
    cell: ({ row }) => {
      const c = row.original.consolidado
      return h('span', c?.codigo || c?.nombre || `#${row.original.id_consolidado}`)
    },
  },
  {
    accessorKey: 'entidad',
    header: 'Entidad',
    cell: ({ row }) => row.original.entidad?.nombre ?? '-',
  },
  {
    accessorKey: 'tipo_permiso',
    header: 'T. Permiso',
    cell: ({ row }) => row.original.tipo_permiso?.nombre_permiso ?? '-',
  },
  {
    accessorKey: 'derecho_entidad',
    header: 'Derecho tramite',
    cell: ({ row }) => h('span', {}, `S/.${Number(row.original.derecho_entidad).toFixed(2)}`),
  },
  {
    accessorKey: 'precio',
    header: 'Precio',
    cell: ({ row }) => h('span', {}, `S/.${Number(row.original.precio).toFixed(2)}`),
  },
  {
    accessorKey: 'f_inicio',
    header: 'F. Inicio',
    cell: ({ row }) => formatDate(row.original.f_inicio),
  },
  {
    accessorKey: 'f_termino',
    header: 'F. Termino',
    cell: ({ row }) => formatDate(row.original.f_termino),
  },
  {
    accessorKey: 'f_caducidad',
    header: 'F. Caducidad',
    cell: ({ row }) => formatDate(row.original.f_caducidad),
  },
  {
    accessorKey: 'dias',
    header: 'Días',
    cell: ({ row }) => row.original.dias ?? '-',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const t = row.original
      const isUpdating = updatingEstadoId.value === t.id
      const est = TRAMITE_ESTADOS.find(e => e.value === (t.estado ?? ''))
      const bg = (est && 'bgColor' in est ? est.bgColor : '#AAAAAA') as string
      const text = (est && 'textColor' in est ? est.textColor : '#F0F0F0') as string
      return h(UPopover as any, {
        disabled: isUpdating,
      }, {
        default: () => h('button', {
          class: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium min-w-[100px] justify-center border-0 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
          style: { backgroundColor: bg, color: text },
          disabled: isUpdating,
        }, [
          isUpdating ? '...' : (est?.label ?? t.estado ?? '-'),
          ...(isUpdating ? [] : [h(UIcon as any, { name: 'i-heroicons-chevron-down', class: 'w-3 h-3 ml-0.5' })]),
        ]),
        content: () => h('div', {
          class: 'p-1.5 flex flex-col gap-1 min-w-[140px]',
        }, TRAMITE_ESTADOS.map((e) => {
          const itemBg = 'bgColor' in e ? e.bgColor : '#AAAAAA'
          const itemText = 'textColor' in e ? e.textColor : '#F0F0F0'
          return h('button', {
            type: 'button',
            key: e.value,
            class: 'w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium border-0 cursor-pointer transition-opacity hover:opacity-90',
            style: { backgroundColor: itemBg, color: itemText },
            onClick: () => handleEstadoChange(t, e.value),
          }, e.label)
        })),
      })
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => h('div', { class: 'flex gap-1' }, [
      h(UButton as any, {
        icon: 'i-heroicons-document-text',
        variant: 'ghost',
        size: 'xs',
        color: 'orange' as any,
        title: 'Documentos',
        onClick: () => navigateTo(`/basedatos/permisos/documentos/${row.original.id}`),
      }),
      h(UButton as any, {
        icon: 'i-heroicons-eye',
        variant: 'ghost',
        size: 'xs',
        color: 'neutral',
        title: 'Ver',
        onClick: () => openViewModal(row.original),
      }),
      h(UButton as any, {
        icon: 'i-heroicons-pencil-square',
        variant: 'ghost',
        size: 'xs',
        color: 'primary',
        title: 'Editar',
        onClick: () => openEditModal(row.original),
      }),
      h(UButton as any, {
        icon: 'i-heroicons-trash',
        variant: 'ghost',
        size: 'xs',
        color: 'red',
        title: 'Eliminar',
        onClick: () => confirmDelete(row.original),
      }),
    ]),
  },
])

function formatDate(d: string | null | undefined): string {
  if (!d) return '-'
  try {
    const date = new Date(d)
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return String(d)
  }
}

function handlePrimarySearch(value: string) {
  search.value = value
  loadTramites({ page: 1 })
}

function handlePageChange(page: number) {
  loadTramites({ page })
}

function handleItemsPerPageChange(limit: number) {
  loadTramites({ page: 1, limit })
}

function handleFilterChange(filterKey: string, value: string | number | { value?: string } | unknown) {
  const raw =
    value != null && typeof value === 'object' && 'value' in value
      ? (value as { value?: string }).value
      : (typeof value === 'string' || typeof value === 'number' ? value : undefined)
  const normalized =
    raw === '' || raw == null ? undefined : String(raw).trim() || undefined
  const isAll = normalized === 'ALL' || normalized === '' || normalized == null
  filters.value = { ...filters.value, [filterKey]: isAll ? 'ALL' : normalized }
  nextTick(() => loadTramites({ page: 1 }))
}

function handleClearFilters() {
  filters.value = {}
  loadTramites({ page: 1 })
}

async function handleEstadoChange(tramite: TramiteAduana, nuevoEstado: string) {
  if (!nuevoEstado || nuevoEstado === tramite.estado) return
  updatingEstadoId.value = tramite.id
  try {
    await withSpinner(async () => {
      const res = await updateTramite(tramite.id, { estado: nuevoEstado as TramiteAduana['estado'] })
      if (res.success) {
        showSuccess('Actualizado', 'Estado del trámite actualizado')
        loadTramites({ page: pagination.value.current_page })
      } else {
        showError('Error', res.error || 'No se pudo actualizar el estado')
      }
    }, 'Actualizando estado...')
  } catch (e: any) {
    showError('Error', e?.message || 'Error al actualizar el estado')
  } finally {
    updatingEstadoId.value = null
  }
}

function openCreateModal() {
  selectedTramite.value = null
  clientesByConsolidado.value = []
  // Abrir modal al instante; los datos se cargan en segundo plano y se actualizan con patch
  permisoModal.open({
    open: true,
    tramite: null,
    loading: saving.value,
    consolidadoOptions: [],
    clienteOptions: [],
    entidadOptions: [],
    tipoPermisoOptions: [],
    loadingConsolidados: true,
    loadingClientes: false,
    loadingEntidades: true,
    loadingTiposPermiso: true,
    onClose: () => {
      permisoModal.close()
      selectedTramite.value = null
    },
    onSave: async (payload) => {
      await handleSave(payload)
    },
    onCreateTipoPermiso: handleCreateTipoPermiso,
    onEntityCreated,
    onCreateEntidad: async (nombre: string) => {
      try {
        const res = await TramiteAduanaCatalogoService.createEntidad({ nombre })
        if (res.success && res.data) {
          await loadEntidades()
          permisoModal.patch({ entidadOptions: entidadOptions.value, loadingEntidades: false })
          return res.data
        }
        showError('Error', res.error || 'No se pudo crear la entidad')
      } catch (e: any) {
        showError('Error', e?.message || 'No se pudo crear la entidad')
      }
      return null
    },
    onConsolidadoChange: async (id: number) => {
      permisoModal.patch({ loadingClientes: true, clienteOptions: [] })
      await loadClientesByConsolidado(id)
      permisoModal.patch({ clienteOptions: clienteOptions.value, loadingClientes: loadingClientes.value })
    },
  })
  // Cargar datos en segundo plano y actualizar el modal
  Promise.all([
    loadConsolidados({ sinCompletarDocumentacion: true, estadoDocumentacion: 'PENDIENTE' }),
    loadEntidades(),
    loadTiposPermiso(),
  ]).then(() => {
    permisoModal.patch({
      consolidadoOptions: consolidadoOptions.value,
      entidadOptions: entidadOptions.value,
      tipoPermisoOptions: tipoPermisoOptions.value,
      loadingConsolidados: false,
      loadingEntidades: false,
      loadingTiposPermiso: false,
    })
  })
}

function openEditModal(t: TramiteAduana, viewOnly = false) {
  selectedTramite.value = t
  // Abrir modal al instante con el trámite; los catálogos se cargan en segundo plano
  permisoModal.open({
    open: true,
    tramite: t,
    readOnly: viewOnly,
    loading: saving.value,
    consolidadoOptions: [],
    clienteOptions: [],
    entidadOptions: [],
    tipoPermisoOptions: [],
    loadingConsolidados: true,
    loadingClientes: !!t.id_consolidado,
    loadingEntidades: true,
    loadingTiposPermiso: true,
    onClose: () => {
      permisoModal.close()
      selectedTramite.value = null
    },
    onSave: async (payload) => {
      await handleSave(payload)
    },
    onCreateTipoPermiso: handleCreateTipoPermiso,
    onEntityCreated,
    onCreateEntidad: async (nombre: string) => {
      try {
        const res = await TramiteAduanaCatalogoService.createEntidad({ nombre })
        if (res.success && res.data) {
          await loadEntidades()
          permisoModal.patch({ entidadOptions: entidadOptions.value, loadingEntidades: false })
          return res.data
        }
        showError('Error', res.error || 'No se pudo crear la entidad')
      } catch (e: any) {
        showError('Error', e?.message || 'No se pudo crear la entidad')
      }
      return null
    },
    onConsolidadoChange: async (id: number) => {
      permisoModal.patch({ loadingClientes: true, clienteOptions: [] })
      await loadClientesByConsolidado(id)
      permisoModal.patch({ clienteOptions: clienteOptions.value, loadingClientes: loadingClientes.value })
    },
  })
  // Cargar catálogos en segundo plano y actualizar el modal
  const loadClientes = t.id_consolidado ? loadClientesByConsolidado(t.id_consolidado) : Promise.resolve()
  Promise.all([
    loadConsolidados({ estadoDocumentacion: 'PENDIENTE' }),
    loadEntidades(),
    loadTiposPermiso(),
    loadClientes,
  ]).then(() => {
    permisoModal.patch({
      consolidadoOptions: consolidadoOptions.value,
      clienteOptions: clienteOptions.value,
      entidadOptions: entidadOptions.value,
      tipoPermisoOptions: tipoPermisoOptions.value,
      loadingConsolidados: false,
      loadingClientes: false,
      loadingEntidades: false,
      loadingTiposPermiso: false,
    })
  })
}

function openViewModal(t: TramiteAduana) {
  openEditModal(t, true)
}

async function handleSave(payload: CreateTramiteAduanaRequest) {
  saving.value = true
  permisoModal.patch({ loading: true })
  try {
    await withSpinner(async () => {
      if (selectedTramite.value?.id) {
        const res = await updateTramite(selectedTramite.value.id, payload)
        if (res.success) {
          showSuccess('Actualizado', 'El trámite se actualizó correctamente')
          loadTramites({ page: pagination.value.current_page })
        } else {
          showError('Error', res.error || 'No se pudo actualizar')
        }
      } else {
        const res = await createTramite(payload)
        if (res.success) {
          showSuccess('Creado', 'El trámite se creó correctamente')
          loadTramites({ page: 1 })
        } else {
          showError('Error', res.error || 'No se pudo crear')
        }
      }
    }, 'Guardando...')
  } catch (e: any) {
    showError('Error', e?.message || 'Error al guardar')
  } finally {
    saving.value = false
    permisoModal.patch({ loading: false })
  }
}

function onEntityCreated() {
  loadEntidades()
}

async function handleCreateTipoPermiso(
  _name: string,
  _entidadId: number | null
): Promise<{ id: number; nombre_permiso: string } | null> {
  try {
    const name = _name.trim()
    if (!name) return null
    const res = await TramiteAduanaCatalogoService.createTipoPermiso({ nombre_permiso: name })
    if (res.success && res.data) {
      await loadTiposPermiso()
      permisoModal.patch({ tipoPermisoOptions: tipoPermisoOptions.value, loadingTiposPermiso: false })
      return { id: res.data.id, nombre_permiso: res.data.nombre_permiso }
    }
    showError('Error', res.error || 'No se pudo crear el tipo de permiso')
  } catch (e: any) {
    showError('Error', e?.message || 'No se pudo crear el tipo de permiso')
  }
  return null
}

function confirmDelete(t: TramiteAduana) {
  showConfirmation(
    'Eliminar trámite',
    `¿Está seguro de eliminar este trámite?`,
    async () => {
      await withSpinner(async () => {
        const res = await deleteTramite(t.id)
        if (res?.success !== false) {
          showSuccess('Eliminado', 'El trámite se eliminó correctamente')
          loadTramites({ page: pagination.value.current_page })
        } else {
          showError('Error', res?.error || 'No se pudo eliminar')
        }
      }, 'Eliminando...')
    },
    undefined,
    { persistent: true }
  )
}

onMounted(() => {
  loadTramites()
})
</script>
