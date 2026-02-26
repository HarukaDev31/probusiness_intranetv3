import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import PagoGrid from './PagoGrid.vue'

const meta: Meta<typeof PagoGrid> = {
    title: 'Components/PagoGrid',
    component: PagoGrid,
    tags: ['autodocs'],
    argTypes: {
        numberOfPagos: { control: 'number', description: 'Número de celdas de pago a mostrar' },
        pagoDetails: { control: 'object', description: 'Array con detalles de cada pago' },
        clienteNombre: { control: 'text', description: 'Nombre del cliente' },
        currency: { control: 'select', options: ['USD', 'PEN'], description: 'Moneda del pago' },
        showDelete: { control: 'boolean', description: 'Permite eliminar pagos' },
    },
}

export default meta
type Story = StoryObj<typeof PagoGrid>

const pagosEjemplo = [
    {
        id: 1,
        monto: '1500.00',
        banco: 'BCP',
        fecha_pago: '2025-01-15',
        estado: 'PAGADO',
        is_confirmed: 1,
        voucher_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        payment_date: '2025-01-15',
        concepto: 'Adelanto 1',
    },
    {
        id: 2,
        monto: '2000.00',
        banco: 'INTERBANK',
        fecha_pago: '2025-02-01',
        estado: 'PAGADO',
        is_confirmed: 1,
        voucher_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        payment_date: '2025-02-01',
        concepto: 'Adelanto 2',
    },
]

export const SinPagos: Story = {
    name: 'Sin adelantos (4 celdas vacías)',
    args: {
        numberOfPagos: 4,
        pagoDetails: [],
        clienteNombre: 'Importaciones SAC',
        currency: 'USD',
        showDelete: false,
    },
}

export const UnPago: Story = {
    name: 'Un adelanto registrado',
    args: {
        numberOfPagos: 4,
        pagoDetails: [pagosEjemplo[0]],
        clienteNombre: 'Importaciones SAC',
        currency: 'USD',
        showDelete: false,
    },
}

export const DosPagos: Story = {
    name: 'Dos adelantos registrados',
    args: {
        numberOfPagos: 4,
        pagoDetails: pagosEjemplo,
        clienteNombre: 'Tech Solutions Peru',
        currency: 'USD',
        showDelete: true,
    },
}

export const EnSoles: Story = {
    name: 'En soles (PEN)',
    args: {
        numberOfPagos: 3,
        pagoDetails: [pagosEjemplo[0]],
        clienteNombre: 'Comercial Andina',
        currency: 'PEN',
        showDelete: false,
    },
}
