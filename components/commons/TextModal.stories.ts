import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import TextModal from './TextModal.vue'

const meta: Meta<typeof TextModal> = {
    title: 'Commons/TextModal',
    component: TextModal,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        title: { control: 'text', description: 'Título del modal' },
        content: { control: 'text', description: 'Contenido de texto a mostrar' },
        onClose: { action: 'close' },
    },
}

export default meta
type Story = StoryObj<typeof TextModal>

export const Default: Story = {
    args: {
        title: 'Observaciones',
        content: 'El cliente solicitó que el pedido sea entregado en el almacén principal de Ate Vitarte. Se debe coordinar con el área de logística con al menos 48 horas de anticipación.',
    },
}

export const ContenidoLargo: Story = {
    name: 'Contenido largo',
    args: {
        title: 'Términos y condiciones del embarque',
        content: `El presente acuerdo establece las condiciones generales para la carga consolidada.\n\n1. El cliente acepta los tiempos de tránsito estimados.\n2. Los seguros de carga son responsabilidad del cliente.\n3. Cualquier demora en aduana será notificada oportunamente.\n4. El pago debe realizarse antes del retiro del contenedor.\n5. Se permiten hasta 2 modificaciones sin costo adicional.`,
    },
}

export const NombreTramitador: Story = {
    name: 'Nombre del tramitador',
    args: {
        title: 'Tramitador asignado',
        content: 'Carlos Mendoza Quispe\nTelefono: +51 987 654 321\nEmail: c.mendoza@tramitadores.pe',
    },
}
