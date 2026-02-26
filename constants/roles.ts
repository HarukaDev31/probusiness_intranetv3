// Constantes globales de roles
export const ROLES = {
    CONTENEDOR_ALMACEN: 'ContenedorAlmacen',
    CONTENEDOR_CONSOLIDADO: 'ContenedorConsolidado',
    COORDINACION: 'Coordinación',
    ADMIN: 'Admin',
    USER: 'User',
    COTIZADOR: 'Cotizador',
    DOCUMENTACION: 'Documentacion',
    ADMINISTRACION: 'Administración',
    SUB_ADMINISTRACION: 'SUB_ADMINISTRACION',
    JEFE_IMPORTACIONES: 'Jefe Importacion',
    CONTABILIDAD: 'Contabilidad'
} as const
export const ID_JEFEVENTAS = 28791
export const COTIZADORES_WITH_PRIVILEGES = [28911]

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
    [ROLES.JEFE_IMPORTACIONES]: {
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

// Permisos específicos del calendario por rol
export const CALENDAR_PERMISSIONS = {
    [ROLES.JEFE_IMPORTACIONES]: {
        canViewAllActivities: true,
        canEditPriority: true,
        canEditAnyStatus: true,
        canAssignResponsables: true,
        canViewTeamProgress: true,
        canViewResponsableProgress: true,
        canAccessConfig: true,
        canFilterByResponsable: true,
        canFilterByContenedor: true,
        canCreateActivity: true,
        canDeleteActivity: true,
        canEditActivity: true
    },
    [ROLES.COORDINACION]: {
        canViewAllActivities: false,
        canEditPriority: false,
        canEditAnyStatus: false,
        canAssignResponsables: false,
        canViewTeamProgress: false,
        canViewResponsableProgress: false,
        canAccessConfig: false,
        canFilterByResponsable: true,
        canFilterByContenedor: true,
        canCreateActivity: false,
        canDeleteActivity: false,
        canEditActivity: false 
    },
    [ROLES.DOCUMENTACION]: {
        canViewAllActivities: false,
        canEditPriority: false,
        canEditAnyStatus: false,
        canAssignResponsables: false,
        canViewTeamProgress: false,
        canViewResponsableProgress: false,
        canAccessConfig: false,
        canFilterByResponsable: true,
        canFilterByContenedor: true,
        canCreateActivity: false,
        canDeleteActivity: false,
        canEditActivity:    false 
    },
    default: {
        canViewAllActivities: false,
        canEditPriority: false,
        canEditAnyStatus: false,
        canAssignResponsables: false,
        canViewTeamProgress: false,
        canViewResponsableProgress: false,
        canAccessConfig: false,
        canFilterByResponsable: false,
        canFilterByContenedor: false,
        canCreateActivity: false,
        canDeleteActivity: false,
        canEditActivity: false
    }
} as const

// Función helper para obtener permisos del calendario
export const getCalendarPermissions = (role: UserRole) => {
    return CALENDAR_PERMISSIONS[role as keyof typeof CALENDAR_PERMISSIONS] || CALENDAR_PERMISSIONS.default
}

// Función helper para obtener permisos de un rol
export const getRolePermissions = (role: UserRole) => {
    return PERMISSIONS[role] || PERMISSIONS.default
}

// Función helper para verificar si un rol tiene un permiso específico
export const hasPermission = (role: UserRole, permission: keyof typeof PERMISSIONS.default) => {
    const permissions = getRolePermissions(role)
    return permissions[permission] || false
}
