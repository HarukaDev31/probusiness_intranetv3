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

    <!-- #2011: la vista del cliente es un panel lateral. -->
    <USlideover
      :open="!!selected"
      side="right"
      :title="selected?.name || ''"
      :ui="{ content: 'w-full max-w-md sm:max-w-md', header: 'hidden', body: 'p-0 sm:p-0' }"
      @update:open="(value: boolean) => !value && (selected = null)"
    >
      <template #body>
        <div v-if="selected" class="px-6 py-5">
          <div class="flex items-start justify-between gap-3">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <UIcon name="i-heroicons-lock-closed" class="size-3.5" />Cliente de {{ label }} - Solo lectura
            </span>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="selected = null" />
          </div>
          <div class="mt-4 flex items-center gap-4 border-b border-primary/20 pb-5">
            <div class="grid size-16 shrink-0 place-items-center rounded-full bg-primary/15 text-xl font-bold text-primary">{{ initials(selected.name) }}</div>
            <div class="min-w-0">
              <p class="text-lg font-bold uppercase text-highlighted">{{ selected.name }}</p>
              <p class="text-sm text-muted">Cliente registrado</p>
            </div>
          </div>

          <section class="border-b border-default py-4">
            <p class="mb-2 flex items-center gap-2 font-semibold text-highlighted"><UIcon name="i-heroicons-user" class="size-5 text-primary" />Información personal</p>
            <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span class="text-toned">Documento de identidad</span>
              <span class="flex items-center gap-2 font-medium">{{ selected.document ? `DNI: ${selected.document}` : '-' }}<button v-if="selected.document" type="button" class="text-primary" title="Copiar" @click="copy(selected.document)"><UIcon name="i-heroicons-clipboard-document" class="size-5" /></button></span>
            </div>
          </section>

          <section class="border-b border-default py-4">
            <p class="mb-2 flex items-center gap-2 font-semibold text-highlighted"><UIcon name="i-heroicons-phone" class="size-5 text-primary" />Información de contacto</p>
            <div v-for="item in [{ label: 'Teléfono', value: selected.phone }, { label: 'Correo electrónico', value: selected.email }]" :key="item.label" class="flex items-center justify-between gap-3 border-b border-default/60 py-1.5 text-sm last:border-0">
              <span class="text-toned">{{ item.label }}</span>
              <span class="flex min-w-0 items-center gap-2 font-medium"><span class="truncate">{{ item.value || '-' }}</span><button v-if="item.value" type="button" class="text-primary" title="Copiar" @click="copy(item.value)"><UIcon name="i-heroicons-clipboard-document" class="size-5" /></button></span>
            </div>
          </section>

          <section class="py-4">
            <p class="mb-2 flex items-center gap-2 font-semibold text-highlighted"><UIcon name="i-heroicons-briefcase" class="size-5 text-primary" />Información comercial</p>
            <div v-for="item in [{ label: 'Fecha de registro', value: fullDate(selected.registered_on) }, { label: 'Provincia', value: selected.province }, { label: 'Origen', value: selected.origin }, { label: 'Servicio', value: selected.service }]" :key="item.label" class="flex items-center justify-between gap-3 border-b border-default/60 py-1.5 text-sm">
              <span class="text-toned">{{ item.label }}</span><span class="font-medium">{{ item.value || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span class="text-toned">Categoría</span>
              <span class="rounded-full bg-primary/15 px-4 py-1 text-sm font-medium text-primary">{{ selected.category }}</span>
            </div>
          </section>
        </div>
      </template>
    </USlideover>
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

const initials = (value: string) => (value || '').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
const copy = (value: string) => { try { navigator.clipboard?.writeText(value) } catch { /* sin portapapeles */ } }

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
    class: `inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.original.category === 'Prospecto' ? 'bg-elevated text-toned' : 'bg-info/15 text-info'}`
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
