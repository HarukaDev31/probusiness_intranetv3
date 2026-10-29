<template>
  <div class="md:p-6">
    <DataTable
      title="Cotizaciones"
      subtitle="Pago a proveedor"
      :show-title="true"
      icon="i-heroicons-banknotes"
      :data="filas"
      :columns="columns"
      :loading="cargando"
      :current-page="paginacion.current_page"
      :total-pages="paginacion.last_page"
      :total-records="paginacion.total"
      :items-per-page="paginacion.per_page"
      :primary-search-value="busqueda"
      :show-primary-search="true"
      :show-primary-search-label="false"
      primary-search-placeholder="Buscar por cotización, cliente o consolidado"
      :show-filters="true"
      :filter-config="filtrosConfig"
      :filters-value="filtros"
      :show-export="false"
      empty-state-message="No hay cotizaciones de pago a proveedor."
      :show-new-button="true"
      new-button-label="Nueva cotización"
      :on-new-button-click="() => navigateTo('/pago-proveedor/cotizaciones/nueva')"
      @update:primary-search="alBuscar"
      @page-change="alCambiarPagina"
      @items-per-page-change="alCambiarTamano"
      @filter-change="alFiltrar"
    >
      <template #body-top>
        <div class="my-3 flex flex-wrap items-end gap-3">
          <label class="text-sm text-gray-600">
            Vigencia de cotizaciones (horas hábiles)
            <input v-model.number="horasVigencia" type="number" min="1" max="240" class="mt-1 block w-28 rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <UButton size="sm" color="primary" variant="soft" :loading="guardandoVigencia" @click="guardarVigencia">Guardar vigencia</UButton>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import type { PagoProveedorCotizacion, PagoProveedorPaginacion } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import { useModal } from '~/composables/commons/useModal'
import { UBadge, UButton } from '#components'

const { showSuccess, showError, showConfirmation } = useModal()
const filas = ref<PagoProveedorCotizacion[]>([])
const cargando = ref(false)
const busqueda = ref('')
const filtros = ref<Record<string, string>>({ estado: 'todos' })
const paginacion = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const horasVigencia = ref(48)
const guardandoVigencia = ref(false)

const filtrosConfig: FilterConfig[] = [
  {
    key: 'estado',
    label: 'Estado',
    placeholder: 'Estado',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Pendiente', value: 'pendiente' },
      { label: 'Vencida', value: 'vencida' },
      { label: 'Confirmada', value: 'confirmada' }
    ]
  }
]

const dinero = (valor: number) => `$${Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const columns: TableColumn<PagoProveedorCotizacion>[] = [
  { accessorKey: 'codigo', header: 'N.°' },
  { accessorKey: 'creado_en', header: 'Fecha', cell: ({ row }) => formatearFecha(row.original.creado_en) },
  { accessorKey: 'vigencia_texto', header: 'Vigencia' },
  { accessorKey: 'cliente_nombre', header: 'Cliente' },
  { accessorKey: 'consolidado', header: 'Consolidado' },
  { accessorKey: 'cod_cotizacion_cc', header: 'Cotización C.C.' },
  { accessorKey: 'proveedores_cantidad', header: 'Proveedores' },
  { accessorKey: 'total', header: 'Total', cell: ({ row }) => dinero(row.original.total) },
  { accessorKey: 'tipo_cambio', header: 'T.C.', cell: ({ row }) => row.original.tipo_cambio ?? '—' },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => h(UBadge, {
      color: row.original.estado === 'confirmada' ? 'success' : row.original.vencida ? 'error' : 'warning',
      variant: 'soft',
      label: row.original.estado === 'confirmada' ? 'Confirmada' : row.original.vencida ? 'Vencida' : 'Pendiente'
    })
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }) => h('div', { class: 'flex gap-1' }, [
      h(UButton, { icon: 'i-heroicons-eye', size: 'xs', color: 'primary', variant: 'ghost', onClick: () => navigateTo(`/pago-proveedor/cotizaciones/${row.original.id}`) }),
      row.original.puede_eliminar
        ? h(UButton, { icon: 'i-heroicons-trash', size: 'xs', color: 'error', variant: 'ghost', onClick: () => confirmarEliminar(row.original) })
        : null
    ])
  }
]

function formatearFecha(valor: string | null) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

async function cargar() {
  cargando.value = true
  try {
    const respuesta = await PagoProveedorService.listarCotizaciones({
      search: busqueda.value,
      estado: filtros.value.estado,
      page: paginacion.value.current_page,
      per_page: paginacion.value.per_page
    })
    filas.value = respuesta.data
    paginacion.value = respuesta.pagination
  } catch (error: any) {
    showError('Cotizaciones', error.message || 'No se pudo cargar el listado.')
  } finally {
    cargando.value = false
  }
}

function alBuscar(valor: string) {
  busqueda.value = valor
  paginacion.value.current_page = 1
  cargar()
}

function alCambiarPagina(pagina: number) {
  paginacion.value.current_page = pagina
  cargar()
}

function alCambiarTamano(tamano: number) {
  paginacion.value.per_page = tamano
  paginacion.value.current_page = 1
  cargar()
}

function alFiltrar(clave: string, valor: unknown) {
  const normalizado = valor && typeof valor === 'object' && 'value' in (valor as Record<string, unknown>)
    ? (valor as Record<string, unknown>).value
    : valor
  filtros.value = { ...filtros.value, [clave]: String(normalizado ?? 'todos') }
  paginacion.value.current_page = 1
  cargar()
}

function confirmarEliminar(cotizacion: PagoProveedorCotizacion) {
  showConfirmation('Eliminar cotización', `Se eliminará ${cotizacion.codigo}. Esta acción no se puede deshacer.`, async () => {
    try {
      await PagoProveedorService.eliminarCotizacion(cotizacion.id)
      showSuccess('Cotización eliminada', cotizacion.codigo)
      await cargar()
    } catch (error: any) {
      showError('No se pudo eliminar', error.message || 'Inténtalo de nuevo.')
    }
  })
}

async function guardarVigencia() {
  guardandoVigencia.value = true
  try {
    await PagoProveedorService.guardarVigencia(horasVigencia.value)
    showSuccess('Vigencia actualizada', `Las cotizaciones nuevas vencen a las ${horasVigencia.value} horas hábiles.`)
  } catch (error: any) {
    showError('Vigencia', error.message || 'No se pudo guardar.')
  } finally {
    guardandoVigencia.value = false
  }
}

onMounted(async () => {
  try {
    const config = await PagoProveedorService.obtenerConfiguracion()
    const horas = Number(config.data.vigencia_cotizacion_horas)
    if (horas > 0) horasVigencia.value = horas
  } catch {
    horasVigencia.value = 48
  }
  await cargar()
})
</script>
