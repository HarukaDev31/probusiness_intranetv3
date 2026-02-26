import { ref } from 'vue'
import { ContabilidadService } from '~/services/cargaconsolidada/factura-guia/contabilidadService'

export const useContabilidadDetalle = () => {
    const loading = ref(false)
    const cliente = ref<any>(null)
    const comprobantes = ref<any[]>([])
    const totalComprobantes = ref(0)
    const totalDetracciones = ref(0)
    const panel = ref<any>(null)
    const nota = ref('')

    const getDetalle = async (idCotizacion: number) => {
        try {
            loading.value = true
            const response = await ContabilidadService.getDetalle(idCotizacion)
            if (response.success) {
                cliente.value = response.cliente
                comprobantes.value = response.comprobantes
                totalComprobantes.value = response.total_comprobantes
                totalDetracciones.value = response.total_detracciones
                panel.value = response.panel
                nota.value = response.panel?.nota_contabilidad || ''
            }
        } catch (e) {
            console.error('Error al obtener detalle contabilidad:', e)
        } finally {
            loading.value = false
        }
    }

    const uploadComprobante = async (file: File, idCotizacion: number) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('idCotizacion', String(idCotizacion))
        return ContabilidadService.uploadComprobante(formData)
    }

    const uploadConstancia = async (file: File, comprobanteId: number) => {
        return ContabilidadService.uploadConstancia(comprobanteId, file)
    }

    const deleteComprobante = async (id: number) => {
        return ContabilidadService.deleteComprobante(id)
    }

    const deleteConstancia = async (id: number) => {
        return ContabilidadService.deleteConstancia(id)
    }

    const saveNota = async (idCotizacion: number) => {
        return ContabilidadService.saveNota(idCotizacion, nota.value)
    }

    return {
        loading,
        cliente,
        comprobantes,
        totalComprobantes,
        totalDetracciones,
        panel,
        nota,
        getDetalle,
        uploadComprobante,
        uploadConstancia,
        deleteComprobante,
        deleteConstancia,
        saveNota,
    }
}
