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
        <UButton v-if="rolActivo === 'Solicitante'" size="sm" icon="i-heroicons-plus" @click="modalCrear = true">
          Nueva solicitud
        </UButton>
      </template>
      <template #kanban-card="{ row }">
        <SoporteTiKanbanCard :row="row as any" :variant="rolActivo === 'Solicitante' ? 'solicitante' : 'staff'" />
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
import { SOPORTE_TI_ESTADOS, SOPORTE_TI_KANBAN_BOARD } from '~/constants/soporteTiEstados'
import {
  SOPORTE_TI_COMPLEJIDADES,
  esComplejidadCatalogo,
  puedePasarAEnProgreso
} from '~/utils/soporteTiCriticidad'
import { aplicarCambioEstadoEnSolicitud } from '~/utils/soporteTiEstadoTransition'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { formatDate, formatSoporteTiRegistro } from '~/utils/formatters'

definePageMeta({
  middleware: 'auth'
})

const {
  rolActivo,
  solicitudes,
  usarApi,
  stats,
  error,
  cargar,
  crearSolicitud,
  handlersSala,
  actualizarSolicitud,
  agregarMensajeSistema,
  etiquetaAhora
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

const { fetchCurrentUser } = useUserRole()

const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

const { suscribirSala, desuscribirTodas, setSalaActiva } = useSoporteTiChatRoom()
const salasSuscritas = ref<Set<string>>(new Set())

watch(
  solicitudes,
  (list) => {
    const activos = new Set(list.map((s) => s.chatUuid))
    for (const uuid of activos) {
      if (!salasSuscritas.value.has(uuid)) {
        suscribirSala(uuid, handlersSala(uuid))
        salasSuscritas.value.add(uuid)
      }
    }
  },
  { immediate: true, deep: true }
)

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
    if (usarApi.value) void cargarLista(filtrosLista())
  }
}

/** Con API: el listado ya viene filtrado desde el backend (`q`, `tipo_solicitud`). Demo: filtro local. */
const filtradasLocal = computed(() =>
  solicitudes.value.filter((t) => {
    const qq = q.value.trim().toLowerCase()
    const matchQ =
      !qq ||
      t.titulo.toLowerCase().includes(qq) ||
      t.codigo.toLowerCase().includes(qq)
    const matchT =
      filtroTipo.value === 'todos' ||
      (filtroTipo.value === 'A' && t.tipo === 'A') ||
      (filtroTipo.value === 'B' && t.tipo === 'B')
    return matchQ && matchT
  })
)

/** Filas con campos derivados para columnas simples (`accessorKey` + `header`). */
type SoporteTiTablaFila = SoporteTiSolicitud & {
  tipoSolicitud: string
  fechaRegistroCompleta: string
  fechaFinEstimadoFmt: string
  estadoLabel: string
}

const filasTablaBase = computed(() => (usarApi.value ? solicitudes.value : filtradasLocal.value))

