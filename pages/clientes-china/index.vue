<template>
  <SupplierPaymentPage title="Clientes" subtitle="Socios e importadores a los que Almacén China factura sus servicios.">
    <template #actions>
      <UButton color="primary" icon="i-heroicons-plus" @click="openForm(null)">Nuevo cliente</UButton>
    </template>

    <SupplierPaymentTabs v-model="tab" :items="tabs" class="mb-4" />

    <ChinaOrganizationClients
      v-if="activeGroup"
      :organization-id="activeGroup.organization_id"
      :name="activeGroup.name"
      :label="activeGroup.label"
    />

    <DataTable
      v-show="!activeGroup"
      sticky-last-column
      keep-spanish-headers
      filters-layout="inline"
      :fill-viewport="false"
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
      primary-search-placeholder="Buscar por nombre, WhatsApp o correo"
      :show-filters="false"
      :inline-count-text="`${pagination.total} de ${counts.all ?? pagination.total}`"
      :show-export="false"
      empty-state-message="No hay clientes que coincidan."
      @update:primary-search="onSearch"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    >
      <template #actions>
        <div class="order-first inline-flex rounded-xl bg-[#eef1f6] p-1">
          <button
            v-for="item in types"
            :key="item.key"
            type="button"
            class="rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors"
            :class="type === item.key ? 'bg-default text-highlighted shadow-sm' : 'text-toned hover:text-highlighted'"
            @click="changeType(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
      </template>
    </DataTable>

    <ChinaClientDetail :client="detail" @close="detail = null" @balance="openBalance" />
    <ChinaClientForm :open="formOpen" :client="editing" @close="formOpen = false" @saved="onSaved" />
    <ChinaDocumentsModal :target="documentTarget" @close="documentTarget = null" />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import ChinaClientDetail from '~/components/china-billing/ChinaClientDetail.vue'
import ChinaClientForm from '~/components/china-billing/ChinaClientForm.vue'
import ChinaDocumentsModal from '~/components/china-billing/ChinaDocumentsModal.vue'
import ChinaOrganizationClients from '~/components/china-billing/ChinaOrganizationClients.vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import { useChinaClients } from '~/composables/china-billing/useChinaClients'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaClient, ChinaDocumentTarget } from '~/types/china-billing'
import { UIcon } from '#components'

const { type, search, rows, counts, groups, pagination, loading, load, reload, changeType } = useChinaClients()
const { showConfirmation, showError } = useModal()

// Pestaña «China»: socios e importadores. Una pestaña por organización: los clientes que registró.
const tab = ref('china')
const tabs = computed(() => [
  { label: 'China', value: 'china', count: counts.value.all ?? 0 },
  ...groups.value.map((group) => ({ label: group.label, value: `org-${group.organization_id}`, count: group.count }))
])
const activeGroup = computed(() => groups.value.find((group) => `org-${group.organization_id}` === tab.value) || null)

const detail = ref<ChinaClient | null>(null)
const editing = ref<ChinaClient | null>(null)
const formOpen = ref(false)
const documentTarget = ref<ChinaDocumentTarget | null>(null)

const types = [
  { key: 'all', label: 'Todos' },
  { key: 'partner', label: 'Socios' },
  { key: 'importer', label: 'Importadores' }
]

const right = { th: 'text-right', td: 'text-right' }

/** «14/08/2026», como en la maqueta. */
function fullDate(date: string | null): string {
  const [year, month, day] = (date || '').split('-')
  return year ? `${day}/${month}/${year}` : '—'
}

const iconButton = (icon: string, label: string, onClick: () => void, tone = 'hover:bg-primary/10 hover:text-primary', disabled = false) => h('button', {
  type: 'button',
  title: label,
  'aria-label': label,
  disabled,
  class: `grid size-8 place-items-center rounded-lg text-toned transition-colors ${tone} ${disabled ? 'cursor-not-allowed opacity-30' : ''}`,
  onClick
}, h(UIcon, { name: icon, class: 'size-4' }))

