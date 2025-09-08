import { ROLES } from "./roles"

export const CUSTOM_MENUS_PER_ROLE = {
    'Carga Consolidada': {
        [ROLES.DOCUMENTACION]: {
            'Carga Consolidada':'Pendientes',
            
        },
        [ROLES.COTIZADOR]: {
            'Carga Consolidada':'Abiertos',
            'Completados':'Embarcados',
        },
        [ROLES.COORDINACION]: {
            'Carga Consolidada':'Abiertos',
            'Completados':'Embarcados',
        },
        [ROLES.CONTENEDOR_ALMACEN]: {
            'Carga Consolidada':'Waiting',
            'Completados':'Finished',
        },
      
    }
}