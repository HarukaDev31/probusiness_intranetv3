import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import ImageModal from './ImageModal.vue'

const meta: Meta<typeof ImageModal> = {
    title: 'Components/ImageModal',
    component: ImageModal,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        isOpen: { control: 'boolean', description: 'Controla la visibilidad del modal' },
        imageUrl: { control: 'text', description: 'URL de la imagen a mostrar' },
        altText: { control: 'text', description: 'Texto alternativo de la imagen' },
        onClose: { action: 'close' },
    },
}

export default meta
type Story = StoryObj<typeof ImageModal>

export const Abierto: Story = {
    name: 'Modal abierto',
    args: {
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
        altText: 'Vista previa de imagen',
    },
}

export const Cerrado: Story = {
    name: 'Modal cerrado',
    args: {
        isOpen: false,
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
        altText: 'Vista previa de imagen',
    },
}

export const Voucher: Story = {
    name: 'Voucher de pago',
    args: {
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
        altText: 'Voucher de pago BCP',
    },
}
