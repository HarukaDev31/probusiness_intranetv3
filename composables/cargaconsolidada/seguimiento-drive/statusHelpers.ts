import type { SeguimientoDriveStatus } from '~/types/cargaconsolidada/seguimiento-drive'

export const isSeguimientoDriveProcessing = (
    data: Partial<SeguimientoDriveStatus> | null | undefined
) =>
    Boolean(
        data?.processing
        || data?.link_status === 'queued'
        || data?.link_status === 'processing'
    )

export const isSeguimientoDriveTerminal = (
    data: Partial<SeguimientoDriveStatus> | null | undefined
) =>
    Boolean(
        (data?.vinculado && data?.drive_link)
        || data?.link_status === 'completed'
        || data?.link_status === 'failed'
    )

export const mergeSeguimientoDriveStatus = (
    current: SeguimientoDriveStatus | null,
    patch: Partial<SeguimientoDriveStatus>
): SeguimientoDriveStatus => ({
    vinculado: false,
    ...(current || {}),
    ...patch,
})
