<template>
  <div class="p-6">
    <!-- Header -->
    <PageHeader title="Detalles del Cliente" subtitle="Información completa del cliente" icon="i-heroicons-user"
      :loading="loading" @back="navigateBack" />

    <!-- Loading state -->
    <LoadingState v-if="loading" />

    <!-- Error state -->
    <ErrorState v-else-if="error" :message="error || 'Error desconocido'" />

    <!-- Cliente details -->
    <div v-else-if="cliente" class="space-y-6">
      <!-- Información básica -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Información Personal
          </h3>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre completo
            </label>
            <p class="text-gray-900 dark:text-white">{{ cliente.nombre }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              DNI / RUC
            </label>
            <p class="text-gray-900 dark:text-white">{{ cliente.dniRuc }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo electrónico
            </label>
            <p class="text-gray-900 dark:text-white">{{ cliente.correo }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              WhatsApp
            </label>
            <p class="text-gray-900 dark:text-white">{{ cliente.whatsapp }}</p>
          </div>
        </div>
      </UCard>

      <!-- Información de servicios -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Información de Servicios
          </h3>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de registro
            </label>
            <p class="text-gray-900 dark:text-white">{{ cliente.fecha }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Servicio
            </label>
            <UBadge :color="cliente.servicio === 'Consolidado' ? 'primary' : 'success'" variant="subtle"
              :label="cliente.servicio" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <UBadge :color="getCategoriaColor(cliente.categoria)" variant="subtle" :label="cliente.categoria" />
          </div>
        </div>
      </UCard>

      <!-- Historial de servicios -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Historial de Servicios
            </h3>
            <UButton 
              label="Agregar servicio" 
              icon="i-heroicons-plus" 
              size="sm" 
              @click="showAddServiceModal = true" 
            />
          </div>
        </template>

        <div class="overflow-x-auto">
          <UTable 
            :data="historialServicios" 
            :columns="historialColumns" 
            class="w-full"
          >
            <template #empty-state>
              <div class="text-center py-8">
                <UIcon name="i-heroicons-clock" class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-semibold text-gray-900">Sin historial</h3>
                <p class="mt-1 text-sm text-gray-500">
                  No hay servicios registrados para este cliente.
                </p>
              </div>
            </template>
          </UTable>
        </div>
      </UCard>

      <!-- Acciones -->
     
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import type { Cliente } from '~/services/clienteService'
import type { TableColumn } from '@nuxt/ui'

// Props
const route = useRoute()
const clienteId = parseInt(route.params.id as string)

// State
const cliente = ref<Cliente | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showAddServiceModal = ref(false)
const showEditModal = ref(false)

// Historial de servicios (datos de ejemplo)
const historialServicios = ref([
  {
    id: 1,
    numero: 1,
    fecha: '23/01/24',
    servicio: 'Consolidado #1',
    monto: '$375.00',
    tieneDocumento: true
  },
  {
    id: 2,
    numero: 2,
    fecha: '23/01/24',
    servicio: 'Curso Mayo',
    monto: 'S/350.00',
    tieneDocumento: false
  },
  {
    id: 3,
    numero: 1,
    fecha: '23/01/24',
    servicio: 'Consolidado #4',
    monto: '$375.00',
    tieneDocumento: true
  }
])

// Configuración de columnas para el historial
const historialColumns = [
  {
    accessorKey: 'numero',
    header: 'N.',
    cell: ({ row }) => row.getValue('numero')
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => row.getValue('fecha')
  },
  {
    accessorKey: 'servicio',
    header: 'Servicio',
    cell: ({ row }) => row.getValue('servicio')
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }) => row.getValue('monto')
  },
  {
    accessorKey: 'revisar',
    header: 'Revisar',
    cell: ({ row }) => {
      const tieneDocumento = row.original.tieneDocumento
      if (tieneDocumento) {
        return h('div', { class: 'flex justify-center' }, [
          h('div', { 
            class: 'w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors',
            onClick: () => handleRevisarDocumento(row.original.id)
          }, [
            h('UIcon', { 
              name: 'i-heroicons-link',
              class: 'w-4 h-4 text-white'
            })
          ])
        ])
      }
      return ''
    }
  }
]

// Nuevo servicio
const newService = ref({
  tipo: '',
  fecha: '',
  estado: ''
})

// Opciones para los selects
const serviceTypes = [
  { label: 'Consolidado', value: 'Consolidado' },
  { label: 'Curso', value: 'Curso' }
]

const serviceStatuses = [
  { label: 'En proceso', value: 'En proceso' },
  { label: 'Completado', value: 'Completado' },
  { label: 'Cancelado', value: 'Cancelado' }
]

// Methods
const loadCliente = async () => {
  loading.value = true
  error.value = null

  try {
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Datos de ejemplo
    cliente.value = {
      id: clienteId,
      fecha: '23/01/24',
      nombre: 'Miguel Villegas Perez',
      dniRuc: '4858593901',
      correo: 'mvillegas@probusiness',
      whatsapp: '934934343',
      servicio: 'Consolidado',
      categoria: 'Recurrente'
    }
  } catch (err) {
    error.value = 'Error al cargar los datos del cliente'
  } finally {
    loading.value = false
  }
}

const navigateBack = () => {
  navigateTo('/basedatos/clientes')
}

const getCategoriaColor = (categoria: string) => {
  const colorMap = {
    'Cliente': 'primary',
    'Recurrente': 'success',
    'Premiun': 'secondary',
    'Inactivo': 'neutral'
  }
  return colorMap[categoria as keyof typeof colorMap] || 'neutral'
}

const handleRevisarDocumento = (id: number) => {
  // Implementar lógica para revisar documento
  console.log('Revisar documento del servicio:', id)
}

const handleAddService = () => {
  if (newService.value.tipo && newService.value.fecha && newService.value.estado) {
    historialServicios.value.unshift({
      id: Date.now(),
      numero: historialServicios.value.length + 1,
      fecha: newService.value.fecha,
      servicio: newService.value.tipo,
      monto: 'S/0.00',
      tieneDocumento: false
    })

    // Reset form
    newService.value = { tipo: '', fecha: '', estado: '' }
    showAddServiceModal.value = false

    // Show success notification
    const { showCreateSuccess } = useNotifications()
    showCreateSuccess('Servicio')
  }
}

const confirmDelete = () => {
  // Implementar confirmación de eliminación
  const { showError } = useNotifications()
  showError({
    title: 'Confirmar eliminación',
    subtitle: 'Acción irreversible',
    message: '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
    showRetryButton: true
  })
}

// Initialize
onMounted(() => {
  loadCliente()
})
</script>