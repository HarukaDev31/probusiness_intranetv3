import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import AdelantoPreviewModal from './AdelantoPreviewModal.vue'

const meta: Meta<typeof AdelantoPreviewModal> = {
    title: 'Commons/AdelantoPreviewModal',
    component: AdelantoPreviewModal,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        modelValue: { control: 'boolean', description: 'Controla la visibilidad del modal' },
        pago: { control: 'object', description: 'Datos del adelanto a visualizar' },
        onDelete: { action: 'onDelete' },
    },
}

export default meta
type Story = StoryObj<typeof AdelantoPreviewModal>

const pagoBase = {
    id: 1,
    monto: '2500.00',
    fecha_pago: '2025-01-20',
    estado: 'PAGADO',
    is_confirmed: 1,
    banco: 'BCP',
    voucher_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
}

export const Abierto: Story = {
    name: 'Modal abierto - BCP',
    args: {
        modelValue: true,
        pago: pagoBase,
    },
}

export const ConYape: Story = {
    name: 'Modal abierto - YAPE',
    args: {
        modelValue: true,
        pago: {
            ...pagoBase,
            id: 2,
            banco: 'YAPE',
            monto: '500.00',
        },
    },
}

export const Cerrado: Story = {
    name: 'Modal cerrado',
    args: {
        modelValue: false,
        pago: pagoBase,
    },
}