function formatoFechaLista(val: string | null | undefined): string {
  if (val == null || val === '') return '—'
  const d = new Date(val)
  if (!Number.isNaN(d.getTime())) {
    return formatDate(val, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return val
}

const filasTabla = computed<SoporteTiTablaFila[]>(() =>
  filasTablaBase.value.map((s) => ({
    ...s,
    tipoSolicitud: s.tipo === 'A' ? 'A' : s.subtipoB || 'B',
    fechaRegistroCompleta: formatSoporteTiRegistro(s.fechaRegistro),
    fechaFinEstimadoFmt: formatoFechaLista(s.fechaFinEstimado),
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
  if (usarApi.value) void cargarLista(filtrosLista())
}

function rutaDetalle(row: SoporteTiSolicitud) {
  const seg =
    row.backendId != null
      ? String(row.backendId)
      : encodeURIComponent(row.codigo)
  return `/soporte-ti/${seg}`
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

function itemsEstadoAnalistaPara(t: SoporteTiSolicitud) {
  return SOPORTE_TI_ESTADOS.filter(
    (e) =>
      e.codigo !== 'operativo' &&
      (e.tipoSolicitud === null || e.tipoSolicitud === t.tipo)
  ).map((e) => ({ label: e.nombre, value: e.codigo }))
}

async function onCambioComplejidadAnalistaTabla(t: SoporteTiSolicitud, val: unknown) {
  const raw = typeof val === 'string' ? val : String(val ?? '')
  if (!esComplejidadCatalogo(raw)) return
  if (t.criticidad === raw) return
  try {
    await withSpinner(async () => {
      const res = await actualizarSolicitud({
        ...t,
        criticidad: raw,
        ultimaActualizacion: etiquetaAhora()
      })
      if (res.ok === false) throw new Error(res.error)
    }, 'Actualizando complejidad…')
    agregarMensajeSistema(t.chatUuid, t.codigo, `Complejidad actualizada a «${raw}».`)
    showSuccess('Complejidad actualizada', `El ticket ${t.codigo} quedó en «${raw}».`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar la complejidad.'
    showError('Error al actualizar complejidad', msg)
  }
}

async function onCambioEstadoAnalistaTabla(t: SoporteTiSolicitud, val: unknown) {
  if (!esComplejidadCatalogo(t.criticidad)) return
  const nuevoCodigo = typeof val === 'string' ? val : String(val ?? '')
  if (!nuevoCodigo || nuevoCodigo === t.estadoCodigo) return
  if (nuevoCodigo === 'en_progreso' && !puedePasarAEnProgreso(t)) {
    showError(
      'No se puede pasar a En progreso',
      'Revisa la complejidad y el flujo (en tipo A con maqueta, debe estar aprobada).'
    )
    return
  }
  const actualizada = aplicarCambioEstadoEnSolicitud(t, nuevoCodigo)
  try {
    await withSpinner(async () => {
      const res = await actualizarSolicitud({
        ...actualizada,
        ultimaActualizacion: etiquetaAhora()
      })
      if (res.ok === false) throw new Error(res.error)
    }, 'Actualizando estado…')
    agregarMensajeSistema(t.chatUuid, t.codigo, `Estado actualizado a "${actualizada.estado}" (analista).`)
    showSuccess('Estado actualizado', `El ticket ${t.codigo} pasó a «${actualizada.estado}».`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar el estado.'
    showError('Error al actualizar estado', msg)
  }
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
      { accessorKey: 'estadoLabel', header: 'Estado' },
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

  const colComplejidadAnalista: TableColumn<SoporteTiTablaFila> = {
    id: 'complejidad-analista',
    accessorKey: 'criticidad',
    header: 'Complejidad',
    meta: {
      class: {
        th: tdSelectAnalista,
        td: tdSelectAnalista
      }
    },
    cell: ({ row }) => {
      const t = row.original
      return h(
        'div',
        {
          // Clave estable: si cambia con el valor, se desmonta el USelect con el listbox abierto y puede dejar el foco/pointer bloqueados
          key: `${t.chatUuid}-analista-complejidad`,
          class: 'min-w-0',
          onClick: stopRowNav,
          onPointerdown: stopRowNav
        },
        [
          h(USelect as any, {
            modelValue: esComplejidadCatalogo(t.criticidad) ? t.criticidad : undefined,
            items: itemsComplejidadAnalista,
            valueKey: 'value',
            labelKey: 'label',
            size: 'sm',
            class: 'w-full min-w-0',
            placeholder: 'Definir',
            'onUpdate:modelValue': (v: unknown) => void onCambioComplejidadAnalistaTabla(t, v)
          })
        ]
      )
    }
  }

  const colEstadoAnalista: TableColumn<SoporteTiTablaFila> = {
    id: 'estado-analista',
    accessorKey: 'estadoCodigo',
    header: 'Estado',
    meta: {
      class: {
        th: tdSelectAnalista,
        td: tdSelectAnalista
      }
    },
    cell: ({ row }) => {
      const t = row.original
      const puedeEstado = esComplejidadCatalogo(t.criticidad)
      return h(
        'div',
        {
          key: `${t.chatUuid}-analista-estado`,
          class: 'min-w-0',
          onClick: stopRowNav,
          onPointerdown: stopRowNav
        },
        [
          h(USelect as any, {
            modelValue: t.estadoCodigo,
            items: itemsEstadoAnalistaPara(t),
            disabled: !puedeEstado,
            valueKey: 'value',
            labelKey: 'label',
            size: 'sm',
            class: 'w-full min-w-0',
            title: !puedeEstado ? 'Define primero la complejidad' : undefined,
            placeholder: 'Estado',
            'onUpdate:modelValue': (v: unknown) => void onCambioEstadoAnalistaTabla(t, v)
          })
        ]
      )
    }
  }

  return [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'tipoSolicitud', header: 'Tipo' },
    columnaTitulo('Título'),
    colArea,
    { accessorKey: 'fechaRegistroCompleta', header: 'Fecha de registro' },
    ...(rolActivo.value === 'Analista'
      ? [colComplejidadAnalista, colEstadoAnalista]
      : [{ accessorKey: 'estadoLabel', header: 'Estado' }]),
    colEvidencia,
    colAcciones
  ]
})

async function onCreada(payload: SoporteTiCreatePayload) {
  creandoSolicitud.value = true
  try {
    const nueva = await crearSolicitud(payload)
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
  void cargarLista(usarApi.value ? filtrosLista() : undefined)
})

onUnmounted(() => {
  desuscribirTodas()
  setSalaActiva(null)
})
</script>
