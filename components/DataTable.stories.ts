import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import DataTable from './DataTable.vue'

const meta: Meta<typeof DataTable> = {
    title: 'Components/DataTable',
    component: DataTable,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        title: { control: 'text', description: 'Título de la tabla' },
        subtitle: { control: 'text', description: 'Subtítulo descriptivo' },
        loading: { control: 'boolean', description: 'Estado de carga' },
        data: { control: 'object', description: 'Datos de la tabla' },
        columns: { control: 'object', description: 'Definición de columnas' },
        totalRecords: { control: 'number', description: 'Total de registros' },
        currentPage: { control: 'number', description: 'Página actual' },
        itemsPerPage: { control: 'number', description: 'Items por página' },
        showPrimarySearch: { control: 'boolean', description: 'Muestra barra de búsqueda' },
        showFilters: { control: 'boolean', description: 'Muestra botón de filtros' },
        emptyStateMessage: { control: 'text', description: 'Mensaje cuando no hay datos' },
    },
}

export default meta
type Story = StoryObj<typeof DataTable>

const columnasCotizaciones = [
    { accessorKey: 'nro', header: 'N°', size: 60 },
    { accessorKey: 'cliente', header: 'Cliente' },
    { accessorKey: 'campana', header: 'Campaña' },
    { accessorKey: 'estado', header: 'Estado' },
    { accessorKey: 'moneda', header: 'Moneda', size: 80 },
    { accessorKey: 'importe', header: 'Importe', size: 120 },
]

const dataCotizaciones = [
    { nro: 1, cliente: 'Importaciones del Pacífico SAC', campana: 'CAMP-2025-001', estado: 'ABIERTO', moneda: 'USD', importe: '$12,500.00' },
    { nro: 2, cliente: 'Tech Solutions Peru', campana: 'CAMP-2025-002', estado: 'ABIERTO', moneda: 'USD', importe: '$8,300.00' },
    { nro: 3, cliente: 'Comercial Andina EIRL', campana: 'CAMP-2025-003', estado: 'COMPLETADO', moneda: 'PEN', importe: 'S/ 45,000.00' },
    { nro: 4, cliente: 'Distribuidora Central SAC', campana: 'CAMP-2025-004', estado: 'ABIERTO', moneda: 'USD', importe: '$22,100.00' },
    { nro: 5, cliente: 'Grupo Industrial Norte', campana: 'CAMP-2025-005', estado: 'COMPLETADO', moneda: 'USD', importe: '$9,750.00' },
]

export const Default: Story = {
    name: 'Tabla con datos',
    args: {
        title: 'Cotizaciones',
        subtitle: 'Listado de cotizaciones activas',
        icon: 'i-heroicons-document-text',
        data: dataCotizaciones,
        columns: columnasCotizaciones,
        loading: false,
        totalRecords: 5,
        currentPage: 1,
        itemsPerPage: 20,
        totalPages: 1,
        showPrimarySearch: true,
        showFilters: false,
        hideBackButton: true,
    },
}

export const Cargando: Story = {
    name: 'Estado de carga (skeleton)',
    args: {
        title: 'Cotizaciones',
        data: [],
        columns: columnasCotizaciones,
        loading: true,
        showSkeleton: true,
        skeletonRows: 5,
        skeletonCols: 6,
        hideBackButton: true,
    },
}

export const Vacio: Story = {
    name: 'Sin datos',
    args: {
        title: 'Cotizaciones',
        data: [],
        columns: columnasCotizaciones,
        loading: false,
        emptyStateMessage: 'No se encontraron cotizaciones con los filtros aplicados.',
        hideBackButton: true,
    },
}

export const ConFiltros: Story = {
    name: 'Con filtros activos',
    args: {
        title: 'Inspeccionados',
        subtitle: 'Filtrar por estado y fecha',
        icon: 'i-heroicons-eye',
        data: dataCotizaciones,
        columns: columnasCotizaciones,
        loading: false,
        totalRecords: 42,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 5,
        showPrimarySearch: true,
        showFilters: true,
        filterConfig: [
            {
                key: 'estado_inspeccion',
                label: 'Estado de inspección',
                placeholder: 'Todos',
                options: [
                    { label: 'Todos', value: 'todos' },
                    { label: 'Inspeccionado', value: 'Inspeccionado' },
                    { label: 'Completado', value: 'Completado' },
                ],
            },
            {
                key: 'estado_pago',
                label: 'Estado de pago',
                placeholder: 'Todos',
                options: [
                    { label: 'Todos', value: 'todos' },
                    { label: 'Pendiente', value: 'Pendiente' },
                    { label: 'Pagado', value: 'Pagado' },
                ],
            },
        ],
        hideBackButton: true,
    },
}

export const ConHeaders: Story = {
    name: 'Con headers de metadata',
    args: {
        title: 'Detalle del Consolidado',
        data: dataCotizaciones.slice(0, 3),
        columns: columnasCotizaciones,
        loading: false,
        showHeaders: true,
        headers: [
            { label: 'Contenedor', value: 'CONT-40G-001', icon: 'i-heroicons-cube' },
            { label: 'Puerto', value: 'Callao', icon: 'i-heroicons-map-pin' },
            { label: 'ETA', value: '2025-03-15', icon: 'i-heroicons-calendar' },
        ],
        hideBackButton: false,
    },
}
