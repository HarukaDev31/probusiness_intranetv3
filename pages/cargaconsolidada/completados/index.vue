<template>
    <div class="">
        <!-- Navegación superior -->
        <div class="flex items-center space-x-6 ">
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Coordinación</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Ventas</span>
                </div>
            </div>
        </div>


        <DataTable title="Carga Consolidada Completada"  :show-pagination="false"   icon="" :show-title="true" :data="consolidadoData" :columns="getColumns()" :loading="loading"
            :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
            :items-per-page="itemsPerPage" :search-query-value="search" :show-secondary-search="false"
            :show-filters="true" :filter-config="filterConfig" :filters-value="(() => {
                return filters
            })()" :show-export="true" empty-state-message="No se encontraron registros de contenedores."
            @update:search-query="handleSearch" @update:primary-search="handleSearch" @page-change="handlePageChange"
            @items-per-page-change="handleItemsPerPageChange" @export="exportClientes"
            @filter-change="handleFilterChange"
            :hide-back-button="true">
            <template #actions>
                <template v-if="!isAlmacen">
                    <CreateConsolidadoModal @submit="handleCreateConsolidado" :id="currentConsolidado" 
                    v-if="currentRole === ROLES.COORDINACION"
                    />
                </template>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, h, resolveComponent, onMounted, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
const { withSpinner } = useSpinner()
const { hasRole, isCoordinacion, currentRole, currentId } = useUserRole()
const isAlmacen = computed(() => hasRole(ROLES.CONTENEDOR_ALMACEN))
import CreateConsolidadoModal from '~/components/cargaconsolidada/CreateConsolidadoModal.vue'
import { USelect } from '#components'
import  TextModal  from '~/components/commons/TextModal.vue' 
const { showSuccess, showConfirmation } = useModal()
import { STATUS_BG_CLASSES } from '~/constants/ui'
const {
    consolidadoData,
    loading,
    search,
    itemsPerPage,
    totalPages,
    totalRecords,
    currentPage,
    filters, // Usar filters del composable
    getConsolidadoData,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
    clearFilters,
    resetSearch,
    createConsolidado,
    deleteConsolidado
} = useConsolidado()
const overlay = useOverlay()
const modal = overlay.create(CreateConsolidadoModal)
const currentConsolidado = ref<number | null>(null)
const textModal = overlay.create(TextModal)

// Components
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

