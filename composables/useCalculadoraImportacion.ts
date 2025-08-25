import type { ClienteInfo, ProductoItem, Proveedor, CalculosFinales } from '~/types/calculadora-importacion'

export const useCalculadoraImportacion = () => {
  const currentStep = ref(1)
  const totalSteps = 4

  const clienteInfo = ref<ClienteInfo>({
    nombre: '',
    dni: '12345678',
    whatsapp: '+51 999 999 999',
    correo: 'correo@ejemplo.com',
    qtyProveedores: 1
  })

  const proveedores = ref<Proveedor[]>([
    {
      id: '1',
      productos: [
        {
          id: '1-1',
          nombre: '',
          cbm: 0,
          peso: 0,
          precio: 0,
          qtyCaja: 0,
          cantidad: 0
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
      productos: [
        {
          id: `${newId}-1`,
          nombre: '',
          cbm: 0,
          peso: 0,
          precio: 0,
          qtyCaja: 0,
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
        cbm: 0,
        peso: 0,
        precio: 0,
        qtyCaja: 0,
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
      proveedor.productos.forEach(producto => {
        totalCbm += producto.cbm * producto.cantidad
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
          proveedor.productos.every(producto =>
            producto.nombre.trim() !== '' &&
            producto.cbm > 0 &&
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
    canGoPrev
  }
}
