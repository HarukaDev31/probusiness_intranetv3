import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import FileIcon from './FileIcon.vue'

const meta: Meta<typeof FileIcon> = {
    title: 'Commons/FileIcon',
    component: FileIcon,
    tags: ['autodocs'],
    argTypes: {
        file: {
            control: 'object',
            description: 'FileItem o File nativo. Determina el ícono a mostrar según la extensión.',
        },
    },
}

export default meta
type Story = StoryObj<typeof FileIcon>

const makeFile = (name: string, ext: string) => ({
    id: 1,
    file_name: name,
    file_url: null,
    type: ext,
    size: 102400,
    lastModified: Date.now(),
    file_ext: ext,
})

export const PDF: Story = {
    args: { file: makeFile('documento.pdf', 'pdf') },
}

export const Excel: Story = {
    args: { file: makeFile('reporte.xlsx', 'xlsx') },
}

export const Word: Story = {
    args: { file: makeFile('contrato.docx', 'docx') },
}

export const Imagen: Story = {
    args: { file: makeFile('foto.jpg', 'jpg') },
}

export const ImagenPNG: Story = {
    name: 'Imagen PNG',
    args: { file: makeFile('captura.png', 'png') },
}

export const ZIP: Story = {
    args: { file: makeFile('archivos.zip', 'zip') },
}

export const Desconocido: Story = {
    args: { file: makeFile('datos.dat', 'dat') },
}
