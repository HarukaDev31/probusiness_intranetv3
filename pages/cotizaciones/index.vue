<template>
  <div class="p-6">

      <DataTable title="Cotizaciones" :show-title="true" icon="i-heroicons-users" :data="cotizaciones" :columns="columns"
          :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
          :items-per-page="itemsPerPage" :search-query-value="search" :primary-search-value="search"
          :show-primary-search="true" :showPrimarySearchLabel="false"
          :primary-search-placeholder="'Buscar por'" :show-filters="true"
          :filters-value="filters" :show-export="true"
          :show-headers="true" :headers="headers"
          empty-state-message="No se encontraron clientes que coincidan con los criterios de búsqueda."
          :show-new-button="true"
          new-button-label="Cargar Cliente"
       
          @update:search-query="handleSearch" @update:primary-search="handleSearch"
          @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportClientes"
          @filter-change="handleFilterChange">
          

          <template #error-state>
              <ErrorState :message="error || 'Error desconocido'" />
          </template>
      </DataTable>
</div>
</template> 
<script setup lang="ts">
import { useCalculadoraImportacion } from '~/composables/useCalculadoraImportacion'
const { cotizaciones, loading, error, pagination, headers, search, itemsPerPage, totalPages, totalRecords, currentPage, filters, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange, getCotizaciones } = useCalculadoraImportacion()
import type { TableColumn } from '@nuxt/ui'
//N.     Fecha                Nombre                                  Dni                    WhatsApp           Volumen         Qty Item    Fob           Logistica      Impuesto      Tarifa             Campaña     Cotizacion                   Estado                                Acciones
const columns: TableColumn<any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.original.created_at)
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }: { row: any }) => row.original.nombre_cliente
  },
  {
    accessorKey: 'dni',
    header: 'DNI',
    cell: ({ row }: { row: any }) => row.original.dni_cliente
  },
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
    cell: ({ row }: { row: any }) => row.original.whatsapp_cliente
  },
  {
    accessorKey: 'volumen',
    header: 'Volumen',
    cell: ({ row }: { row: any }) => row.original.totales.total_cbm
  },
  {
    accessorKey: 'qty_item',
    header: 'Qty Item',
    cell: ({ row }: { row: any }) => row.original.totales.total_productos
  },
  {
    accessorKey: 'fob',
    header: 'Fob',
    cell: ({ row }: { row: any }) => row.original.totales.total_fob
  },
  {
    accessorKey: 'logistica',
    header: 'Logistica',
    cell: ({ row }: { row: any }) => row.getValue('logistica')
  },
  {
    accessorKey: 'impuesto',
    header: 'Impuesto',
    cell: ({ row }: { row: any }) => row.getValue('impuesto')
  },
  {
    accessorKey: 'tarifa',
    header: 'Tarifa',
    cell: ({ row }: { row: any }) => row.getValue('tarifa')
  },
  {
    accessorKey: 'campania',
    header: 'Campaña',
    cell: ({ row }: { row: any }) => row.getValue('campania') 
  },
  {
    accessorKey: 'cotizacion',
    header: 'Cotizacion',
    cell: ({ row }: { row: any }) => row.getValue('cotizacion')
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }: { row: any }) => row.getValue('estado')
  },
  
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => row.getValue('acciones')
  }
]
  
onMounted(() => {
  getCotizaciones()
})

</script>