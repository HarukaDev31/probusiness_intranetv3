<template>
  <div class="md:p-6">
    <DataTable
      title="Solicitudes"
      subtitle="Pago a proveedor"
      :show-title="true"
      icon="i-heroicons-clipboard-document-list"
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
      primary-search-placeholder="Buscar por cliente, consolidado o N.°"
      :show-filters="false"
      :show-export="false"
      empty-state-message="Todavía no hay solicitudes."
      @update:primary-search="alBuscar"
      @page-change="alCambiarPagina"
      @items-per-page-change="alCambiarTamano"
    />
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { PagoProveedorPaginacion, PagoProveedorSolicitud } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import { useModal } from '~/composables/commons/useModal'
import { UButton } from '#components'

const { showError } = useModal()
const filas = ref<PagoProveedorSolicitud[]>([])
const cargando = ref(false)
const busqueda = ref('')
const paginacion = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })

const columns: TableColumn<PagoProveedorSolicitud>[] = [
  { accessorKey: 'numero_orden', header: 'N.° de orden' },
  { accessorKey: 'cotizacion_codigo', header: 'Cotización' },
  { accessorKey: 'cliente_nombre', header: 'Cliente' },
  { accessorKey: 'consolidado', header: 'Consolidado' },
  { accessorKey: 'cod_cotizacion_cc', header: 'Cotización C.C.' },
  { accessorKey: 'proveedores_cantidad', header: 'Proveedores' },
  {
    accessorKey: 'acciones',
    header: '',
    cell: ({ row }) => h(UButton, {
      icon: 'i-heroicons-eye',
      size: 'xs',
      color: 'primary',
      variant: 'ghost',
      onClick: () => navigateTo(`/pago-proveedor/solicitudes/${row.original.id}`)
    })
  }
]

async function cargar() {
  cargando.value = true
  try {
    const respuesta = await PagoProveedorService.listarSolicitudes({
      search: busqueda.value,
      page: paginacion.value.current_page,
      per_page: paginacion.value.per_page
    })
    filas.value = respuesta.data
    paginacion.value = respuesta.pagination
  } catch (error: any) {
    showError('Solicitudes', error.message || 'No se pudo cargar el listado.')
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

onMounted(cargar)
</script>
