import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import InspeccionSection from './InspeccionSection.vue'

const meta: Meta<typeof InspeccionSection> = {
    title: 'Components/InspeccionSection',
    component: InspeccionSection,
    tags: ['autodocs'],
    argTypes: {
        files: { control: 'object', description: 'Archivos de inspección ya subidos' },
        selectedFiles: { control: 'object', description: 'Archivos seleccionados por el usuario' },
        loading: { control: 'boolean', description: 'Estado de carga al guardar' },
        disabled: { control: 'boolean', description: 'Deshabilita la subida de archivos' },
        showRemoveButton: { control: 'boolean', description: 'Muestra botón de eliminar en cada archivo' },
    },
}

export default meta
type Story = StoryObj<typeof InspeccionSection>

const archivosExistentes = [
    {
        id: 1,
        file_name: 'inspeccion_2025_01.jpg',
        file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
        type: 'jpg',
        size: 204800,
        lastModified: Date.now(),
        file_ext: 'jpg',
    },
    {
        id: 2,
        file_name: 'inspeccion_etiquetado.jpg',
        file_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        type: 'jpg',
        size: 153600,
        lastModified: Date.now(),
        file_ext: 'jpg',
    },
]

export const Vacio: Story = {
    name: 'Sin archivos',
    args: {
        files: [],
        selectedFiles: [],
        loading: false,
        disabled: false,
        showRemoveButton: false,
    },
}

export const ConArchivos: Story = {
    name: 'Con archivos de inspección',
    args: {
        files: archivosExistentes,
        selectedFiles: [],
        loading: false,
        disabled: false,
        showRemoveButton: true,
    },
}

export const Cargando: Story = {
    name: 'Guardando archivos...',
    args: {
        files: archivosExistentes,
        selectedFiles: [],
        loading: true,
        disabled: true,
        showRemoveButton: false,
    },
}

export const Deshabilitado: Story = {
    name: 'Solo lectura (deshabilitado)',
    args: {
        files: archivosExistentes,
        selectedFiles: [],
        loading: false,
        disabled: true,
        showRemoveButton: false,
    },
}
