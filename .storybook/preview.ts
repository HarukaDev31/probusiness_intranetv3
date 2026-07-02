import type { Preview } from '@storybook-vue/nuxt'

// Set up mock auth user so useUserRole works in stories
if (typeof window !== 'undefined') {
    window.localStorage.setItem(
        'auth_user',
        JSON.stringify({
            id: 1,
            nombre: 'Demo Probusiness',
            nombres_apellidos: 'Demo Probusiness',
            email: 'demo@probusiness.pe',
            role: 'COTIZADOR',
            avatar: null,
            isActive: true,
            empresa: { id: 1, nombre: 'Probusiness SAC' },
            grupo: {
                id: 2,
                nombre: 'COTIZADOR',
                descripcion: 'Cotizador',
                tipo_privilegio: 2,
                estado: 1,
                notificacion: 1,
            },
            organizacion: { id: 1, nombre: 'Probusiness' },
            raw: {
                id: 1,
                nombre: 'Demo Probusiness',
                nombres_apellidos: 'Demo Probusiness',
                email: 'demo@probusiness.pe',
                empresa: { id: 1, nombre: 'Probusiness SAC' },
                estado: 1,
                grupo: {
                    id: 2,
                    nombre: 'COTIZADOR',
                    descripcion: 'Cotizador',
                    tipo_privilegio: 2,
                    estado: 1,
                    notificacion: 1,
                },
                organizacion: { id: 1, nombre: 'Probusiness' },
            },
        })
    )
}

const preview: Preview = {
    parameters: {
        backgrounds: {
            default: 'app',
            values: [
                { name: 'app', value: '#f0f4f9' },
                { name: 'white', value: '#ffffff' },
                { name: 'dark', value: '#111827' },
            ],
        },
        layout: 'padded',
        docs: {
            toc: true,
        },
    },
}

export default preview
