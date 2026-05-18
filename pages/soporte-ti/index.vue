<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
    <UCard v-if="error" color="warning" variant="subtle">
      <p class="text-sm">{{ error }}</p>
    </UCard>


    <SoporteTiStatsCards :stats="stats" class="shrink-0" />
    <DataTable title="" icon="" :show-headers="false" :hide-back-button="true" :data="filasTabla" :columns="columns"
      :loading="loading" :show-pagination="false" :show-bottom-section="false" :show-filters="true" :show-export="false"
      :show-new-button="false" :show-primary-search-label="false" :primary-search-value="q" :search-query-value="q"
      primary-search-placeholder="Buscar código o título..." :filter-config="filterConfig" :filters-value="filtersDraft"
      :search-debounce-ms="300" :show-kanban="true" :kanban-columns="SOPORTE_TI_KANBAN_BOARD"
      kanban-group-field="estadoCodigo" kanban-title-field="titulo" kanban-row-key-field="codigo"
      empty-state-message="No hay solicitudes que coincidan con los filtros." @update:primary-search="onPrimarySearch"
      @filter-change="onFilterChange" @row-click="onRowClick">
      <template #actions>
        <UButton
          v-if="rolActivo !== 'Solicitante'"
          size="sm"
          variant="outline"
          icon="i-heroicons-clock"
          @click="navigateTo('/soporte-ti/configuracion/horas-tipo-b')"
        >
          Horas tipo B
        </UButton>
        <UButton
          v-if="rolActivo !== 'Solicitante'"
          size="sm"
          variant="outline"
          icon="i-heroicons-cog-6-tooth"
          @click="navigateTo('/soporte-ti/configuracion/horas-tipo-a')"
        >
          Horas tipo A
        </UButton>
        <UButton v-if="rolActivo === 'Solicitante'" size="sm" icon="i-heroicons-plus" @click="modalCrear = true">
          Nueva solicitud
        </UButton>
      </template>
      <template #kanban-card="{ row }">
        <SoporteTiKanbanCard
          :row="row as any"
          :variant="(row as SoporteTiSolicitud).gestion.esCreador ? 'solicitante' : 'staff'"
        />
      </template>
    </DataTable>


    <SoporteTiModalCreate v-model:open="modalCrear" :loading="creandoSolicitud" @saved="onCreada" />

    <SoporteTiEvidenciaModal :open="evidenciaTicket != null" :ticket="evidenciaTicket"
      @update:open="onEvidenciaModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted, onUnmounted, watch, resolveComponent } from 'vue'
import { navigateTo } from '#imports'
import type { TableColumn } from '@nuxt/ui'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import type { SoporteTiCreatePayload, SoporteTiListFilters, SoporteTiSolicitud } from '~/types/soporteTi'
import type { FilterConfig } from '~/types/data-table'
import DataTable from '~/components/DataTable.vue'
import SoporteTiStatsCards from '~/components/soporte-ti/SoporteTiStatsCards.vue'
import SoporteTiKanbanCard from '~/components/soporte-ti/SoporteTiKanbanCard.vue'
import SoporteTiModalCreate from '~/components/soporte-ti/SoporteTiModalCreate.vue'
import SoporteTiEvidenciaModal from '~/components/soporte-ti/SoporteTiEvidenciaModal.vue'
import { SOPORTE_TI_KANBAN_BOARD } from '~/constants/soporteTiEstados'
import { SOPORTE_TI_COMPLEJIDADES, complejidadOk } from '~/utils/soporteTiComplejidad'
import { estadosItemsCompletos } from '~/utils/soporteTiGestion'
import {
  clasesSelectComplejidad,
  clasesSelectEstado,
  clasesSelectPrioridad
} from '~/constants/soporteTiColores'
import { useSoporteTiAcciones } from '~/composables/useSoporteTiAcciones'
import { useModal } from '~/composables/commons/useModal'
import { formatSoporteTiRegistro } from '~/utils/formatters'
import {
  SOPORTE_TI_PRIORIDADES,
  prioridadOk,
  etiquetaPrioridad
} from '~/constants/soporteTiPrioridad'
import { useSpinner } from '~/composables/commons/useSpinner'

definePageMeta({
  middleware: 'auth'
})

const { fetchCurrentUser } = useUserRole()
const { cambiarComplejidad, cambiarEstado } = useSoporteTiAcciones()
const { actualizarPrioridadSolicitud } = useSoporteTi()

const {
  rolActivo,
  solicitudes,
  stats,
  error,
  cargar,
  crearSolicitud,
} = useSoporteTi()

const loading = ref(false)

