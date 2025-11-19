<template>
    <div class="p-6">
        <DataTable 
            title="Estudiantes de la Campaña" 
            subtitle="Lista de estudiantes inscritos en la campaña" 
            icon="i-heroicons-users"
            :show-title="true" 
            :data="students" 
            :columns="columns" 
            :loading="studentsLoading" 
            :current-page="studentsCurrentPage"
            :total-pages="studentsTotalPages" 
            :total-records="studentsTotalRecords" 
            :items-per-page="studentsItemsPerPage"
            :search-query-value="studentsSearchQuery" 
            :show-primary-search="true" 
            :primary-search-label="'Buscar por'"
            :primary-search-placeholder="'Buscar estudiante...'" 
            :show-filters="false" 
            :filter-config="filterConfigList"
            :filters-value="studentsFilters" 
            :show-export="false" 
            :show-new-button="false"
            :hide-back-button="false"
            empty-state-message="No se encontraron estudiantes que coincidan con los criterios de búsqueda."
            previous-page-url="/campanas" 
            @update:primarySearch="handleStudentsSearch" 
            @page-change="handleStudentsPageChange"
            @items-per-page-change="handleStudentsItemsPerPageChange" 
            @filter-change="handleStudentsFilterChange" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UButton, USelect } from '#components'
import { useCampaigns } from '~/composables/useCampaigns'
import { useRoute } from 'vue-router'
import type { CampaignStudent } from '~/services/campaignService'
import { useCursos } from '~/composables/useCursos'
import type { FilterConfig } from '~/types/data-table'

const route = useRoute()
const campaignId = computed(() => Number(route.params.id))

const {
    students,
    studentsLoading,
    studentsCurrentPage,
    studentsItemsPerPage,
    studentsTotalPages,
    studentsTotalRecords,
    studentsSearchQuery,
    studentsFilters,
    loadCampaignStudents,
    handleStudentsSearch,
    handleStudentsPageChange,
    handleStudentsItemsPerPageChange,
    handleStudentsFilterChange
} = useCampaigns()

// Obtener filtros de campañas desde useCursos (igual que en index.vue)
const { getFiltros } = useCursos()
const filterConfig = ref<FilterConfig[]>([])
const campanasOptions = computed(() => {
    const campanaFilter = filterConfig.value.find((f: any) => f.key === 'campanas')
    return campanaFilter?.options || []
})

// Cargar filtros al montar
const fillFilters = async () => {
    try {
        const response = await getFiltros()
        if (response && response.data) {
            filterConfig.value = Array.isArray(response.data) ? response.data : []
        }
    } catch (error) {
        console.error('Error al cargar filtros:', error)
    }
}

// Configuración de filtros
const filterConfigList = [
    {
        key: 'estado',
        label: 'Estado',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: '' },
            { label: 'Pagado', value: 'pagado' },
            { label: 'Pendiente', value: 'pendiente' },
            { label: 'Cancelado', value: 'cancelado' }
        ]
    }
]

const estadoClasses: Record<string, string> = {
    pendiente: 'bg-gray-100 text-gray-800',
    adelanto: 'bg-yellow-100 text-yellow-800',
    pagado: 'bg-green-100 text-green-800',
    sobrepago: 'bg-red-100 text-red-800'
}

