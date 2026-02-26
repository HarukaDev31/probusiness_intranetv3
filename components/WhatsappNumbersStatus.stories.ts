import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import WhatsappNumbersStatus from './WhatsappNumbersStatus.vue'

const meta: Meta<typeof WhatsappNumbersStatus> = {
    title: 'Components/WhatsappNumbersStatus',
    component: WhatsappNumbersStatus,
    tags: ['autodocs'],
    argTypes: {
        instances: { control: 'object', description: 'Array de instancias de WhatsApp a monitorear' },
        autoRefresh: { control: 'boolean', description: 'Actualización automática del estado' },
        refreshInterval: { control: 'number', description: 'Intervalo de actualización en ms' },
        fullWidth: { control: 'boolean', description: 'Ocupa todo el ancho disponible' },
    },
}

export default meta
type Story = StoryObj<typeof WhatsappNumbersStatus>

const instances = [
    { instanceName: 'instance-1', key: 'Linea Principal (+51 987 654 321)' },
    { instanceName: 'instance-2', key: 'Linea Secundaria (+51 976 543 210)' },
    { instanceName: 'instance-3', key: 'Linea Contabilidad (+51 965 432 109)' },
]

export const Default: Story = {
    args: {
        instances,
        autoRefresh: false,
        fullWidth: false,
    },
}

export const UnaInstancia: Story = {
    name: 'Una instancia',
    args: {
        instances: [instances[0]],
        autoRefresh: false,
    },
}

export const SinInstancias: Story = {
    name: 'Sin instancias',
    args: {
        instances: [],
        autoRefresh: false,
    },
}

export const AnchoCompleto: Story = {
    name: 'Ancho completo',
    args: {
        instances,
        autoRefresh: false,
        fullWidth: true,
    },
}
