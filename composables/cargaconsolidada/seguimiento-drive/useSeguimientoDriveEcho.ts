import { getEchoInstance, useEcho } from '~/composables/websocket/useEcho'
import type { SeguimientoDriveStatus } from '~/types/cargaconsolidada/seguimiento-drive'
import { SEGUIMIENTO_DRIVE_WS_EVENT, seguimientoDriveChannelName } from './constants'
import { isSeguimientoDriveTerminal } from './statusHelpers'
import { parseSeguimientoDriveWsPayload } from './wsPayload'

type SeguimientoDriveEchoHandlers = {
    onStatus: (data: SeguimientoDriveStatus) => void
    onTerminal: (data: SeguimientoDriveStatus, notify: boolean) => void
    shouldNotify: () => boolean
    clearNotify: () => void
}

export const useSeguimientoDriveEcho = () => {
    const { subscribeToChannel, unsubscribeFromChannel } = useEcho()

    let canalActivo: string | null = null
    let contenedorSuscripcion: number | null = null

    const desuscribir = () => {
        if (!canalActivo) return
        try {
            unsubscribeFromChannel(canalActivo)
        } catch (e) {
            console.warn('[SeguimientoDrive] Error al desuscribir canal:', canalActivo, e)
        }
        canalActivo = null
        contenedorSuscripcion = null
    }

    const suscribir = (contenedorId: number, handlers: SeguimientoDriveEchoHandlers) => {
        if (!contenedorId || typeof window === 'undefined') return
        if (!getEchoInstance()) return

        const channelName = seguimientoDriveChannelName(contenedorId)
        if (canalActivo === channelName && contenedorSuscripcion === contenedorId) return

        desuscribir()

        subscribeToChannel({
            name: channelName,
            type: 'private',
            handlers: [
                {
                    event: SEGUIMIENTO_DRIVE_WS_EVENT,
                    callback: (raw: unknown) => {
                        const payload = parseSeguimientoDriveWsPayload(raw)
                        if (!payload?.data || Number(payload.id_contenedor) !== contenedorId) return

                        handlers.onStatus(payload.data)

                        if (isSeguimientoDriveTerminal(payload.data)) {
                            handlers.onTerminal(payload.data, handlers.shouldNotify())
                            handlers.clearNotify()
                        }
                    },
                },
            ],
        })

        canalActivo = channelName
        contenedorSuscripcion = contenedorId
    }

    return {
        suscribir,
        desuscribir,
    }
}
