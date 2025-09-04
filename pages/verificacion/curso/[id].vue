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
       <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
         <div class="text-lg font-semibold text-gray-900 dark:text-white">
           Importe: <span class="text-primary-600">{{ formatCurrency(totalAPagar) }}</span>
           Pagado: <span class="text-primary-600">{{ formatCurrency(adelantosPagados) }}</span>
         </div>
       </div>
  
      <!-- Detalles de pagos -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Pagos del Curso</h3>
        
        <!-- Skeleton loading para pagos -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 rounded mb-2"></div>
              <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div class="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
              <div class="h-6 bg-gray-200 rounded w-20 mt-3"></div>
            </div>
          </div>
        </div>
  
                             <!-- Contenido real de pagos -->
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="(pago, index) in pagoDetalle || []"
              :key="pago.id"
              class="rounded-lg border p-4 transition-colors duration-200"
              :class="{
                'bg-green-50 border-green-200 dark:bg-green-800 dark:border-green-700': pago.status === 'CONFIRMADO',
                'bg-yellow-50 border-yellow-200 dark:bg-yellow-800 dark:border-yellow-700': pago.status === 'PENDIENTE',
                'bg-red-50 border-red-200 dark:bg-red-800 dark:border-red-700': pago.status === 'OBSERVADO',
                'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700': !['CONFIRMADO', 'PENDIENTE', 'OBSERVADO'].includes(pago.status)
              }"
            >
              <div class="mb-3">
                <h4 class="font-medium text-gray-900 dark:text-white">{{ pago.concepto.name }}</h4>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Monto:</span>
                  <span class="font-medium">{{ formatCurrency(parseFloat(pago.monto),'PEN') }}</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Fecha:</span>
                  <span class="font-medium">{{ formatDate(pago.payment_date) }}</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Banco:</span>
                  <span class="font-medium">{{ pago.banco }}</span>
                </div>
                
                                                                                           <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-300">Comprobante:</span>
                    <div class="flex items-center space-x-2">
                      <UIcon name="i-heroicons-photo" class="w-4 h-4 text-gray-400" />
                      <button 
                        v-if="pago.voucher_url"
                        @click="openImageModal(pago.voucher_url)"
                        class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 truncate max-w-24 cursor-pointer hover:underline"
                      >
                        {{ generateVoucherName(pago.voucher_url) }}
                      </button>
                      <span v-else class="text-xs text-gray-500">Sin comprobante</span>
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
  
            <!-- Sección de notas -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-pencil" class="w-5 h-5 text-gray-500" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nota</h3>
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
  
      <!-- Modal de vista previa de voucher -->
      <ImageModal 
        :is-open="showImageModal"
        :image-url="selectedImageUrl"
        :alt-text="selectedImageName"
        @close="closeImageModal"
      />
    </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { usePagos } from '../composables/usePagos'
  import { useModal } from '~/composables/commons/useModal'
  import { PagosService } from '~/services/pagosService'
import { formatCurrency } from '../utils/cursos'
  
  // Route params
  const route = useRoute()
  const pagoId = route.params.id as string
  
  // Composable
  const { getCursoDetalle, updateEstadoPago, updateNota } = usePagos()
  const { showSuccess, showError } = useModal()

  // We'll use PagosService.updateNota for saving notes
  
  // State
  const loading = ref(true)
  const pagoDetalle = ref<any>(null)
const nota = ref('')
const totalAPagar = ref(0)
const adelantosPagados = ref(0)
const noteSectionOpen = ref(true)
  
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
      await updateNota(parseInt(pagoId), nota.value)
      showSuccess('Nota guardada', `Nota para curso guardada correctamente`, { duration: 3000 })
    } catch (err) {
      console.error('handleSave error:', err)
      showError('Error al guardar', `No se pudo guardar la nota para curso ${pagoId}`, { persistent: true })
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
  if (!voucherUrl) return 'Sin comprobante'
  
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
  
  
  
  const toggleNoteSection = () => {
    noteSectionOpen.value = !noteSectionOpen.value
  }
  
  // Métodos para manejo de estados
const handleStatusChange = async (pagoId: number, newStatus: string) => {
  const pago = pagoDetalle.value.find((p: any) => p.id === pagoId)
  if (!pago) return

  const previous = pago.status
  pago.status = newStatus
  pago._loading = true

  try {
    // Try composable update first (it updates local list too)
    await updateEstadoPago(pagoId, newStatus)
    showSuccess('Estado actualizado', `Pago actualizado a ${newStatus}`, { duration: 3000 })
  } catch (err) {
    console.error('handleStatusChange error:', err)
    pago.status = previous
    showError('Error', `Error al actualizar estado del pago ${pagoId}`, { persistent: true })
  } finally {
    pago._loading = false
  }
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
const loadCursoDetalle = async () => {
  try {
    loading.value = true
    const response = await getCursoDetalle(parseInt(pagoId))
    
    // Actualizar el estado con los datos de la respuesta
    pagoDetalle.value = response.data
    nota.value = response.nota || ''
    totalAPagar.value = response.total_a_pagar
    adelantosPagados.value = response.total_pagado
    
  } catch (error) {
    console.error('Error al cargar detalles del curso:', error)
  } finally {
    loading.value = false
  }
}
  
  // Initialize
onMounted(() => {
  loadCursoDetalle()
})
  </script>