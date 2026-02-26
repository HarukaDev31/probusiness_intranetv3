import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import LoadingState from './LoadingState.vue'

const meta: Meta<typeof LoadingState> = {
    title: 'Components/LoadingState',
    component: LoadingState,
    tags: ['autodocs'],
    argTypes: {
        message: { control: 'text', description: 'Mensaje mostrado debajo del spinner' },
    },
}

export default meta
type Story = StoryObj<typeof LoadingState>

export const Default: Story = {
    args: {
        message: 'Cargando datos...',
    },
}

export const Cotizaciones: Story = {
    args: {
        message: 'Cargando cotizaciones...',
    },
}

export const Documentos: Story = {
    args: {
        message: 'Cargando documentos...',
    },
}

export const SinMensaje: Story = {
    args: {
        message: '',
    },
    name: 'Sin mensaje',
}
