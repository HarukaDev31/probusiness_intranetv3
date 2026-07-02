export type SeguimientoDriveLinkStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type SeguimientoDriveStatus = {
    vinculado: boolean
    processing?: boolean
    link_status?: SeguimientoDriveLinkStatus | null
    link_error?: string | null
    drive_link?: string | null
    vinculado_at?: string | null
    file_name?: string | null
    drive_configured?: boolean
}

export type SeguimientoDriveWsPayload = {
    id_contenedor?: number
    data?: SeguimientoDriveStatus
}

export type SeguimientoDriveVincularResponse = {
    success: boolean
    queued?: boolean
    message?: string
    data?: Partial<SeguimientoDriveStatus>
}

export type SeguimientoDriveHeadersPayload = {
    excel_seguimiento_drive?: SeguimientoDriveStatus | null
}

export type SeguimientoDriveVincularResult = {
    success: boolean
    queued?: boolean
    error?: string
    drive_link?: string | null
}

export type SeguimientoDriveCorteConfig = {
    hora_corte: string
    timezone: string
    periodo_contactar_inicio: string
    periodo_contactar_fin: string
    excel_config_label: string
}

export type SeguimientoDriveCorteConfigResponse = {
    success: boolean
    message?: string
    data?: SeguimientoDriveCorteConfig
}
