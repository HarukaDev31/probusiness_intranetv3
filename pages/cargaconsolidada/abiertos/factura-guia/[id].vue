<template>
  <div class="p-6">
    <!-- Header Section -->


  <DataTable title="" :data="general" :columns="generalColumns" :loading="loadingGeneral || loadingHeaders" icon=""
    :show-pagination="false"

      :current-page="currentPageGeneral" :total-pages="totalPagesGeneral" :total-records="totalRecordsGeneral"
      :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral" :show-secondary-search="false"
      :show-filters="false" :filter-config="filterConfigGeneral" :show-export="false"
      empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
      @filter-change="handleFilterChangeGeneral" :hide-back-button="false"
      :show-primary-search="false"
      :show-body-top="true"
      :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS) ? `/cargaconsolidada/abiertos/pasos/${id}` : `/cargaconsolidada/abiertos`">
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Factura y Guía #${carga}`" :headers="headers" :loading="loadingGeneral || loadingHeaders" />
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGeneral } from '~/composables/cargaconsolidada/factura-guia/useGeneral'
import { USelect, UBadge, UButton } from '#components'
import SimpleUploadFileModal from '~/components/cargaconsolidada/cotizacion-final/SimpleUploadFile.vue'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import type { TableColumn } from '@nuxt/ui'
import { useUserRole } from '~/composables/auth/useUserRole'
const { general, loadingGeneral, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, handleSearchGeneral, handlePageChangeGeneral, handleItemsPerPageChangeGeneral, handleFilterChangeGeneral, uploadFacturaComercial, uploadGuiaRemision, headers, carga, loadingHeaders, getHeaders } = useGeneral()
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import SectionHeader from '~/components/commons/SectionHeader.vue'  
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()
const route = useRoute()
const id = Number(route.params.id)
const overlay = useOverlay()
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)
// Modal state for creating pagos
const { currentRole, currentId } = useUserRole()
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
    header: 'T. Cliente',
    cell: ({ row }: { row: any }) => {
      return row.original.name
    }
  },
  //Ajuste	C.Final	Factura C.	Guia R.
  {
    accessorKey: 'ajuste',
    header: 'Ajuste',
    cell: ({ row }: { row: any }) => {
      return h(UBadge, {
        color: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'error' : 'success',
        label: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'SI' : 'NO'
      })
    }
  },
  {
    accessorKey: 'c_final',
    header: 'C. Final',
    cell: ({ row }: { row: any }) => {
      // cotizacion_final_url SHOW DOWNLOAD ICON 
      if (row.original.cotizacion_final_url) {
        return h(UButton, {
          icon: 'i-heroicons-arrow-down-tray',
          color: 'primary',
          variant: 'outline',
          onClick: () => {
            window.open(row.original.cotizacion_final_url, '_blank')
          }
        })
      } else {
        return
      }
    }
  },
  {
    accessorKey: 'factura_c_',
    header: 'Factura C. ',
    cell: ({ row }: { row: any }) => {
      // if factura_comercial exist show download icon else show button to open modal to upload
      if (row.original.factura_comercial) {
        return h(UButton, {
          icon: 'i-heroicons-arrow-down-tray',
          color: 'primary',
          variant: 'outline',
          onClick: () => {
            window.open(row.original.factura_comercial, '_blank')
          }
        })
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          label: 'Subir',

          variant: 'outline',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Factura Comercial',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadFacturaComercial(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guia R. ',
    cell: ({ row }: { row: any }) => {
      // if guia_r exist show download icon else show button to open modal to upload
      if (row.original.guia_remision_url) {
        return h(UButton, {
          icon: 'i-heroicons-arrow-down-tray',
          color: 'primary',
          variant: 'outline',

          onClick: () => {
            window.open(row.original.guia_remision_url, '_blank')
          }
        })
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          variant: 'outline',
          label: 'Subir',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Guia Remisión',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadGuiaRemision(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  }
])

const handleUploadFacturaComercial = async (data: { file: File }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const response = await uploadFacturaComercial({
        idCotizacion: idCotizacion,
        file: data.file
      })
      if (response.success) {
        showSuccess('Factura comercial subida correctamente', 'success')
        await getGeneral(Number(id))
      } else {
        showError('Error al subir la factura comercial', 'error')
      }
    } catch (error) {
      showError('Error al subir la factura comercial', 'error')
    }
  })
}
const handleUploadGuiaRemision = async (data: { file: File }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const response = await uploadGuiaRemision({
        idCotizacion: idCotizacion,
        file: data.file
      })
      if (response.success) {
        showSuccess('Guía remisión subida correctamente', 'success')
        await getGeneral(Number(id))
      } else {
        showError('Error al subir la guía remisión', 'error')
      }
    } catch (error) {
      showError('Error al subir la guía remisión', 'error')
    }
  })
}

onMounted(async () => {
  await getGeneral(Number(id))
  await getHeaders(Number(id))
})
</script>

<style scoped></style>