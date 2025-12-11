<template>
    <div class="">
        <WhatsappNumbersStatus 
        :instances="[{ instanceName: 'COORDINATION', key: 'Coordinación' },
            { instanceName: 'SELLS', key: 'Ventas' }
        ]"
        :auto-refresh="true"
        :refresh-interval="30000"
        :compact="true"
        />


        <div v-if="isDesktop || currentRole==ROLES.DOCUMENTACION">
            <DataTable title="Carga Consolidada Completada"  :show-pagination="false"   icon="" :show-title="true" :data="consolidadoData" :columns="getColumns()" :loading="loading"
            :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
            :items-per-page="itemsPerPage" :search-query-value="search" :show-secondary-search="false"
            :show-filters="false" :filter-config="filterConfig" :filters-value="(() => {
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
        <!-- Mobile list view: visible only on small screens -->
        <div v-if="currentRole!==ROLES.DOCUMENTACION" class="md:hidden mt-4">
            <div class="flex flex-col gap-3">
                <template v-for="(row, idx) in consolidadoData" :key="row.id || idx">
                    <button type="button" @click="handleViewSteps(row.id)" class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary">
                        <div class="flex-1">
                            <div class="text-xs text-gray-500">{{ row.mes }}</div>
                            <div class="font-semibold text-sm">Consolidado #{{ row.carga }}</div>
                            <div class="text-xs text-gray-400 mt-1">{{ formatDateTimeToDmy(row.f_cierre) }} • {{ row.empresa }}</div>
                        </div>
                        <div class="ml-4 flex flex-col items-end">
                            <div class="min-w-[110px]">
                                <USelect :modelValue="row.estado_china"
                                    variant="subtle"
                                    disabled
                                    :items="[
                                        { label: 'PENDIENTE', value: 'PENDIENTE' },
                                        { label: 'RECIBIENDO', value: 'RECIBIENDO' },
                                        { label: 'COMPLETADO', value: 'COMPLETADO' }
                                    ]"
                                    :class="STATUS_BG_CLASSES[(row.estado_china) as keyof typeof STATUS_BG_CLASSES]
                                    + ' text-sm py-2 px-3 rounded-full'"
                                />
                            </div>
                            <div class="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-300">
                                <div class="flex items-center gap-2">
                                    <img data-v-f8957c9e="" src="https://upload.wikimedia.org/wikipedia/commons/c/cf/Flag_of_Peru.svg" alt="icon" class="w-4 h-2.5">
                                    <span class="whitespace-nowrap">{{ safeCbm(row, 'cbm_total_peru') }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <img data-v-f8957c9e="" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg" alt="icon" class="w-4 h-2.5">
                                    <span class="whitespace-nowrap">{{ safeCbm(row, 'cbm_total_china') }}</span>
                                </div>
                            </div>
                        </div>
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, h, resolveComponent, onMounted, watch, onUnmounted } from 'vue'
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

// Desktop detection: keep DataTable out of DOM on small screens to avoid flicker
const isDesktop = ref(false)
const updateIsDesktop = () => {
    try {
        isDesktop.value = window.innerWidth >= 768 // tailwind md breakpoint
    } catch (e) {
        isDesktop.value = true
    }
}
onMounted(() => {
    updateIsDesktop()
    window.addEventListener('resize', updateIsDesktop)
})
onUnmounted(() => {
    try { window.removeEventListener('resize', updateIsDesktop) } catch (e) {}
})

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

const safeCbm = (r: any, key: string) => {
    try {
        const val = (r && (r as any)[key]) ?? (r && (r as any).original && (r as any).original[key])
        return val != null ? formatNumber(val, 2) : 'N/A'
    } catch (e) {
        return 'N/A'
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
        cell: ({ row }) => {
            const fa =
            row.getValue('fecha_arribo') ||
            row.original?.fecha_arribo || // por si viene en original
            row.original?.f_puerto

            return fa ? formatDateTimeToDmy(fa) : 'N/A'
        }
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
        accessorKey: 'cbm_total_peru',
        header: 'CBM Perú',
        cell: ({ row }) => formatNumber(row.getValue('cbm_total_peru'), 2)
    },
    {
        accessorKey: 'cbm_total_china',
        header: 'CBM China',
        cell: ({ row }) => formatNumber(row.getValue('cbm_total_china'), 2)
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
        accessorKey: 'naviera',
        header: 'Naviera',
        cell: ({ row }) => row.getValue('naviera')
    },

    {
        //Tiempo de transito (fecha_zarpe-fecha arribo)
        accessorKey: 't_transito',
        header: 'T. transito',
        cell: ({ row }) => {
            const fechaZarpe = row.original.fecha_zarpe
            const fechaArribo = row.original.fecha_arribo
            if (!fechaZarpe || !fechaArribo) return 'N/A'
            const dateZarpe = new Date(String(fechaZarpe).split(' ')[0])
            const dateArribo = new Date(String(fechaArribo).split(' ')[0])
            if (isNaN(dateZarpe.getTime()) || isNaN(dateArribo.getTime())) return 'N/A'
            const diffMs = dateArribo.getTime() - dateZarpe.getTime() // llegada - zarpe
            const diffDays = Math.floor(diffMs / 86400000)
            return diffDays < 0 ? 0 : diffDays
        }
    },
    {
        //Dias-levante(fecha_levante - fecha_arribo)
        accessorKey: 'dias_levante',
        header: 'Días de levante',
        cell: ({ row }) => {
            const fechaLevante = row.original.fecha_levante
            const fechaArribo = row.original.fecha_arribo
            if (!fechaLevante || !fechaArribo) return 'N/A'
            const dateLevante = new Date(String(fechaLevante).split(' ')[0])
            const dateArribo = new Date(String(fechaArribo).split(' ')[0])
            if (isNaN(dateLevante.getTime()) || isNaN(dateArribo.getTime())) return 'N/A'
            const diffMs = dateLevante.getTime() - dateArribo.getTime()
            const diffDays = Math.floor(diffMs / 86400000)
            return diffDays < 0 ? 0 : diffDays
        }
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
        accessorKey: 'cbm_total_peru',
        header: 'CBM Perú',
        cell: ({ row }) => formatNumber(row.getValue('cbm_total_peru'), 2)
    },
    {
        accessorKey: 'cbm_total_china',
        header: 'CBM China',
        cell: ({ row }) => formatNumber(row.getValue('cbm_total_china'), 2)
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
