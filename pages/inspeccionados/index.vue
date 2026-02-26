<template>
    <DataTable
        title="Inspeccionados"
        icon="i-heroicons-magnifying-glass"
        :data="inspeccionados"
        :columns="getColumns()"
        :show-pagination="true"
        :loading="loading"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-records="totalRecords"
        :items-per-page="itemsPerPage"
        :search-query-value="search"
        :show-secondary-search="false"
        :show-filters="true"
        :filter-config="filterConfig"
        :show-export="false"
        :hide-back-button="true"
        empty-state-message="No se encontraron clientes con carga inspeccionada."
        @update:primary-search="handleSearch"
        @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange"
        @filter-change="handleFilterChange"
        :show-body-top="true"
    >
      
    </DataTable>
</template>

<script setup lang="ts">
import { h, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UButton, USelect, UTooltip, UBadge } from '#components'
import { useInspeccionados } from '~/composables/cargaconsolidada/useInspeccionados'
import { usePagos } from '~/composables/cargaconsolidada/clientes/usePagos'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { formatCurrency } from '~/utils/formatters'
import { STATUS_BG_PAGOS_CLASSES } from '~/constants/ui'
import PagoGrid from '~/components/PagoGrid.vue'

const {
    inspeccionados,
    loading,
    search,
    itemsPerPage,
    totalPages,
    totalRecords,
    currentPage,
    getInspeccionados,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
} = useInspeccionados()

const { registrarPago, deletePago } = usePagos()
const { withSpinner } = useSpinner()
const { showSuccess, showError, showConfirmation } = useModal()

const INSPECCION_CLASSES: Record<string, string> = {
    Inspeccionado: 'bg-green-500 text-white dark:bg-green-500 dark:text-white',
    Completado:    'bg-blue-500  text-white dark:bg-blue-500  dark:text-white',
    Pendiente:     'bg-gray-400  text-white dark:bg-gray-400  dark:text-white',
}

const filterConfig = ref([
    {
        key:         'fecha_inicio',
        label:       'F. Inspección Inicio',
        type:        'date',
        placeholder: 'Selecciona una fecha',
        options:     [],
    },
    {
        key:         'fecha_fin',
        label:       'F. Inspección Fin',
        type:        'date',
        placeholder: 'Selecciona una fecha',
        options:     [],
    },
    {
        key:         'estado_inspeccion',
        label:       'Estado Inspección',
        type:        'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos',         value: 'todos',         inrow: false },
            { label: 'Inspeccionado', value: 'Inspeccionado', inrow: true  },
            { label: 'Completado',    value: 'Completado',    inrow: true  },
        ],
    },
    {
        key:         'estado_pago',
        label:       'Estado',
        type:        'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos',     value: 'todos',     inrow: false },
            { label: 'PENDIENTE', value: 'PENDIENTE', inrow: true  },
            { label: 'ADELANTO',  value: 'ADELANTO',  inrow: true  },
            { label: 'PAGADO',    value: 'PAGADO',    inrow: true  },
            { label: 'SOBREPAGO', value: 'SOBREPAGO', inrow: true  },
        ],
    },
])

const openWhatsapp = (row: any) => {
    const phone = (row.telefono ?? '').replace(/\D/g, '')
    if (!phone) {
        showError('Sin teléfono', 'Este cliente no tiene teléfono registrado.')
        return
    }
    const diferencia = row.diferencia ?? 0
    const monto      = formatCurrency(row.monto)
    const pagado     = formatCurrency(row.total_pagos)
    const pendiente  = formatCurrency(diferencia)
    const nombre     = row.nombre ?? 'Cliente'
    const campana    = row.campana ?? ''
    const msg = encodeURIComponent(
        `Estimado/a ${nombre}, le informamos que tiene un saldo pendiente de ${pendiente} (Importe: ${monto} | Pagado: ${pagado}) correspondiente a su carga de la campaña ${campana}. Por favor, comuníquese con nosotros para coordinar el pago. Gracias.`
    )
    window.open(`https://api.whatsapp.com/send?phone=51${phone}&text=${msg}`, '_blank')
}

