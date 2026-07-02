import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import SimpleUploadFile from './SimpleUploadFile.vue'

const meta: Meta<typeof SimpleUploadFile> = {
    title: 'Commons/SimpleUploadFile',
    component: SimpleUploadFile,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        title: { control: 'text', description: 'Título del modal' },
        withNameField: { control: 'boolean', description: 'Muestra campo para nombre del documento' },
        onSave: { action: 'save' },
        onClose: { action: 'close' },
    },
}

export default meta
type Story = StoryObj<typeof SimpleUploadFile>

export const SubirArchivo: Story = {
    name: 'Subir archivo simple',
    args: {
        title: 'Subir Documento',
        withNameField: false,
    },
}

export const ConNombreDocumento: Story = {
    name: 'Con campo de nombre',
    args: {
        title: 'Subir Nuevo Documento',
        withNameField: true,
    },
}

export const SubirComprobante: Story = {
    name: 'Subir comprobante',
    args: {
        title: 'Subir Comprobante de Pago',
        withNameField: false,
    },
}
