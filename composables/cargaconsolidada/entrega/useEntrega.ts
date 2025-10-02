import { ref, computed } from 'vue'
import type { PaginationInfo, HeaderResponse } from '~/types/data-table'
import { EntregaService } from '../../../services/cargaconsolidada/entrega/entregaService'
import type { Entrega } from '../../../types/cargaconsolidada/entrega/entrega'

// Define Header type for local use
type Header = {
  label: string
  value: string | number
  icon?: string
}

export const useEntrega = () => {
  const entregas = ref<Entrega[]>([])
  const clientes = ref<Entrega[]>([])
  // Detalle cacheado para navegación a página específica
  const entregaDetalle = ref<any | null>(null)
  // DELIVERY
  interface DeliveryRow {
    id_cotizacion: number
    nombre: string
    telefono: string
    tipo_entrega: string | null
    ciudad: string | null
    documento: string | null
    razon_social: string | null
    estado: string
    importe: number
    pagado: number
    pagos_details?: any[]
    id_contenedor?: number
    id_contenedor_pago?: number | null
    entrega: string | null
  }
  const delivery = ref<DeliveryRow[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: 0,
    from: 0,
    to: 0
  })
  const search = ref('')
  const itemsPerPage = ref(100)
  const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
  const totalRecords = computed(() => pagination.value.total)
  const currentPage = computed(() => pagination.value.current_page)
  const filters = ref<any>({})
  const clientesFilters = ref<any>({})
  const filterConfig = ref<any>([])
  const clientesFilterConfig = ref<any>([
    {
      key: 'registrado',
      label: 'Registrado',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'Si', value: 'Si' },
        { label: 'No', value: 'No' }
      ]
    },
    {
      key: 'entregado',
      label: 'Entregado',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'Si', value: 'Si' },
        { label: 'No', value: 'No' }
      ]
    },
    {
      key: 'estado',
      label: 'Estado',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'Pagado', value: 'Pagado' },
        { label: 'Pendiente', value: 'Pendiente' }
      ]
    }
  ])

  const headers = ref<any[]>([])
  const carga = ref<string | null>(null)
  const loadingHeaders = ref(false)
  const contenedorId = ref<number | null>(null)

  const getEntregas = async (id: number) => {
    try {
      loading.value = true
      contenedorId.value = id
      const params = {
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search: search.value,
        filters: filters.value
      }
      const response = await EntregaService.getEntregas(id, params)
      entregas.value = response.data
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar entregas'
    } finally {
      loading.value = false
    }
  }
  const getEntregasDetalle = async (id_cotizacion: number) => {
    try {
      loading.value = true
      const response = await EntregaService.getEntregasDetalle(id_cotizacion)
      // Soportar tanto forma antigua (array) como nueva (seccionada)
      const data = (response && 'data' in response) ? (response as any).data : response

      const hasSections = data && (data.meta || data.resumen || data.delivery || data.form_user || data.lima || data.provincia || data.comprobante)
      if (hasSections) {
        const root: any = data
        const meta = root.meta || root.data || root
        const resumen = root.resumen || root.data || root
        const delivery = root.delivery || root.data?.delivery || null
        const form_user = root.form_user || root.data?.form_user || null
        const lima = root.lima || null
        const province = root.province || null
        const comprobante = root.province || root.lima || null
        const conformidad = root.conformidad || null
        const type_form = (meta?.type_form ?? root.type_form)
        const isLima = (type_form === 1 || type_form === '1')

        const flat: any = {
          id_cotizacion: meta?.cotizacion_id ?? meta?.id_cotizacion ?? id_cotizacion,
          id_contenedor: meta?.id_contenedor ?? root.id_contenedor ?? null,
          type_form: (type_form === '1') ? 1 : (type_form === '0') ? 0 : type_form,
          // Generales
          qty_box_china: resumen?.qty_box_china ?? root.qty_box_china ?? '',
          peso: resumen?.peso ?? root.peso ?? '',
          documento: lima?.pick_doc ?? province?.r_doc ?? '',
          import_name: lima?.import_name ?? province.import_name ?? '',
          productos: lima?.productos ?? province.productos ?? '',
          // Lima
          nombre_chofer: lima?.drver_name ?? root.driver_name ?? '',
          licencia: lima?.driver_license ?? root.driver_license ?? '',
          direccion_final: lima?.final_destination_place ?? root.final_destination_place ?? '',
          distrito: lima?.final_destination_district ?? root.final_destination_district ?? province?.distrito ?? root.distrito ?? '',
          // Provincia
          agency_address_final_delivery: province?.agency_address_final_delivery ?? root.agency_address_final_delivery ?? '',
          agency_address_initial_delivery: province?.agency_address_initial_delivery ?? root.agency_address_initial_delivery ?? '',
          id_department: province?.id_department ?? root.id_department ?? null,
          id_province: province?.id_province ?? root.id_province ?? null,
          id_district: province?.id_district ?? root.id_district ?? null,
          id_agency: province?.id_agency ?? root.id_agency ?? null,
          agency_name: province?.agency_name ?? root.agency_name ?? '',
          agency_ruc: province?.agency_ruc ?? root.agency_ruc ?? '',
          home_adress_delivery: province?.home_adress_delivery ?? root.home_adress_delivery ?? '',
          r_type: province?.r_type ?? root.r_type ?? '',
          r_doc: province?.r_doc ?? root.r_doc ?? '',
          r_name: province?.r_name ?? root.r_name ?? '',
          r_phone: province?.r_phone ?? root.r_phone ?? '',
          // Comprobante
          comp_documento: comprobante?.voucher_doc ?? resumen?.documento ?? '',
          comp_nombre: comprobante?.voucher_name ?? '',
          comp_email: comprobante?.voucher_email ?? '',
          // Delivery (si se usa en listados)
          delivery_date: delivery?.date ?? null,
          delivery_start_time: delivery?.start_time ?? null,
          delivery_end_time: delivery?.end_time ?? null,
          date_id: delivery?.date_id ?? null,
          range_id: delivery?.range_id ?? null,
          // Nombre mostrado
          form_user: form_user?.name ?? root.form_user?.name ?? root.nombre ?? '',
          //Conformidad
          conformidad: conformidad ?? [],
        }
        entregaDetalle.value = flat
        return entregaDetalle.value
      }

      // Caso 2: forma antigua (array de items)
      const raw = Array.isArray(data) ? data : [data]
      const mapped = raw.map((item: any) => ({
        ...item,
        id_cotizacion: item.id_cotizacion ?? item.idCotizacion ?? item.cotizacion_id ?? item.id ?? null
      }))
      entregas.value = mapped as any
      entregaDetalle.value = mapped[0] || null
      if ((response as any)?.pagination) pagination.value = (response as any).pagination
      return entregaDetalle.value
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('404') || /no encontrada/i.test(msg)) {
        console.warn('Detalle de entrega no encontrado para id_cotizacion', id_cotizacion)
        entregaDetalle.value = null
        return null
      } else {
        error.value = msg || 'Error al cargar detalles de entrega'
        return null
      }
    } finally {
      loading.value = false
    }
  }

  // CLIENTES TAB
  const getClientes = async (id: number) => {
    try {
      loading.value = true
      contenedorId.value = id
      const params = {
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search: search.value,
        filters: clientesFilters.value
      }
      const response = await EntregaService.getClientes(id, params)
      // Aplicar filtros locales según requerimiento (backend no espera campos de filtros)
      const rows = (response.data || []) as any[]
      let filtered = rows
      // Filtro Registrado (delivery_form_registered_at)
      const fRegistrado = clientesFilters.value?.registrado
      if (fRegistrado && fRegistrado !== 'todos') {
        const want = fRegistrado === 'Si'
        filtered = filtered.filter(r => Boolean(r?.delivery_form_registered_at) === want)
      }
      // Filtro Entregado (voucher_doc)
      const fEntregado = clientesFilters.value?.entregado
      if (fEntregado && fEntregado !== 'todos') {
        const want = fEntregado === 'Si'
        filtered = filtered.filter(r => Boolean(r?.voucher_doc) === want)
      }
      // Filtro Estado (Pagado/Pendiente) por total_pagos vs total_logistica_impuestos
      const fEstado = clientesFilters.value?.estado
      if (fEstado && fEstado !== 'todos') {
        const isPagado = (row: any) => {
          const totalPagos = Number(row?.total_pagos ?? 0)
          const totalLogImp = Number(row?.total_logistica_impuestos ?? 0)
          return totalPagos >= totalLogImp
        }
        filtered = filtered.filter(r => {
          const pago = isPagado(r)
          return fEstado === 'Pagado' ? pago : !pago
        })
      }
      // Buscador local (por si backend no filtra por search)
      const term = (search.value || '').toString().trim().toLowerCase()
      if (term) {
        filtered = filtered.filter(r => {
          const fields = [r?.nombre, r?.documento, r?.telefono, r?.razon_social]
          return fields.some(v => (v ?? '').toString().toLowerCase().includes(term))
        })
      }
      clientes.value = filtered
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar clientes (entrega)'
    } finally {
      loading.value = false
    }
  }

  //DELIVERY TAB
  const getDelivery = async (id: number) => {
    try {
      loading.value = true
      contenedorId.value = id
      const params = {
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search: search.value,
        filters: filters.value
      }
      const response = await EntregaService.getDelivery(id, params)
      delivery.value = (response.data as Entrega[]).map((item: any) => ({
        id_cotizacion: item.id,
        nombre: item.nombre,
        telefono: item.telefono,
        tipo_entrega: item.tipo_entrega ?? null,
        ciudad: item.ciudad ?? null,
        documento: item.documento ?? null,
        razon_social: item.razon_social ?? null,
        estado: item.estado ?? '',
        importe: item.importe ?? 0,
        pagado: item.pagado ?? 0,
        pagos_details: item.pagos_details ?? [],
        id_contenedor: item.id_contenedor,
        id_contenedor_pago: item.id_contenedor_pago ?? null,
        entrega: item.entrega ?? null
      }))
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar delivery'
    } finally {
      loading.value = false
    }
  }

  const marcarRegistrado = async (idCotizacion: number) => {
    return await EntregaService.marcarRegistrado({ id_cotizacion: idCotizacion })
  }
  const marcarEntregadoCliente = async (idCotizacion: number) => {
    return await EntregaService.marcarEntregadoCliente({ id_cotizacion: idCotizacion })
  }
  const getHeaders = async (id: number) => {
    try {
      loadingHeaders.value = true
      const response = await EntregaService.getHeaders(id) as any

      // Casos:
      // 1. data es un array de headers -> lo usamos directo
      // 2. data es un objeto con 'carga' únicamente -> sólo seteamos carga y dejamos headers vacíos
      // 3. data es objeto con varias claves -> convertimos a headers
      const respData = response?.data
      if (Array.isArray(respData)) {
        headers.value = respData as Header[]
      } else if (respData && typeof respData === 'object') {
        if ('carga' in respData && Object.keys(respData).length === 1) {
          carga.value = respData.carga
          headers.value = []
        } else {
          // Transformar cada par clave:valor en un header
          headers.value = Object.entries(respData).filter(([k]) => k !== 'carga').map(([k, v]) => ({
            label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: typeof v === 'number' ? v.toLocaleString('es-PE') : (v ?? 'N/A'),
            icon: 'i-heroicons-information-circle'
          })) as Header[]
          if (respData.carga) carga.value = respData.carga as string
        }
      } else {
        headers.value = []
      }

      // fallback si backend cambiara y enviara carga en la raíz
      if (!carga.value && response?.carga) carga.value = response.carga
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar headers'
    } finally {
      loadingHeaders.value = false
    }
  }

  const handleSearch = (value: string) => {
    search.value = value
    pagination.value.current_page = 1
    if (contenedorId.value) getEntregas(contenedorId.value)
  }
  const handlePageChange = (value: number) => {
    pagination.value.current_page = value
    if (contenedorId.value) getEntregas(contenedorId.value)
  }
  const handleItemsPerPageChange = (value: number) => {
    itemsPerPage.value = value
    pagination.value.current_page = 1
    if (contenedorId.value) getEntregas(contenedorId.value)
  }
  const handleFilterChange = (key: string, value: any) => {
    filters.value[key] = value
    pagination.value.current_page = 1
    if (contenedorId.value) getEntregas(contenedorId.value)
  }

  // Clientes: handlers específicos para buscador y filtros
  const handleClientesSearch = (value: string) => {
    search.value = value
    pagination.value.current_page = 1
    if (contenedorId.value) getClientes(contenedorId.value)
  }
  const handleClientesFilterChange = (key: string, value: any) => {
    clientesFilters.value[key] = value
    pagination.value.current_page = 1
    if (contenedorId.value) getClientes(contenedorId.value)
  }
  const handleClientesPageChange = (value: number) => {
    pagination.value.current_page = value
    if (contenedorId.value) getClientes(contenedorId.value)
  }
  const handleClientesItemsPerPageChange = (value: number) => {
    itemsPerPage.value = value
    pagination.value.current_page = 1
    if (contenedorId.value) getClientes(contenedorId.value)
  }

  // Clear filters helpers
  const clearClientesFilters = () => {
    clientesFilters.value = {}
    pagination.value.current_page = 1
    if (contenedorId.value) getClientes(contenedorId.value)
  }
  const clearFilters = () => {
    filters.value = {}
    pagination.value.current_page = 1
    if (contenedorId.value) getEntregas(contenedorId.value)
  }

  // ---------------- DELIVERY LOGIC -----------------
  const calcularEstado = (pagado: number, importe: number) => {
    if (pagado === 0) return 'Pendiente'
    if (pagado === importe) return 'Pagado'
    if (pagado > importe) return 'Sobrepago'
    return 'Parcial'
  }
  const updateImporteDelivery = async (data: any) => {
    try {
      const response = await EntregaService.updateImporteDelivery(data)
      return response
    } catch (err) {
      error.value = err as string
    }
  }
  const registrarPagoDelivery = async (row: DeliveryRow, data: any) => {
    const formData = new FormData()
    for (const key in data) if (data[key] !== undefined && data[key] !== null) formData.append(key, data[key])
    formData.append('idPedido', row.id_cotizacion.toString())
    formData.append('idCotizacion', row.id_cotizacion.toString())
    if (row.id_contenedor) formData.append('idContenedor', row.id_contenedor.toString())
    const response = await EntregaService.registrarPagoDelivery(formData)
    if (response?.success) await getEntregas(contenedorId.value as number)
    return response
  }
  const deletePagoDelivery = async (row: DeliveryRow, pagoId: number) => {
    const response = await EntregaService.deletePagoDelivery(pagoId)
    if (response?.success) await getEntregas(contenedorId.value as number)
    return response
  }
  const sendMessageForCotizacion = async (id_cotizacion: number) => {
    try {
      const response = await EntregaService.sendMessageForCotizacion(id_cotizacion)
      return response
    } catch (error) {
      error.value = error as string
    }
  }

  // --- CONFORMIDAD (fotos) ---
  const uploadConformidad = async (payload: {
    id_contenedor: number;
    id_cotizacion: number;
    type_form: 0 | 1;
    photo_1?: File;
    photo_2?: File;
    id_form_lima?: number;
    id_form_province?: number;
  }) => {
    const fd = new FormData()
    console.log(payload)
    fd.append('id_contenedor', String(payload.id_contenedor))
    fd.append('id_cotizacion', String(payload.id_cotizacion))
    fd.append('type_form', String(payload.type_form))
    if (payload.photo_1) fd.append('photo_1', payload.photo_1)
    if (payload.photo_2) fd.append('photo_2', payload.photo_2)
    if (payload.id_form_lima) fd.append('id_form_lima', String(payload.id_form_lima))
    if (payload.id_form_province) fd.append('id_form_province', String(payload.id_form_province))
    const res = await EntregaService.uploadConformidad(fd)
    console.log(res)  
    if (res?.success) {
      // refrescar detalle para tener urls correctas
      if (entregaDetalle.value?.id_cotizacion) await getEntregasDetalle(entregaDetalle.value.id_cotizacion)
    }
    return res
  }

  const updateConformidad = async (id: number, files: { photo_1?: File; photo_2?: File }) => {
    const fd = new FormData()
    if (files.photo_1) fd.append('photo_1', files.photo_1)
    if (files.photo_2) fd.append('photo_2', files.photo_2)
    const res = await EntregaService.updateConformidad(id, fd)
    if (res?.success) {
      if (entregaDetalle.value?.id_cotizacion) await getEntregasDetalle(entregaDetalle.value.id_cotizacion)
    }
    return res
  }

  const deleteConformidad = async (id: number, typeForm: 0 | 1) => {
    const res = await EntregaService.deleteConformidad(id, typeForm)

    return res
  }
  // Eliminar un registro de la lista de entregas por id_cotizacion o id
  const deleteEntregaRegistro = async (registroId: number) => {
    const res = await EntregaService.deleteEntregaRegistro(registroId)
    if (res?.success && contenedorId.value) {
      await getEntregas(contenedorId.value)
    }
    return res
  }

  // Guardar formulario de cliente
  const saveClienteDetalle = async (id_cotizacion: number, payload: any) => {
    const res = await EntregaService.updateClienteDetalle(id_cotizacion, payload)
    if (res?.success) {
      await getEntregasDetalle(id_cotizacion)
    }
    return res
  }
  const getAllDeliveryData = async () => {
    try {
      loading.value = true
      const params = {
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search: search.value,
        filters: filters.value
      }
      const response = await EntregaService.getAllDeliveryData(params)
      if (response?.success) {
        // algunos endpoints devuelven { data: { data, pagination, total } }
        const dataBlock: any = (response as any).data
        delivery.value = (dataBlock?.data ?? dataBlock ?? [])
        if (dataBlock?.pagination) {
          pagination.value = dataBlock.pagination
        } else {
          pagination.value = {
            current_page: currentPage.value,
            last_page: 1,
            per_page: itemsPerPage.value,
            total: dataBlock?.total ?? (Array.isArray(delivery.value) ? delivery.value.length : 0),
            from: 0,
            to: 0
          }
        }
      }
      return response
    } catch (err: any) {
      error.value = err?.message || String(err)
    } finally {
      loading.value = false
    }
  }

  // Función para obtener datos de delivery con paginación (similar a fetchConsolidadoData)
  const fetchDeliveryData = async (filters: any, page: number, itemsPerPage: number) => {
    try {
      loading.value = true
      const params = {
        page: page,
        per_page: itemsPerPage,
        search: search.value,
        filters: filters
      }
      const response = await EntregaService.getAllDeliveryData(params)
      
      if (response.success) {
        delivery.value = response.data.data || response.data
        pagination.value = response.data.pagination || {
          current_page: page,
          last_page: 1,
          per_page: itemsPerPage,
          total: response.data.total || 0,
          from: 0,
          to: 0
        }
      }
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar datos de delivery'
    } finally {
      loading.value = false
    }
  }

  return {
    entregas,
    entregaDetalle,
    delivery,
    loading,
    error,
    pagination,
    search,
    itemsPerPage,
    totalPages,
    totalRecords,
    currentPage,
    filters,
    filterConfig,
    getEntregas,
    getEntregasDetalle,
    getClientes,
    clientes,
    clientesFilterConfig,
    marcarRegistrado,
    marcarEntregadoCliente,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
  handleClientesSearch,
  handleClientesFilterChange,
  handleClientesPageChange,
  handleClientesItemsPerPageChange,
  clearClientesFilters,
  clearFilters,
    headers,
    carga,
    loadingHeaders,
    getHeaders,
    // delivery
    getDelivery,
    updateImporteDelivery,
    registrarPagoDelivery,
    deletePagoDelivery,
    sendMessageForCotizacion
    , uploadConformidad
    , updateConformidad
    , deleteConformidad
    , deleteEntregaRegistro
    , saveClienteDetalle
    , getAllDeliveryData
    , fetchDeliveryData
  }
}
