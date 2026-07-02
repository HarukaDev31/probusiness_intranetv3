import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import ModalPreview from './ModalPreview.vue'

const meta: Meta<typeof ModalPreview> = {
    title: 'Commons/ModalPreview',
    component: ModalPreview,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        isOpen: { control: 'boolean', description: 'Controla la visibilidad del modal' },
        file: { control: 'object', description: 'Archivo a previsualizar (FileItem)' },
        onClose: { action: 'close' },
    },
}

export default meta
type Story = StoryObj<typeof ModalPreview>

export const Imagen: Story = {
    name: 'Preview de imagen',
    args: {
        isOpen: true,
        file: {
            id: 1,
            file_name: 'inspeccion_2025.jpg',
            file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
            type: 'jpg',
            size: 204800,
            lastModified: Date.now(),
            file_ext: 'jpg',
        },
    },
}

export const PDF: Story = {
    name: 'Preview de PDF',
    args: {
        isOpen: true,
        file: {
            id: 2,
            file_name: 'factura_importacion.pdf',
            file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf',
            type: 'pdf',
            size: 512000,
            lastModified: Date.now(),
            file_ext: 'pdf',
        },
    },
}

export const Excel: Story = {
    name: 'Preview de Excel',
    args: {
        isOpen: true,
        file: {
            id: 3,
            file_name: 'lista_productos.xlsx',
            file_url: null,
            type: 'xlsx',
            size: 102400,
            lastModified: Date.now(),
            file_ext: 'xlsx',
        },
    },
}

export const Cerrado: Story = {
    name: 'Modal cerrado',
    args: {
        isOpen: false,
        file: null,
    },
}
