<template>
  <div class="md:p-6">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="max-w-6xl mx-auto space-y-6">
      <!-- Header skeleton -->
      <div class="mb-6 flex items-center justify-between">
        <USkeleton class="h-10 w-24 rounded" />
        <USkeleton class="h-8 w-32 rounded-full" />
      </div>

      <!-- Grid skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda skeleton -->
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-48 rounded" />
            </template>
            <div class="space-y-4">
              <USkeleton class="h-4 w-32 rounded" />
              <USkeleton class="h-6 w-full rounded" />
              <div class="grid grid-cols-2 gap-4">
                <div v-for="i in 4" :key="i" class="space-y-2">
                  <USkeleton class="h-3 w-24 rounded" />
                  <USkeleton class="h-5 w-full rounded" />
                </div>
              </div>
            </div>
          </UCard>
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-40 rounded" />
            </template>
            <USkeleton class="h-24 w-full rounded" />
          </UCard>
        </div>
        
        <!-- Columna derecha skeleton -->
        <div class="space-y-6">
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-36 rounded" />
            </template>
            <USkeleton class="h-64 w-full rounded-lg" />
          </UCard>
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-40 rounded" />
            </template>
            <USkeleton class="h-64 w-full rounded-lg" />
          </UCard>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <UButton @click="goBack" color="neutral" variant="soft">Volver</UButton>
    </div>

    <div v-else-if="viatico" class="max-w-6xl mx-auto space-y-6">
      <!-- Header con botón de volver y estado -->
      <div class="flex items-center justify-between">
        <UButton 
          icon="i-heroicons-arrow-left" 
          color="neutral" 
          variant="ghost" 
          @click="goBack"
        >
          Volver
        </UButton>
        <UBadge 
          :color="getStatusColor(viatico.status)" 
          variant="subtle"
          size="lg"
          class="text-sm font-semibold px-4 py-2"
        >
          {{ getStatusLabel(viatico.status) }}
        </UBadge>
      </div>

      <!-- Grid principal: Información y Comprobantes -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda: Información básica -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Información General -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Información General</h2>
              </div>
            </template>
            
            <div class="space-y-6">
              <!-- Asunto -->
              <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Asunto</label>
                <p class="text-base text-gray-900 dark:text-white font-medium">{{ viatico.subject }}</p>
              </div>

              <!-- Grid de información -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">   
                <!-- Fecha de Creación -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Fecha de Creación</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white">{{ formatDateTimeToDmy(viatico.created_at) }}</p>
                  </div>
                </div>
                <!-- Fecha de Reintegro -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Fecha de Reintegro</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white">{{ formatDateTimeToDmy(viatico.reimbursement_date) }}</p>
                  </div>
                </div>

                <!-- Área Solicitante -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Área Solicitante</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white">{{ viatico.requesting_area }}</p>
                  </div>
                </div>

                <!-- Monto Total -->
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Monto Total</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary-500" />
                    <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {{ formatCurrency(viatico.total_amount, 'PEN') }}
                    </p>
                  </div>
                </div>

                <!-- Solicitante (solo para admin) -->
                <div v-if="isAdmin" class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Solicitante</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white font-medium">{{ viatico.nombre_usuario || 'N/A' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Descripción del Gasto -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Descripción del Gasto</h2>
              </div>
            </template>
            
            <div class="prose prose-sm max-w-none">
              <p class="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">{{ viatico.expense_description }}</p>
            </div>
          </UCard>
        </div>

        <!-- Columna derecha: Comprobantes -->
        <div class="space-y-6">
          <!-- Comprobante Inicial -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-document" class="w-5 h-5 text-primary-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Evidencia</h2>
              </div>
            </template>
            
            <div v-if="viatico.url_comprobante" class="space-y-3">
              <div class="relative group">
                <div v-if="isImageFile(viatico.url_comprobante)">
                <img 
                  :src="viatico.url_comprobante" 
                  alt="Comprobante Inicial" 
                  class="w-full h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-400 transition-all duration-200 shadow-sm"
                  @click="() => openComprobanteModal(viatico?.url_comprobante, viatico?.url_comprobante)"
                />
                </div>
                <div v-else-if="isPdfFile(viatico.url_comprobante)">
                  <iframe :src="viatico.url_comprobante" class="w-full h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-400 transition-all duration-200 shadow-sm" frameborder="0"></iframe>
                </div>  
                <div v-else>
                  <UIcon name="i-heroicons-document" class="w-5 h-5 text-primary-500" />
                  <p class="text-sm text-gray-900 dark:text-white">{{ viatico.url_comprobante }}</p>
                </div>
              </div>
             
            </div>
           
          </UCard>

          <!-- Comprobante de Retribución (solo para admin) -->
          <UCard v-if="isAdmin" class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Comprobante de Retribución</h2>
              </div>
            </template>
            
            <div v-if="viatico.url_payment_receipt" class="space-y-3">
              <div class="relative group">
                <img 
                  :src="viatico.url_payment_receipt" 
                  alt="Comprobante de Retribución" 
                  class="w-full h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-400 transition-all duration-200 shadow-sm"
                  @click="() => openComprobanteModal(viatico?.url_payment_receipt, viatico?.url_payment_receipt)"
                />
               
              </div>
              <div class="flex gap-2">
                <UButton 
                  icon="i-heroicons-eye" 
                  color="primary" 
                  variant="soft" 
                  size="sm"
                  class="flex-1"
                  @click="() => openComprobanteModal(viatico?.url_payment_receipt, 'Comprobante de Retribución')"
                >
                  Ver
                </UButton>
                <UButton 
                  v-if="viatico.status !== 'CONFIRMED'"
                  icon="i-heroicons-trash" 
                  color="error" 
                  variant="soft" 
                  size="sm"
                  @click="handleDeleteFile"
                  :loading="deletingFile"
                >
                  Eliminar
                </UButton>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <UIcon name="i-heroicons-document-minus" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p class="text-sm text-gray-500 dark:text-gray-400 italic">Sin comprobante de retribución</p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Acciones de Administración -->
      <UCard v-if="isAdmin && viatico.status !== 'CONFIRMED'" class="bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Acciones de Administración</h2>
          </div>
        </template>
        
        <div class="space-y-6">
          <!-- Subir comprobante de retribución -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {{ viatico.url_payment_receipt ? 'Reemplazar Comprobante de Retribución' : 'Subir Comprobante de Retribución' }}
            </label>
            <FileUploader 
              ref="fileUploaderRef" 
              :multiple="false" 
              :accepted-types="['.jpg', '.jpeg', '.png', '.gif']"
              @file-added="handleFileAdded"
              @file-removed="handleFileRemoved" 
              :show-save-button="false"
              :initial-files="viatico.url_payment_receipt ? [{ url: viatico.url_payment_receipt, name: 'Comprobante de retribución actual' }] : []"
            />
            <UButton 
              v-if="selectedFile"
              icon="i-heroicons-arrow-up-tray"
              @click="handleUploadFile"
              color="primary"
              class="mt-3 w-full"
              :loading="uploadingFile"
            >
              Subir Comprobante de Retribución
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useViaticos } from '~/composables/useViaticos'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { formatDateTimeToDmy, formatCurrency } from '~/utils/formatters'
import { ROLES } from '~/constants/roles'
import FileUploader from '~/components/commons/FileUploader.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import type { UpdateViaticoRequest } from '~/types/viatico'
import type { FileItem } from '~/types/commons/file'

