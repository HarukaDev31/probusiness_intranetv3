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
    <div v-else-if="cliente" class="flex flex-col md:flex-row gap-8 items-start">
      <!-- Card de información del cliente -->
      <div class="bg-white rounded-xl shadow p-6 w-1/4 md:w-1/3 flex flex-col items-center">
        <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
          <UIcon name="i-heroicons-user" class="w-20 h-20 text-gray-400" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2 text-center">{{ cliente?.nombre }}</h2>
        <div class="w-full space-y-2 text-sm">
          <div><span class="font-medium text-gray-500">País:</span> <span class="text-gray-900">{{ cliente?.pais || 'Perú' }}</span></div>
          <div><span class="font-medium text-gray-500">Ciudad:</span> <span class="text-gray-900">{{ cliente?.ciudad || 'Lima' }}</span></div>
          <div><span class="font-medium text-gray-500">DNI:</span> <span class="text-gray-900">{{ cliente?.documento }}</span></div>
          <div><span class="font-medium text-gray-500">WhatsApp:</span> <span class="text-gray-900">{{ cliente?.telefono }}</span></div>
          <div><span class="font-medium text-gray-500">Correo:</span> <span class="text-gray-900">{{ cliente?.correo }}</span></div>
          <div><span class="font-medium text-gray-500">Empresa:</span> <span class="text-gray-900">{{ cliente?.empresa }}</span></div>
          <div><span class="font-medium text-gray-500">RUC:</span> <span class="text-gray-900">{{ cliente?.ruc }}</span></div>
          <div><span class="font-medium text-gray-500">Capacidad comercial:</span> <span class="text-gray-900">{{ cliente?.capacidad_comercial }}</span></div>
          <div><span class="font-medium text-gray-500">Rubro:</span> <span class="text-gray-900">{{ cliente?.rubro }}</span></div>
          <div><span class="font-medium text-gray-500">Red social:</span> <span class="text-gray-900">{{ cliente?.red_social }}</span></div>
        </div>
      </div>

      <!-- Historial de compras -->
      <div class="flex-1 max-w-3xl mx-auto">
        <h3 class="text-xl font-semibold text-gray-900 mb-4 text-center">Historial de compras</h3>
        <div class="overflow-x-auto">
          <DataTable
            :data="historialCompras"
            :columns="historialColumns"
            :loading="loading"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import DataTable from '~/components/DataTable.vue'
import type { Cliente } from '~/services/clienteService'
import type { TableColumn } from '@nuxt/ui'
import { UButton } from '#components'
import { ClienteService } from '~/services/clienteService'
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
  try {
    const clienteData = await ClienteService.getClienteById(clienteId)
    cliente.value = clienteData
    if (clienteData.servicios) {
      historialCompras.value = clienteData.servicios.map((servicio: any, index: number) => ({
        id: index + 1,
        id_servicio: servicio.id,
        numero: index + 1,
        fecha: servicio.fecha,
        is_imported: servicio.is_imported,
        detalle: servicio.detalle,
        servicio: servicio.servicio,
        monto: servicio.servicio === 'Curso' ? `S/${servicio.monto??0.0}` : `$${servicio.monto??0.0}`,
      }))
    }
  } finally {
    loading.value = false
  }
}

const navigateBack = () => {
  navigateTo('/basedatos/clientes')
}



// Initialize
onMounted(() => {
  loadCliente()
})
</script>