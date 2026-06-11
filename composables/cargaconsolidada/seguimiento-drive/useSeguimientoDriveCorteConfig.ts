import { ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { EmbarcadosService } from '~/services/cargaconsolidada/clientes/embarcadosService'
import type { SeguimientoDriveCorteConfig } from '~/types/cargaconsolidada/seguimiento-drive'

export const useSeguimientoDriveCorteConfig = () => {
    const { showSuccess, showError } = useModal()
    const { withSpinner } = useSpinner()

    const corteConfig = ref<SeguimientoDriveCorteConfig | null>(null)
    const horaCorteInput = ref('20:00')
    const loadingCorteConfig = ref(false)
    const savingCorteConfig = ref(false)

    const applyConfig = (data: SeguimientoDriveCorteConfig | null | undefined) => {
        if (!data) return
        corteConfig.value = data
        horaCorteInput.value = data.hora_corte || '20:00'
    }

    const loadCorteConfig = async () => {
        try {
            loadingCorteConfig.value = true
            const res = await EmbarcadosService.getSeguimientoDriveConfig()
            if (res?.success && res.data) {
                applyConfig(res.data)
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se pudo cargar la hora de corte'
            showError('Configuración', msg)
        } finally {
            loadingCorteConfig.value = false
        }
    }

    const saveCorteConfig = async (): Promise<boolean> => {
        const hora = horaCorteInput.value.trim()
        if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(hora)) {
            showError('Hora inválida', 'Use formato HH:MM (ej. 20:00).')
            return false
        }

        try {
            await withSpinner(async () => {
                savingCorteConfig.value = true
                const res = await EmbarcadosService.updateSeguimientoDriveConfig({
                    hora_corte: hora,
                    timezone: corteConfig.value?.timezone,
                })

                if (!res?.success) {
                    throw new Error(res?.message || 'No se pudo guardar la hora de corte')
                }

                applyConfig(res.data)
            }, 'Guardando hora de corte…')

            showSuccess('Guardado', 'La hora de corte se aplicará en el Excel y en el job diario.')
            return true
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se pudo guardar'
            showError('Error', msg)
            return false
        } finally {
            savingCorteConfig.value = false
        }
    }

    return {
        corteConfig,
        horaCorteInput,
        loadingCorteConfig,
        savingCorteConfig,
        loadCorteConfig,
        saveCorteConfig,
    }
}