const route = useRoute()
const { currentViatico, loading, error, loadViaticoById, updateViatico, getStatusColor, getStatusLabel } = useViaticos()
const { hasRole, currentId } = useUserRole()
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

const viatico = computed(() => currentViatico.value)
const isAdmin = computed(() => hasRole(ROLES.ADMINISTRACION))
const selectedFile = ref<File | null>(null)
const selectedStatus = ref<string>('')
const uploadingFile = ref(false)
const deletingFile = ref(false)
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)

const statusOptions = [
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Confirmado', value: 'CONFIRMED' },
  { label: 'Rechazado', value: 'REJECTED' }
]

// Verificar permisos
const canEdit = computed(() => {
  if (!viatico.value) return false
  if (isAdmin.value) return true
  // Usuario solo puede ver sus propios vi?ticos
  return viatico.value.user_id === currentId.value
})

const goBack = () => {
  if (isAdmin.value) {
    if (viatico.value?.status === 'CONFIRMED') {
      navigateTo('/viaticos/completados')
    } else {
      navigateTo('/viaticos/pendientes')
    }
  } else {
    navigateTo('/viaticos')
  }
}
const isImageFile = (url: string) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const extension = getFileExtension(url).toLowerCase()
  return imageExtensions.includes(extension)
}
const isPdfFile = (url: string) => {
  const pdfExtensions = ['pdf']
  const extension = getFileExtension(url).toLowerCase()
  return pdfExtensions.includes(extension)
}
const getFileExtension = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase()
  return extension || ''
}
const handleFileAdded = (file: File) => {
  selectedFile.value = file
}

