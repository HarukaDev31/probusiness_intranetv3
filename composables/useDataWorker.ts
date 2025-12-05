/**
 * Composable especializado para procesamiento de datos con Web Worker
 */

import { useWebWorker } from './useWebWorker'

export const useDataWorker = () => {
  const worker = useWebWorker('../workers/data-processor.worker.ts')

  // Filtrar datos
  const filterData = async <T = any>(data: T[], filters: Record<string, any>): Promise<T[]> => {
    return worker.execute('filter', data, { filters })
  }

  // Buscar en datos
  const searchData = async <T = any>(data: T[], query: string, fields: string[]): Promise<T[]> => {
    return worker.execute('search', data, { query, fields })
  }

  // Ordenar datos
  const sortData = async <T = any>(data: T[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): Promise<T[]> => {
    return worker.execute('sort', data, { sortBy, sortOrder })
  }

  // Transformar datos
  const transformData = async <T = any, R = any>(data: T[], transformer: (item: T) => R): Promise<R[]> => {
    // Serializar función
    const transformerString = transformer.toString().replace(/^[^{]+{|}$/g, '').trim()
    return worker.execute('transform', data, { transformer: transformerString })
  }

  // Agregar datos (sum, avg, min, max, count)
  const aggregateData = async (
    data: any[], 
    field: string, 
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  ): Promise<number> => {
    return worker.execute('aggregate', data, { aggregation: { field, operation } })
  }

  // Procesamiento combinado (filtrar + buscar + ordenar en una sola operación)
  const processData = async <T = any>(
    data: T[],
    options: {
      filters?: Record<string, any>
      search?: { query: string; fields: string[] }
      sort?: { sortBy: string; sortOrder: 'asc' | 'desc' }
    }
  ): Promise<T[]> => {
    let result = data

    // Filtrar
    if (options.filters && Object.keys(options.filters).length > 0) {
      result = await filterData(result, options.filters)
    }

    // Buscar
    if (options.search && options.search.query) {
      result = await searchData(result, options.search.query, options.search.fields)
    }

    // Ordenar
    if (options.sort) {
      result = await sortData(result, options.sort.sortBy, options.sort.sortOrder)
    }

    return result
  }

  return {
    ...worker,
    filterData,
    searchData,
    sortData,
    transformData,
    aggregateData,
    processData
  }
}

