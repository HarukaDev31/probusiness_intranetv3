import { EmbarcadosService } from '~/services/cargaconsolidada/clientes/embarcadosService'
import { GeneralService } from '~/services/cargaconsolidada/clientes/generalService'
import { VariacionService } from '~/services/cargaconsolidada/clientes/variacionService'
import { formatCurrency, formatDateTimeToDmy } from '~/utils/formatters'

const EXPORT_PAGE_SIZE = 2000

const ESTADO_CLIENTE_LABEL: Record<string, string> = {
    RESERVADO: 'Reservado',
    'NO RESERVADO': 'No Reservado',
    DOCUMENTACION: 'Documentación',
}

export type ClientesTablasExcelOptions = {
    contenedorId: number
    carga?: string | null
    role?: string | null
    usaEstadosCoord2: boolean
    isOrgNoAdmin: boolean
}

function unwrapList(response: unknown): any[] {
    const root = response as any
    const respData = root?.data ?? root
    if (Array.isArray(respData)) return respData
    if (Array.isArray(respData?.data)) return respData.data
    return []
}

function pickField(row: any, keys: string[]): string {
    for (const key of keys) {
        const value = row?.[key]
        if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
        const nested = row?.cliente?.[key]
        if (nested !== undefined && nested !== null && String(nested).trim() !== '') return String(nested)
    }
    return ''
}

function contactoText(row: any, opts?: { sinCorreo?: boolean; extra?: string[] }): string {
    const nombre = pickField(row, ['nombre', 'razon_social', 'name', 'cliente_nombre', 'clienteName'])
    const documento = pickField(row, ['documento', 'dni', 'ruc', 'numero_documento'])
    const telefono = pickField(row, ['telefono', 'whatsapp', 'celular', 'phone'])
    const correo = pickField(row, ['correo', 'email', 'mail'])
    const lines = [nombre, documento, telefono]
    if (correo) lines.push(correo)
    else if (opts?.sinCorreo) lines.push('Sin correo')
    if (opts?.extra) lines.push(...opts.extra.filter(Boolean))
    return lines.filter(Boolean).join('\n')
}

function proveedoresOf(row: any): any[] {
    return Array.isArray(row?.proveedores) ? row.proveedores : []
}

function joinProveedorField(row: any, field: string, format?: (value: unknown) => string): string {
    return proveedoresOf(row)
        .map((proveedor) => {
            const raw = proveedor?.[field]
            if (format) return format(raw)
            return raw == null ? '' : String(raw)
        })
        .join('\n')
}

function formatMoney(value: unknown): string {
    if (value === null || value === undefined || value === '') return ''
    const n = Number(value)
    if (!Number.isFinite(n)) return String(value)
    return formatCurrency(n)
}

function formatOptionalDate(value: unknown): string {
    if (value === null || value === undefined || value === '') return ''
    return formatDateTimeToDmy(value as string)
}

function estadoClienteLabel(value: unknown): string {
    const key = String(value || '').trim()
    return ESTADO_CLIENTE_LABEL[key] || key
}

function variacionLabel(row: any, isOrgNoAdmin: boolean): string {
    const volCot = Number(row?.volumen ?? 0)
    const volChina = Number(row?.volumen_china ?? 0)
    const volDoc = Number(row?.volumen_doc ?? 0)
    const valorCot = Number(row?.valor_cot ?? 0)
    const valorDoc = Number(row?.valor_doc ?? 0)
    const hayVariacion = isOrgNoAdmin
        ? volCot !== volChina
        : (volCot !== volChina || volCot !== volDoc || valorCot !== valorDoc)
    return hayVariacion ? 'SI' : 'NO'
}

function sheetFromRows(headers: string[], rows: Array<Array<string | number>>): { headers: string[]; rows: Array<Array<string | number>> } {
    return { headers, rows }
}

function buildSeguimientoRows(items: any[], usaEstadosCoord2: boolean) {
    const invoiceField = usaEstadosCoord2 ? 'invoice_status' : 'invoice_status_final'
    const packingField = usaEstadosCoord2 ? 'packing_status' : 'packing_status_final'
    const excelField = usaEstadosCoord2 ? 'excel_conf_status' : 'excel_conf_status_final'
    const headers = [
        'N°',
        'Contacto',
        'T. Cliente',
        'Productos',
        'Code Supplier',
        'Inspección',
        'Invoice',
        'Packing list',
        'Excel Conf.',
        'Canal',
        'Fecha de Entrega',
        'Observaciones',
    ]
    const rows = items.map((row, index) => [
        index + 1,
        contactoText(row),
        row?.tipo_cliente ?? '',
        joinProveedorField(row, 'products'),
        joinProveedorField(row, 'code_supplier'),
        joinProveedorField(row, 'arrive_date_china', formatOptionalDate),
        joinProveedorField(row, invoiceField, (v) => String(v || 'Pendiente')),
        joinProveedorField(row, packingField, (v) => String(v || 'Pendiente')),
        joinProveedorField(row, excelField, (v) => String(v || 'Pendiente')),
        joinProveedorField(row, 'canal'),
        joinProveedorField(row, 'fecha_entrega', formatOptionalDate),
        joinProveedorField(row, 'observaciones_seguimiento'),
    ])
    return sheetFromRows(headers, rows)
}

