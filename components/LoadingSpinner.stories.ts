import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import LoadingSpinner from './LoadingSpinner.vue'

const meta: Meta<typeof LoadingSpinner> = {
    title: 'Components/LoadingSpinner',
    component: LoadingSpinner,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl'],
            description: 'Tamaño del spinner',
        },
        text: {
            control: 'text',
            description: 'Texto opcional debajo del spinner',
        },
        fullScreen: {
            control: 'boolean',
            description: 'Muestra el spinner en pantalla completa',
        },
    },
}

export default meta
type Story = StoryObj<typeof LoadingSpinner>

export const Small: Story = {
    name: 'Pequeño (sm)',
    args: { size: 'sm', text: '' },
}

export const Medium: Story = {
    name: 'Mediano (md)',
    args: { size: 'md', text: '' },
}

export const Large: Story = {
    name: 'Grande (lg)',
    args: { size: 'lg', text: 'Cargando...' },
}

export const ExtraLarge: Story = {
    name: 'Extra grande (xl)',
    args: { size: 'xl', text: 'Procesando solicitud...' },
}

export const ConTexto: Story = {
    name: 'Con texto',
    args: { size: 'md', text: 'Por favor espera...' },
}