// Configuración de filtros según el rol
const filterConfig = computed<FilterConfig[]>(() => {
    const baseConfig: FilterConfig[] = [
        {
            label: 'Fecha Inicio',
            key: 'fecha_inicio',
            type: 'date',
            placeholder: 'Selecciona una fecha',
            options: []
        },
        {
            label: 'Fecha Fin',
            key: 'fecha_fin',
            type: 'date',
            placeholder: 'Selecciona una fecha',
            options: []
        }
    ]

    if (isAlmacen.value) {
        // Para rol ContenedorConsolidado: estados en inglés
        baseConfig.push({
            label: 'Estado',
            key: 'estado_china',
            type: 'select',
            options: [
                { label: 'Todos', value: 'todos' },
                { label: 'WAITING', value: 'WAITING' },
                { label: 'RECEIVING', value: 'RECEIVING' },
                { label: 'FINISH', value: 'FINISH' }
            ],
            placeholder: 'Selecciona un estado',
        })
    } else {
        // Para otros roles: estados en español
        baseConfig.push({
            label: 'Estado',
            key: 'estado_china',
            type: 'select',
            options: [
                { label: 'Todos', value: 'todos' },
                { label: 'PENDIENTE', value: 'PENDIENTE' },
                { label: 'RECIBIENDO', value: 'RECIBIENDO' },
                { label: 'COMPLETADO', value: 'COMPLETADO' }
            ],
            placeholder: 'Selecciona un estado',
        })
    }

    return baseConfig
})
const handleCreateConsolidado = async (data: any) => {
    try {
        const payload = {
            id: data.id,
            carga: data.carga,
            mes: data.mes,
            id_pais: data.pais,
            empresa: data.empresa,
            f_cierre: `${data.fechaCierre.year}-${data.fechaCierre.month}-${data.fechaCierre.day}`,
            f_puerto: `${data.fechaArribo.year}-${data.fechaArribo.month}-${data.fechaArribo.day}`,
            f_entrega: `${data.fechaEntrega.year}-${data.fechaEntrega.month}-${data.fechaEntrega.day}`
        }
        await withSpinner(async () => {
            await createConsolidado(payload)
        })
        showSuccess('Carga consolidada creada correctamente', 'La carga consolidada se ha creado correctamente y ya está disponible en el sistema.')
        await getConsolidadoData()
    } catch (error) {
        showError(error as string)
    }
}
const columns: TableColumn<any>[] = [
    {
        accessorKey: 'carga',
        header: 'Carga',
        cell: ({ row }) => `CARGA CONSOLIDADA #${row.getValue('carga')}`
    },
    {
        accessorKey: 'mes',
        header: 'Mes',
        cell: ({ row }) => row.getValue('mes')
    },
    {
        accessorKey: 'pais',
        header: 'País',
        cell: ({ row }) => row.original.pais?.No_Pais || 'N/A'
    },
    {
        accessorKey: 'f_cierre',
        header: 'F. Cierre',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('f_cierre'))
    },
    {
        accessorKey: 'fecha_arribo',
        header: 'F. Arribo',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('fecha_arribo'))
    },
    {
        accessorKey: 'f_entrega',
        header: 'F. Entrega',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('f_entrega'))
    },
    {
        accessorKey: 'empresa',
        header: 'Empresa',
        cell: ({ row }) => row.getValue('empresa')
    },
    {
        accessorKey: 'estado_china',
        header: 'Estado',
        cell: ({ row }) => {
            const estado = row.getValue('estado_china') as string
            const color = getColorByEstado(estado)
            return h(USelect as any, {
                modelValue: estado,
                variant: 'subtle',
                color: color,
                disabled: true,
                class: STATUS_BG_CLASSES[estado as keyof typeof STATUS_BG_CLASSES],
                items: [
                    { label: 'PENDIENTE', value: 'PENDIENTE' },
                    { label: 'RECIBIENDO', value: 'RECIBIENDO' },
                    { label: 'COMPLETADO', value: 'COMPLETADO' }
                ]
            })
        }
    },
    {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
            return h('div', { class: 'flex space-x-2' }, isCoordinacion.value ? [

                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-eye',
                    color: 'info',
                    variant: 'ghost',
                    onClick: () => handleViewSteps(row.original.id)
                }),
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-pencil',
                    color: 'warning',
                    variant: 'ghost',
                    onClick: () => {
                        currentConsolidado.value = row.original.id
                        //define on emit
                        modal.open({
                            id: row.original.id,
                            onSubmit: (data: any) => {
                                handleCreateConsolidado(data)
                            }
                        })
                    }
                }),
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-trash',
                    color: 'error',
                    variant: 'ghost',
                    onClick: () => handleDeleteCarga(row.original.id)
                })
            ] : [
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-eye',
                    color: 'info',
                    variant: 'ghost',
                    onClick: () => handleViewSteps(row.original.id)
                })
            ])
        }
    }
]
//Mes	Empresa	Carga	T. Ctn	Canal	Naviera	T. Transito	Días de levante	Ajuste	Multa	FOB	Flete	C. Destino	Acciones
const documentacionColumns: TableColumn<any>[] = [
    {
        accessorKey: 'mes',
        header: 'Mes',
        cell: ({ row }) => row.getValue('mes')
    },
    {
        accessorKey: 'empresa',
        header: 'Empresa',
        cell: ({ row }) => row.getValue('empresa')
    },
    {
        accessorKey: 'carga',
        header: 'Carga',
        cell: ({ row }) => `CARGA CONSOLIDADA #${row.getValue('carga')}`
    },
    {
        accessorKey: 'tipo_contenedor',
        header: 'T. Ctn',
        cell: ({ row }) => row.getValue('tipo_contenedor')
    },

    {
        accessorKey: 'canal_control',
        header: 'Canal',
        cell: ({ row }) => {
            const canal = row.getValue('canal_control')
            return h(UBadge, {
                color: canal === 'Verde' ? 'success' : canal === 'Naranja' ? 'warning' : 'error',
                variant: 'subtle',
                label: canal
            })
        }
    },

    {
        accessorKey: 'f_cierre',
        header: 'F. Cierre',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('f_cierre'))
    },

    {
        accessorKey: 'fecha_arribo',
        header: 'F. Arribo',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('fecha_arribo'))
    },
    {
        accessorKey: 'fecha_declaracion',
        header: 'F. Declaración',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('fecha_declaracion'))
    },
    {
        accessorKey: 'fecha_levante',
        header: 'F. Levante',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('fecha_levante'))
    },
    {
        accessorKey: 'dias_levante',
        header: 'Días de levante',
        cell: ({ row }) => 0   
    },
    {
        accessorKey: 'numero_dua',
        header: 'N. Dua',
        cell: ({ row }) => row.getValue('numero_dua')
    },
    {
        accessorKey: 'ajuste_valor',
        header: 'Ajuste',
        cell: ({ row }) => formatCurrency(row.getValue('ajuste_valor'))
    },
    {
        accessorKey: 'multa',
        header: 'Multa',
        cell: ({ row }) => formatCurrency(row.getValue('multa'))
    },
    {
        accessorKey: 'valor_fob',
        header: 'FOB',
        cell: ({ row }) => formatCurrency(row.getValue('valor_fob'))
    },
    {
        accessorKey: 'valor_flete',
        header: 'Flete',
        cell: ({ row }) => formatCurrency(row.getValue('valor_flete'))
    },

    {
        accessorKey: 'costo_destino',
        header: 'C. Destino',
        cell: ({ row }) => formatCurrency(row.getValue('costo_destino'))

    },
    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
            return h('div', { class: 'flex space-x-2' }, [
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-eye',
                    color: 'primary',
                    variant: 'ghost',
                    onClick: () => handleViewSteps(row.original.id)
                }),
                row.original.observaciones ?
                h(UButton, {
                    size: 'xs',
                    //icon  mail
                    icon: 'i-heroicons-envelope',
                    color: 'primary',
                    variant: 'ghost',
                    onClick: () => {
                        textModal.open({
                            content: row.original.observaciones,
                            title: 'Observaciones'
                        })
                    }
                }) : null
            ])
        }
    }
    
]
/**
 * Columnas para almacen
 */
