/**
 * Web Worker para procesamiento pesado de datos
 * - Filtrado de arrays grandes
 * - Ordenamiento
 * - Búsqueda
 * - Transformaciones
 */

interface WorkerMessage {
  id: string
  type: 'filter' | 'sort' | 'search' | 'transform' | 'aggregate'
  data: any[]
  payload?: any
}

interface WorkerResponse {
  id: string
  result: any
  error?: string
  duration?: number
}

// Handler para filtrado
const filterData = (data: any[], filters: Record<string, any>): any[] => {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === 'todos') {
        return true
      }
      
      const itemValue = item[key]
      
      // Búsqueda de texto
      if (typeof value === 'string' && typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase())
      }
      
      // Comparación exacta
      return itemValue === value
    })
  })
}

// Handler para búsqueda de texto
const searchData = (data: any[], query: string, fields: string[]): any[] => {
  if (!query) return data
  
  const lowerQuery = query.toLowerCase()
  
  return data.filter(item => {
    return fields.some(field => {
      const value = item[field]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(lowerQuery)
    })
  })
}

// Handler para ordenamiento
const sortData = (data: any[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): any[] => {
  return [...data].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    
    if (aVal === bVal) return 0
    
    const comparison = aVal > bVal ? 1 : -1
    return sortOrder === 'asc' ? comparison : -comparison
  })
}

// Handler para transformaciones
const transformData = (data: any[], transformer: string): any[] => {
  // El transformer es una función serializada como string
  const fn = new Function('item', `return ${transformer}`)
  return data.map(item => fn(item))
}

// Handler para agregaciones
const aggregateData = (data: any[], aggregation: { field: string, operation: 'sum' | 'avg' | 'min' | 'max' | 'count' }): number => {
  const { field, operation } = aggregation
  
  switch (operation) {
    case 'sum':
      return data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
    
    case 'avg':
      const total = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
      return data.length > 0 ? total / data.length : 0
    
    case 'min':
      return Math.min(...data.map(item => Number(item[field]) || 0))
    
    case 'max':
      return Math.max(...data.map(item => Number(item[field]) || 0))
    
    case 'count':
      return data.length
    
    default:
      return 0
  }
}

// Listener principal
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const startTime = performance.now()
  const { id, type, data, payload } = event.data
  
  try {
    let result: any
    
    switch (type) {
      case 'filter':
        result = filterData(data, payload.filters)
        break
      
      case 'search':
        result = searchData(data, payload.query, payload.fields)
        break
      
      case 'sort':
        result = sortData(data, payload.sortBy, payload.sortOrder)
        break
      
      case 'transform':
        result = transformData(data, payload.transformer)
        break
      
      case 'aggregate':
        result = aggregateData(data, payload.aggregation)
        break
      
      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
    
    const duration = performance.now() - startTime
    
    const response: WorkerResponse = {
      id,
      result,
      duration
    }
    
    self.postMessage(response)
  } catch (error: any) {
    const response: WorkerResponse = {
      id,
      result: null,
      error: error.message
    }
    
    self.postMessage(response)
  }
})

// Notificar que el worker está listo
self.postMessage({ type: 'ready' })

