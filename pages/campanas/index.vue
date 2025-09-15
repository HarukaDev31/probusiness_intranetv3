<template>
    <div class="p-6">
        <DataTable title="Campañas" subtitle="Gestión de campañas de cursos" icon="i-heroicons-calendar-days"
            :show-title="true" :data="campaigns" :columns="columns" :loading="loading" :current-page="currentPage"
            :total-pages="totalPages" :total-records="totalRecords" :items-per-page="itemsPerPage"
            :search-query-value="searchQuery" :show-primary-search="false" :primary-search-label="'Buscar por'"
            :primary-search-placeholder="'Buscar campaña...'" :show-filters="false" :filter-config="filterConfig"
            :filters-value="filters" :show-export="false" :show-new-button="true" new-button-label="Crear Campaña"
            :on-new-button-click="openCreateModal"
            :hide-back-button="false"
            empty-state-message="No se encontraron campañas que coincidan con los criterios de búsqueda."
            previous-page-url="/curso" @update:primarySearch="handleSearch" @page-change="handlePageChange"
            @items-per-page-change="handleItemsPerPageChange" @filter-change="handleFilterChange" />


    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UButton } from '#components'
import { useCampaigns } from '~/composables/useCampaigns'
import { useNotifications } from '~/composables/useNotifications'
import CreateCampaignModal from '~/components/campanas/CreateCampaignModal.vue'
import { useOverlay } from '#imports'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
const {
    campaigns,
    loading,
    currentPage,
    itemsPerPage,
    totalPages,
    totalRecords,
    searchQuery,
    filters,
    loadCampaigns,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
    deleteCampaign,
    createCampaign
} = useCampaigns()

const { showDeleteSuccess } = useNotifications()
const { withSpinner } = useSpinner()
// Overlay para el modal de creación
const overlay = useOverlay()
const createCampaignModal = overlay.create(CreateCampaignModal)
const { showSuccess, showError,showConfirmation } = useModal()

// Estado local
const showDeleteModal = ref(false)
const campaignToDelete = ref<any>(null)

// Configuración de filtros
const filterConfig = [
    {
        key: 'mes',
        label: 'Mes',
        type: 'select',
        placeholder: 'Seleccionar mes',
        options: [
            { label: 'Todos', value: '' },
            { label: 'Enero', value: 'enero' },
            { label: 'Febrero', value: 'febrero' },
            { label: 'Marzo', value: 'marzo' },
            { label: 'Abril', value: 'abril' },
            { label: 'Mayo', value: 'mayo' },
            { label: 'Junio', value: 'junio' },
            { label: 'Julio', value: 'julio' },
            { label: 'Agosto', value: 'agosto' },
            { label: 'Septiembre', value: 'septiembre' },
            { label: 'Octubre', value: 'octubre' },
            { label: 'Noviembre', value: 'noviembre' },
            { label: 'Diciembre', value: 'diciembre' }
        ]
    },
    {
        key: 'estado',
        label: 'Estado',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: '' },
            { label: 'Activa', value: 'activa' },
            { label: 'Finalizada', value: 'finalizada' },
            { label: 'Programada', value: 'programada' }
        ]
    }
]


// Configuración de columnas de la tabla
const columns: TableColumn<Campaign>[] = [
    { accessorKey: 'id', header: 'ID' },
    {
        accessorKey: 'fecha_creacion',
        header: 'Fecha de Creación',
        cell: ({ row }) => row.original.Fe_Creacion
    },
    {
        accessorKey: 'nombre_campana', header: 'Nombre de Campaña',
        cell: ({ row }) => row.original.No_Campana
    },
    {
        accessorKey: 'fecha_inicio',
        header: 'Fecha de Inicio',
        cell: ({ row }) => row.original.Fe_Inicio
    },
    {
        accessorKey: 'fecha_fin',
        header: 'Fecha Fin',
        cell: ({ row }) => row.original.Fe_Fin
    },
    {
        accessorKey: 'cantidad_personas',
        header: 'Cantidad de Personas',
        cell: ({ row }) => `${row.original.cantidad_personas} personas`
    },
    {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
            
            h(UButton, {
                icon: 'i-heroicons-trash',
                size: 'sm',
                color: 'error',
                variant: 'ghost',
                onClick: () => handleDelete(row.original)
            })
        ])
    }
]

// Estado vacío
const emptyState = {
    icon: 'i-heroicons-inbox',
    label: 'No hay campañas',
    description: 'No se encontraron campañas registradas.'
}

// Métodos
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const openCreateModal = async () => {
    createCampaignModal.open({
        maxDays: 6,
        onSave: async (campaignData: any) => {
            try {
                // Aquí se llamaría al servicio para crear la campaña

                await withSpinner(async () => {
                    console.log('Datos de la campaña:', campaignData)
                    const response = await createCampaign(campaignData)
                    if (response) {
                        showSuccess('Campaña creada correctamente', 'La campaña se ha creado correctamente')
                    } else {
                        showError('Error al crear campaña', 'Error al crear la campaña')
                    }
                })


                // Recargar datos
                await loadCampaigns()
            } catch (error) {
                console.error('Error al crear campaña:', error)
            }
        }
    })
}

const handleEdit = (campaign: any) => {
    console.log('Editar campaña:', campaign)
    // navigateTo(`/curso/campañas/${campaign.id}/editar`)
}

const handleDelete = (campaign: any) => {
    //call deleteCampaign
    showConfirmation('Eliminar campaña', '¿Estás seguro de que deseas eliminar esta campaña?', async () => {
        const response = await deleteCampaign(campaign.ID_Campana)
        if (response.success) {
            showSuccess('Campaña eliminada correctamente', 'La campaña se ha eliminado correctamente')
            await loadCampaigns()
        } else {
            showError('Error al eliminar campaña', 'Error al eliminar la campaña')
        }
        showDeleteModal.value = false
        campaignToDelete.value = null
    })
}


// Lifecycle
onMounted(() => {
    loadCampaigns()
})
</script>
