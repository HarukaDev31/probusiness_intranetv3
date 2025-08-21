<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton label="Volver" icon="i-heroicons-arrow-left" variant="outline" @click="goBack" class="mr-4" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UIcon name="i-heroicons-plus-circle" class="text-blue-600 mr-3 text-2xl" />
              Nuevo Regulación de Permiso
            </h1>

          </div>
        </div>
        <UButton label="Guardar" icon="i-heroicons-document-arrow-down" color="primary" @click="saveForm" />
      </div>
    </div>

    <!-- Form -->
    <UCard>
      <div class="space-y-6">
        <!-- Entity -->
        <div class="max-w-md">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <UIcon name="i-heroicons-building-office" class="mr-1" />
              Entidad
            </label>
            <CreateEntityButton @entity-created="handleCreateEntity" />

          </div>
          <USelect v-model="formData.entidad" :items="entityOptions" :loading="loadingEntities"
            placeholder="Seleccionar entidad" class="w-full" />
        </div>

        <!-- Permit Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <UIcon name="i-heroicons-tag" class="mr-1" />
            Nombre del permiso
          </label>
          <UInput v-model="formData.nombrePermiso" placeholder="Nombre del permiso para el producto seleccionado"
            class="w-full" />
        </div>

        <!-- Code, Base Cost, and Processor Cost -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UIcon name="i-heroicons-qr-code" class="mr-1" />
              C. Permiso
            </label>
            <UInput v-model="formData.codigoPermiso" class="w-full" type="number" step="0.01" placeholder="0.00" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UIcon name="i-heroicons-user" class="mr-1" />
              C. Tramitador
            </label>
            <UInput v-model="formData.costoTramitador" type="number" step="0.01" placeholder="0.00" class="w-full" />
          </div>
        </div>

        <!-- Documents Upload -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Documentos
            </label>
            <UButton label="Agregar documento" icon="i-heroicons-plus" size="xs" @click="addDocumentSlot" />
          </div>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <div v-for="(slot, index) in documentSlots" :key="index"
              class="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="selectDocument(index)">
              <div v-if="!slot.file" class="text-center">
                <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span class="text-xs text-gray-500">Agregar documento</span>
              </div>
              <div v-else class="text-center">
                <UIcon name="i-heroicons-document-check" class="w-8 h-8 text-green-500 mx-auto mb-1" />
                <span class="text-xs text-gray-600">{{ slot.file.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Observations -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Comentarios
          </label>
          <UTextarea v-model="formData.observaciones" placeholder="Agregar observaciones sobre el permiso..." :rows="3"
            class="w-full" />
        </div>
      </div>
    </UCard>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {EntityService} from '~/services/entityService'
import { type CreateEntityRequest } from '~/services/entityService'
import { type CreatePermisoRequest } from '~/services/permisoService'
import { useModal } from '../composables/commons/useModal'
import { useSpinner } from '../composables/commons/useSpinner'
// Router
const router = useRouter()
const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()
// Service instances

// Form data
const formData = ref({
  entidad: '',
  nombrePermiso: '',
  codigoPermiso: '',
  costoBase: '',
  costoTramitador: '',
  observaciones: ''
})



// Entity options
const entityOptions = ref([
  { label: 'MTC', value: 'MTC' },
  { label: 'MINSA', value: 'MINSA' },
  { label: 'PRODUCE', value: 'PRODUCE' },
  { label: 'MINCETUR', value: 'MINCETUR' }
])

// Loading state for entities
const loadingEntities = ref(false)

// Document slots
interface DocumentSlot {
  file: File | null
}

const documentSlots = ref<DocumentSlot[]>([
  { file: null }
])

// Methods
const goBack = () => {
  // Redirigir a la página de regulaciones con el tab de permisos seleccionado
  router.push('/basedatos/regulaciones?tab=permisos')
}

const addDocumentSlot = () => {
  documentSlots.value.push({ file: null })
}

const selectDocument = (index: number) => {
  // Crear un input file oculto
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'

  input.onchange = (event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      documentSlots.value[index] = { file: file }
    }
  }

  input.click()
}

const saveForm = async () => {
  try {

    // Validar campos requeridos
    if (!formData.value.entidad || !formData.value.nombrePermiso || !formData.value.codigoPermiso) {
      return
    }

    // Preparar datos para la API
    const permisoData: CreatePermisoRequest = {
      entidad_id: parseInt(formData.value.entidad),
      nombre_permiso: formData.value.nombrePermiso,
      codigo_permiso: formData.value.codigoPermiso,
      costo_base: parseFloat(formData.value.costoBase),
      costo_tramitador: parseFloat(formData.value.costoTramitador),
      observaciones: formData.value.observaciones || undefined,
      documentos: documentSlots.value
        .filter(slot => slot.file)
        .map(slot => slot.file!)
    }
    await withSpinner(async () => {
      // Llamar al servicio para crear el permiso
      const response = await permisoService.createPermiso(permisoData)

      if (response.success && response.data) {


        // Redirigir de vuelta a la lista
        router.push('/basedatos/regulaciones?tab=permisos')
        showSuccess('Permiso guardado exitosamente', 'El permiso se ha guardado correctamente')
      } else {
        showError('Error al guardar permiso', 'Error al guardar el permiso')
      }
    }, 'Guardando regulación de permiso...')

  } catch (error) {
    console.error('Error al guardar:', error)
    // Aquí podrías mostrar un mensaje de error al usuario
  }
}

const loadEntities = async () => {
  try {
    loadingEntities.value = true
    const response = await entityService.getEntities()

    if (response.success && response.data) {
      // Convertir las entidades a formato de opciones
      entityOptions.value = response.data.map(entity => ({
        label: entity.nombre,
        value: entity.id.toString()
      }))
      console.log('Entidades cargadas:', entityOptions.value)
    } else {
      console.error('Error al cargar entidades:', response.error)
    }
  } catch (error) {
    console.error('Error al cargar entidades:', error)
  } finally {
    loadingEntities.value = false
  }
}



const handleCreateEntity = async (entity: { nombre: string; descripcion: string }) => {
  try {
    await withSpinner(async () => {
      const entityData: CreateEntityRequest = {
        nombre: entity.nombre,
        descripcion: entity.descripcion,
      }

      const response = await EntityService.createEntity(entityData)

      if (response.success && response.data) {
        // Agregar la nueva entidad a las opciones
        entityOptions.value.push({
          label: response.data.nombre,
          value: response.data.id.toString()
        })
        showSuccess('Entidad creada exitosamente', 'La entidad se ha creado correctamente')

      } else {
        showError('Error al crear entidad', 'Error al crear la entidad')
      }

    }, 'Creando entidad...')

  } catch (error) {
    showError('Error al crear entidad', 'Error al crear la entidad')
  }
}

// Cargar entidades al inicializar
onMounted(() => {
  loadEntities()
})
</script>