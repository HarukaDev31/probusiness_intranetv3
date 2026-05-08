export interface ConsolidadoPasosViewProps {
/** Rol para skeleton/permisos (ej. ROLES.COORDINACION, ROLES.DOCUMENTACION) */
    role: string
    /** Ruta al hacer clic en Regresar */
    backRoute: string
    /** Base path para enlaces a pasos (ej. /cargaconsolidada/abiertos o /cargaconsolidada/coordinacion/abiertos) */
    basePath: string
}
