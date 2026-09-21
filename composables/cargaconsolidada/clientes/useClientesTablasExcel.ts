import { GeneralService } from '~/services/cargaconsolidada/clientes/generalService'

export type ClientesTablasExcelOptions = {
    contenedorId: number
    carga?: string | null
}

export function useClientesTablasExcel() {
    const descargarTablasClientesExcel = async (opts: ClientesTablasExcelOptions) => {
        const contenedorId = Number(opts.contenedorId)
        if (!contenedorId) throw new Error('Contenedor inválido')

        const blob = await GeneralService.exportTablasExcel(contenedorId)
        const cargaLabel = String(opts.carga || contenedorId).replace(/[\\/:*?"<>|]/g, '-')
        const day = new Date().toISOString().split('T')[0]
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `clientes_#${cargaLabel}_${day}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }

    return { descargarTablasClientesExcel }
}