const handleFileRemoved = () => {
  selectedFile.value = null
}

const openComprobanteModal = (url: string | null | undefined, name: string) => {
  if (!url) return
  
  const fileItem: FileItem = {
    id: 0,
    file_name: name,
    file_url: url,
    type: 'image',
    size: 0,
    lastModified: 0,
    file_ext: 'jpg'
  }
  
  modalPreview.open({
    file: fileItem,
    isOpen: true
  })
}

const handleUploadFile = async () => {
  if (!selectedFile.value || !viatico.value) return

  try {
    uploadingFile.value = true
    await withSpinner(async () => {
      const data: UpdateViaticoRequest = {
        payment_receipt_file: selectedFile.value!
      } 
      console.log(data,'data')
      await updateViatico(viatico.value!.id, data)
      showSuccess('Comprobante subido', 'El comprobante de retribución ha sido subido exitosamente y el estado cambió a Confirmado')
      selectedFile.value = null
      await loadViaticoById(viatico.value!.id)
    })
  } catch (err: any) {
    showError('Error al subir comprobante', err.message || 'Error desconocido')
  } finally {
    uploadingFile.value = false
  }
}

const handleDeleteFile = async () => {
  if (!viatico.value) return

  showConfirmation(
    'Eliminar Comprobante de Retribución',
    '¿Estás seguro de que deseas eliminar el comprobante de retribución? El estado cambiará a Pendiente.',
    async () => {
      try {
        deletingFile.value = true
        await withSpinner(async () => {
          const data: UpdateViaticoRequest = {
            payment_receipt_file: null,
            delete_file: true
          }
          await updateViatico(viatico.value!.id, data)
          showSuccess('Comprobante eliminado', 'El comprobante de retribución ha sido eliminado y el estado cambió a Pendiente')
          await loadViaticoById(viatico.value!.id)
        })
      } catch (err: any) {
        showError('Error al eliminar comprobante', err.message || 'Error desconocido')
      } finally {
        deletingFile.value = false
      }
    }
  )
}

const handleStatusChange = async (newStatus: string) => {
  if (!viatico.value || newStatus === viatico.value.status) return

  showConfirmation(
    'Cambiar Estado',
    `¿Estás seguro de que deseas cambiar el estado a ${statusOptions.find(s => s.value === newStatus)?.label}?`,
    async () => {
      try {
        await withSpinner(async () => {
          const data: UpdateViaticoRequest = {
            status: newStatus as 'PENDING' | 'CONFIRMED' | 'REJECTED'
          }
          await updateViatico(viatico.value!.id, data)
          showSuccess('Estado cambiado', 'El estado ha sido actualizado exitosamente')
          await loadViaticoById(viatico.value!.id)
        })
      } catch (err: any) {
        showError('Error al cambiar estado', err.message || 'Error desconocido')
        selectedStatus.value = viatico.value.status
      }
    },
    () => {
      selectedStatus.value = viatico.value!.status
    }
  )
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    selectedStatus.value = viatico.value?.status || ''
    await loadViaticoById(id)
    if (viatico.value) {
      selectedStatus.value = viatico.value.status
    }
  }
})

// Watch para actualizar selectedStatus cuando cambie el viatico
watch(() => viatico.value?.status, (newStatus) => {
  if (newStatus) {
    selectedStatus.value = newStatus
  }
})
</script>
