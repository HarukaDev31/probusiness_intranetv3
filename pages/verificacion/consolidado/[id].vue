<template>
  <div class="p-6">
    <!-- Header con botones de navegación y guardar -->
    <div class="flex justify-between items-center mb-6">
      <UButton
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        @click="navigateTo('/verificacion')"
      >
        Regresar
      </UButton>
      
      <UButton
        icon="i-heroicons-lock-closed"
        color="primary"
        @click="handleSave"
      >
        Guardar
      </UButton>
    </div>

         <!-- Resumen financiero -->
     <div class="mb-6 p-4 bg-gray-50 rounded-lg">
       <div class="text-lg font-semibold text-gray-900">
         Importe: <span class="text-primary-600">{{ formatCurrency(totalAPagar) }}</span>
         Pagado: <span class="text-primary-600">{{ formatCurrency(adelantosPagados) }}</span>
       </div>
     </div>

    <!-- Detalles de adelantos -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Adelantos</h3>
      
      <!-- Skeleton loading para adelantos -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="bg-white rounded-lg border p-4">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
            <div class="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
            <div class="h-6 bg-gray-200 rounded w-20 mt-3"></div>
          </div>
        </div>
      </div>

                           <!-- Contenido real de adelantos -->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="(pago, index) in pagoDetalle || []"
            :key="pago.id"
            class="rounded-lg border p-4 transition-colors duration-200"
            :class="{
              'bg-green-50 border-green-200': pago.status === 'CONFIRMADO',
              'bg-yellow-50 border-yellow-200': pago.status === 'PENDIENTE',
              'bg-red-50 border-red-200': pago.status === 'OBSERVADO',
              'bg-white border-gray-200': !['CONFIRMADO', 'PENDIENTE', 'OBSERVADO'].includes(pago.status)
            }"
          >
            <div class="mb-3">
              <h4 class="font-medium text-gray-900">{{ pago.concepto.name }}</h4>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Monto:</span>
                <span class="font-medium">${{ formatCurrency(parseFloat(pago.monto)) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Fecha:</span>
                <span class="font-medium">{{ formatDate(pago.payment_date) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Banco:</span>
                <span class="font-medium">{{ pago.banco }}</span>
              </div>
              
                    <div class="flex justify-between items-center">
                  <span class="text-gray-600">Voucher:</span>
                  <div class="flex items-center space-x-2">
                    <UIcon name="i-heroicons-photo" class="w-4 h-4 text-gray-400" />
                    <button 
                      @click="openImageModal(pago.voucher_url)"
                      class="text-xs text-blue-600 hover:text-blue-800 truncate max-w-24 cursor-pointer hover:underline"
                    >
                      {{ generateVoucherName(pago.voucher_url) }}
                    </button>
                  </div>
                </div>
            </div>
            
                         <!-- Select de estado -->
             <div class="mt-4">
               <USelect
                 v-model="pago.status"
                 :items="estadosOptions"
                 placeholder="Seleccionar estado"
                 size="sm"
                 @update:model-value="(value) => handleStatusChange(pago.id, value)"
               />
             </div>
          </div>
        </div>
    </div>

    <!-- Sección inferior con cotizaciones y notas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Cotizaciones -->
      <div class="bg-white rounded-lg border p-4">
        <div class="flex items-center space-x-2 mb-4">
          <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" />
          <h3 class="text-lg font-semibold text-gray-900">Cotizaciones</h3>
        </div>
        
        <!-- Skeleton loading para cotizaciones -->
        <div v-if="loading" class="space-y-3">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div class="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div class="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <!-- Contenido real de cotizaciones -->
        <div v-else class="space-y-3">
          <div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-green-600" />
            <span class="flex-1 text-sm text-gray-700">Cotización Inicial.xlsx</span>
            <UButton
              icon="i-heroicons-arrow-down-tray"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="downloadFile('cotizacion-inicial')"
            />
          </div>
          
          <div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-green-600" />
            <span class="flex-1 text-sm text-gray-700">Cotización Final.xlsx</span>
            <UButton
              icon="i-heroicons-arrow-down-tray"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="downloadFile('cotizacion-final')"
            />
          </div>
        </div>
      </div>

      <!-- Nota -->
      <div class="bg-white rounded-lg border p-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-pencil" class="w-5 h-5 text-gray-500" />
            <h3 class="text-lg font-semibold text-gray-900">Nota</h3>
          </div>
          <UButton
            icon="i-heroicons-chevron-up"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="toggleNoteSection"
          />
        </div>
        
        <!-- Skeleton loading para nota -->
        <div v-if="loading" class="animate-pulse">
          <div class="h-32 bg-gray-200 rounded"></div>
        </div>

        <!-- Contenido real de nota -->
        <div v-else>
          <UTextarea
            v-model="nota"
            placeholder="Agregar nota o comentario..."
            class="w-full h-32 resize-none"
            :disabled="!noteSectionOpen"
          />
        </div>
             </div>
     </div>
       </div>

    <!-- Modal de vista previa de voucher -->
    <ImageModal 
      :is-open="showImageModal"
      :image-url="selectedImageUrl"
      :alt-text="selectedImageName"
      @close="closeImageModal"
    />
  </template>

<script setup lang="ts">
import { toast } from '#build/ui'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useConsolidado } from '../composables/usePagosConsolidado'
import { formatCurrency } from '../utils/consolidado'

// Route params
const route = useRoute()
const pagoId = route.params.id as string

// Composable
const { getPagoDetalle } = useConsolidado()

// State
const loading = ref(true)
const pagoDetalle = ref<any>(null)
const nota = ref('')
const totalAPagar = ref(0)
const adelantosPagados= ref(0)
const noteSectionOpen = ref(true)
const cotizacionInicialUrl = ref('')
const cotizacionFinalUrl = ref('')

// Modal de voucher
const showImageModal = ref(false)
const selectedImageUrl = ref('')
const selectedImageName = ref('')

// Opciones para el select de estados
const estadosOptions = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Conforme', value: 'CONFIRMADO' },
  { label: 'Observado', value: 'OBSERVADO' }
]


// Methods
const handleSave = async () => {
  try {
    // Aquí implementar la lógica de guardado
    console.log('Guardando cambios...', { pagoId, nota: nota.value })
    // Mostrar notificación de éxito
  } catch (error) {
    console.error('Error al guardar:', error)
    // Mostrar notificación de error
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  
  // Manejar el formato de fecha que viene de la API
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // Si la fecha no es válida, devolver el string original
    return dateString
  }
  
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const generateVoucherName = (voucherUrl: string) => {
  if (!voucherUrl) return 'Sin voucher'
  
  // Extraer el nombre del archivo de la URL
  const urlParts = voucherUrl.split('/')
  const fileName = urlParts[urlParts.length - 1]
  
  // Decodificar el nombre del archivo
  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

const downloadFile = (fileType: string) => {
  let url = ''
  
  if (fileType === 'cotizacion-inicial') {
    url = cotizacionInicialUrl.value
  } else if (fileType === 'cotizacion-final') {
    url = cotizacionFinalUrl.value
  }
  
  if (url) {
    // Crear un enlace temporal para descargar
    const link = document.createElement('a')
    link.href = url
    link.download = fileType === 'cotizacion-inicial' ? 'Cotización Inicial.xlsx' : 'Cotización Final.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    console.error('URL no disponible para descarga')
  }
}

const toggleNoteSection = () => {
  noteSectionOpen.value = !noteSectionOpen.value
}

// Métodos para manejo de estados
const handleStatusChange = (pagoId: number, newStatus: string) => {
  console.log(`Cambiando estado del pago ${pagoId} a: ${newStatus}`)
  
  // Actualizar el estado local inmediatamente
  const pago = pagoDetalle.value.find((p: any) => p.id === pagoId)
  if (pago) {
    pago.status = newStatus
  }
  
  // Aquí se puede implementar la llamada al API para persistir el cambio
  // updatePagoStatus(pagoId, newStatus)
}

// Métodos para el modal de voucher
const openImageModal = (imageUrl: string) => {
  selectedImageUrl.value = imageUrl
  selectedImageName.value = generateVoucherName(imageUrl)
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImageUrl.value = ''
  selectedImageName.value = ''
}





// Load data
const loadPagoDetalle = async () => {
  try {
    loading.value = true
    const response = await getPagoDetalle(parseInt(pagoId))
    
    // Actualizar el estado con los datos de la respuesta
    pagoDetalle.value = response.data
    nota.value = response.nota || ''
    totalAPagar.value = response.total_a_pagar
    adelantosPagados.value = response.total_pagado
    cotizacionInicialUrl.value = response.cotizacion_inicial_url || ''
    cotizacionFinalUrl.value = response.cotizacion_final_url || ''
    
  } catch (error) {
    console.error('Error al cargar detalles del pago:', error)
  } finally {
    loading.value = false
  }
}

// Initialize
onMounted(() => {
  loadPagoDetalle()
})
</script>