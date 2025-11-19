<template>
    <div class="p-6">
        <PageHeader title="Curso" subtitle="Gestión de cursos" icon="" :hide-back-button="true" />
        <DataTable title="" icon="" :data="cursosData" :columns="columns" :loading="loading" :current-page="currentPage"
            v-if="activeTab === 'alumnos'" :total-pages="totalPages" :total-records="totalRecords"
            :items-per-page="itemsPerPage" :search-query-value="searchQuery" :show-primary-search="true"
            :primary-search-label="'Buscar por'" :primary-search-placeholder="'Buscar...'" :show-filters="true"
            :filter-config="filterConfig" :filters-value="filters" :show-export="true"
            empty-state-message="No se encontraron clientes que coincidan con los criterios de búsqueda."
            @update:primarySearch="handleSearch" @page-change="handlePageChange"
            @items-per-page-change="handleItemsPerPageChange" @export="handleExport" @filter-change="handleFilterChange"
            :show-body-top="true">
            <template #actions>

                <!--button to navigate to /curso/campañas-->
                <UButton icon="i-heroicons-plus" label="Ver Campañas" @click="navigateTo('/campanas')" class="py-3" />
            </template>
            <template #body-top>
                <UTabs v-model="activeTab" :items="tabs" variant="pill" class="mb-1 w-80 h-15" />
                <div class="mb-4 flex justify-end">
                    <div class="text-lg font-semibold text-gray-900 dark:text-white">
                        Importe total:
                        <span class="text-black dark:text-primary-400 bg-white p-2 rounded-md border border-gray-200">
                            {{ formatCurrency(totalAmountCursos, 'PEN') }}
                        </span>
                    </div>
                </div>
            </template>
        </DataTable>
        <DataTable title="" icon="" :data="pagosData" :columns="columnsPagos" :loading="loadingPagos"
            :current-page="currentPagePagos" v-else-if="activeTab === 'pagos'" :total-pages="totalPagesPagos"
            :total-records="totalRecordsPagos" :items-per-page="itemsPerPagePagos"
            :search-query-value="searchQueryPagos" :show-primary-search="true" :primary-search-label="'Buscar por'"
            :primary-search-placeholder="'Buscar...'" :show-filters="false" :filter-config="filterConfigPagos"
            :filters-value="filtersPagos" :show-export="false"
            empty-state-message="No se encontraron clientes que coincidan con los criterios de búsqueda."
            @update:primarySearch="handleSearchPagos" @page-change="handlePageChangePagos"
            @items-per-page-change="handleItemsPerPageChangePagos" @filter-change="handleFilterChangePagos"
            :show-body-top="true">
            <template #body-top>
                <UTabs v-model="activeTab" :items="tabs" variant="pill" class="mb-1 w-80 h-15" />
                <div class="mb-4 flex justify-end">
                    <div class="text-lg font-semibold text-gray-900 dark:text-white">
                        Importe total:
                        <span class="text-black dark:text-primary-400 bg-white p-2 rounded-md border border-gray-200">
                            {{ formatCurrency(totalAmountPagos, 'PEN') }}
                        </span>
                    </div>
                </div>
            </template>
        </DataTable>
    </div>

</template>
<script setup lang="ts">
import { ref, h, resolveComponent, onMounted, watch } from 'vue'
import { useCursos } from '~/composables/useCursos'
import { useRouter } from 'vue-router'
const router = useRouter()
import type { CursoItem } from '~/types/cursos/cursos'
import type { TableColumn } from '@nuxt/ui'
import { useRoute } from 'vue-router'
import { usePagos } from '~/composables/curso/usePagos'
import type { FilterConfig } from '~/types/data-table'
import PagoGrid from '~/components/PagoGrid.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
const { withSpinner } = useSpinner()
const { showConfirmation, showSuccess, showError } = useModal()
const {
    cursosData,
    loading,
    currentPage,
    totalPages, getFiltros,
    loadCursos,
    totalRecords,
    itemsPerPage,
    searchQuery,
    filterConfig,
    filters,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
    exportData,
    clearFilters,
    changeTipoCurso,
    changeEstadoPedido,
    changeImportePedido,
    deleteCurso,
    totalAmountCursos,
    changeEstadoUsuarioExterno,
    sendRecordatorioPago
} = useCursos()
const {
    pagosData,
    loadingPagos,
    currentPagePagos,
    totalPagesPagos,
    loadPagos,
    totalRecordsPagos,
    itemsPerPagePagos,
    searchQueryPagos,
    filterConfigPagos,
    filtersPagos,
    handleSearchPagos,
    handlePageChangePagos,
    handleItemsPerPageChangePagos,
    handleFilterChangePagos,
    totalAmountPagos,
    deletePago,
    registrarPago,
} = usePagos()
const activeTab = ref('')

