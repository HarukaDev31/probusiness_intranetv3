import { computed, ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { EmbarcadosService } from '~/services/cargaconsolidada/clientes/embarcadosService'
import type {
    SeguimientoDriveStatus,
    SeguimientoDriveVincularResult,
} from '~/types/cargaconsolidada/seguimiento-drive'
import {
    isSeguimientoDriveProcessing,
    mergeSeguimientoDriveStatus,
} from './statusHelpers'
import { useSeguimientoDriveEcho } from './useSeguimientoDriveEcho'

export const useSeguimientoDrive = () => {
    const { showSuccess, showError, showInfo } = useModal()
    const { suscribir, desuscribir } = useSeguimientoDriveEcho()

    const driveSeguimientoStatus = ref<SeguimientoDriveStatus | null>(null)
    const loadingDriveSeguimiento = ref(false)
    const waitingDriveLink = ref(false)

    let notificacionPendiente = false

    const isDriveLinkPending = computed(() =>
        waitingDriveLink.value || isSeguimientoDriveProcessing(driveSeguimientoStatus.value)
    )

    const applyStatus = (data: Partial<SeguimientoDriveStatus> | null | undefined) => {
        if (!data) return
        driveSeguimientoStatus.value = mergeSeguimientoDriveStatus(driveSeguimientoStatus.value, data)
        if (!isSeguimientoDriveProcessing(driveSeguimientoStatus.value)) {
            waitingDriveLink.value = false
        }
    }

    const manejarEstadoTerminal = (data: SeguimientoDriveStatus, notify: boolean) => {
        waitingDriveLink.value = false
        desuscribir()

        if (data.link_status === 'failed') {
            if (notify) {
                showError('Error', data.link_error || 'No se pudo vincular el Excel a Drive')
            }
            return
        }

        if (data.vinculado && data.drive_link && notify) {
            showSuccess('Vinculado', 'El Excel de seguimiento quedó en Google Drive.')
        }
    }

    const suscribirCanal = (contenedorId: number) => {
        suscribir(contenedorId, {
            onStatus: applyStatus,
            onTerminal: manejarEstadoTerminal,
            shouldNotify: () => notificacionPendiente,
            clearNotify: () => { notificacionPendiente = false },
        })
    }

    const syncDriveFromHeaders = (
        contenedorId: number,
        data: SeguimientoDriveStatus | null | undefined
    ) => {
        if (!contenedorId || !data) return

        applyStatus(data)

        if (data.link_status === 'failed') {
            waitingDriveLink.value = false
            desuscribir()
            return
        }

        if (isSeguimientoDriveProcessing(data)) {
            waitingDriveLink.value = true
            notificacionPendiente = false
            suscribirCanal(contenedorId)
        }
    }

    const teardownDriveSeguimiento = () => {
        notificacionPendiente = false
        waitingDriveLink.value = false
        desuscribir()
    }

    const vincularAlDrive = async (contenedorId: number): Promise<SeguimientoDriveVincularResult> => {
        if (!contenedorId) return { success: false, error: 'ID de consolidado inválido' }

        try {
            loadingDriveSeguimiento.value = true
            const result = await EmbarcadosService.vincularDriveSeguimiento(contenedorId)

            if (result?.data) {
                applyStatus(result.data)
            }

            if (!result?.success) {
                const msg = result?.message || 'No se pudo iniciar la vinculación a Drive'
                showError('Error', msg)
                if (result?.data?.link_status === 'failed') {
                    waitingDriveLink.value = false
                } else if (isSeguimientoDriveProcessing(result.data)) {
                    waitingDriveLink.value = true
                    notificacionPendiente = false
                    suscribirCanal(contenedorId)
                }
                return { success: false, error: msg }
            }

            if (result.queued || result.data?.processing) {
                waitingDriveLink.value = true
                notificacionPendiente = true
                suscribirCanal(contenedorId)
                showInfo(
                    'Vinculación en curso',
                    'Se está creando el Excel en Drive. Puedes seguir trabajando; te avisaremos cuando termine.'
                )
                return { success: true, queued: true }
            }

            if (driveSeguimientoStatus.value?.vinculado) {
                showSuccess('Vinculado', result.message || 'El Excel de seguimiento quedó en Google Drive.')
            }

            return { success: true, drive_link: driveSeguimientoStatus.value?.drive_link ?? null }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se pudo vincular al Drive'
            showError('Error', msg)
            waitingDriveLink.value = false
            return { success: false, error: msg }
        } finally {
            loadingDriveSeguimiento.value = false
        }
    }

    return {
        driveSeguimientoStatus,
        loadingDriveSeguimiento,
        waitingDriveLink,
        isDriveLinkPending,
        syncDriveFromHeaders,
        teardownDriveSeguimiento,
        vincularAlDrive,
    }
}
