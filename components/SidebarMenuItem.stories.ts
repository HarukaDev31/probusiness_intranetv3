import type { Meta, StoryObj } from '@storybook-vue/nuxt'
import SidebarMenuItem from './SidebarMenuItem.vue'

const meta: Meta<typeof SidebarMenuItem> = {
    title: 'Components/SidebarMenuItem',
    component: SidebarMenuItem,
    tags: ['autodocs'],
    decorators: [
        () => ({ template: '<ul class="w-64 bg-white rounded-lg p-2"><story /></ul>' }),
    ],
    argTypes: {
        item: { control: 'object', description: 'Objeto del ítem de menú' },
        level: { control: 'number', description: 'Nivel de anidamiento (0 = raíz)' },
    },
}

export default meta
type Story = StoryObj<typeof SidebarMenuItem>

const baseItem = {
    ID_Menu: 1,
    No_Menu: 'Carga Consolidada',
    Txt_Css_Icons: 'fa fa-boxes',
    No_Menu_Url: '#',
    url_intranet_v2: '/cargaconsolidada',
    Hijos: [],
    SubHijos: [],
}

export const ItemRaiz: Story = {
    name: 'Ítem raíz (nivel 0)',
    args: {
        item: baseItem,
        level: 0,
    },
}

export const ItemConHijos: Story = {
    name: 'Con submenú',
    args: {
        item: {
            ...baseItem,
            No_Menu: 'Abiertos',
            url_intranet_v2: null,
            No_Menu_Url: '#',
            Hijos: [
                { ID_Menu: 2, No_Menu: 'Cotizaciones', Txt_Css_Icons: 'fa fa-file-alt', url_intranet_v2: '/cargaconsolidada/abiertos/cotizaciones', Hijos: [], SubHijos: [] },
                { ID_Menu: 3, No_Menu: 'Clientes', Txt_Css_Icons: 'fa fa-users', url_intranet_v2: '/cargaconsolidada/abiertos/clientes', Hijos: [], SubHijos: [] },
            ],
        },
        level: 0,
    },
}

export const ItemNivel1: Story = {
    name: 'Ítem nivel 1 (sub-ítem)',
    args: {
        item: {
            ID_Menu: 4,
            No_Menu: 'Cotizaciones',
            Txt_Css_Icons: 'fa fa-file-alt',
            No_Menu_Url: '/cargaconsolidada/abiertos/cotizaciones',
            url_intranet_v2: '/cargaconsolidada/abiertos/cotizaciones',
            Hijos: [],
            SubHijos: [],
        },
        level: 1,
    },
}
