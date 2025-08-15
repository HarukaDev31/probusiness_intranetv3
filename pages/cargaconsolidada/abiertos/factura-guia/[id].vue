<template>
    <div class="p-6">
      <!-- Header Section -->
      <PageHeader title="Factura y Guía" subtitle="Gestión de factura y guía" icon="i-heroicons-book-open"
        :hide-back-button="false" @back="navigateTo(`/cargaconsolidada/abiertos/pasos/${id}`)" />
  
      <DataTable title="General"  :data="general" :columns="generalColumns"
        :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
        :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral"
        :show-secondary-search="false" :show-filters="true" :filter-config="filterConfigGeneral" :show-export="true"
        empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
        @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
        @filter-change="handleFilterChangeGeneral" />
     
  
      <!-- CreatePagoModal -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useGeneral } from '~/composables/cargaconsolidada/factura-guia/useGeneral'
  import { USelect, UBadge } from '#components'
  
  const { general, loadingGeneral, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, handleSearchGeneral, handlePageChangeGeneral, handleItemsPerPageChangeGeneral, handleFilterChangeGeneral } = useGeneral()
  
  const route = useRoute()
  const id = Number(route.params.id)
  
  // Modal state for creating pagos
  const showCreatePagoModal = ref(false)
  const selectedCliente = ref('')
  
  // Tab state
  const activeTab = ref('general') as Ref<string>
  
  // Tab configuration
  const tabs = [
    { value: 'general', label: 'General' },
    { value: 'pagos', label: 'Pagos' }
  ]
  
  const generalColumns = ref<TableColumn<any>[]>([
    {
      accessorKey: 'nro',
      header: 'N°',
      cell: ({ row }: { row: any }) => {
        return row.index + 1
      }
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre'
    },
  
    {
      accessorKey: 'documento',
      header: 'DNI/RUC'
    },
  
    {
      accessorKey: 'correo',
      header: 'Correo'
    },
  
    {
      accessorKey: 'telefono',
      header: 'Whatsapp'
    },
  
    {
      accessorKey: 'tipo_cliente',
      header: 'T. Cliente'
    },
    //Ajuste	C.Final	Factura C.	Guia R.
    {
        accessorKey: 'ajuste',
        header: 'Ajuste'
    },
    {
        accessorKey: 'c_final',
        header: 'C. Final'
    },
    {
        accessorKey: 'factura_c_',
        header: 'Factura C. '
    },
    {
        accessorKey: 'guia_r_',
        header: 'Guia R. '
    }
  ])


 
  onMounted(async () => {
    await getGeneral(Number(id))
  })
  </script>
  
  <style scoped>
  </style>
  