const getColumns = (): TableColumn<any>[] => [
    {
        accessorKey: 'index',
        header:      'N°',
        cell:        ({ row }: { row: any }) => row.index + 1,
    },
    {
        accessorKey: 'contacto',
        header:      'Contacto',
        cell:        ({ row }: { row: any }) => {
            const { nombre, documento, telefono, correo } = row.original
            return h('div', { class: 'py-1' }, [
                h('div', { class: 'font-medium uppercase' }, nombre || '—'),
                documento ? h('div', { class: 'text-sm text-gray-500' }, documento) : null,
                telefono  ? h('div', { class: 'text-sm text-gray-500' }, telefono)  : null,
                h('div', { class: 'text-sm text-gray-500' }, correo || 'Sin correo'),
            ])
        },
    },
    {
        accessorKey: 'tipo_cliente',
        header:      'T. Cliente',
        cell:        ({ row }: { row: any }) => row.original.tipo_cliente || '—',
    },
    {
        accessorKey: 'campana',
        header:      'Campaña',
        cell:        ({ row }: { row: any }) => row.original.campana || '—',
    },
    {
        accessorKey: 'f_inspeccion',
        header:      'F. Inspección',
        cell:        ({ row }: { row: any }) => row.original.f_inspeccion || '—',
    },
    {
        accessorKey: 'acciones',
        header:      'Acciones',
        cell:        ({ row }: { row: any }) => {
            const item = row.original
            return h('div', { class: 'flex items-center gap-1' }, [
                h(UTooltip, { text: 'Enviar recordatorio de pago por WhatsApp' }, {
                    default: () => h(UButton, {
                        icon:    'i-heroicons-paper-airplane',
                        color:   'primary',
                        variant: 'ghost',
                        size:    'sm',
                        onClick: () => openWhatsapp(item),
                    }),
                }),
                h(UTooltip, { text: 'Ver cotizaciones del contenedor' }, {
                    default: () => h(UButton, {
                        icon:    'i-heroicons-eye',
                        color:   'neutral',
                        variant: 'ghost',
                        size:    'sm',
                        onClick: () => navigateTo(`/cargaconsolidada/abiertos/cotizaciones/${item.id_contenedor}?tab=pagos&idCotizacion=${item.id_cotizacion}`),
                    }),
                }),
            ])
        },
    },
    {
        accessorKey: 'estado_inspeccion',
        header:      'Inspección',
        cell:        ({ row }: { row: any }) => {
            const estado = row.original.estado_inspeccion || 'Pendiente'
            const cls    = INSPECCION_CLASSES[estado] || INSPECCION_CLASSES.Pendiente
            return h(UButton as any, {
                disabled: true,
                class:    ['min-w-28 justify-center', cls].join(' '),
                label:    estado,
                size:     'sm',
            })
        },
    },
    {
        accessorKey: 'estado_pago',
        header:      'Estado',
        cell:        ({ row }: { row: any }) => h(USelect as any, {
            modelValue: row.original.estado_pago,
            disabled:   true,
            items: [
                { label: 'PENDIENTE', value: 'PENDIENTE' },
                { label: 'ADELANTO',  value: 'ADELANTO'  },
                { label: 'PAGADO',    value: 'PAGADO'    },
                { label: 'SOBREPAGO', value: 'SOBREPAGO' },
            ],
            class: STATUS_BG_PAGOS_CLASSES[row.original.estado_pago as keyof typeof STATUS_BG_PAGOS_CLASSES],
        }),
    },
    {
        accessorKey: 'concepto',
        header:      'Concepto',
        cell:        ({ row }: { row: any }) => row.original.tipo_pago || 'Logística',
    },
    {
        accessorKey: 'importe',
        header:      'Importe',
        cell:        ({ row }: { row: any }) => formatCurrency(row.original.monto),
    },
    {
        accessorKey: 'pagado',
        header:      'Pagado',
        cell:        ({ row }: { row: any }) => formatCurrency(row.original.total_pagos),
    },
    {
        accessorKey: 'diferencia',
        header:      'Diferencia',
        cell:        ({ row }: { row: any }) => {
            const diff  = row.original.diferencia ?? 0
            const isPaid = diff <= 0
            return isPaid
                ? h(UBadge as any, {
                    color:   'success',
                    variant: 'solid',
                    label:   formatCurrency(Math.abs(diff)),
                    class:   'min-w-16 justify-center',
                })
                : h('span', {}, formatCurrency(diff))
        },
    },
    {
        accessorKey: 'adelantos',
        header:      'Adelantos',
        cell:        ({ row }: { row: any }) => {
            const item  = row.original
            const pagos = item.pagos || []
            return h(PagoGrid, {
                numberOfPagos:  4,
                pagoDetails:    pagos,
                clienteNombre:  item.nombre,
                currency:       'USD',
                showDelete:     true,
                onSave: (data: any) => {
                    const formData = new FormData()
                    for (const key in data) {
                        if (data[key] !== undefined && data[key] !== null) {
                            formData.append(key, data[key])
                        }
                    }
                    formData.append('idPedido',    item.id_cotizacion)
                    formData.append('idContenedor', item.id_contenedor)
                    formData.append('idCotizacion', item.id_cotizacion)
                    withSpinner(async () => {
                        const response = await registrarPago(formData)
                        if (response?.success) {
                            showSuccess('Pago registrado', 'Pago registrado correctamente', { duration: 3000 })
                            await getInspeccionados()
                        } else {
                            showError('Error al registrar pago', response?.error, { persistent: true })
                        }
                    }, 'Registrando pago...')
                },
                onDelete: (pagoId: number) => {
                    showConfirmation(
                        'Confirmar eliminación',
                        '¿Está seguro de que desea eliminar el pago? Esta acción no se puede deshacer.',
                        async () => {
                            try {
                                await withSpinner(async () => {
                                    const response = await deletePago(pagoId)
                                    if (response?.success) {
                                        await getInspeccionados()
                                        showSuccess('Eliminación exitosa', 'El pago se ha eliminado correctamente.')
                                    }
                                }, 'Eliminando pago...')
                            } catch {
                                showError('Error de eliminación', 'Error al eliminar el pago')
                            }
                        }
                    )
                },
            })
        },
    },
]

onMounted(() => getInspeccionados())
</script>
