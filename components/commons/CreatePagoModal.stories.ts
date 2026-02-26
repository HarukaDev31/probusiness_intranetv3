import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import CreatePagoModal from './CreatePagoModal.vue'

const meta: Meta<typeof CreatePagoModal> = {
    title: 'Commons/CreatePagoModal',
    component: CreatePagoModal,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        clienteNombre: { control: 'text', description: 'Nombre del cliente a pagar' },
        currency: { control: 'select', options: ['USD', 'PEN'], description: 'Moneda del pago' },
        soloComprobante: { control: 'boolean', description: 'Solo muestra campo de comprobante (oculta monto/banco/fecha)' },
        tituloComprobante: { control: 'text', description: 'Título alternativo cuando soloComprobante=true' },
        onSave: { action: 'save' },
        onClose: { action: 'close' },
    },
}

export default meta
type Story = StoryObj<typeof CreatePagoModal>

export const RegistrarPago: Story = {
    name: 'Registrar pago completo',
    args: {
        clienteNombre: 'Importaciones del Pacífico SAC',
        currency: 'USD',
        soloComprobante: false,
    },
}

export const RegistrarPagoSoles: Story = {
    name: 'Registrar pago en soles',
    args: {
        clienteNombre: 'Comercial Andina EIRL',
        currency: 'PEN',
        soloComprobante: false,
    },
}

export const SoloComprobante: Story = {
    name: 'Solo subir comprobante',
    args: {
        clienteNombre: 'Tech Solutions Peru',
        currency: 'USD',
        soloComprobante: true,
        tituloComprobante: 'Derecho de tramite - Permiso DIGESA',
    },
}
