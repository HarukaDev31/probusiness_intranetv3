import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import PageHeader from './PageHeader.vue'

const meta: Meta<typeof PageHeader> = {
    title: 'Components/PageHeader',
    component: PageHeader,
    tags: ['autodocs'],
    argTypes: {
        title: { control: 'text', description: 'Título principal de la página' },
        subtitle: { control: 'text', description: 'Subtítulo descriptivo' },
        icon: { control: 'text', description: 'Nombre del ícono (heroicons / mdi / etc.)' },
        hideBackButton: { control: 'boolean', description: 'Oculta el botón de retroceso' },
    },
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
    args: {
        title: 'Cotizaciones',
        subtitle: 'Gestiona las cotizaciones de carga consolidada',
        icon: 'i-heroicons-document-text',
        hideBackButton: false,
    },
}

export const SinSubtitulo: Story = {
    name: 'Sin subtítulo',
    args: {
        title: 'Inspeccionados',
        icon: 'i-heroicons-eye',
        hideBackButton: false,
    },
}

export const SinBotonAtras: Story = {
    name: 'Sin botón atrás',
    args: {
        title: 'Dashboard',
        subtitle: 'Resumen general del sistema',
        icon: 'i-heroicons-chart-bar',
        hideBackButton: true,
    },
}

export const Documentacion: Story = {
    args: {
        title: 'Documentación',
        subtitle: 'Gestión de documentos de importación',
        icon: 'i-heroicons-folder-open',
        hideBackButton: false,
    },
}
