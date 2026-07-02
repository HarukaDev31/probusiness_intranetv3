import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import ErrorState from './ErrorState.vue'

const meta: Meta<typeof ErrorState> = {
    title: 'Components/ErrorState',
    component: ErrorState,
    tags: ['autodocs'],
    argTypes: {
        message: { control: 'text', description: 'Mensaje de error a mostrar' },
        onRetry: { action: 'retry', description: 'Emitido al hacer click en Reintentar' },
    },
}

export default meta
type Story = StoryObj<typeof ErrorState>

export const Default: Story = {
    args: {
        message: 'Ha ocurrido un error al cargar los datos.',
    },
}

export const SinConexion: Story = {
    name: 'Sin conexión',
    args: {
        message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
    },
}

export const ErrorServidor: Story = {
    name: 'Error de servidor',
    args: {
        message: 'Error 500: Error interno del servidor. Por favor, intenta más tarde.',
    },
}
