// Constantes globales de roles
export const ROLES = {
    CONTENEDOR_ALMACEN: 'ContenedorAlmacen',
    CONTENEDOR_CONSOLIDADO: 'ContenedorConsolidado',
    ADMIN: 'Admin',
    USER: 'User',
    COORDINADOR: 'Coordinador',
    VENTAS: 'Ventas'
} as const

// Tipos de roles
export type UserRole = typeof ROLES[keyof typeof ROLES]

// Configuraciones de estados según el rol
export const ESTADOS_CONFIG = {
    [ROLES.CONTENEDOR_CONSOLIDADO]: {
        estados: [
            { label: 'Todos', value: 'todos' },
            { label: 'WAITING', value: 'WAITING' },
            { label: 'RECEIVING', value: 'RECEIVING' },
            { label: 'FINISH', value: 'FINISH' }
        ],
        mapeo: {
            'PENDIENTE': 'WAITING',
            'RECIBIENDO': 'RECEIVING',
            'COMPLETADO': 'FINISH',
            'WAITING': 'WAITING',
            'RECEIVING': 'RECEIVING',
            'FINISH': 'FINISH'
        },
        colores: {
            'WAITING': 'warning',
            'RECEIVING': 'info',
            'FINISH': 'success'
        }
    },
    default: {
        estados: [
            { label: 'Todos', value: 'todos' },
            { label: 'PENDIENTE', value: 'PENDIENTE' },
            { label: 'RECIBIENDO', value: 'RECIBIENDO' },
            { label: 'COMPLETADO', value: 'COMPLETADO' }
        ],
        mapeo: {
            'WAITING': 'PENDIENTE',
            'RECEIVING': 'RECIBIENDO',
            'FINISH': 'COMPLETADO',
            'PENDIENTE': 'PENDIENTE',
            'RECIBIENDO': 'RECIBIENDO',
            'COMPLETADO': 'COMPLETADO'
        },
        colores: {
            'PENDIENTE': 'warning',
            'RECIBIENDO': 'info',
            'COMPLETADO': 'success'
        }
    }
} as const

// Configuraciones de permisos por rol
export const PERMISSIONS = {
    [ROLES.CONTENEDOR_ALMACEN]: {
        canViewSteps: true,
        canEdit: false,
        canDelete: false,
        canExport: true,
        canFilter: true
    },
    [ROLES.CONTENEDOR_CONSOLIDADO]: {
        canViewSteps: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canFilter: true
    },
    [ROLES.ADMIN]: {
        canViewSteps: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canFilter: true
    },
    default: {
        canViewSteps: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canFilter: false
    }
} as const

// Función helper para obtener permisos de un rol
export const getRolePermissions = (role: UserRole) => {
    return PERMISSIONS[role] || PERMISSIONS.default
}

// Función helper para verificar si un rol tiene un permiso específico
export const hasPermission = (role: UserRole, permission: keyof typeof PERMISSIONS.default) => {
    const permissions = getRolePermissions(role)
    return permissions[permission] || false
}