const columns: TableColumn<ChinaClient>[] = [
  { accessorKey: 'number', header: 'N°', cell: ({ row }) => h('span', { class: 'text-muted' }, String(row.original.number ?? '')) },
  { accessorKey: 'registered_on', header: 'Fecha', cell: ({ row }) => h('span', { class: 'whitespace-nowrap' }, fullDate(row.original.registered_on)) },
  { accessorKey: 'name', header: 'Cliente', cell: ({ row }) => h('div', { class: 'flex min-w-48 flex-col' }, [
    h('span', { class: 'font-semibold' }, row.original.name),
    h('span', { class: 'text-xs text-muted' }, row.original.whatsapp || '—'),
    h('span', { class: 'text-xs text-muted' }, [row.original.contact_name, row.original.email].filter(Boolean).join(' · ') || '—')
  ]) },
  { accessorKey: 'country', header: 'País', cell: ({ row }) => h('span', row.original.country || '—') },
  { accessorKey: 'type', header: 'Tipo', cell: ({ row }) => h('span', {
    class: `inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.original.type === 'partner' ? 'bg-[#fff3ea] text-[#b4480c]' : 'bg-[#eef1f6] text-[#4a5a72]'}`
  }, row.original.type === 'partner' ? 'Socio' : 'Importador') },
  { accessorKey: 'service_amount', header: 'Total servicio', meta: { class: right }, cell: ({ row }) => h('span', usd(row.original.service_amount)) },
  { accessorKey: 'total_billed', header: 'Total facturado', meta: { class: right }, cell: ({ row }) => h('span', usd(row.original.total_billed)) },
  { accessorKey: 'paid', header: 'Total pagado', meta: { class: right }, cell: ({ row }) => h('span', usd(row.original.paid)) },
  { accessorKey: 'receivable', header: 'Por cobrar', meta: { class: right }, cell: ({ row }) => h('span', { class: row.original.receivable > 0.005 ? 'font-semibold text-error' : '' }, usd(row.original.receivable)) },
  { id: 'operations', header: 'Operaciones', cell: ({ row }) => h('div', { class: 'flex flex-col text-xs text-toned' }, [
    h('span', [h('strong', { class: 'text-sm text-highlighted' }, String(row.original.open_count)), ' abiertas']),
    h('span', [h('strong', { class: 'text-sm text-highlighted' }, String(row.original.closed_count)), ' cerradas'])
  ]) },
  { id: 'actions', header: 'Acciones', cell: ({ row }) => h('div', { class: 'flex gap-1' }, [
    iconButton('i-heroicons-eye', 'Ver cliente', () => openDetail(row.original)),
    iconButton('i-heroicons-pencil-square', 'Editar', () => openForm(row.original)),
    iconButton(
      'i-heroicons-trash',
      row.original.can_delete ? 'Eliminar' : 'Los socios se administran desde su organización',
      () => remove(row.original),
      'hover:bg-error/10 hover:text-error',
      !row.original.can_delete
    )
  ]) }
]

async function openDetail(client: ChinaClient) {
  try {
    detail.value = (await ChinaBillingService.getClient(client.id)).data
  } catch (error: any) {
    showError('Clientes', error?.message || 'No se pudo abrir el cliente.')
  }
}

function openForm(client: ChinaClient | null) {
  editing.value = client
  formOpen.value = true
}

function openBalance(client: ChinaClient) {
  documentTarget.value = { kind: 'balance', mode: 'china', title: `Balance de pago · ${client.name}`, organizationId: client.organization_id! }
}

function remove(client: ChinaClient) {
  showConfirmation(`¿Eliminar a ${client.name}?`, 'Esta acción no se puede deshacer.', async () => {
    try {
      await ChinaBillingService.deleteClient(client.id)
      load()
    } catch (error: any) {
      showError('Clientes', error?.message || 'No se pudo eliminar el cliente.')
    }
  })
}

function onSaved() {
  formOpen.value = false
  load()
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

onMounted(load)
</script>
