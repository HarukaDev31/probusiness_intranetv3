/**
 * Composable para gestionar Web Workers de forma fácil y segura
 */

import { ref, onUnmounted } from 'vue'

interface WorkerTask {
  id: string
  resolve: (value: any) => void
  reject: (error: any) => void
  timeout?: NodeJS.Timeout
}

export const useWebWorker = (workerPath: string, timeoutMs: number = 30000) => {
  const worker = ref<Worker | null>(null)
  const isReady = ref(false)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const pendingTasks = new Map<string, WorkerTask>()

  // Inicializar worker
  const initWorker = () => {
    if (!process.client) return

    try {
      // Crear worker
      worker.value = new Worker(new URL(workerPath, import.meta.url), {
        type: 'module'
      })

      // Listener para mensajes del worker
      worker.value.addEventListener('message', (event: MessageEvent) => {
        const { id, type, result, error: workerError, duration } = event.data

        // Worker está listo
        if (type === 'ready') {
          isReady.value = true
          return
        }

        // Buscar tarea pendiente
        const task = pendingTasks.get(id)
        if (!task) return

        // Limpiar timeout
        if (task.timeout) {
          clearTimeout(task.timeout)
        }

        // Resolver o rechazar según resultado
        if (workerError) {
          task.reject(new Error(workerError))
        } else {
          task.resolve(result)
        }

        // Remover tarea
        pendingTasks.delete(id)

        // Actualizar estado
        isProcessing.value = pendingTasks.size > 0

        // Log de performance (solo en dev)
        if (process.env.NODE_ENV === 'development' && duration) {
          console.log(`[Worker] Tarea ${id} completada en ${duration.toFixed(2)}ms`)
        }
      })

      // Listener para errores del worker
      worker.value.addEventListener('error', (event: ErrorEvent) => {
        console.error('[Worker] Error:', event.message)
        error.value = event.message

        // Rechazar todas las tareas pendientes
        pendingTasks.forEach(task => {
          if (task.timeout) clearTimeout(task.timeout)
          task.reject(new Error(event.message))
        })
        pendingTasks.clear()

        isProcessing.value = false
      })

    } catch (err: any) {
      console.error('[Worker] Error al inicializar:', err)
      error.value = err.message
    }
  }

  // Ejecutar tarea en el worker
  const execute = <T = any>(type: string, data: any, payload?: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!worker.value || !isReady.value) {
        reject(new Error('Worker no está listo'))
        return
      }

      // Generar ID único
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Crear timeout
      const timeout = setTimeout(() => {
        pendingTasks.delete(id)
        isProcessing.value = pendingTasks.size > 0
        reject(new Error(`Timeout: La tarea ${id} excedió el tiempo límite de ${timeoutMs}ms`))
      }, timeoutMs)

      // Guardar tarea
      pendingTasks.set(id, {
        id,
        resolve,
        reject,
        timeout
      })

      isProcessing.value = true

      // Enviar mensaje al worker
      worker.value.postMessage({
        id,
        type,
        data,
        payload
      })
    })
  }

  // Terminar worker
  const terminate = () => {
    if (worker.value) {
      // Rechazar tareas pendientes
      pendingTasks.forEach(task => {
        if (task.timeout) clearTimeout(task.timeout)
        task.reject(new Error('Worker terminado'))
      })
      pendingTasks.clear()

      worker.value.terminate()
      worker.value = null
      isReady.value = false
      isProcessing.value = false
    }
  }

  // Reiniciar worker
  const restart = () => {
    terminate()
    initWorker()
  }

  // Auto-inicializar
  if (process.client) {
    initWorker()
  }

  // Cleanup al desmontar
  onUnmounted(() => {
    terminate()
  })

  return {
    isReady,
    isProcessing,
    error,
    execute,
    terminate,
    restart
  }
}

