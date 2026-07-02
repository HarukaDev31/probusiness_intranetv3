<template>
  <div class="p-6">
    <DataTable
      :title="tableTitle"
      subtitle="Leads privados captados en landings"
      icon="i-heroicons-inbox-stack"
      :show-title="true"
      :data="tableData"
      :columns="tableColumns"
      :loading="loading"
      :current-page="tablePagination.current_page"
      :total-pages="tablePagination.last_page"
      :total-records="tablePagination.total"
      :items-per-page="tablePerPage"
      :primary-search-value="tableSearch"
      :show-primary-search="true"
      primary-search-placeholder="Buscar por nombre, whatsapp o email"
      :show-filters="false"
      :show-export="true"
      :show-body-top="true"
      empty-state-message="No se encontraron leads."
      @update:primary-search="handleSearch"
      @page-change="handlePageChange"
      @items-per-page-change="handleItemsPerPageChange"
      @export="handleExport"
    >
      <template #body-top>
        <UTabs v-model="activeTab" :items="tabs" variant="pill" class="w-80" />
      </template>

      <template #error-state>
        <ErrorState :message="error || 'Error desconocido'" />
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useLandingLeads } from '~/composables/useLandingLeads'
import type { LandingConsolidadoLead, LandingCursoLead, LandingLeadPagination } from '~/types/landing-leads'
import { formatDate } from '~/utils/formatters'
import { LandingLeadsService } from '~/services/landing/landingLeadsService'

definePageMeta({ layout: 'default' })

const {
  activeTab,
  loading,
  error,
  consolidadoLeads,
  cursoLeads,
  searchConsolidado,
  searchCurso,
  perPageConsolidado,
  perPageCurso,
  paginationConsolidado,
  paginationCurso,
  loadConsolidado,
  loadCurso
} = useLandingLeads()

const tabs = [
  { label: 'Landing consolidado', value: 'consolidado' },
  { label: 'Landing curso', value: 'curso' }
]

const formatLeadDateTime = (value?: string | null) =>
  value
    ? formatDate(value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    : '-'

const consolidadoColumns: TableColumn<LandingConsolidadoLead>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'whatsapp', header: 'WhatsApp' },
  { accessorKey: 'proveedor', header: 'Proveedor' },
  { accessorKey: 'codigo_campana', header: 'Campaña' },
  { accessorKey: 'ip_address', header: 'IP' },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => h('span', formatLeadDateTime(row.original.created_at))
  }
]

const cursoColumns: TableColumn<LandingCursoLead>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'whatsapp', header: 'WhatsApp' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'experiencia_importando', header: 'Experiencia' },
  { accessorKey: 'ip_address', header: 'IP' },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => h('span', formatLeadDateTime(row.original.created_at))
  }
]

const tableTitle = computed(() =>
  activeTab.value === 'consolidado' ? 'Leads Landing Consolidado' : 'Leads Landing Curso'
)

const tableData = computed(() =>
  activeTab.value === 'consolidado' ? consolidadoLeads.value : cursoLeads.value
)

const tableColumns = computed(() =>
  activeTab.value === 'consolidado' ? consolidadoColumns : cursoColumns
)

const tablePagination = computed<LandingLeadPagination>(() =>
  activeTab.value === 'consolidado' ? paginationConsolidado.value : paginationCurso.value
)

const tableSearch = computed(() =>
  activeTab.value === 'consolidado' ? searchConsolidado.value : searchCurso.value
)

const tablePerPage = computed(() =>
  activeTab.value === 'consolidado' ? perPageConsolidado.value : perPageCurso.value
)

const handleSearch = async (value: string) => {
  if (activeTab.value === 'consolidado') {
    searchConsolidado.value = value
    paginationConsolidado.value.current_page = 1
    await loadConsolidado()
    return
  }

  searchCurso.value = value
  paginationCurso.value.current_page = 1
  await loadCurso()
}

const handlePageChange = async (page: number) => {
  if (activeTab.value === 'consolidado') {
    paginationConsolidado.value.current_page = page
    await loadConsolidado()
    return
  }

  paginationCurso.value.current_page = page
  await loadCurso()
}

const handleItemsPerPageChange = async (perPage: number) => {
  if (activeTab.value === 'consolidado') {
    perPageConsolidado.value = perPage
    paginationConsolidado.value.current_page = 1
    await loadConsolidado()
    return
  }

  perPageCurso.value = perPage
  paginationCurso.value.current_page = 1
  await loadCurso()
}

const handleExport = async () => {
  const isConsolidado = activeTab.value === 'consolidado'
  const params = {
    search: isConsolidado ? (searchConsolidado.value || undefined) : (searchCurso.value || undefined)
  }

  const blob = isConsolidado
    ? await LandingLeadsService.exportConsolidadoLeads(params)
    : await LandingLeadsService.exportCursoLeads(params)

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  const fileName = `landing_leads_${isConsolidado ? 'consolidado' : 'curso'}_${new Date().toISOString().slice(0, 10)}.xlsx`
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

watch(activeTab, async (tab) => {
  if (tab === 'consolidado') {
    await loadConsolidado()
  } else {
    await loadCurso()
  }
})

onMounted(async () => {
  await loadConsolidado()
})
</script>

