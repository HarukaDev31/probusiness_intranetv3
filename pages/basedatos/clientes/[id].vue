<template>
  <div class="p-6">
    <!-- Header -->
    <PageHeader title="Detalles del Cliente" subtitle="Información completa del cliente" icon="i-heroicons-user"
      :loading="loading" @back="navigateBack" />

    <!-- Loading state -->
    <div v-if="loading" class="space-y-6">
      <!-- Skeleton para la información básica -->
      <UCard>
        <div class="flex items-start space-x-6">
          <!-- Skeleton foto de perfil -->
          <div class="flex-shrink-0">
            <div class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>

          <!-- Skeleton información -->
          <div class="flex-1">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse w-1/3"></div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Columna izquierda -->
              <div class="space-y-4">
                <div v-for="i in 5" :key="`left-${i}`"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse w-1/4"></div>
                  <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                </div>
              </div>

              <!-- Columna derecha -->
              <div class="space-y-4">
                <div v-for="i in 5" :key="`right-${i}`"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse w-1/4"></div>
                  <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Skeleton para el historial -->
      <UCard>
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse w-1/4"></div>
        <div class="space-y-3">
          <div v-for="i in 3" :key="`row-${i}`" class="flex space-x-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error state -->
    <ErrorState v-else-if="error" :message="error || 'Error desconocido'" />

    <!-- Cliente details -->
    <div v-else-if="cliente" class="space-y-6">
      <!-- Información básica con foto de perfil -->
      <UCard>
        <div class="flex items-start space-x-6">
          <!-- Foto de perfil -->
          <div class="flex-shrink-0">
            <div class="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-user" class="w-16 h-16 text-gray-400" />
            </div>
          </div>

          <!-- Información del cliente -->
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {{ cliente.nombre }}
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Columna izquierda - Información personal -->
              <div class="space-y-4">
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    País
                  </label>
                  <p class="text-gray-900 dark:text-white">Perú</p>
                </div>

                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad
                  </label>
                  <p class="text-gray-900 dark:text-white">Lima</p>
                </div>

                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    DNI
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.documento || 'No especificado' }}</p>
                </div>

                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.telefono }}</p>
                </div>

                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Correo
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.correo }}</p>
                </div>

                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de registro
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.fecha }}</p>
                </div>

              </div>

              <!-- Columna derecha - Información del primer servicio -->
              <div class="space-y-4">
                <div v-if="cliente.primer_servicio" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primer servicio
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.primer_servicio.servicio }}</p>
                </div>

                <div v-if="cliente.primer_servicio" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha primer servicio
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.primer_servicio.fecha }}</p>
                </div>

                <div v-if="cliente.primer_servicio" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.primer_servicio.categoria }}</p>
                </div>

                <!-- Campos adicionales para futuras implementaciones -->
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Empresa
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.empresa }}</p>
                </div>

                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RUC
                  </label>
                  <p class="text-gray-900 dark:text-white">{{ cliente.ruc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Historial de compras -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de compras
          </h3>
        </template>

        <div class="overflow-x-auto">
          <UTable :data="historialCompras" :columns="historialColumns" class="w-full">
            <template #empty-state>
              <div class="text-center py-8">
                <UIcon name="i-heroicons-shopping-cart" class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-semibold text-gray-900">Sin historial</h3>
                <p class="mt-1 text-sm text-gray-500">
                  No hay compras registradas para este cliente.
                </p>
              </div>
            </template>
          </UTable>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import type { Cliente } from '~/services/clienteService'
import type { TableColumn } from '@nuxt/ui'
import { UButton } from '#components'

// Props
const route = useRoute()
const clienteId = parseInt(route.params.id as string)

// State
const cliente = ref<Cliente | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Historial de compras (datos de ejemplo basados en la imagen)
const historialCompras = ref<any[]>([])

// Configuración de columnas para el historial
const historialColumns: TableColumn<any>[] = [
  {
    accessorKey: 'numero',
    header: 'N.',
    cell: ({ row }: { row: any }) => {
      const index = historialCompras.value.indexOf(row.original)
      return index + 1
    }
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => row.getValue('fecha')
  },
  {
    accessorKey: 'servicio',
    header: 'Servicio',
    cell: ({ row }: { row: any }) => {
      const servicio = row.original.servicio
      const detalle = row.original.detalle
      return servicio + (row.original.servicio=="Consolidado"?' #':' ') + detalle
    }
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }: { row: any }) => row.getValue('monto')
  },
  {
    //if is_imported is trus show button with eye UIcon
    accessorKey: 'is_imported',
    header: 'Ver',
    cell: ({ row }: { row: any }) => {
      const isImported = row.getValue('is_imported')
      const servicio = row.original.servicio
      return  servicio=="Consolidado" && isImported==0 ?  h('div', { class: 'flex items-center gap-2' }, [
        h(UButton as any, {
          size: 'xs',
          icon: 'i-heroicons-eye',
          color: 'primary',
          variant: 'ghost',
          onClick: () => navigateTo(`/basedatos/clientes/documentacion/${row.original.id_servicio}`)
        }),

      ])
      : ''
    }
  }
]

// Methods
const loadCliente = async () => {
  loading.value = true
  error.value = null

  try {
    const { clienteService } = await import('~/services/clienteService')
    const clienteData = await clienteService.getClienteById(clienteId)
    cliente.value = clienteData

    // Actualizar historial de compras basado en los servicios del cliente
    if (clienteData.servicios) {
      console.log(clienteData.servicios)
      historialCompras.value = clienteData.servicios.map((servicio: any, index: number) => ({
        id: index + 1,
        id_servicio: servicio.id,
        numero: index + 1,
        fecha: servicio.fecha,
        is_imported: servicio.is_imported,
        detalle: servicio.detalle,
        servicio: servicio.servicio,
        monto: servicio.servicio === 'Curso' ? `S/${servicio.monto??0.0}` : `$${servicio.monto??0.0}`, // Montos de ejemplo
        tieneDocumento: servicio.servicio === 'Consolidado' // Solo consolidados tienen documentos
      }))
    }
  } catch (err: any) {
    error.value = err.message || 'Error al cargar los datos del cliente'
    showError(`Error al cargar los datos del cliente ${err}`)
  } finally {
    loading.value = false
  }
}

const navigateBack = () => {
  navigateTo('/basedatos/clientes')
}

const handleRevisarDocumento = (id: number) => {
  // Implementar lógica para revisar documento
  console.log('Revisar documento del servicio:', id)
}

// Initialize
onMounted(() => {
  loadCliente()
})
</script>