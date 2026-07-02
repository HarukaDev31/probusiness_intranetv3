import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import Breadcrumbs from './Breadcrumbs.vue'

const meta: Meta<typeof Breadcrumbs> = {
    title: 'Components/Breadcrumbs',
    component: Breadcrumbs,
    tags: ['autodocs'],
    parameters: {
        // Use a mocked route for Storybook
        nuxt: {
            route: { path: '/cargaconsolidada/abiertos/cotizaciones' },
        },
    },
    decorators: [
        () => ({ template: '<div class="bg-white p-4 rounded-lg"><story /></div>' }),
    ],
}

export default meta
type Story = StoryObj<typeof Breadcrumbs>

export const Default: Story = {
    name: 'Carga Consolidada > Abiertos > Cotizaciones',
    parameters: {
        nuxt: { route: { path: '/cargaconsolidada/abiertos/cotizaciones' } },
    },
}

export const Inicio: Story = {
    name: 'Inicio',
    parameters: {
        nuxt: { route: { path: '/' } },
    },
}

export const BaseDatos: Story = {
    name: 'Base de Datos',
    parameters: {
        nuxt: { route: { path: '/basedatos/clientes' } },
    },
}

export const DetalleContenedor: Story = {
    name: 'Detalle de contenedor',
    parameters: {
        nuxt: { route: { path: '/cargaconsolidada/abiertos/cotizaciones/42', params: { id: '42' } } },
    },
}
