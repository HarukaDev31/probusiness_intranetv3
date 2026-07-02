import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import PagoDetailsModal from './PagoDetailsModal.vue'

const meta: Meta<typeof PagoDetailsModal> = {
    title: 'Commons/PagoDetailsModal',
    component: PagoDetailsModal,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        pagoDetails: { control: 'object', description: 'Detalles del pago a mostrar' },
        currency: { control: 'select', options: ['USD', 'PEN'], description: 'Moneda' },
        showDelete: { control: 'boolean', description: 'Muestra botón de eliminar' },
        onDelete: { action: 'delete' },
        onClose: { action: 'close' },
    },
}

export default meta
type Story = StoryObj<typeof PagoDetailsModal>

const pagoConVoucher = {
    id_pago: 1,
    monto: '1500.00',
    banco: 'BCP',
    payment_date: '2025-01-15T10:30:00',
    estado: 'PAGADO',
    is_confirmed: 1,
    voucher_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    concepto: 'Adelanto 1',
}

const pagoBCP: Story = {
    name: 'Pago con voucher (BCP)',
    args: {
        pagoDetails: pagoConVoucher,
        currency: 'USD',
        showDelete: true,
    },
}

export { pagoBCP as PagoBCP }

export const PagoInterbank: Story = {
    name: 'Pago Interbank',
    args: {
        pagoDetails: {
            ...pagoConVoucher,
            id_pago: 2,
            banco: 'INTERBANK',
            monto: '3000.00',
        },
        currency: 'USD',
        showDelete: false,
    },
}

export const PagoSinEliminar: Story = {
    name: 'Solo lectura (sin eliminar)',
    args: {
        pagoDetails: pagoConVoucher,
        currency: 'PEN',
        showDelete: false,
    },
}
