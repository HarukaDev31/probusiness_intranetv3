export interface CotizacionesViewProps {
    role?: string
    basePath: string
    backBasePath?: string
    /** Vista Jefe de Ventas: prospectos de todos los contenedores abiertos o completados juntos. */
    scope?: 'abiertos' | 'completados'
}