async function cargarLista(filters?: SoporteTiListFilters) {
  loading.value = true
  try {
    await cargar(filters)
  } finally {
    loading.value = false
  }
}

const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

const { setSalaActiva } = useSoporteTiChatRoom()

const modalCrear = ref(false)
const creandoSolicitud = ref(false)
const evidenciaTicket = ref<SoporteTiSolicitud | null>(null)

function onEvidenciaModalOpen(open: boolean) {
  if (!open) evidenciaTicket.value = null
}

const q = ref('')
const filtroTipo = ref<'todos' | 'A' | 'B'>('todos')
const filtersDraft = computed(() => ({ tipo: filtroTipo.value }))

const filterConfig: FilterConfig[] = [
  {
    key: 'tipo',
    label: 'Tipo',
    placeholder: 'Tipo',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Tipo A', value: 'A' },
      { label: 'Tipo B', value: 'B' }
    ]
  }
]

function onFilterChange(key: string, value: string) {
  if (key === 'tipo' && (value === 'todos' || value === 'A' || value === 'B')) {
    filtroTipo.value = value
    void cargarLista(filtrosLista())
  }
}

/** Filas con campos derivados para columnas simples (`accessorKey` + `header`). */
type SoporteTiTablaFila = SoporteTiSolicitud & {
  tipoSolicitud: string
  fechaRegistroCompleta: string
  fechaFinEstimadoFmt: string
  estadoLabel: string
}

const filasTabla = computed<SoporteTiTablaFila[]>(() =>
  solicitudes.value.map((s) => ({
    ...s,
    tipoSolicitud: s.tipo === 'A' ? 'A' : s.subtipoB || 'B',
    fechaRegistroCompleta: formatSoporteTiRegistro(s.fechaRegistroIso ?? s.fechaRegistro),
    fechaFinEstimadoFmt: s.gestion.terminoEstimado,
    estadoLabel: s.estado || s.estadoCodigo
  }))
)

function filtrosLista(): SoporteTiListFilters {
  return {
    q: q.value.trim() || undefined,
    tipo: filtroTipo.value
  }
}

function onPrimarySearch(value: string) {
  q.value = value
  void cargarLista(filtrosLista())
}

function rutaDetalle(row: SoporteTiSolicitud) {
  if (row.backendId == null) return '/soporte-ti'
  return `/soporte-ti/${row.backendId}`
}

function onRowClick(row: Record<string, unknown>) {
  void navigateTo(rutaDetalle(row as unknown as SoporteTiSolicitud))
}

const UIcon = resolveComponent('UIcon')
const USelect = resolveComponent('USelect')

const itemsComplejidadAnalista = SOPORTE_TI_COMPLEJIDADES.map((c) => ({
  label: c,
  value: c
}))

const itemsPrioridad = SOPORTE_TI_PRIORIDADES.map((p) => ({
  label: p.label,
  value: p.value
}))

async function onCambioPrioridadTabla(t: SoporteTiSolicitud, val: unknown) {
  const n = typeof val === 'number' ? val : Number(val)
  if (!prioridadOk(n) || t.prioridad === n) return
  try {
    await withSpinner(async () => {
      const res = await actualizarPrioridadSolicitud(t, n)
      if (res.ok === false) throw new Error(res.error)
    }, 'Actualizando prioridad…')
    showSuccess(
      'Prioridad actualizada',
      `El ticket ${t.codigo} quedó en «${etiquetaPrioridad(n)}».`
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar la prioridad.'
    showError('Error al actualizar prioridad', msg)
  }
}

async function onCambioComplejidadTabla(
  t: SoporteTiSolicitud,
  val: unknown,
  rol: 'pm' | 'analista' | 'legacy' = 'legacy'
) {
  const raw = typeof val === 'string' ? val : String(val ?? '')
  if (!complejidadOk(raw)) return
  await cambiarComplejidad(t, raw, { rol })
}

async function onCambioEstadoTabla(t: SoporteTiSolicitud, val: unknown) {
  const codigo = typeof val === 'string' ? val : String(val ?? '')
  await cambiarEstado(t, codigo, { rolEtiqueta: t.gestion.esStaff ? 'analista' : undefined })
}

function celdaEstadoTicket(t: SoporteTiSolicitud) {
  const g = t.gestion
  const codigo = g.estadoValor ?? t.estadoCodigo
  if (!g.puedeEstado) {
    return h(
      'span',
      {
        class: `inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${clasesSelectEstado(codigo)}`
      },
      t.estado
    )
  }
  return h(
    'div',
    {
      key: `${t.chatUuid}-estado`,
      class: 'min-w-0',
      onClick: stopRowNav,
      onPointerdown: stopRowNav
    },
    [
      h(USelect as any, {
        modelValue: codigo || undefined,
        items: estadosItemsCompletos(t.tipo, g.estados, { editable: g.estadoEditable }),
        disabled: !g.estadoEditable,
        valueKey: 'value',
        labelKey: 'label',
        size: 'sm',
        class: ['w-full min-w-0', clasesSelectEstado(codigo)],
        placeholder: g.estadoPlaceholder,
        'onUpdate:modelValue': (v: unknown) => void onCambioEstadoTabla(t, v)
      })
    ]
  )
}

function stopRowNav(e: Event) {
  e.stopPropagation()
}

const tdSelectAnalista = 'min-w-[7.5rem] max-w-[13rem] w-[10rem] align-top'

function botonOjo(options: {
  titulo: string
  deshabilitado?: boolean
  onClick: (e: MouseEvent) => void
}) {
  const dis = Boolean(options.deshabilitado)
  return h(
    'button',
    {
      type: 'button',
      disabled: dis,
      class: dis
        ? 'inline-flex cursor-not-allowed rounded-md p-2 text-slate-300'
        : 'inline-flex rounded-md p-2 text-slate-600 hover:bg-slate-200 hover:text-blue-700',
      title: options.titulo,
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        if (!dis) options.onClick(e)
      }
    },
    h(UIcon, { name: 'i-heroicons-eye', class: 'size-5' })
  )
}

