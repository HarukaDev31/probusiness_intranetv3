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
        <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UTabs v-model="activeTab" :items="tabs" variant="pill" class="w-80" />
          <UButton
            v-if="activeTab === 'curso'"
            icon="i-heroicons-clock"
            label="Contador landing"
            color="neutral"
            variant="soft"
            @click="openCountdownModal"
          />
        </div>
      </template>

      <template #error-state>
        <ErrorState :message="error || 'Error desconocido'" />
      </template>
    </DataTable>

    <UModal v-model:open="showCountdownModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold">Contador landing curso</h3>
                <p class="text-sm text-muted">
                  Fecha/hora fin del contador ({{ countdownTimezone || 'America/Lima' }})
                </p>
              </div>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showCountdownModal = false" />
            </div>
          </template>

          <div class="space-y-4">
            <UFormField label="Fecha y hora de fin" name="ends_at" required>
              <UInput
                v-model="countdownEndsAtLocal"
                type="datetime-local"
                class="w-full"
                :disabled="countdownLoading || countdownSaving"
              />
            </UFormField>

            <p v-if="countdownPreviewIso" class="text-xs text-muted">
              Se guardará como: <code class="text-highlighted">{{ countdownPreviewIso }}</code>
            </p>

            <UAlert
              v-if="countdownError"
              color="error"
              variant="subtle"
              :title="countdownError"
              icon="i-heroicons-exclamation-triangle"
            />

            <UAlert
              v-if="countdownSuccess"
              color="success"
              variant="subtle"
              :title="countdownSuccess"
              icon="i-heroicons-check-circle"
            />

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                variant="ghost"
                label="Cancelar"
                :disabled="countdownSaving"
                @click="showCountdownModal = false"
              />
              <UButton
                color="primary"
                label="Guardar"
                :loading="countdownSaving"
                :disabled="countdownLoading || !countdownEndsAtLocal"
                @click="saveCountdown"
              />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useLandingLeads } from '~/composables/useLandingLeads'
import type { LandingConsolidadoLead, LandingCursoLead, LandingLeadPagination } from '~/types/landing-leads'
import { formatDate } from '~/utils/formatters'
import { LandingLeadsService } from '~/services/landing/landingLeadsService'
import { LandingCountdownService } from '~/services/landing/landingCountdownService'

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

const showCountdownModal = ref(false)
const countdownLoading = ref(false)
const countdownSaving = ref(false)
const countdownError = ref('')
const countdownSuccess = ref('')
const countdownTimezone = ref('America/Lima')
const countdownEndsAtLocal = ref('')

const countdownPreviewIso = computed(() => {
  if (!countdownEndsAtLocal.value) return ''
  try {
    return toIsoFromLocalInput(countdownEndsAtLocal.value)
  } catch {
    return ''
  }
})

function toLocalInputValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIsoFromLocalInput(localValue: string): string {
  const [datePart, timePart = '00:00'] = localValue.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-05:00`
}

async function loadCountdown() {
  countdownLoading.value = true
  countdownError.value = ''
  countdownSuccess.value = ''
  try {
    const data = await LandingCountdownService.getCountdown()
    countdownTimezone.value = data.timezone || 'America/Lima'
    countdownEndsAtLocal.value = toLocalInputValue(data.ends_at)
  } catch (e: any) {
    countdownError.value = e?.message || 'No se pudo cargar la fecha del contador.'
  } finally {
    countdownLoading.value = false
  }
}

async function openCountdownModal() {
  showCountdownModal.value = true
  await loadCountdown()
}

async function saveCountdown() {
  if (!countdownEndsAtLocal.value) return

  countdownSaving.value = true
  countdownError.value = ''
  countdownSuccess.value = ''
  try {
    const data = await LandingCountdownService.updateCountdown(
      toIsoFromLocalInput(countdownEndsAtLocal.value)
    )
    countdownTimezone.value = data.timezone || 'America/Lima'
    countdownEndsAtLocal.value = toLocalInputValue(data.ends_at)
    countdownSuccess.value = 'Fecha del contador actualizada.'
  } catch (e: any) {
    countdownError.value = e?.message || 'No se pudo guardar la fecha del contador.'
  } finally {
    countdownSaving.value = false
  }
}

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

const formatConsolidadoFormSource = (value?: string | null) => {
  if (value === 'landing_consolidado_v2') return 'META CONSOLIDADO'
  if (value === 'probusiness_pe') return 'WEB'
  return value || '-'
}

const formatCursoFormSource = (value?: string | null) => {
  if (value === 'landing_curso_v2') return 'META CURSO'
  if (value === 'probusiness_pe') return 'WEB'
  return value || '-'
}

const consolidadoColumns: TableColumn<LandingConsolidadoLead>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'whatsapp', header: 'WhatsApp' },
  { accessorKey: 'proveedor', header: 'Proveedor' },
  { accessorKey: 'codigo_campana', header: 'Campaña' },
  {
    accessorKey: 'form_source',
    header: 'Origen',
    cell: ({ row }: { row: any }) => h('span', formatConsolidadoFormSource(row.original.form_source))
  },
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
  {
    accessorKey: 'form_source',
    header: 'Origen',
    cell: ({ row }: { row: any }) => h('span', formatCursoFormSource(row.original.form_source))
  },
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
