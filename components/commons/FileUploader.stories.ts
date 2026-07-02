import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import FileUploader from './FileUploader.vue'

const meta: Meta<typeof FileUploader> = {
    title: 'Commons/FileUploader',
    component: FileUploader,
    tags: ['autodocs'],
    argTypes: {
        multiple: { control: 'boolean', description: 'Permite subir múltiples archivos' },
        disabled: { control: 'boolean', description: 'Deshabilita la subida' },
        showSaveButton: { control: 'boolean', description: 'Muestra botón de guardar individual' },
        showRemoveButton: { control: 'boolean', description: 'Muestra botón de eliminar' },
        readOnly: { control: 'boolean', description: 'Solo lectura: no permite añadir ni quitar archivos' },
        acceptedTypes: { control: 'object', description: 'Extensiones permitidas' },
        customMessage: { control: 'text', description: 'Mensaje personalizado en la zona de drop' },
        initialFiles: { control: 'object', description: 'Archivos ya subidos a mostrar inicialmente' },
    },
}

export default meta
type Story = StoryObj<typeof FileUploader>

const archivosIniciales = [
    {
        id: 1,
        file_name: 'factura_comercial.pdf',
        file_url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf',
        type: 'pdf',
        size: 512000,
        lastModified: Date.now(),
        file_ext: 'pdf',
    },
    {
        id: 2,
        file_name: 'lista_empaque.xlsx',
        file_url: null,
        type: 'xlsx',
        size: 102400,
        lastModified: Date.now(),
        file_ext: 'xlsx',
    },
]

export const Default: Story = {
    name: 'Subida simple (un archivo)',
    args: {
        multiple: false,
        disabled: false,
        showSaveButton: false,
        showRemoveButton: true,
        initialFiles: [],
    },
}

export const Multiple: Story = {
    name: 'Subida múltiple',
    args: {
        multiple: true,
        disabled: false,
        showSaveButton: false,
        showRemoveButton: true,
        customMessage: 'Selecciona o arrastra las fotos de inspección',
        acceptedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov'],
        initialFiles: [],
    },
}

export const ConArchivosIniciales: Story = {
    name: 'Con archivos ya subidos',
    args: {
        multiple: true,
        disabled: false,
        showSaveButton: false,
        showRemoveButton: true,
        initialFiles: archivosIniciales,
    },
}

export const SoloLectura: Story = {
    name: 'Solo lectura',
    args: {
        multiple: false,
        disabled: false,
        readOnly: true,
        showRemoveButton: false,
        initialFiles: archivosIniciales,
    },
}

export const Deshabilitado: Story = {
    name: 'Deshabilitado',
    args: {
        multiple: false,
        disabled: true,
        showRemoveButton: false,
        initialFiles: [],
    },
}