function buildDocumentacionRows(items: any[]) {
    const headers = [
        'N°',
        'Fecha',
        'Contacto',
        'T. Cliente',
        'Volumen',
        'Qty Item',
        'Fob',
        'Logistica',
        'Impuesto',
        'Tarifa',
        'Estados',
    ]
    const rows = items.map((row, index) => {
        const contrato = row?.cod_contract ? `Contrato: ${row.cod_contract}` : ''
        return [
            index + 1,
            formatOptionalDate(row?.fecha),
            contactoText(row, { sinCorreo: true, extra: [contrato] }),
            row?.name ?? '',
            row?.volumen ?? '',
            row?.qty_item ?? '',
            formatMoney(row?.fob),
            formatMoney(row?.monto),
            formatMoney(row?.impuestos),
            formatMoney(row?.tarifa),
            estadoClienteLabel(row?.estado_cliente),
        ]
    })
    return sheetFromRows(headers, rows)
}

function buildVariacionRows(items: any[], isOrgNoAdmin: boolean) {
    const headers = isOrgNoAdmin
        ? ['N°', 'Asesor', 'Contacto', 'T. Cliente', 'Tarifa', 'Vol. Cot', 'Vol. China', 'Variación']
        : ['N°', 'Asesor', 'Contacto', 'T. Cliente', 'Tarifa', 'Vol. Cot', 'Vol. China', 'Vol. Doc', 'Valor Cot', 'Valor Doc', 'Variación']
    const rows = items.map((row, index) => {
        const base: Array<string | number> = [
            index + 1,
            row?.asesor ?? '',
            contactoText(row),
            row?.name ?? '',
            row?.tarifa ?? '',
            row?.volumen ?? '',
            row?.volumen_china ?? '',
        ]
        if (!isOrgNoAdmin) {
            base.push(row?.volumen_doc ?? '', row?.valor_cot ?? '', row?.valor_doc ?? '')
        }
        base.push(variacionLabel(row, isOrgNoAdmin))
        return base
    })
    return sheetFromRows(headers, rows)
}

function applyColumnWidths(ws: any, headers: string[]) {
    ws['!cols'] = headers.map((header) => {
        if (header === 'Contacto' || header === 'Productos' || header === 'Observaciones') return { wch: 32 }
        if (header === 'Code Supplier') return { wch: 18 }
        if (header.length <= 8) return { wch: 12 }
        return { wch: 16 }
    })
}

export function useClientesTablasExcel() {
    const descargarTablasClientesExcel = async (opts: ClientesTablasExcelOptions) => {
        const { contenedorId, carga, role, usaEstadosCoord2, isOrgNoAdmin } = opts
        if (!contenedorId) throw new Error('Contenedor inválido')

        const [embarcadosRes, generalRes, variacionRes] = await Promise.all([
            EmbarcadosService.getEmbarcados(contenedorId, {}, '', EXPORT_PAGE_SIZE, 1),
            GeneralService.getClientes(contenedorId, {}, '', EXPORT_PAGE_SIZE, 1, role || undefined),
            VariacionService.getClientes(contenedorId, {}, '', EXPORT_PAGE_SIZE, 1),
        ])

        const seguimiento = buildSeguimientoRows(unwrapList(embarcadosRes), usaEstadosCoord2)
        const documentacion = buildDocumentacionRows(unwrapList(generalRes))
        const variacion = buildVariacionRows(unwrapList(variacionRes), isOrgNoAdmin)

        const XLSX = await import('xlsx')
        const workbook = XLSX.utils.book_new()
        const sheets = [
            { name: 'Seguimiento', ...seguimiento },
            { name: 'Documentacion', ...documentacion },
            { name: 'Variación', ...variacion },
        ]
        for (const sheet of sheets) {
            const aoa = [sheet.headers, ...sheet.rows]
            const ws = XLSX.utils.aoa_to_sheet(aoa)
            applyColumnWidths(ws, sheet.headers)
            XLSX.utils.book_append_sheet(workbook, ws, sheet.name)
        }

        const cargaLabel = String(carga || contenedorId).replace(/[\\/:*?"<>|]/g, '-')
        const day = new Date().toISOString().split('T')[0]
        XLSX.writeFile(workbook, `clientes_#${cargaLabel}_${day}.xlsx`)
    }

    return { descargarTablasClientesExcel }
}