const almacenColumns: TableColumn<any>[] = [
    {
        accessorKey: 'carga',
        header: 'Burden',
        cell: ({ row }) => `CARGA CONSOLIDADA #${row.getValue('carga')}`
    },
    {
        accessorKey: 'mes',
        header: 'Month',
        cell: ({ row }) => row.getValue('mes')
    },
    {
        accessorKey: 'pais',
        header: 'Country',
        cell: ({ row }) => row.original.pais?.No_Pais || 'N/A'
    },
    {
        accessorKey: 'f_cierre',
        header: 'Cut off',
        cell: ({ row }) => formatDateTimeToDmy(row.getValue('f_cierre'))
    },
    {
        accessorKey: 'empresa',
        header: 'Company',
        cell: ({ row }) => row.getValue('empresa')
    },
    {
        accessorKey: 'estado_china',
        header: 'Status',
        cell: ({ row }) => {
            const estado = row.getValue('estado_china') as string
            const color = getColorByEstado(estado)
            return h(UBadge, {
                color,
                variant: 'subtle',
                label: getEstadoLabel(estado)
            })
        }
    },
    {
        id: 'actions',
        header: 'Check',
        cell: ({ row }) => {
            return h('div', { class: 'flex space-x-2' }, [
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-eye',
                    color: 'primary',
                    variant: 'ghost',
                    onClick: () => handleViewSteps(row.original.id)
                })
            ])
        }
    }
]

const getColumns = ()=>{
    switch(currentRole.value){
        case ROLES.DOCUMENTACION:
            return documentacionColumns
        case ROLES.CONTENEDOR_ALMACEN:
            return almacenColumns
        default:
            return columns
    }
}

// Función para mapear estados según el rol
const getEstadoLabel = (estado: string) => {
    if (!estado) return 'N/A'

    if (isAlmacen.value) {
        // Para rol ContenedorConsolidado: mostrar en inglés
        const estadoMap: Record<string, string> = {
            'PENDIENTE': 'WAITING',
            'RECIBIENDO': 'RECEIVING',
            'COMPLETADO': 'FINISH',
            'WAITING': 'WAITING',
            'RECEIVING': 'RECEIVING',
            'FINISH': 'FINISH'
        }
        return estadoMap[estado] || estado
    } else {
        // Para otros roles: mostrar en español
        const estadoMap: Record<string, string> = {
            'WAITING': 'PENDIENTE',
            'RECEIVING': 'RECIBIENDO',
            'FINISH': 'COMPLETADO',
            'PENDIENTE': 'PENDIENTE',
            'RECIBIENDO': 'RECIBIENDO',
            'COMPLETADO': 'COMPLETADO'
        }
        return estadoMap[estado] || estado
    }
}

// Función para obtener el color del estado según el rol
const getColorByEstado = (estado: string) => {
    if (!estado) return 'neutral'
    console.log('estado', estado)

    // Para otros roles: colores en español
    if (estado === 'PENDIENTE') return 'warning'
    if (estado === 'RECIBIENDO') return 'info'
    if (estado === 'COMPLETADO') return 'success'


    return 'neutral'
}
const IDGINO = 28791
const handleViewSteps = (id: number) => {
    if (hasRole('ContenedorAlmacen')) {
        navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=embarque`)
    } else if (currentId.value !== IDGINO && currentRole.value === ROLES.COTIZADOR) {
        navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=prospectos`)
    } else {
        navigateTo(`/cargaconsolidada/completados/pasos/${id}`)
    }
}

const handleEditCarga = (id: number) => {
    console.log('Editar carga:', id)
}

const handleDeleteCarga = async (id: number) => {
    try {
        showConfirmation('¿Estás seguro de querer eliminar esta carga consolidada?', 'Esta acción no se puede deshacer.', async () => {
            await withSpinner(async () => {
                const response = await deleteConsolidado(id)
                if (response.success) {
                    showSuccess('Carga consolidada eliminada correctamente', 'La carga consolidada se ha eliminado correctamente.')
                }
                await getConsolidadoData()

            }, 'Eliminando carga consolidada~.')
        })
    } catch (error) {
        showError(error as string)
    }
}

const exportClientes = async () => {
    try {
        console.log('Exportando contenedores~.')
    } catch (error) {
        console.error('Error al exportar:', error)
    }
}


// Inicialización
onMounted(async () => {
    try {
        filters.value.completado = true
        await getConsolidadoData()
    } catch (error) {
        console.error('Error al cargar datos:', error)
    }
})
</script>
