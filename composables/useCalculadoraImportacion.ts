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
      limit_sup: 1.0,
      item_base: 6,
      item_extra: 4, // item_max: 10
      tarifa: 20
    },
    {
      id: 2,
      limit_inf: 1.01,
      limit_sup: 2.0,
      item_base: 8,
      item_extra: 7, // item_max: 15
      tarifa: 10
    },
    {
      id: 3,
      limit_inf: 2.1,
      limit_sup: 3.0,
      item_base: 10,
      item_extra: 5, // item_max: 15
      tarifa: 10
    },
    {
      id: 4,
      limit_inf: 3.1,
      limit_sup: 6.0,
      item_base: 13,
      item_extra: 7, // item_max: 20
      tarifa: 10
    },
    {
      id: 5,
      limit_inf: 6.1,
      limit_sup: 9.0,
      item_base: 15,
      item_extra: 5, // item_max: 20
      tarifa: 10
    },
    {
      id: 6,
      limit_inf: 9.1,
      limit_sup: 12.0,
      item_base: 17,
      item_extra: 8, // item_max: 25
      tarifa: 10
    },
    {
      id: 7,
      limit_inf: 12.1,
      limit_sup: 15.0,
      item_base: 19,
      item_extra: 6, // item_max: 25
      tarifa: 10
    },
    {
      id: 8,
      limit_inf: 15.1,
      limit_sup: 9999, // 20 o más
      item_base: 20,
      item_extra: 10, // item_max: 30
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
  const tipoCambio = ref(3.7)
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
      class: 'bg-blue-500',
      showOptions: true
    },
    {
      label: 'CONFIRMADO',
      value: 'CONFIRMADO',
      class: 'bg-green-500',
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
    // Contar la cantidad de items (entradas de producto), no la suma de cantidades por producto
    return proveedores.value.reduce((acc, proveedor) => {
      return acc + (Array.isArray(proveedor.productos) ? proveedor.productos.length : 0)
    }, 0)
  })
  const totalCbm = computed(() => {
    const value = proveedores.value.reduce((acc, proveedor) => {
      return acc + (typeof proveedor.cbm === 'number' ? proveedor.cbm : 0)
    }, 0)
    return isNaN(value) ? 0 : value
  })

  // Calcular extras automáticamente según las tarifas
  const calculatedExtraProveedores = computed(() => {
    // Proveedores extra son los que superan MAX_PROVEEDORES
    const extraCount = Math.max(0, proveedores.value.length - MAX_PROVEEDORES)
    return round10(extraCount * (TARIFA_EXTRA_PROVEEDOR || 0 || 0))
  })

  const calculatedExtraItems = computed(() => {
   
    const cbmTotal = totalCbm.value
    const itemsTotal = totalItems.value
    const tarifa = findTarifaByCbm(cbmTotal)
    
    if (!tarifa) return 0
    
    const itemMax = tarifa.item_base + tarifa.item_extra
    // Calcular cuántos ítems exceden el item_base
    const itemsExtra = Math.max(0, itemsTotal - tarifa.item_base)
    
    // Limitar a los ítems extra permitidos (hasta item_max)
    // itemsExtraACobrar = cantidad de ítems extra que se cobrarán
    const itemsExtraACobrar = Math.min(itemsExtra, itemMax - tarifa.item_base)
    
    // Multiplicar por la tarifa por ítem extra
    return round10(itemsExtraACobrar * (tarifa.tarifa || 0))
  })

  const proveedores = ref<Proveedor[]>([

  ])

  // Función helper para encontrar tarifa de ítems extra por CBM (comportamiento original)
  const findTarifaByCbm = (cbm: number) => {
    if (!cbm || isNaN(cbm) || cbm <= 0) {
      return TARIFAS_EXTRA_ITEM_PER_CBM[0] // Devolver primera tarifa por defecto
    }
    
    const cbmValue = parseFloat(cbm.toFixed(2))
    
    // 1. Buscar tarifa exacta donde el CBM cae en el rango
    let tarifa = TARIFAS_EXTRA_ITEM_PER_CBM.find(t => 
      cbmValue >= t.limit_inf && cbmValue <= t.limit_sup
    )
    
    // 2. Si no encuentra, redondear CBM a 1 decimal y buscar de nuevo
    if (!tarifa) {
      const cbmRedondeado = Math.round(cbmValue * 10) / 10
      tarifa = TARIFAS_EXTRA_ITEM_PER_CBM.find(t => 
        cbmRedondeado >= t.limit_inf && cbmRedondeado <= t.limit_sup
      )
    }
    
    // 3. Si aún no encuentra, buscar la tarifa más cercana
    if (!tarifa) {
      // Buscar el rango más cercano comparando distancias
      const distancias = TARIFAS_EXTRA_ITEM_PER_CBM.map(t => {
        const centro = (t.limit_inf + t.limit_sup) / 2
        return { tarifa: t, distancia: Math.abs(cbmValue - centro) }
      })
      distancias.sort((a, b) => a.distancia - b.distancia)
      tarifa = distancias[0]?.tarifa
    }
    
    // 4. Si aún no hay tarifa, usar la última (mayor rango)
    return tarifa || TARIFAS_EXTRA_ITEM_PER_CBM[TARIFAS_EXTRA_ITEM_PER_CBM.length - 1]
  }

  // Función helper para encontrar tarifa general por CBM y tipo de cliente
  const findTarifaByCbmAndTipo = (cbm: number, tipoCliente: string): Tarifa | null => {
    if (!cbm || isNaN(cbm) || cbm <= 0) {
      if (tarifas.value.length > 0) {
        const tarifasDelTipo = tarifas.value.filter(t => t.label === tipoCliente)
        return tarifasDelTipo[0] || null
      }
      return null
    }
    
    const cbmValue = parseFloat(cbm.toFixed(2))
    
    if (tarifas.value.length === 0) {
      return null
    }
    
    const tarifasDelTipo = tarifas.value.filter(t => t.label === tipoCliente)
    
    // 1. Buscar tarifa exacta donde el CBM cae en el rango
    let tarifa = tarifasDelTipo.find(t => {
      const limitInferior = parseFloat(t.limit_inf.replace(',', '.'))
      const limitSuperior = parseFloat(t.limit_sup.replace(',', '.'))
      return cbmValue >= limitInferior && cbmValue <= limitSuperior
    })
    
    // 2. Si no encuentra, redondear CBM a 1 decimal y buscar de nuevo
    if (!tarifa) {
      const cbmRedondeado = Math.round(cbmValue * 10) / 10
      tarifa = tarifasDelTipo.find(t => {
        const limitInferior = parseFloat(t.limit_inf.replace(',', '.'))
        const limitSuperior = parseFloat(t.limit_sup.replace(',', '.'))
        return cbmRedondeado >= limitInferior && cbmRedondeado <= limitSuperior
      })
    }
    
    // 3. Si aún no encuentra, buscar la tarifa más cercana del mismo tipo
    if (!tarifa && tarifasDelTipo.length > 0) {
      tarifa = tarifasDelTipo.reduce((closest, current) => {
        const limitInfCurrent = parseFloat(current.limit_inf.replace(',', '.'))
        const limitSupCurrent = parseFloat(current.limit_sup.replace(',', '.'))
        const limitInfClosest = parseFloat(closest.limit_inf.replace(',', '.'))
        const limitSupClosest = parseFloat(closest.limit_sup.replace(',', '.'))
        
        const distCurrent = Math.min(Math.abs(cbmValue - limitInfCurrent), Math.abs(cbmValue - limitSupCurrent))
        const distClosest = Math.min(Math.abs(cbmValue - limitInfClosest), Math.abs(cbmValue - limitSupClosest))
        
        return distCurrent < distClosest ? current : closest
      })
    }
    
    // 4. Fallback: si no hay tarifas del tipo, usar NUEVO
    if (!tarifa) {
      tarifa = tarifas.value.find(t => t.label === 'NUEVO')
    }
    
    return tarifa || null
  }

  const selectedTarifa = computed(() => {
    const tipoCliente = clienteInfo.value.tipoCliente
    const totalCbmValue = totalCbm.value
    
    // Usar la función helper findTarifaByCbmAndTipo para buscar tarifa general
    return findTarifaByCbmAndTipo(totalCbmValue, tipoCliente)
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

  const handleEndFormulario = async (id?: number) => {
    // Las tarifas siempre se toman del campo modificable
    // Al inicio, estos campos se inicializan con los valores calculados
    // Si el usuario modifica esos campos, solo se envía el valor modificado (no la suma)
    const tarifaTotalExtraProveedor = tarifaExtraProveedorManual.value
    const tarifaTotalExtraItem = tarifaExtraItemManual.value
    //create saveCotizacionRequest
    let tarifaToSend = selectedTarifa.value
    // Si es MANUAL, usar el valor del input
    if (tarifaToSend && tarifaToSend.label === 'MANUAL') {
      tarifaToSend = { ...tarifaToSend, tarifa: Number(tarifaToSend.tarifa) }
    }
    const saveCotizacionRequest: saveCotizacionRequest = {
      ...(id ? { id } : {}),
      clienteInfo: clienteInfo.value,
      proveedores: proveedores.value.map(proveedor => ({
        id: proveedor.id,
        code_supplier: proveedor.code_supplier,
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
      tarifaTotalExtraProveedor: tarifaTotalExtraProveedor,
      tarifaTotalExtraItem: tarifaTotalExtraItem,
      tarifaDescuento: tarifaDescuento.value,
      id_usuario: selectedVendedor.value,
      id_carga_consolidada_contenedor: selectedContenedor.value,
      tarifa: tarifaToSend,
      tipo_cambio: tipoCambio.value,
    }
    console.log(saveCotizacionRequest)
    const response = await CalculadoraImportacionService.saveCotizacion(saveCotizacionRequest)
    return response
  }
  const nextStep = () => {
    switch (currentStep.value) {
      case 1:
        handleChangeToStep2()
        break
      case 2:
        // No guardar aquí
        break
      case 3:
        // No guardar aquí, solo avanzar de paso
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
      return false
    }
    
    // Validar límite de ítems: un nuevo proveedor siempre agrega al menos 1 ítem
    // Verificar si agregar 1 ítem más excedería el límite
    if (!canAddMoreItems()) {
      return false
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
          nombre: '',
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
      extraProveedor: isExtra ? TARIFA_EXTRA_PROVEEDOR : 0,
      // estado de colapso del panel del proveedor
      collapsed: false
    } as any)
    clienteInfo.value.qtyProveedores = proveedores.value.length
    return true
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
    return findTarifaByCbm(cbm)
  }

  // Función helper para obtener el límite máximo de ítems basado en CBM total
  const getMaxItemsByTotalCbm = () => {
    const cbmTotal = totalCbm.value
    const tarifa = findTarifaByCbm(cbmTotal)
    if (!tarifa) return Infinity
    return tarifa.item_base + tarifa.item_extra
  }

  // Función helper para verificar si se puede agregar más ítems
  const canAddMoreItems = () => {
    const maxItems = getMaxItemsByTotalCbm()
    return totalItems.value < maxItems
  }

  const addProducto = (proveedorId: string) => {
    // Validar límite de ítems basado en CBM total
    if (!canAddMoreItems()) {
      // Retornar false para que el componente pueda mostrar el modal de error
      return false
    }

    const proveedor = proveedores.value.find(p => p.id === proveedorId)
    if (proveedor) {
      // asegurar que el panel esté abierto al agregar un producto
      ;(proveedor as any).collapsed = false
      const newId = `${proveedorId}-${proveedor.productos.length + 1}`
      const cbmTotal = totalCbm.value
      const tarifaExtra = getExtraItem(cbmTotal)
      // Calcular si este ítem será extra basándose en el total de ítems después de agregarlo
      const itemsTotalDespues = totalItems.value + 1
      const isExtra = itemsTotalDespues > tarifaExtra?.item_base
      proveedor.productos.push({
        id: newId,
        nombre: '',
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
      return true
    }
    return false
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
        // Validar campos obligatorios: whatsapp y qtyProveedores
        if (!clienteInfo.value.whatsapp || clienteInfo.value.qtyProveedores < 1) {
          return false
        }
        // Validar según tipo de documento (solo nombre/empresa es obligatorio)
        if (clienteInfo.value.tipoDocumento === 'DNI') {
          return clienteInfo.value.nombre.trim() !== ''
        } else if (clienteInfo.value.tipoDocumento === 'RUC') {
          return clienteInfo.value.empresa.trim() !== ''
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
      case 3:
        // Validar que se haya seleccionado un tipo de cliente (tarifa)
        if (!selectedTarifa.value) return false
        // Si es MANUAL, la tarifa debe ser válida
        if (selectedTarifa.value.label === 'MANUAL') {
          return !!selectedTarifa.value.tarifa && selectedTarifa.value.tarifa > 0
        }
        return true
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
      // No lanzar para evitar romper el flujo de montaje; dejar lista vacía
      clientes.value = []
      return null
    }
  }
  const getTarifas = async () => {
    try {
      const response = await CalculadoraImportacionService.getTarifas()
      tarifas.value = response.data
    } catch (error) {
      console.error('Error al obtener tarifas:', error)
      // No lanzar para evitar que onMounted falle; usar lista vacía como fallback
      tarifas.value = []
      return null
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

  // Obtener una cotización por id y mapearla al estado de la calculadora
  const loadCotizacionById = async (id: number) => {
    try {
      const response = await CalculadoraImportacionService.getCotizacionById(id)
      const payload = response?.data?.calculadora || response?.data || response
      if (!payload) return null

      const cliente = payload.cliente || {}
      clienteInfo.value.nombre = cliente.nombre || payload.nombre_cliente || ''
      clienteInfo.value.dni = cliente.documento || payload.dni_cliente || ''
      clienteInfo.value.ruc = cliente.ruc || payload.ruc_cliente || ''
      clienteInfo.value.empresa = cliente.empresa || payload.razon_social || ''
      clienteInfo.value.correo = cliente.correo || payload.correo_cliente || ''
      clienteInfo.value.whatsapp = cliente.telefono || payload.whatsapp_cliente || ''
      clienteInfo.value.tipoCliente = payload.tipo_cliente || clienteInfo.value.tipoCliente
      clienteInfo.value.qtyProveedores = Number(payload.qty_proveedores || payload.qtyProveedores || 0)
      clienteInfo.value.tipoDocumento = cliente.tipo_documento || payload.tipo_documento || 'DNI'

      proveedores.value = (payload.proveedores || []).map((p: any, idx: number) => ({
        id:  p.id || (idx + 1).toString(),
        cbm: Number(p.cbm) || 0,
        peso: Number(p.peso) || 0,
        code_supplier: p.code_supplier,
        qtyCaja: Number(p.qty_caja || p.qtyCaja || 0),
        productos: (p.productos || []).map((prod: any, j: number) => ({
          id: `${idx + 1}-${j + 1}`,
          nombre: prod.nombre || '',
          precio: Number(prod.precio) || 0,
          valoracion: Number(prod.valoracion) || 0,
          cantidad: Number(prod.cantidad) || 0,
          antidumpingCU: Number(prod.antidumping_cu || prod.antidumpingCU) || 0,
          adValoremP: Number(prod.ad_valorem_p || prod.adValoremP) || 0,
          showValoracion: !!(prod.valoracion && Number(prod.valoracion) > 0),
          extraItem: 0
        })),
        extraProveedor: 0
      }))

      tarifaDescuento.value = Number(payload.tarifa_descuento || payload.tarifaDescuento || 0)
      tarifaExtraProveedorManual.value = Number(payload.tarifa_total_extra_proveedor || payload.tarifaTotalExtraProveedor || 0)
      tarifaExtraItemManual.value = Number(payload.tarifa_total_extra_item || payload.tarifaTotalExtraItem || 0)
      selectedVendedor.value = payload.id_usuario || payload.vendedor || null
      selectedContenedor.value = payload.id_carga_consolidada_contenedor || payload.id_carga_consolidada_contenedor || null
      // Cargar tipo de cambio, usar 3.7 como valor por defecto si es null o undefined
      // Intentar diferentes nombres posibles del campo (incluyendo "tc")
      const tipoCambioValue = payload.tipo_cambio ?? payload.tipoCambio ?? payload.tipo_de_cambio ?? payload.tipoDeCambio ?? payload.tc ?? payload.TC ?? null
      tipoCambio.value = tipoCambioValue !== null && tipoCambioValue !== undefined && tipoCambioValue !== ''
        ? Number(tipoCambioValue) 
        : 3.7

      return payload
    } catch (error) {
      console.error('Error al cargar cotización por id:', error)
      throw error
    }
  }

  const round10 = (value: number) => Math.round(value * Math.pow(10, 10)) / Math.pow(10, 10);

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
    tipoCambio,
    calculatedExtraProveedores,
    calculatedExtraItems,
    selectedVendedor,
    selectedContenedor,
    fetchVendedores,
    fetchContenedores,
    loadCotizacionById,
    getMaxItemsByTotalCbm,
    canAddMoreItems
  }
}
