import type { SeguimientoDriveWsPayload } from '~/types/cargaconsolidada/seguimiento-drive'

export const parseSeguimientoDriveWsPayload = (raw: unknown): SeguimientoDriveWsPayload | null => {
    if (!raw) return null
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) as SeguimientoDriveWsPayload
        } catch {
            return null
        }
    }
    return raw as SeguimientoDriveWsPayload
}