const tabs = [
    { label: 'Alumnos', value: 'alumnos' },
    { label: 'Pagos', value: 'pagos' }
]
import { UButton, USelect, UInput } from '#components'
const estadoClasses: Record<string, string> = {
    pendiente: 'bg-gray-100 text-gray-800',
    adelanto: 'bg-yellow-100 text-yellow-800',
    pagado: 'bg-green-100 text-green-800',
    sobrepago: 'bg-red-100 text-red-800'
}

const onItemsPerPageChange = (newLimit: number) => {
    loadCursos({ page: 1, limit: newLimit })
}

const columns = ref<TableColumn<CursoItem>[]>([
    {
        accessorKey: 'index',
        header: 'N.',
        cell: ({ row }) => {
            const index = cursosData.value.indexOf(row.original)
            return index + 1
        }
    },

    {
        accessorKey: 'Fe_Registro',
        header: 'Fecha',
        cell: ({ row }: { row: any }) => row.getValue('Fe_Registro')
    },
    {
        accessorKey: 'cliente',
        header: 'Cliente',
        cell: ({ row }: { row: any }) => {
            return h('div', [
                h('p', row.original.No_Entidad),
                h('p', row.original.Nu_Documento_Identidad),
                h('p', row.original.Nu_Celular_Entidad),
                h('p', row.original.Txt_Email_Entidad)
            ])
        }
    },
    {
        accessorKey: 'tipo_curso',
        header: 'Curso',
        cell: ({ row }: { row: any }) => {
            const value = row.original.tipo_curso
            const items = [
                { label: 'Virtual', value: "0", icon: 'i-heroicons-video-camera' },
                { label: 'En vivo', value: "1", icon: 'i-heroicons-computer-desktop' }
            ]
            const icon = items.find(item => item.value === value)?.icon
            return h(USelect as any, {
                modelValue: value,
                'onUpdate:modelValue': (value: any) => {
                    row.original.tipo_curso = value
                    handleChangeTipoCurso(value, row.original.ID_Pedido_Curso)
                },
                placeholder: 'Seleccionar tipo',
                variant: 'outline',
                size: 'sm',
                items,
                option: (option: any) => h('div', { class: 'flex items-center gap-2' }, [
                    h('span', { class: option.icon }),
                    h('span', option.label)
                ]),
                icon,
                class: 'w-full'
            })
        }
    },
    {
        accessorKey: 'campana',
        header: 'Campaña',
        cell: ({ row }: { row: any }) => {
            //create a select with the campanas in filterConfig with key campana and select with row.original.ID_Campana
            return h(USelect as any, {
                modelValue: row.original.ID_Campana,
                'onUpdate:modelValue': (value: any) => {
                    row.original.ID_Campana = value
                    handleChangeEstadoPedido(value, row.original.ID_Pedido_Curso)
                },
                placeholder: 'Seleccionar campaña',
                items: filterConfig.value.find((filter: any) => filter.key === 'campanas')?.options || []
            })
        }
    },
    {
        accessorKey: 'usuario',
        header: 'Usuario',
        cell: ({ row }: { row: any }) => {
            const items = [
                { label: 'Pendiente', value: 3, icon: 'ic:outline-access-time' },
                { label: 'Creado', value: 2, icon: 'ic:outline-person' },
                { label: 'Constancia', value: 4, icon: 'solar:diploma-outline', disabled: true }
            ]
            // Solo mostrar la opción de constancia si puede_constancia es verdadero
            
            const icon = items.find(item => item.value === row.original.Nu_Estado_Usuario_Externo)?.icon
            // Valor por defecto: pendiente (1) si no está definido
            let  modelValue = row.original.Nu_Estado_Usuario_Externo ?? 1
            if(row.original.puede_constancia){
                modelValue = 4
            }
            return h(USelect as any, {
                modelValue,
                'onUpdate:modelValue': (value: any) => {
                    row.original.Nu_Estado_Usuario_Externo = value
                    handleChangeEstadoUsuarioExterno(row.original.ID_Usuario, row.original.ID_Pedido_Curso)
                },
                placeholder: 'Seleccionar usuario',
                items,
                option: (option: any) => h('div', { class: 'flex items-center gap-2' }, [
                    h('span', { class: option.icon }),
                    h('span', option.label)
                ]),
                icon,
            })
        }
    },
    {
        accessorKey: 'importe',
        header: 'Importe',
        cell: ({ row }: { row: any }) => {
            return h(UInput as any, {
                modelValue: row.original.Ss_Total,
                type: 'number',
                variant: 'outline',
                size: 'sm',
                class: 'w-full',
                'onUpdate:modelValue': (value: any) => {
                    row.original.Ss_Total = value
                }
            })
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            //parse all to 2 decimal places
            const nSs_Importe = Number(row.original.Ss_Total??0)
            const nTotal_pagos = Number(row.original.total_pagos??0)
            let value = 'pendiente'
            
            if(nTotal_pagos > nSs_Importe){
                value = 'sobrepago'
            }else if(nTotal_pagos < nSs_Importe && nTotal_pagos !== 0){
                value = 'adelanto'
            }else if(nTotal_pagos === nSs_Importe && nSs_Importe !== 0){
                value = 'pagado'
            }
            const items = [
                { label: 'Pendiente', value: 'pendiente', icon: 'ic:outline-access-time' },
                { label: 'Adelanto', value: 'adelanto', icon: 'ic:round-double-arrow' },
                { label: 'Pagado', value: 'pagado', icon: 'ic:baseline-check-circle-outline' },
                { label: 'Sobrepago', value: 'sobrepago', icon: 'ri:error-warning-line' }
            ]
            const icon = items.find(item => item.value === value)?.icon
            return h(USelect as any, {
                modelValue: value,
                disabled: true,
                'onUpdate:modelValue': (val: any) => {
                    row.original.estado_pago = val
                },
                placeholder: 'Seleccionar estado',
                items,
                option: (option: any) => h('div', {
                    class: estadoClasses[option.value] + ' rounded px-2 py-1 flex items-center gap-2'
                }, [
                    h('span', { class: option.icon }),
                    h('span', option.label)
                ]),
                icon,
                class: estadoClasses[value] + ' rounded px-2 py-1',

            })
        },
    },
    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
            const curso = row.original
            return h('div', { class: 'flex items-center gap-2' }, [
                h(UButton, {
                    icon: 'i-heroicons-eye',
                    variant: 'solid',
                    onClick: () => viewCurso(curso)
                }),
                h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'outline',
                    onClick: () => {
                        handleDeleteCurso(row.original.ID_Pedido_Curso)
                    }
                }),
                h(UButton, {
                    icon: 'ic:outline-save',
                    variant: 'outline',
                    onClick: () => {
                        handleChangeImporte(row.original.ID_Pedido_Curso, row.original.Ss_Total)
                    }
                }),
                h(UButton, {
                    icon: 'i-heroicons-chat-bubble-left-right',
                    variant: 'outline',
                    color: 'primary',
                    onClick: () => {
                        handleSendRecordatorioPago(row.original)
                    }
                })
            ])
        }
    }
])
const columnsPagos = ref<TableColumn<CursoItem>[]>([
    //N.	Fecha	Nombre	DNI/RUC	WhatsApp	Precio	Pagado	Adelanto
    {
        accessorKey: 'index',
        header: 'N.',
        cell: ({ row }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => {
            return row.original.Fe_Registro
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }) => {
            const nombre = row.original.No_Entidad || ''
            const dni = row.original.Nu_Documento_Identidad || ''
            const telefono = row.original.Nu_Celular_Entidad || ''
            return h('div', { class: 'py-2' }, [
                h('div', { class: 'font-medium' }, nombre),
                h('div', { class: 'text-sm text-gray-500' }, dni),
                h('div', { class: 'text-sm text-gray-500' }, telefono)
            ])
        }
    },
    {
        accessorKey: 'precio',
        header: 'Precio',
        cell: ({ row }) => {
            return formatCurrency(Number(row.original.Ss_Total), 'PEN')
        }
    },
    {
        accessorKey: 'pagado',
        header: 'Pagado',
        cell: ({ row }) => {
            return formatCurrency(Number(row.original.total_pagos), 'PEN')
        }
    },
    {
        accessorKey: 'adelanto',
        header: 'Adelanto',
        cell: ({ row }) => {
            const pagos = row.original.pagos_details || []
            return h(PagoGrid, {
                pagoDetails: pagos,
                numberOfPagos: 4,
                clienteNombre: row.original.No_Entidad,
                currency: 'PEN',
                onSave: (data) => {
                    const formData = new FormData();
                    for (const key in data) {
                        if (data[key] !== undefined && data[key] !== null) {
                            formData.append(key, data[key]);
                        }
                    }
                    formData.append('idPedido', row.original.ID_Pedido_Curso)

                    withSpinner(async () => {
                        const response = await registrarPago(formData)
                        if (response.success) {
                            showSuccess('Pago registrado', 'Pago registrado correctamente', { duration: 3000 })
                            loadPagos()
                        } else {
                            showError('Error al registrar pago', response.error, { persistent: true })
                        }
                    }, 'registrarPago')

                },
                onDelete: (pagoId: number) => {
                    showConfirmation(
                        'Confirmar eliminación',
                        '¿Está seguro de que desea eliminar el pago? Esta acción no se puede deshacer.',
                        async () => {
                            try {
                                await withSpinner(async () => {
                                    const response = await deletePago(pagoId)
                                    if (response.success) {
                                        showSuccess('Eliminación Exitosa', 'El pago se ha eliminado correctamente.')
                                        await loadPagos()
                                    }
                                }, 'Eliminando pago...')
                            } catch (error) {
                                console.error('Error al eliminar el pago:', error)
                                showError('Error de Eliminación', 'Error al eliminar el pago')
                            }
                        }
                    )
                },
            })
        }
    }
])
const handleChangeEstadoPedido = async (value: number, idPedido: number) => {
    const data = {
        id_pedido: idPedido,
        estado_pedido: value
    }
    try {
        await withSpinner(async () => {
            const response = await changeEstadoPedido(data)
            if (response.success) {
                showSuccess('Estado de pedido cambiado', 'Estado de pedido cambiado correctamente')
            } else {
                showError('Error al cambiar el estado de pedido', response.error)
            }
        })
    } catch (error) {
        showError('Error al cambiar el estado de pedido', error as string)
    }
}
const handleChangeEstadoUsuarioExterno = async (idUsuario: number, idPedido: number) => {
    const data = {
        id_usuario: idUsuario,
        id_pedido: idPedido
    }
    try {
        await withSpinner(async () => {
            const response = await changeEstadoUsuarioExterno(data)
            if (response.success) {
                if(response?.data){
                    
                    //show success with data.No_Usuario Y data.No_Password
                    let usuario = response.data.No_Usuario??response.data.moodle_username
                    let password = response.data.No_Password??response.data.moodle_password
                    showSuccess('El Usuario ha sido creado en Moodle', `Usuario: ${usuario}, Password: ${password}`)
                }else{
                    showSuccess('Estado de usuario externo cambiado', 'Estado de usuario externo cambiado correctamente')
                }
                await loadCursos()  
            } else {
                showError('Error al cambiar el estado de usuario externo', response.error)
            }
        })
    } catch (error) {
        showError('Error al cambiar el estado de usuario externo', error as string)
    }
}
const handleDeleteCurso = async (idPedido: number) => {
    const data = {
        id_pedido: idPedido
    }
    try {
        showConfirmation(
            'Confirmar eliminación',
            '¿Está seguro de que desea eliminar el curso? Esta acción no se puede deshacer.',
            async () => {
                await withSpinner(async () => {
                    const response = await deleteCurso(data)
                    if (response.success) {
                        showSuccess('Curso eliminado', 'Curso eliminado correctamente')
                        loadCursos()
                    } else {
                        showError('Error al eliminar el curso', response.error)
                    }
                })
            }
        )
    } catch (error) {
        showError('Error al eliminar el curso', error as string)
    }
}
const handleChangeImporte = async (idPedido: number, importe: string) => {
    const data = {
        id_pedido: idPedido,
        importe: Number(importe)
    }
    try {
        await withSpinner(async () => {
            const response = await changeImportePedido(data)
            if (response.success) {
                showSuccess('Importe cambiado', 'Importe cambiado correctamente')
                loadCursos()
            } else {
                showError('Error al cambiar el importe', response.error)
            }
        })
    } catch (error) {
        showError('Error al cambiar el importe', error as string)
    }
}
const handleChangeTipoCurso = async (value: number, idPedido: number) => {
    const data = {
        id_pedido: idPedido,
        id_tipo_curso: value
    }
    try {
        await withSpinner(async () => {
            const response = await changeTipoCurso(data)
            if (response.success) {
                showSuccess('Tipo de curso cambiado', 'Tipo de curso cambiado correctamente')
            } else {
                showError('Error al cambiar el tipo de curso', response.error)
            }
        })
    } catch (error) {
        showError('Error al cambiar el tipo de curso', error as string)
    }
}
const handleExport = async () => {
    await withSpinner(async () => { 
        const response = await exportData()
        if (response.success) {
            showSuccess('Exportación exitosa', 'La exportación se ha realizado correctamente')
        } else {
            showError('Error al exportar cursos', response.error)
        }
    }, 'Exportando cursos...')
}
const fillFilters = async () => {
    const response = await getFiltros()
    
    filterConfig.value = response.data as FilterConfig[]

}
watch(activeTab, async (newTab, oldTab) => {
    if (newTab === 'alumnos') {
        navigateTo(`/curso?tab=alumnos`)

        // reset search to avoid sending stale query param to backend
        try { searchQuery.value = '' } catch (e) { /* ignore */ }
        await loadCursos()
    } else if (newTab === 'pagos') {
        navigateTo(`/curso?tab=pagos`)
        try { searchQueryPagos.value = '' } catch (e) { /* ignore */ }
        await loadPagos()
    }
})
onMounted(async () => {
    const query = useRoute().query
    if (query.tab) {
        activeTab.value = query.tab as string
    } else {
        activeTab.value = tabs[0].value || 'alumnos'
    }
    await loadCursos()
    await fillFilters()
})

const handleSendRecordatorioPago = async (curso: CursoItem) => {
    const nombreCliente = curso.No_Entidad || 'Cliente'
    showConfirmation(
        'Enviar recordatorio de pago',
        `¿Está seguro de que desea enviar un recordatorio de pago por WhatsApp a ${nombreCliente}?`,
        async () => {
            try {
                await withSpinner(async () => {
                    const response = await sendRecordatorioPago(curso.ID_Pedido_Curso)
                    if (response.success) {
                        showSuccess('Recordatorio enviado', 'El recordatorio de pago se ha enviado correctamente por WhatsApp')
                    } else {
                        showError('Error al enviar recordatorio', response.error || 'No se pudo enviar el recordatorio')
                    }
                }, 'Enviando recordatorio...')
            } catch (error) {
                showError('Error al enviar recordatorio', error as string)
            }
        }
    )
}

const viewCurso = (curso: CursoItem) => {
    navigateTo(`/curso/${curso.ID_Pedido_Curso}`)
}
</script>
