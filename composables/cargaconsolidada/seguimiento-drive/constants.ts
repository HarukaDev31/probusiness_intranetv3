/** Canal privado Laravel Echo: `private-carga-consolidada.seguimiento-drive.{idContenedor}` */
export const seguimientoDriveChannelName = (idContenedor: number | string) =>
    `carga-consolidada.seguimiento-drive.${idContenedor}`

export const SEGUIMIENTO_DRIVE_WS_EVENT = 'SeguimientoConsolidadoDriveLinkUpdated'