function celdaTituloTabla(titulo: string | undefined | null) {
  const text = (titulo ?? '').trim() || '—'
  return h(
    'span',
    {
      class:
        'block w-full min-w-0 truncate text-left text-sm text-gray-900 dark:text-gray-100',
      title: text !== '—' ? text : undefined
    },
    text
  )
}

function columnaTitulo(header: string): TableColumn<SoporteTiTablaFila> {
  const cap = 'min-w-0 max-w-[14rem] sm:max-w-[18rem] lg:max-w-[22rem] align-top'
  return {
    accessorKey: 'titulo',
    header,
    meta: {
      class: {
        th: cap,
        td: cap
      }
    },
    cell: ({ row }) => celdaTituloTabla(row.original.titulo)
  }
}

const columns = computed<TableColumn<SoporteTiTablaFila>[]>(() => {
  const colEstado: TableColumn<SoporteTiTablaFila> = {
    id: 'estado',
    accessorKey: 'estadoCodigo',
    header: 'Estado',
    meta: {
      class: {
        th: tdSelectAnalista,
        td: tdSelectAnalista
      }
    },
    cell: ({ row }) => celdaEstadoTicket(row.original)
  }

  const colAcciones: TableColumn<SoporteTiTablaFila> = {
    id: 'acciones',
    accessorKey: 'codigo',
    header: 'Acciones',
    cell: ({ row }) =>
      botonOjo({
        titulo: 'Ver detalle',
        onClick: () => void navigateTo(rutaDetalle(row.original))
      })
  }

  if (rolActivo.value === 'Solicitante') {
    return [
      { accessorKey: 'codigo', header: 'Código' },
      { accessorKey: 'tipoSolicitud', header: 'Tipo solicitud' },
      columnaTitulo('Nombre'),
      { accessorKey: 'fechaRegistroCompleta', header: 'Fecha de registro' },
      { accessorKey: 'fechaFinEstimadoFmt', header: 'Término estimado' },
      colEstado,
      colAcciones
    ]
  }

  const colEvidencia: TableColumn<SoporteTiTablaFila> = {
    id: 'evidencia',
    accessorKey: 'codigo',
    header: 'Evidencia',
    cell: ({ row }) => {
      const t = row.original
      return botonOjo({
        titulo: 'Ver evidencia / contexto',
        onClick: () => {
          evidenciaTicket.value = t
        }
      })
    }
  }

  const colArea: TableColumn<SoporteTiTablaFila> = {
    accessorKey: 'area',
    header: 'Área',
    cell: ({ row }) =>
      h(
        'span',
        {
          class:
            'max-w-[11rem] whitespace-normal break-words text-xs leading-snug text-slate-700'
        },
        row.original.area
      )
  }

  function celdaComplejidad(
    t: SoporteTiSolicitud,
    opts: {
      key: string
      puede: boolean
      valor: string | null | undefined
      texto: string
      rol: 'pm' | 'analista' | 'legacy'
    }
  ) {
    const valorMostrar = opts.valor ?? opts.texto
    if (!opts.puede) {
      return h(
        'span',
        {
          class: `inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${clasesSelectComplejidad(valorMostrar)}`
        },
        opts.texto
      )
    }
    return h(
      'div',
      {
        key: `${t.chatUuid}-${opts.key}`,
        class: 'min-w-0',
        onClick: stopRowNav,
        onPointerdown: stopRowNav
      },
      [
        h(USelect as any, {
          modelValue: opts.valor ?? undefined,
          items: itemsComplejidadAnalista,
          valueKey: 'value',
          labelKey: 'label',
          size: 'sm',
          class: ['w-full min-w-0', clasesSelectComplejidad(opts.valor ?? opts.texto)],
          placeholder: 'Definir',
          'onUpdate:modelValue': (v: unknown) => void onCambioComplejidadTabla(t, v, opts.rol)
        })
      ]
    )
  }

  const colPrioridad: TableColumn<SoporteTiTablaFila> = {
    id: 'prioridad',
    accessorKey: 'prioridad',
    header: 'Prioridad',
    meta: { class: { th: tdSelectAnalista, td: tdSelectAnalista } },
    cell: ({ row }) => {
      const t = row.original
      const p = t.prioridad ?? 2
      if (rolActivo.value !== 'PM') {
        return h(
          'span',
          {
            class: `inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${clasesSelectPrioridad(p)}`
          },
          etiquetaPrioridad(p)
        )
      }
      return h(
        'div',
        {
          key: `${t.chatUuid}-prioridad`,
          class: 'min-w-0',
          onClick: stopRowNav,
          onPointerdown: stopRowNav
        },
        [
          h(USelect as any, {
            modelValue: p,
            items: itemsPrioridad,
            valueKey: 'value',
            labelKey: 'label',
            size: 'sm',
            class: ['w-full min-w-0', clasesSelectPrioridad(p)],
            'onUpdate:modelValue': (v: unknown) => void onCambioPrioridadTabla(t, v)
          })
        ]
      )
    }
  }

  const colComplejidadPm: TableColumn<SoporteTiTablaFila> = {
    id: 'complejidad-pm',
    accessorKey: 'complejidadPm',
    header: 'Compl. PM',
    meta: { class: { th: tdSelectAnalista, td: tdSelectAnalista } },
    cell: ({ row }) => {
      const t = row.original
      if (t.tipo !== 'A') return h('span', { class: 'text-xs text-muted' }, '—')
      return celdaComplejidad(t, {
        key: 'pm-complejidad',
        puede: t.gestion.puedeComplejidadPm,
        valor: t.gestion.complejidadPmValor,
        texto: t.complejidadPm ?? t.criticidad,
        rol: 'pm'
      })
    }
  }

  const colComplejidadAnalista: TableColumn<SoporteTiTablaFila> = {
    id: 'complejidad-analista',
    accessorKey: 'criticidad',
    header: 'Compl. analista',
    meta: {
      class: {
        th: tdSelectAnalista,
        td: tdSelectAnalista
      }
    },
    cell: ({ row }) => {
      const t = row.original
      if (t.tipo === 'A') {
        return celdaComplejidad(t, {
          key: 'analista-complejidad',
          puede: t.gestion.puedeComplejidadAnalista,
          valor: t.gestion.complejidadAnalistaValor,
          texto: t.complejidadAnalista ?? 'Por definir',
          rol: 'analista'
        })
      }
      return celdaComplejidad(t, {
        key: 'analista-complejidad',
        puede: t.gestion.puedeComplejidad,
        valor: t.gestion.complejidadValor,
        texto: t.criticidad,
        rol: 'legacy'
      })
    }
  }

  return [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'tipoSolicitud', header: 'Tipo' },
    columnaTitulo('Título'),
    colArea,
    { accessorKey: 'fechaRegistroCompleta', header: 'Fecha de registro' },
    ...(rolActivo.value === 'PM' || rolActivo.value === 'Analista'
      ? [colPrioridad]
      : []),
    ...(rolActivo.value === 'PM' ? [colComplejidadPm] : []),
    ...(rolActivo.value === 'Analista' ? [colComplejidadAnalista] : []),
    colEstado,
    colEvidencia,
    colAcciones
  ]
})

async function onCreada(payload: SoporteTiCreatePayload) {
  creandoSolicitud.value = true
  try {
    const nueva = await withSpinner(
      () => crearSolicitud(payload),
      'Creando solicitud…'
    )
    showSuccess('Solicitud creada', `Se creó el ticket ${nueva.codigo}.`)
    modalCrear.value = false
    void navigateTo(rutaDetalle(nueva))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo crear la solicitud.'
    showError('No se pudo crear la solicitud', msg)
    modalCrear.value = false
  } finally {
    creandoSolicitud.value = false
  }
}

onMounted(() => {
  fetchCurrentUser()
  void cargarLista(filtrosLista())
})

onUnmounted(() => {
  setSalaActiva(null)
})
</script>