// Configuración de columnas de la tabla (basado en index.vue)
const columns: TableColumn<CampaignStudent>[] = [
    {
        accessorKey: 'numero',
        header: 'N.',
        cell: ({ row }) => {
            const index = (studentsCurrentPage.value - 1) * studentsItemsPerPage.value + row.index + 1
            return index
        }
    },
    {
        accessorKey: 'Fe_Registro',
        header: 'Fecha',
        cell: ({ row }) => {
            // Usar Fe_Registro si existe, sino Fe_Emision
            const fecha = row.original.Fe_Registro || row.original.Fe_Emision
            if (!fecha) return '-'
            return fecha // Mostrar fecha sin formato especial, igual que index.vue
        }
    },
    {
        accessorKey: 'cliente',
        header: 'Cliente',
        cell: ({ row }) => {
            // Usar los mismos campos que en index.vue
            const nombre = row.original.No_Entidad || `Cliente ID: ${row.original.id_cliente}`
            const dni = row.original.Nu_Documento_Identidad || '-'
            const telefono = row.original.Nu_Celular_Entidad || '-'
            const email = row.original.Txt_Email_Entidad || '-'
            
            return h('div', [
                h('p', nombre),
                h('p', dni),
                h('p', telefono),
                h('p', email)
            ])
        }
    },
    {
        accessorKey: 'tipo_curso',
        header: 'Curso',
        cell: ({ row }) => {
            // Igual que en index.vue: 0 = Virtual, 1 = En vivo
            const value = String(row.original.tipo_curso)
            const items = [
                { label: 'Virtual', value: "0", icon: 'i-heroicons-video-camera' },
                { label: 'En vivo', value: "1", icon: 'i-heroicons-computer-desktop' }
            ]
            const icon = items.find(item => item.value === value)?.icon
            return h(UButton, {
                label: items.find(item => item.value === value)?.label || 'En vivo',
                icon: icon || 'i-heroicons-computer-desktop',
                size: 'sm',
                color: 'neutral',
                variant: 'soft',
                trailing: true
            })
        }
    },
    {
        accessorKey: 'campana',
        header: 'Campaña',
        cell: ({ row }) => {
            // Usar select igual que en index.vue
            const campanaId = row.original.ID_Campana
            const campanaOption = campanasOptions.value.find((opt: any) => opt.value === campanaId)
            const campanaLabel = campanaOption?.label || `Campaña ${campanaId}`
            
            return h(UButton, {
                label: campanaLabel,
                size: 'sm',
                color: 'neutral',
                variant: 'soft',
                trailing: true
            })
        }
    },
    {
        accessorKey: 'usuario',
        header: 'Usuario',
        cell: ({ row }) => {
            // Igual que en index.vue
            const items = [
                { label: 'Pendiente', value: 3, icon: 'ic:outline-access-time' },
                { label: 'Creado', value: 2, icon: 'ic:outline-person' },
                { label: 'Constancia', value: 4, icon: 'solar:diploma-outline', disabled: true }
            ]
            
            const icon = items.find(item => item.value === row.original.Nu_Estado_Usuario_Externo)?.icon
            let modelValue = row.original.Nu_Estado_Usuario_Externo ?? 1
            if (row.original.puede_constancia) {
                modelValue = 4
            }
            
            const selectedItem = items.find(item => item.value === modelValue)
            
            return h(UButton, {
                label: selectedItem?.label || 'Creado',
                icon: icon || 'ic:outline-person',
                size: 'sm',
                color: 'neutral',
                variant: 'soft',
                trailing: true
            })
        }
    },
    {
        accessorKey: 'importe',
        header: 'Importe',
        cell: ({ row }) => {
            // Mostrar como en index.vue (sin formato de moneda, solo el valor)
            return row.original.Ss_Total || '0.00'
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
            // Calcular estado igual que en index.vue
            const nSs_Importe = Number(row.original.Ss_Total || 0)
            const nTotal_pagos = Number(row.original.total_pagos || 0)
            let value = 'pendiente'
            
            if (nTotal_pagos > nSs_Importe) {
                value = 'sobrepago'
            } else if (nTotal_pagos < nSs_Importe && nTotal_pagos !== 0) {
                value = 'adelanto'
            } else if (nTotal_pagos === nSs_Importe && nSs_Importe !== 0) {
                value = 'pagado'
            }
            
            const items = [
                { label: 'Pendiente', value: 'pendiente', icon: 'ic:outline-access-time' },
                { label: 'Adelanto', value: 'adelanto', icon: 'ic:round-double-arrow' },
                { label: 'Pagado', value: 'pagado', icon: 'ic:baseline-check-circle-outline' },
                { label: 'Sobrepago', value: 'sobrepago', icon: 'ri:error-warning-line' }
            ]
            const icon = items.find(item => item.value === value)?.icon
            
            return h(UButton, {
                label: items.find(item => item.value === value)?.label || 'Pendiente',
                icon: icon || 'ic:outline-access-time',
                size: 'sm',
                color: value === 'pagado' ? 'success' : value === 'adelanto' ? 'warning' : value === 'sobrepago' ? 'error' : 'neutral',
                variant: 'soft',
                trailing: true,
                class: estadoClasses[value] + ' rounded px-2 py-1'
            })
        }
    },
    {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
            h(UButton, {
                icon: 'i-heroicons-eye',
                size: 'sm',
                color: 'warning',
                variant: 'solid',
                onClick: () => handleView(row.original)
            }),
            h(UButton, {
                icon: 'i-heroicons-trash',
                size: 'sm',
                color: 'warning',
                variant: 'solid',
                onClick: () => handleDelete(row.original)
            }),
            h(UButton, {
                icon: 'i-heroicons-arrow-down-tray',
                size: 'sm',
                color: 'warning',
                variant: 'solid',
                onClick: () => handleSave(row.original)
            })
        ])
    }
]

// Métodos
const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const handleView = (student: CampaignStudent) => {
    console.log('Ver estudiante:', student)
    // TODO: Implementar vista de detalles - navegar a /curso/[id] con ID_Pedido_Curso
    navigateTo(`/curso/${student.ID_Pedido_Curso}`)
}

const handleDelete = (student: CampaignStudent) => {
    console.log('Eliminar estudiante:', student)
    // TODO: Implementar eliminación
}

const handleSave = (student: CampaignStudent) => {
    console.log('Guardar estudiante:', student)
    // TODO: Implementar guardado/exportación
}

// Watchers para recargar cuando cambian los filtros o búsqueda
watch([studentsSearchQuery, studentsFilters, studentsCurrentPage, studentsItemsPerPage], () => {
    if (campaignId.value) {
        loadCampaignStudents(campaignId.value)
    }
}, { deep: true })

// Lifecycle
onMounted(async () => {
    await fillFilters()
    if (campaignId.value) {
        loadCampaignStudents(campaignId.value)
    }
})
</script>

