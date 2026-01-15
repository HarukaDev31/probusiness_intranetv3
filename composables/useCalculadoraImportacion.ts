import type { ClienteInfo, ProductoItem, Proveedor, Tarifa, saveCotizacionRequest, CotizacionFilters, FilterOptions } from '~/types/calculadora-importacion'
import { CalculadoraImportacionService } from '~/services/calculadora-importacion/calculadoraImportacionService'
import type { Header, PaginationInfo } from "~/types/data-table"
import type { CotizacionFilters as CotizacionFiltersLegacy } from '~/types/cargaconsolidada/cotizaciones'
import { CotizacionService } from '~/services/cargaconsolidada/cotizacionService'

export const useCalculadoraImportacion = () => {
  const currentStep = ref(1)
  const ISDEBUG = false;
  const totalSteps = 4
  const MAX_PROVEEDORES = 3;
  const MAX_PROVEEDORES_EXTRA = 3;
  const TARIFA_EXTRA_PROVEEDOR = 50;
  const TARIFAS_EXTRA_ITEM_PER_CBM = [
    {
      id: 1,
      limit_inf: 0.1,
      limit_sup: 1,
      item_base: 6,
      item_extra: 4,
      tarifa: 20
    },
    {
      id: 2,
      limit_inf: 1.1,
      limit_sup: 2,
      item_base: 8,
      item_extra: 7,
      tarifa: 10
    },
    {
      id: 3,
      limit_inf: 2.1,
      limit_sup: 3,
      item_base: 10,
      item_extra: 5,
      tarifa: 10
    }
  ]
  const clientes = ref<any[]>([])
  const tarifas = ref<Tarifa[]>([])
  const cotizaciones = ref<any[]>([])
  const loading = ref(false)
  const vendedores = ref<any[]>([])
  const contenedores = ref<any[]>([])
  const tarifaDescuento = ref(0)
  const tarifaExtraProveedorManual = ref(0)
  const tarifaExtraItemManual = ref(0)
  const selectedVendedor = ref<number | null>(null)
  const selectedContenedor = ref<number | null>(null)
  const estadoCotizaciones = ref<any[]>([
    {
      label: 'Todos',
      value: 'todos',
      showOptions: false,
      class: 'bg-primary'
    },

    {
      label: 'PENDIENTE',
      value: 'PENDIENTE',
      class: 'bg-warning-500',
      showOptions: true
    },
    {
      label: 'COTIZADO',
      value: 'COTIZADO',
      class: 'bg-secondary',
      showOptions: true
    },
    {
      label: 'CONFIRMADO',
      value: 'CONFIRMADO',
      class: 'bg-success',
      showOptions: true
    }
  ])
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0
  })
  const headers = ref<Header[]>([])
  const search = ref('')
  const itemsPerPage = ref(10)
  const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
  const totalRecords = computed(() => pagination.value.total)
  const currentPage = computed(() => pagination.value.current_page)
  const filters = ref<CotizacionFilters>({
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'todos', // Inicializar con 'todos' para consistencia
    completado: false,
    campania: '', // Agregar filtro de campaña
    estado_calculadora: '' // Agregar filtro de estado de calculadora
  })

  // Agregar opciones de filtro para campaña y estado
  const filterOptions = ref<FilterOptions>({
    contenedores: [],
    estadoCalculadora: []
  })

  const tarifasSelect = computed(() => {

    const grouped = tarifas.value.reduce((acc, tarifa) => {
      acc[tarifa.value] = tarifa
      return acc
    }, {})
    return Object.values(grouped)
  })
  const clienteInfo = ref<ClienteInfo>({
    nombre: '',
    dni: '',
    whatsapp: null,
    correo: '',
    qtyProveedores: 0,
    tipoCliente: 'NUEVO',
    tipoDocumento: 'DNI',
    empresa: '',
    ruc: ''
  })
  //computed totalItems
  const totalItems = computed(() => {
    return proveedores.value.reduce((acc, proveedor) => {
      return acc + proveedor.productos.reduce((acc, producto) => acc + producto.cantidad, 0)
    }, 0)
  })
  const totalCbm = computed(() => {
    return proveedores.value.reduce((acc, proveedor) => {
      return acc + proveedor.cbm
    }, 0)
  })
  const proveedores = ref<Proveedor[]>([

  ])
  const selectedTarifa = computed(() => {
    let tarifa = tarifas.value.find(tarifa => {
      const limitInferior = parseFloat(tarifa.limit_inf.replace(',', '.'))
      const limitSuperior = parseFloat(tarifa.limit_sup.replace(',', '.'))
      const totalCbmValue = parseFloat(totalCbm.value.toFixed(2))
      return totalCbmValue >= limitInferior && totalCbmValue <= limitSuperior &&
        tarifa.label === clienteInfo.value.tipoCliente
    })
    if (typeof tarifa === 'undefined') {
      tarifa = tarifas.value.find(tarifa => tarifa.label === 'NUEVO')
    }
    return tarifa
  })

  //NUEVO RECURRENTE PREMIUM SOCIO INACTIVO
  const tipoClientes = ref<any[]>([
    {
      label: 'NUEVO',
      value: 'NUEVO'
    },
    {
      label: 'RECURRENTE',
      value: 'RECURRENTE'
    },
    {
      label: 'PREMIUM',
      value: 'PREMIUM'
    },
    {
      label: 'SOCIO',
      value: 'SOCIO'
    },
    {
      label: 'INACTIVO',
      value: 'INACTIVO'
    }
  ])
  const handleChangeToStep2 = () => {

    const proveedoresLength = proveedores.value.length
    const clienteQtyProveedores = clienteInfo.value.qtyProveedores
    const diff = clienteQtyProveedores - proveedoresLength
    
    if (currentStep.value === 1) {
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          addProveedor()
        }
      } else {
        for (let i = 0; i < diff; i++) {
          removeProveedor(proveedores.value[i].id)
        }
      }
      clienteInfo.value.qtyProveedores = proveedores.value.length
    }

  }

  const handleEndFormulario = async () => {
    //get extra per proveedor and item from proveedores
    const tarifaTotalExtraProveedor = proveedores.value.reduce((acc, proveedor) => {
      return acc + proveedor.extraProveedor
    }, 0)
    const tarifaTotalExtraItem = proveedores.value.reduce((acc, proveedor) => {
      return acc + proveedor.productos.reduce((acc, producto) => acc + producto.extraItem, 0)
    }, 0)
    //create saveCotizacionRequest
    const saveCotizacionRequest: saveCotizacionRequest = {
      clienteInfo: clienteInfo.value,
      proveedores: proveedores.value.map(proveedor => ({
        cbm: proveedor.cbm,
        peso: proveedor.peso,
        qtyCaja: proveedor.qtyCaja,
        productos: proveedor.productos.map(producto => ({
          nombre: producto.nombre,
          precio: producto.precio,
          valoracion: producto.valoracion,
          cantidad: producto.cantidad,
          antidumpingCU: producto.antidumpingCU,
          adValoremP: producto.adValoremP
        }))
      })),
      tarifaTotalExtraProveedor: tarifaTotalExtraProveedor + tarifaExtraProveedorManual.value,
      tarifaTotalExtraItem: tarifaTotalExtraItem + tarifaExtraItemManual.value,
      tarifaDescuento: tarifaDescuento.value,
      id_usuario: selectedVendedor.value,
      id_carga_consolidada_contenedor: selectedContenedor.value,
      tarifa: selectedTarifa.value,
    }

    const response = await CalculadoraImportacionService.saveCotizacion(saveCotizacionRequest)
    return response
  }
  const nextStep = () => {
    switch (currentStep.value) {
      case 1:
        handleChangeToStep2()
        break
      case 2:

        break
      case 3:
        handleEndFormulario()
        break
      default:

    }
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  }

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
      return
    }
    if (currentStep.value === 1) {
      navigateTo('/cotizaciones')
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step
    }
  }

  const addProveedor = () => {
    if (proveedores.value.length >= MAX_PROVEEDORES + MAX_PROVEEDORES_EXTRA) {
      return
    }
    const newId = (proveedores.value.length + 1).toString()
    const isExtra = proveedores.value.length + 1 > MAX_PROVEEDORES
    proveedores.value.push({
      id: newId,
      cbm: ISDEBUG ? 1.2 : 0,
      peso: ISDEBUG ? 100 : 0,
      qtyCaja: ISDEBUG ? 10 : 0,
      productos: [
        {
          id: `${newId}-1`,
          nombre: `Producto ${newId}`,
          precio: ISDEBUG ? 10 : 0,
          cantidad: ISDEBUG ? 100 : 0,
          antidumpingCU: 0,
          antidumping: 0,
          adValorem: 0,
          adValoremP: 0,
          igv: 0,
          ipm: 0,
          percepcion: 0,
          total: 0,
          costoDestino: 0,
          costoTotal: 0,
          costoUnitarioUSD: 0,
          costoUnitarioPEN: 0,
          valoracion: 0,
          showValoracion: false,
          extraItem: 0
        }
      ],
      extraProveedor: isExtra ? TARIFA_EXTRA_PROVEEDOR : 0
    })
    clienteInfo.value.qtyProveedores = proveedores.value.length
  }

  const removeProveedor = (proveedorId: string) => {
    const index = proveedores.value.findIndex(p => p.id === proveedorId)
    if (index > -1) {
      proveedores.value.splice(index, 1)
      clienteInfo.value.qtyProveedores = proveedores.value.length
      // Renumerar IDs
      proveedores.value.forEach((p, i) => {
        p.id = (i + 1).toString()
        p.productos.forEach((prod, j) => {
          prod.id = `${p.id}-${j + 1}`
        })
      })
    }
  }
  const getExtraItem = (cbm: number) => {
    const tarifa = TARIFAS_EXTRA_ITEM_PER_CBM.find(tarifa => {
      return cbm >= tarifa.limit_inf && cbm <= tarifa.limit_sup
    })
    return tarifa
  }
  const addProducto = (proveedorId: string) => {
    const proveedor = proveedores.value.find(p => p.id === proveedorId)
    if (proveedor) {
      const newId = `${proveedorId}-${proveedor.productos.length + 1}`
      const tarifaExtra = getExtraItem(proveedor.cbm)
      const isExtra = proveedor.productos.length + 1 > tarifaExtra?.item_base
      proveedor.productos.push({
        id: newId,
        nombre: `Producto ${newId}`,
        precio: ISDEBUG ? 10 : 0,
        cantidad: ISDEBUG ? 100 : 0,
        antidumpingCU: 0,
        antidumping: 0,
        adValorem: 0,
        adValoremP: 0,
        igv: 0,
        ipm: 0,
        percepcion: 0,
        total: 0,
        costoDestino: 0,
        costoTotal: 0,
        costoUnitarioUSD: 0,
        costoUnitarioPEN: 0,
        valoracion: 0,
        showValoracion: false,
        extraItem: isExtra ? tarifaExtra?.tarifa || 0 : 0
      })
    }
  }

  const removeProducto = (proveedorId: string, productoId: string) => {
    const proveedor = proveedores.value.find(p => p.id === proveedorId)
    if (proveedor) {
      const index = proveedor.productos.findIndex(prod => prod.id === productoId)
      if (index > -1) {
        proveedor.productos.splice(index, 1)
        // Renumerar IDs
        proveedor.productos.forEach((prod, i) => {
          prod.id = `${proveedorId}-${i + 1}`
        })
      }
    }
  }


  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        // Validar campos comunes
        if (!clienteInfo.value.whatsapp || !clienteInfo.value.correo || clienteInfo.value.qtyProveedores < 1) {
          return false
        }
        
        // Validar según tipo de documento
        if (clienteInfo.value.tipoDocumento === 'DNI') {
          return clienteInfo.value.nombre.trim() !== '' && clienteInfo.value.dni.trim() !== ''
        } else if (clienteInfo.value.tipoDocumento === 'RUC') {
          return clienteInfo.value.empresa.trim() !== '' && clienteInfo.value.ruc.trim() !== ''
        }
        return false
        
      case 2:
        return proveedores.value.length > 0 && proveedores.value.every(proveedor =>
          proveedor.cbm > 0 &&
          proveedor.productos.length > 0 &&
          proveedor.productos.every(producto =>
            producto.nombre.trim() !== '' &&
            producto.precio > 0 &&
            producto.cantidad > 0
          )
        )
      default:
        return true
    }
  }

  const canGoNext = computed(() => isStepValid(currentStep.value))
  const canGoPrev = computed(() => currentStep.value > 0)
  const getClientesByWhatsapp = async (whatsapp: string) => {
    try {
      const response = await CalculadoraImportacionService.getClientesByWhatsapp(whatsapp)
      clientes.value = response.data
    } catch (error) {
      console.error('Error al obtener clientes por whatsapp:', error)
      throw new Error('No se pudieron obtener los clientes')
    }
  }
  const getTarifas = async () => {
    try {
      const response = await CalculadoraImportacionService.getTarifas()
      tarifas.value = response.data
    } catch (error) {
      console.error('Error al obtener tarifas:', error)
      throw new Error('No se pudieron obtener las tarifas')
    }
  }
  const getCotizaciones = async () => {
    try {
      const params: any = {
        page: pagination.value.current_page,
        per_page: itemsPerPage.value
      }
      if (search.value.trim()) {
        params.search = search.value.trim()
      }
      if (filters.value.fecha_inicio) {
        params.fecha_inicio = filters.value.fecha_inicio
      }
      if (filters.value.fecha_fin) {
        params.fecha_fin = filters.value.fecha_fin
      }
      if (filters.value.estado && filters.value.estado !== 'todos') {
        params.estado = filters.value.estado
      }
      if (filters.value.campania && filters.value.campania !== '' && filters.value.campania !== 'todas') {
        params.campania = filters.value.campania
      }
      if (filters.value.estado_calculadora && filters.value.estado_calculadora !== '' && filters.value.estado_calculadora !== 'todos') {
        params.estado_calculadora = filters.value.estado_calculadora
      }

      const response = await CalculadoraImportacionService.getCotizaciones(params)
      cotizaciones.value = response.data
      pagination.value = response.pagination
      headers.value = response.headers
      
      // Actualizar las opciones de filtro si vienen en la respuesta
      if (response.filters) {
        filterOptions.value.contenedores = response.filters.contenedores || []
        filterOptions.value.estadoCalculadora = response.filters.estadoCalculadora || []
      }
    } catch (error) {
      console.error('Error al obtener cotizaciones:', error)
      throw new Error('No se pudieron obtener las cotizaciones')
    }
  }
  const handleSearch = async (value: string) => {
    search.value = value
    await getCotizaciones()
  }
  const handlePageChange = async (page: number) => {
    pagination.value.current_page = page
    await getCotizaciones()
  }
  const handleItemsPerPageChange = async (itemsPerPage: number) => {
    pagination.value.per_page = itemsPerPage
    await getCotizaciones()
  }
  const handleFilterChange = async (filterType: string, value: string) => {
    // Manejar el valor 'todos' y 'todas' como vacío para el backend
    let formattedValue = value
    if (value === 'todos' || value === 'todas') {
      formattedValue = ''
    }

    filters.value = { ...filters.value, [filterType]: formattedValue }
    // Resetear a la primera página cuando se cambian los filtros
    pagination.value.current_page = 1
    await getCotizaciones()
  }
  const deleteCotizacionCalculadora = async (id: number) => {
    try {
      const response = await CalculadoraImportacionService.deleteCotizacion(id)
      return response
    } catch (error) {
      console.error('Error al eliminar la cotización:', error)
      throw new Error('No se pudo eliminar la cotización')
    }
  }
  const duplicateCotizacionCalculadora = async (id: number) => {
    try {
      const response = await CalculadoraImportacionService.duplicateCotizacion(id)
      return response
    } catch (error) {
      console.error('Error al duplicar la cotización:', error)
      throw new Error('No se pudo duplicar la cotización')
    }
  }
  const changeEstadoCotizacionCalculadora = async (id: number, estado: string) => {
    try {
      const response = await CalculadoraImportacionService.changeEstadoCotizacion(id, estado)
      return response
    } catch (error) {
      console.error('Error al cambiar el estado de la cotización:', error)
      throw new Error('No se pudo cambiar el estado de la cotización')
    }
  }

  // Función para obtener vendedores desde el backend
  const fetchVendedores = async () => {
    try {
      const response = await CotizacionService.getVendedoresDropdown()
      vendedores.value = response.data || response
    } catch (error) {
      console.error('Error al obtener vendedores:', error)
    }
  }

  // Función para obtener cargas disponibles desde el backend
  const fetchContenedores = async () => {
    try {
      const response = await CotizacionService.getCargasDisponiblesDropdown()
      contenedores.value = response.data || response
    } catch (error) {
      console.error('Error al obtener cargas disponibles:', error)
    }
  }

  return {
    currentStep,
    totalSteps,
    clienteInfo,
    proveedores,
    nextStep,
    prevStep,
    goToStep,
    addProveedor,
    removeProveedor,
    addProducto,
    removeProducto,
    isStepValid,
    canGoNext,
    canGoPrev,
    getClientesByWhatsapp,
    getTarifas,
    clientes,
    tarifas,
    tipoClientes,
    tarifasSelect,
    totalItems,
    totalCbm,
    selectedTarifa,
    MAX_PROVEEDORES,
    MAX_PROVEEDORES_EXTRA,
    TARIFA_EXTRA_PROVEEDOR,
    TARIFAS_EXTRA_ITEM_PER_CBM,
    handleEndFormulario,
    handleChangeToStep2,
    getCotizaciones,
    cotizaciones,
    loading,
    error,
    pagination,
    headers,
    search,
    itemsPerPage,
    totalPages,
    totalRecords,
    currentPage,
    filters,
    filterOptions,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
    estadoCotizaciones,
    deleteCotizacionCalculadora,
    duplicateCotizacionCalculadora,
    changeEstadoCotizacionCalculadora,
    vendedores,
    contenedores,
    tarifaDescuento,
    tarifaExtraProveedorManual,
    tarifaExtraItemManual,
    selectedVendedor,
    selectedContenedor,
    fetchVendedores,
    fetchContenedores
  }
}
