import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import SectionHeader from './SectionHeader.vue'

const meta: Meta<typeof SectionHeader> = {
    title: 'Commons/SectionHeader',
    component: SectionHeader,
    tags: ['autodocs'],
    argTypes: {
        title: { control: 'text', description: 'Título principal de la sección' },
        headers: { control: 'object', description: 'Array de headers con label, value e icon' },
        loading: { control: 'boolean', description: 'Muestra el skeleton de carga' },
        skeletonCount: { control: 'number', description: 'Cantidad de skeletons a mostrar' },
    },
}

export default meta
type Story = StoryObj<typeof SectionHeader>

const sampleHeaders = [
    { label: 'Cliente', value: 'Importaciones SAC', icon: 'i-heroicons-user' },
    { label: 'Campaña', value: 'CAMP-2025-001', icon: 'i-heroicons-tag' },
    { label: 'Contenedor', value: 'CONT-45G-001', icon: 'i-heroicons-cube' },
    { label: 'Moneda', value: 'USD', icon: 'i-heroicons-currency-dollar' },
]

export const Default: Story = {
    args: {
        title: 'Cotización #1042',
        headers: sampleHeaders,
        loading: false,
    },
}

export const Loading: Story = {
    name: 'Cargando (skeleton)',
    args: {
        title: null,
        headers: [],
        loading: true,
        skeletonCount: 4,
    },
}

export const SinTitulo: Story = {
    name: 'Sin título',
    args: {
        title: null,
        headers: sampleHeaders,
        loading: false,
    },
}

export const HeaderConIconoUrl: Story = {
    name: 'Con ícono de imagen',
    args: {
        title: 'Detalle de pago',
        headers: [
            {
                label: 'BCP',
                value: 'S/ 2,500.00',
                icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_credito.gif',
            },
            { label: 'Estado', value: 'Pendiente', icon: 'i-heroicons-clock' },
        ],
        loading: false,
    },
}
