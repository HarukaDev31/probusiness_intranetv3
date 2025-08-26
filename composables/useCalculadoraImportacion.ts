import type { ClienteInfo, ProductoItem, Proveedor, CalculosFinales } from '~/types/calculadora-importacion'
import { CalculadoraImportacionService } from '~/services/calculadora-importacion/calculadoraImportacionService'

export const useCalculadoraImportacion = () => {
  const currentStep = ref(1)
  const totalSteps = 3
  const clientes = ref<any[]>([])
  const tarifas = ref<any[]>([])
  const clienteInfo = ref<ClienteInfo>({
    nombre: '',
    dni: '12345678',
    whatsapp: '',
    correo: 'correo@ejemplo.com',
    qtyProveedores: 1
  })

  const proveedores = ref<Proveedor[]>([
    {
      id: '1',
      cbm: 100,
      peso: 100,
      qtyCaja: 10,
      productos: [
        {
          id: '1-1',
          nombre: 'Producto 1',
          precio: 10,
          cantidad: 10
        },
        {
          id: '1-2',
          nombre: 'Producto 2',
          precio: 20,
          cantidad: 20
        }
      ]
    },
    {
      id: '2',
      cbm: 200,
      peso: 200,
      qtyCaja: 20,
      productos: [
        {
          id: '2-1',
          nombre: 'Producto 3',
          precio: 30,
          cantidad: 30
        },
        {
          id: '2-2',
          nombre: 'Producto 4',
          precio: 40,
          cantidad: 40
        }
      ]
    }
  ])

  const calculosFinales = ref<CalculosFinales>({
    totalCbm: 0,
    totalItems: 0,
    valorFOB: 0,
    flete: 0,
    seguro: 0,
    valorCFR: 0,
    valorCIF: 0,
    antidumping: 0,
    adValorem: 0,
    igv: 0,
    ipm: 0,
    percepcion: 0,
    total: 0
  })

  const nextStep = () => {
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  }

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step
    }
  }

  const addProveedor = () => {
    const newId = (proveedores.value.length + 1).toString()
    proveedores.value.push({
      id: newId,
      cbm: 0,
      peso: 0,
      qtyCaja: 0,
      productos: [
        {
          id: `${newId}-1`,
          nombre: '',
          precio: 0,
          cantidad: 0
        }
      ]
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

  const addProducto = (proveedorId: string) => {
    const proveedor = proveedores.value.find(p => p.id === proveedorId)
    if (proveedor) {
      const newId = `${proveedorId}-${proveedor.productos.length + 1}`
      proveedor.productos.push({
        id: newId,
        nombre: '',
        precio: 0,
        cantidad: 0
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

  const calcularTotales = () => {
    let totalCbm = 0
    let totalItems = 0
    let valorFOB = 0

    proveedores.value.forEach(proveedor => {
      totalCbm += proveedor.cbm
      proveedor.productos.forEach(producto => {
        totalItems += producto.cantidad
        valorFOB += producto.precio * producto.cantidad
      })
    })

    calculosFinales.value.totalCbm = totalCbm
    calculosFinales.value.totalItems = totalItems
    calculosFinales.value.valorFOB = valorFOB
    calculosFinales.value.flete = valorFOB
    calculosFinales.value.valorCFR = valorFOB + calculosFinales.value.flete
    calculosFinales.value.seguro = 50.00
    calculosFinales.value.valorCIF = calculosFinales.value.valorCFR + calculosFinales.value.seguro
    
    // Cálculos de impuestos
    calculosFinales.value.antidumping = valorFOB * 0.01
    calculosFinales.value.adValorem = 0
    calculosFinales.value.igv = calculosFinales.value.valorCIF * 0.16
    calculosFinales.value.ipm = 0
    calculosFinales.value.percepcion = 0
    
    calculosFinales.value.total = calculosFinales.value.valorCIF + 
      calculosFinales.value.antidumping + 
      calculosFinales.value.adValorem + 
      calculosFinales.value.igv + 
      calculosFinales.value.ipm + 
      calculosFinales.value.percepcion
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return clienteInfo.value.nombre.trim() !== '' &&
               clienteInfo.value.dni.trim() !== '' &&
               clienteInfo.value.whatsapp.trim() !== '' &&
               clienteInfo.value.correo.trim() !== ''
      case 2:
        return proveedores.value.every(proveedor =>
          proveedor.cbm > 0 &&
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
  const canGoPrev = computed(() => currentStep.value > 1)
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
      tarifas.value = response
    } catch (error) {
      console.error('Error al obtener tarifas:', error)
      throw new Error('No se pudieron obtener las tarifas')
    }
  }
  return {
    currentStep,
    totalSteps,
    clienteInfo,
    proveedores,
    calculosFinales,
    nextStep,
    prevStep,
    goToStep,
    addProveedor,
    removeProveedor,
    addProducto,
    removeProducto,
    calcularTotales,
    isStepValid,
    canGoNext,
    canGoPrev,
    getClientesByWhatsapp,
    getTarifas,
    clientes,
    tarifas
  }
}
