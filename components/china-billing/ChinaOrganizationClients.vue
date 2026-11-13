<template>
  <div>
    <!-- Misma tabla (DataTable v1) que la Base de datos de clientes de Carga Consolidada. -->
    <DataTable
      :title="`Base de datos de clientes · ${label}`"
      :subtitle="`Registrada por ${name} · solo visualización`"
      :show-title="true"
      icon="i-heroicons-users"
      keep-spanish-headers
      :hide-back-button="true"
      :data="rows"
      :columns="columns"
      :loading="loading"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="pagination.total"
      :items-per-page="pagination.per_page"
      :primary-search-value="search"
      :show-primary-search="true"
      :show-primary-search-label="false"
      primary-search-placeholder="Buscar por"
      :show-filters="false"
      :show-export="false"
      :empty-state-message="search ? 'No hay clientes que coincidan con la búsqueda.' : `${name} aún no tiene clientes registrados.`"
      @update:primary-search="onSearch"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />

    <UModal
      :open="!!selected"
      :title="selected?.name || ''"
      :description="`Cliente de ${name} · solo lectura`"
      :ui="{ content: 'w-full max-w-lg sm:max-w-lg', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
      @update:open="(value: boolean) => !value && (selected = null)"
    >
      <template #body>
        <dl v-if="selected" class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <template v-for="field in fields(selected)" :key="field.label">
            <dt class="text-muted">{{ field.label }}</dt><dd class="font-medium">{{ field.value || '-' }}</dd>
          </template>
        </dl>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaOrganizationClient, ChinaPagination } from '~/types/china-billing'
import { UIcon } from '#components'

const props = defineProps<{ organizationId: number; name: string; label: string }>()

const { showError } = useModal()
const rows = ref<ChinaOrganizationClient[]>([])
const search = ref('')
const loading = ref(false)
const selected = ref<ChinaOrganizationClient | null>(null)
const pagination = ref<ChinaPagination>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
let lastRequest = 0

const fullDate = (date: string | null): string => {
  const [year, month, day] = (date || '').split('-')
  return year ? `${day}/${month}/${year}` : '—'
}

const fields = (client: ChinaOrganizationClient) => [
  { label: 'Fecha', value: fullDate(client.registered_on) },
  { label: 'Documento', value: client.document },
  { label: 'Teléfono', value: client.phone },
  { label: 'Correo', value: client.email },
  { label: 'Provincia', value: client.province },
  { label: 'Origen', value: client.origin },
  { label: 'Servicio', value: client.service },
  { label: 'Categoría', value: client.category }
]

const columns: TableColumn<ChinaOrganizationClient>[] = [
  { accessorKey: 'number', header: 'N°', cell: ({ row }) => h('span', { class: 'text-muted' }, String(row.original.number)) },
  { accessorKey: 'registered_on', header: 'Fecha', cell: ({ row }) => h('span', { class: 'whitespace-nowrap' }, fullDate(row.original.registered_on)) },
  { accessorKey: 'name', header: 'Contacto', cell: ({ row }) => h('div', { class: 'flex min-w-48 flex-col' }, [
    h('span', { class: 'font-semibold' }, row.original.name),
    h('span', { class: 'text-xs text-muted' }, row.original.document || '—'),
    h('span', { class: 'text-xs text-muted' }, row.original.phone || '—'),
    h('span', { class: 'text-xs text-muted' }, row.original.email || '—')
  ]) },
  { accessorKey: 'province', header: 'Provincia', cell: ({ row }) => h('span', row.original.province || '-') },
  { accessorKey: 'origin', header: 'Origen', cell: ({ row }) => h('span', row.original.origin || '-') },
  { accessorKey: 'service', header: 'Servicio', cell: ({ row }) => h('span', row.original.service || '—') },
  { accessorKey: 'category', header: 'Categoría', cell: ({ row }) => h('span', {
    class: `inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.original.category === 'Prospecto' ? 'bg-[#eef1f6] text-[#4a5a72]' : 'bg-[#e3edfd] text-[#1d4f91]'}`
  }, row.original.category) },
  { id: 'actions', header: 'Acción', cell: ({ row }) => h('button', {
    type: 'button',
    title: 'Ver cliente',
    'aria-label': 'Ver cliente',
    class: 'grid size-8 place-items-center rounded-lg text-toned transition-colors hover:bg-primary/10 hover:text-primary',
    onClick: () => { selected.value = row.original }
  }, h(UIcon, { name: 'i-heroicons-eye', class: 'size-4' })) }
]

async function load() {
  const current = ++lastRequest
  loading.value = true
  try {
    const response = await ChinaBillingService.organizationClients({
      organization_id: props.organizationId,
      search: search.value.trim(),
      page: pagination.value.current_page,
      per_page: pagination.value.per_page
    })
    if (current !== lastRequest) return
    rows.value = response.data || []
    if (response.pagination) pagination.value = response.pagination
  } catch (error: any) {
    showError('Clientes', error?.message || 'No se pudo cargar la lista.')
  } finally {
    if (current === lastRequest) loading.value = false
  }
}

function reload() {
  pagination.value.current_page = 1
  return load()
}

function onSearch(value: string) {
  search.value = value
  reload()
}

function onPage(page: number) {
  pagination.value.current_page = page
  load()
}

function onPageSize(size: number) {
  pagination.value.per_page = size
  reload()
}

watch(() => props.organizationId, () => {
  search.value = ''
  reload()
})

onMounted(load)
</script>
