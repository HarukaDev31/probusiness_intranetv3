<template>
  <div class="p-6">
    <UButton icon="i-heroicons-arrow-left" @click="volver" class="mb-4">Regresar</UButton>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Información del alumno -->
      <div class=" rounded-lg shadow p-6">
        <div class="flex items-center mb-4">
          <span class="i-heroicons-user mr-2" />
          <h2 class="font-semibold text-lg">Información del alumno</h2>
          <UButton icon="i-heroicons-pencil-square" variant="ghost" class="ml-auto" @click="editMode = !editMode" />
          <div v-if="editMode" class="flex justify-end">
            <UButton color="primary" @click="guardarCambios">Guardar</UButton>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center">
            <span class="w-48 font-medium">Nombre y apellidos:</span>
            <input
              :class="[editMode ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-800', 'rounded px-3 py-1 w-full']"
              v-model="form.nombres" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Dni / ID:</span>
            <input
              :class="[editMode ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-800', 'rounded px-3 py-1 w-full']"
              v-model="form.dni" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <label for="correo-input" class="w-48 font-medium">Correo:</label>
            <input
              id="correo-input"
              :class="[editMode ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-800', 'rounded px-3 py-1 w-full']"
              v-model="form.correo" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <label for="whatsapp-input" class="w-48 font-medium">WhatsApp:</label>
            <input
              id="whatsapp-input"
              :class="[editMode ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-800', 'rounded px-3 py-1 w-full']"
              v-model="form.whatsapp" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Fecha de nacimiento:</span>
            <div v-if="!editMode" class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full">
              {{ form.nacimiento ? formatDateTimeToDmy(form.nacimiento) : 'No especificada' }}
            </div>
            <UPopover v-else>
              <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start">
                {{ fechaNacimiento ? df.format(fechaNacimiento.toDate(getLocalTimeZone())) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="fechaNacimiento" class="p-2" />
              </template>
            </UPopover>
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Sexo:</span>
            <div v-if="!editMode" class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full">
              {{ getSexoLabel(Number(form.sexo)) }}
            </div>
            <USelect v-if="editMode" v-model="sexoSeleccionado" :items="sexoOptions" :disabled="!editMode"
              class="w-full" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Red social:</span>
            <div v-if="!editMode" class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full">
              {{ getRedSocialLabel(Number(form.red_social)) }}
            </div>
            <USelect v-if="editMode" v-model="redSocialSeleccionada" :items="redSocialOptions" :disabled="!editMode"
              class="w-full" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">País:</span>
            <div v-if="!editMode" class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full">
              {{ form.pais || 'No especificado' }}
            </div>

            <USelect v-if="editMode" v-model="selectedPais" :items="paisOptions" :disabled="!editMode" class="w-full"
              placeholder="Seleccionar país" />
          </div>
          <div v-if="selectedPais === 1" class="flex items-center">
            <span class="w-48 font-medium">Departamento:</span>
            <div v-if="!editMode" class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full">
              {{ form.departamento || 'No especificado' }}
            </div>
            <USelect v-if="editMode" v-model="selectedDepartamento" :items="departamentoOptions" :disabled="!editMode"
              class="w-full" placeholder="Seleccionar departamento" :loading="loadingDepartamentos" />
          </div>
          <div v-if="selectedPais === 1 && selectedDepartamento" class="flex items-center">
            <span class="w-48 font-medium">Provincia:</span>
            <div v-if="!editMode" class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full">
              {{ form.provincia || 'No especificado' }}
            </div>
            <USelect v-if="editMode" v-model="selectedProvincia" :items="provinciaOptions" :disabled="!editMode"
              class="w-full" placeholder="Seleccionar provincia" :loading="loadingProvincias" />
          </div>
          <div v-if="selectedPais === 1 && selectedProvincia" class="flex items-center">
            <span class="w-48 font-medium">Distrito:</span>
            <div v-if="!editMode" class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full">
              {{ form.distrito || 'No especificado' }}
            </div>
            <USelect v-if="editMode" v-model="selectedDistrito" :items="distritoOptions" :disabled="!editMode"
              class="w-full" placeholder="Seleccionar distrito" :loading="loadingDistritos" />
          </div>
        </div>
      </div>
      <!-- Acceso aula virtual -->
      <div v-if="datosCliente?.Nu_Estado_Usuario_Externo == 2" class=" rounded-lg shadow p-6">
        <div class="flex items-center mb-4">
          <span class="i-heroicons-academic-cap mr-2" />
          <h2 class="font-semibold text-lg">ACCESO AULA VIRTUAL</h2>
        </div>
        <div class="space-y-3">
          <div class="flex items-center">
            <span class="w-48 font-medium">Usuario:</span>
            <input
              :class="[editMode ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-800', 'rounded px-3 py-1 w-full']"
              v-model="form.usuario_moodle" :readonly="true" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Contraseña:</span>
            <input class="bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 w-full" v-model="form.password_moodle"
              :readonly="true" />
          </div>
          <div class="mt-4">
            <UButton 
              icon="i-heroicons-key" 
              color="primary" 
              variant="outline"
              @click="handleEnviarInstruccionesCambioPassword"
              :loading="enviandoInstrucciones"
            >
              Enviar instrucciones para cambiar contraseña
            </UButton>
          </div>

        </div>
        <div v-if="datosCliente?.url_constancia" class="mt-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Vista previa de la constancia
              </h3>
            </div>

            <!-- Contenedor de vista previa -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <!-- PDF Preview con múltiples opciones -->
              <div v-if="getFileExtension(datosCliente.url_constancia) === 'pdf'" class="w-full h-[600px]">
                <!-- Opción 1: Iframe directo -->
                <div v-if="!showAlternativeViewer" class="w-full h-full">
                  <iframe :src="datosCliente.url_constancia" class="w-full h-full border-0"
                    title="Vista previa de la constancia" loading="lazy" @error="handleIframeError"></iframe>
                </div>

                <!-- Opción 2: Google Docs Viewer como alternativa -->
                <div v-else class="w-full h-full">
                  <iframe
                    :src="`https://docs.google.com/gview?url=${encodeURIComponent(datosCliente.url_constancia)}&embedded=true`"
                    class="w-full h-full border-0" title="Vista previa de la constancia (Google Docs Viewer)"
                    loading="lazy" @error="handleGoogleViewerError"></iframe>
                </div>

                <!-- Controles para cambiar el visor -->
                <div
                  class="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
                  <UButton :icon="showAlternativeViewer ? 'i-heroicons-document' : 'i-heroicons-globe-alt'"
                    variant="ghost" size="xs" @click="toggleViewer"
                    :title="showAlternativeViewer ? 'Cambiar a iframe directo' : 'Cambiar a Google Docs Viewer'">
                    {{ showAlternativeViewer ? 'Directo' : 'Google' }}
                  </UButton>
                </div>
              </div>

              <!-- Vista previa para imágenes -->
              <div v-else-if="isImageFile(datosCliente.url_constancia)" class="flex justify-center p-4">
                <img :src="datosCliente.url_constancia" :alt="'Constancia de curso'"
                  class="max-w-full max-h-[600px] object-contain rounded shadow-lg" loading="lazy" />
              </div>

              <!-- Vista previa no disponible para otros tipos -->
              <div v-else class="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                <UIcon name="i-heroicons-document" class="w-16 h-16 mb-4" />
                <p class="text-lg font-medium mb-2">Vista previa no disponible</p>
                <p class="text-sm mb-4">Este tipo de archivo no puede ser previsualizado inline</p>
                <div class="flex gap-2">
                  <UButton icon="i-heroicons-arrow-down-tray" variant="outline"
                    @click="descargarConstancia(datosCliente.url_constancia)">
                    Descargar archivo
                  </UButton>
                  <UButton icon="i-heroicons-arrow-top-right-on-square" variant="outline"
                    @click="openInNewTab(datosCliente.url_constancia)">
                    Abrir en nueva pestaña
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Información del archivo -->
            <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">
                  <strong>Archivo:</strong> Constancia de curso.{{
                    getFileExtension(datosCliente.url_constancia).toUpperCase() }}
                </span>
                <UButton icon="i-heroicons-arrow-top-right-on-square" variant="ghost" size="xs"
                  @click="descargarConstancia(datosCliente.url_constancia)">
                  Abrir en nueva pestaña
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="datosCliente?.Nu_Estado == 2 && datosCliente?.Nu_Estado_Usuario_Externo != 2">
        <UButton @click="crearUsuarioCursosMoodle(datosCliente?.id_usuario, datosCliente?.id_pedido_curso)">
          Crear usuario
        </UButton>
      </div>

      <!-- Botón para generar y enviar constancia -->
      <div v-if="datosCliente?.Nu_Estado_Usuario_Externo == 2 " class="mt-4">
        <UButton @click="handleGenerarConstancia" color="success" icon="i-heroicons-document-plus"
          :loading="generandoConstancia">
         {{ datosCliente?.url_constancia ? 'Regenerar Constancia y Enviar' : 'Generar y Enviar Constancia' }}
        </UButton>
      </div>

    </div>

    <!-- Vista previa inline de la constancia -->


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, shallowRef, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCursos } from '~/composables/useCursos'
import type { DatosClientePorPedido } from '~/types/cursos/cursos'
import { useOverlay } from '#imports'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { useLocation } from '~/composables/commons/useLocation'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'

const route = useRoute()
const router = useRouter()
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const datosCliente = ref<DatosClientePorPedido | undefined>(undefined)
const { cargarDatosClientePorPedido, editarDatosCliente, generarYEnviarConstancia, sendInstruccionesCambioPassword } = useCursos()

const volver = () => router.back()

const modalMessage = ref('')
const modalType = ref('') // success, warning, danger
const showModal = ref(false)

const form = ref<Partial<DatosClientePorPedido>>({})
const editMode = ref(false)

// Overlay para modal de previsualización
const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

// Estado para alternar entre visores de PDF
const showAlternativeViewer = ref(false)

// Estado para el envío de correo
const enviandoCorreo = ref(false)

// Estado para la generación de constancia
const generandoConstancia = ref(false)

// Estado para el envío de instrucciones de cambio de contraseña
const enviandoInstrucciones = ref(false)

// DateFormatter para la fecha de nacimiento
const df = new DateFormatter('es-PE', {
  dateStyle: 'medium'
})

// Fecha de nacimiento como CalendarDate
const fechaNacimiento = shallowRef<CalendarDate | null>(null)

// Variables para sexo y red social
const sexoSeleccionado = ref<number | null>(null)
const redSocialSeleccionada = ref<number | null>(null)

// Variables locales para ubicación
const selectedPais = ref<number | null>(null)
const selectedDepartamento = ref<number | null>(null)
const selectedProvincia = ref<number | null>(null)
const selectedDistrito = ref<number | null>(null)

// Bandera para indicar si estamos en la carga inicial
const isInitialLoad = ref(true)

// Composable de ubicación
const {
  paises,
  departamentos,
  provincias,
  distritos,
  loadingPaises,
  loadingDepartamentos,
  loadingProvincias,
  loadingDistritos,
  fetchPaises,
  fetchDepartamentos,
  fetchProvincias,
  fetchDistritos,
  limpiarProvinciasYDistritos,
  limpiarDistritos,
  limpiarUbicacionesPeruanas,
  initializeLocation
} = useLocation()

// Opciones para los selects
const sexoOptions = [
  { label: 'Masculino', value: 1 },
  { label: 'Femenino', value: 0 }
]

const redSocialOptions = [
  { label: 'Tiktok', value: 1 },
  { label: 'Facebook', value: 2 },
  { label: 'Instagram', value: 3 },
  { label: 'Youtube', value: 4 },
  { label: 'Familiares/Amigos', value: 5 },
  { label: 'Google', value: 7 },
  { label: 'Otros', value: 8 }
]

// Opciones computadas para los selects de ubicación
const paisOptions = computed(() => paises.value)

const departamentoOptions = computed(() =>
  departamentos.value.map(d => ({ label: d.nombre, value: d.id }))
)

const provinciaOptions = computed(() =>
  provincias.value.map(p => ({ label: p.nombre, value: p.id }))
)

const distritoOptions = computed(() =>
  distritos.value.map(d => ({ label: d.nombre, value: d.id }))
)

// Funciones para obtener labels de los datos
const getSexoLabel = (value?: number) => {
  const option = sexoOptions.find(o => o.value === value)
  return option?.label || 'No especificado'
}

const getRedSocialLabel = (value?: number) => {
  const option = redSocialOptions.find(o => o.value === value)
  return option?.label || 'No especificado'
}

// Función para formatear fecha para visualización
const formatDateDisplay = (dateString?: string) => {
  if (!dateString) return 'No especificada'
  try {
    const date = new Date(dateString)
    return df.format(date)
  } catch {
    return dateString
  }
}

// Función para convertir string de fecha a CalendarDate
const stringToCalendarDate = (dateString?: string): CalendarDate | null => {
  if (!dateString) return null
  try {
    // Intenta parsear la fecha en formato ISO
    const date = new Date(dateString)
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  } catch {
    return null
  }
}

// Función para convertir CalendarDate a string ISO
const calendarDateToString = (calendarDate: CalendarDate | null): string | undefined => {
  if (!calendarDate) return undefined
  try {
    const date = calendarDate.toDate(getLocalTimeZone())
    return date.toISOString().split('T')[0]
  } catch {
    return undefined
  }
}

// Watch para sincronizar fechaNacimiento con form.nacimiento
watch(fechaNacimiento, (newDate) => {
  if (newDate && editMode.value) {
    form.value.nacimiento = calendarDateToString(newDate)
  }
})

// Watchers para sincronizar selecciones con el formulario
watch(selectedPais, async (newPais, oldPais) => {
  

  // No hacer nada si estamos en carga inicial o no estamos en modo edición
  if (isInitialLoad.value || !editMode.value || newPais === oldPais) return

  if (newPais !== null && newPais !== undefined) {
    form.value.id_pais = newPais

    // Limpiar campos dependientes
    selectedDepartamento.value = null
    selectedProvincia.value = null
    selectedDistrito.value = null
    form.value.id_departamento = 0
    form.value.id_provincia = 0
    form.value.id_distrito = 0

    // Si es Perú (id = 1), cargar departamentos, si no, limpiar
    if (newPais === 1) {
      await fetchDepartamentos()
    } else {
      limpiarUbicacionesPeruanas()
    }
  }
})

watch(selectedDepartamento, async (newDepto, oldDepto) => {
  

  if (isInitialLoad.value || !editMode.value || newDepto === oldDepto) return

  if (newDepto !== null && newDepto !== undefined) {
    form.value.id_departamento = newDepto

    // Limpiar campos dependientes
    selectedProvincia.value = null
    selectedDistrito.value = null
    form.value.id_provincia = 0
    form.value.id_distrito = 0

    // Cargar provincias
    await fetchProvincias(newDepto)
  }
})

watch(selectedProvincia, async (newProv, oldProv) => {
  

  if (isInitialLoad.value || !editMode.value || newProv === oldProv) return

  if (newProv !== null && newProv !== undefined) {
    form.value.id_provincia = newProv

    // Limpiar distrito
    selectedDistrito.value = null
    form.value.id_distrito = 0

    // Cargar distritos
    await fetchDistritos(newProv)
  }
})

watch(selectedDistrito, (newDist, oldDist) => {
  

  if (isInitialLoad.value || !editMode.value || newDist === oldDist) return

  if (newDist !== null && newDist !== undefined) {
    form.value.id_distrito = newDist
  }
})

watch(sexoSeleccionado, (newSexo, oldSexo) => {
  if (isInitialLoad.value || !editMode.value || newSexo === oldSexo) return

  if (newSexo !== null && newSexo !== undefined) {
    form.value.sexo = String(newSexo)
  }
})

watch(redSocialSeleccionada, (newRedSocial, oldRedSocial) => {
  if (isInitialLoad.value || !editMode.value || newRedSocial === oldRedSocial) return

  if (newRedSocial !== null && newRedSocial !== undefined) {
    form.value.red_social = String(newRedSocial)
  }
})

onMounted(async () => {
  datosCliente.value = await cargarDatosClientePorPedido(Number(route.params.id))
  if (datosCliente.value) {
    form.value = { ...datosCliente.value }

    console.log('Datos del cliente cargados:', {
      id_pais: datosCliente.value.id_pais,
      id_departamento: datosCliente.value.id_departamento,
      id_provincia: datosCliente.value.id_provincia,
      id_distrito: datosCliente.value.id_distrito,
      pais: datosCliente.value.pais
    })

    // Inicializar fecha de nacimiento
    fechaNacimiento.value = stringToCalendarDate(datosCliente.value.nacimiento)

    // Inicializar sexo y red social
    sexoSeleccionado.value = datosCliente.value.sexo ? Number(datosCliente.value.sexo) : null
    redSocialSeleccionada.value = datosCliente.value.red_social ? Number(datosCliente.value.red_social) : null

    // Primero cargar ubicación (cargar listas)
    await initializeLocation(
      datosCliente.value.id_pais,
      datosCliente.value.id_departamento,
      datosCliente.value.id_provincia,
      datosCliente.value.id_distrito
    )

    

    // Esperar un tick para que Vue procese los computed
    await nextTick()


    // Luego asignar valores locales de ubicación después de que las listas estén cargadas
    selectedPais.value = datosCliente.value.id_pais || null
    selectedDepartamento.value = datosCliente.value.id_departamento || null
    selectedProvincia.value = datosCliente.value.id_provincia || null
    selectedDistrito.value = datosCliente.value.id_distrito || null


    // Desactivar la bandera de carga inicial después de un pequeño delay
    // para asegurar que todos los valores estén asignados
    await nextTick()
    setTimeout(() => {
      isInitialLoad.value = false
      
    }, 100)
  }
})

const guardarCambios = async () => {
  if (!datosCliente.value) return

  // Construir el payload solo con los campos necesarios
  const payload: any = {
    nombres: form.value.nombres,
    dni: form.value.dni,
    correo: form.value.correo,
    whatsapp: form.value.whatsapp,
    nacimiento: form.value.nacimiento,
    sexo: form.value.sexo,
    red_social: form.value.red_social,
    id_pais: form.value.id_pais
  }

  // Solo incluir ubicación peruana si el país es Perú (id = 1)
  if (form.value.id_pais === 1) {
    payload.id_departamento = form.value.id_departamento
    payload.id_provincia = form.value.id_provincia
    payload.id_distrito = form.value.id_distrito
  }

  

  await editarDatosCliente(datosCliente.value.id_entidad, payload)
  editMode.value = false
  datosCliente.value = await cargarDatosClientePorPedido(Number(route.params.id))
  form.value = { ...datosCliente.value }

  // Reinicializar valores locales
  sexoSeleccionado.value = datosCliente.value.sexo ? Number(datosCliente.value.sexo) : null
  redSocialSeleccionada.value = datosCliente.value.red_social ? Number(datosCliente.value.red_social) : null
  selectedPais.value = datosCliente.value.id_pais || null
  selectedDepartamento.value = datosCliente.value.id_departamento || null
  selectedProvincia.value = datosCliente.value.id_provincia || null
  selectedDistrito.value = datosCliente.value.id_distrito || null
}

function getRedSocialText(num?: number, otros?: string) {
  switch (num) {
    case 2: return 'Facebook'
    case 3: return 'Instagram'
    case 4: return 'Youtube'
    case 5: return 'Familiares/Amigos'
    case 6: return 'LinkedIn'
    case 7: return 'Google'
    case 8: return 'Otros: ' + (otros ?? '')
    default: return 'Tiktok'
  }
}

async function crearUsuarioCursosMoodle(id: number, ID_Pedido_Curso: number) {
  try {
    const response = await fetch(`/api/Curso/PedidosCurso/crearUsuarioCursosMoodle/${id}/${ID_Pedido_Curso}`)
    const data = await response.json()

    showModal.value = true
    modalType.value = data.status === 'success' ? 'success' : (data.debug_data ? 'warning' : 'danger')
    if (data.status === 'success') {
      modalMessage.value = data.message
      setTimeout(() => { showModal.value = false }, 2100)
      // reload_table_Entidad() // Implementa si tienes tabla reactiva
    } else if (data.debug_data) {
      modalMessage.value = `Usuario ya existe en Moodle,
        Usuario: ${data.debug_data.No_Usuario || 'No disponible'},
        Password: ${data.debug_data.No_Password || 'No disponible'}.`
      setTimeout(() => { showModal.value = false }, 4100)
      await enviarEmailUsuarioMoodle(id, ID_Pedido_Curso)
      return
    } else {
      modalMessage.value = data.message
      setTimeout(() => { showModal.value = false }, 4100)
    }
    await enviarEmailUsuarioMoodle(id, ID_Pedido_Curso)
  } catch (err) {
    showModal.value = true
    modalType.value = 'danger'
    modalMessage.value = 'Error en la petición'
    setTimeout(() => { showModal.value = false }, 4100)
  }
}

async function enviarEmailUsuarioMoodle(id: number, ID_Pedido_Curso: number) {
  try {
    const response = await fetch(`/api/Curso/PedidosCurso/enviarEmailUsuarioMoodle/${id}/${ID_Pedido_Curso}`)
    const data = await response.json()
    showModal.value = true
    modalType.value = data.status === 'success' ? 'success' : 'danger'
    modalMessage.value = data.message || data.debug_data
    setTimeout(() => { showModal.value = false }, data.status === 'success' ? 2100 : 4100)
  } catch (err) {
    showModal.value = true
    modalType.value = 'danger'
    modalMessage.value = 'Error en la petición'
    setTimeout(() => { showModal.value = false }, 4100)
  }
}

async function enviarCredencialesCorreo() {
  if (!datosCliente.value?.id_usuario || !datosCliente.value?.id_pedido_curso) {
    showModal.value = true
    modalType.value = 'danger'
    modalMessage.value = 'No se pudo obtener la información del usuario'
    setTimeout(() => { showModal.value = false }, 3000)
    return
  }

  enviandoCorreo.value = true
  try {
    const response = await fetch(
      `/api/Curso/PedidosCurso/enviarEmailUsuarioMoodle/${datosCliente.value.id_usuario}/${datosCliente.value.id_pedido_curso}`
    )
    const data = await response.json()

    showModal.value = true
    modalType.value = data.status === 'success' ? 'success' : 'danger'
    modalMessage.value = data.status === 'success'
      ? 'Correo enviado exitosamente con las credenciales de acceso'
      : data.message || 'Error al enviar el correo'

    setTimeout(() => {
      showModal.value = false
    }, data.status === 'success' ? 3000 : 4000)
  } catch (err) {
    showModal.value = true
    modalType.value = 'danger'
    modalMessage.value = 'Error en la petición al enviar el correo'
    setTimeout(() => { showModal.value = false }, 4000)
  } finally {
    enviandoCorreo.value = false
  }
}

function descargarConstancia(url: string) {
  window.open(url, '_blank')
}

// Función para extraer la extensión del archivo desde la URL
function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const extension = pathname.split('.').pop()?.toLowerCase() || 'file'
    return extension
  } catch {
    // Si la URL no es válida, intentar extraer extensión de otra manera
    const match = url.match(/\.([^./?#]+)(?:[?#]|$)/)
    return match ? match[1].toLowerCase() : 'file'
  }
}

// Función para previsualizar la constancia en modal
function previsualizarConstancia(url: string) {
  const extension = getFileExtension(url)
  const fileName = `Constancia de curso.${extension}`

  // Crear un objeto FileItem compatible con ModalPreview
  const fileItem = {
    file_name: fileName,
    file_url: url,
    size: 0 // No tenemos el tamaño real
  }

  modalPreview.open({
    file: fileItem,
    isOpen: true
  })
}


// Función para verificar si es un archivo de imagen
function isImageFile(url: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = getFileExtension(url).toLowerCase()
  return imageExtensions.includes(extension)
}

// Función para alternar entre visores de PDF
function toggleViewer() {
  showAlternativeViewer.value = !showAlternativeViewer.value
}

// Función para manejar errores del iframe directo
function handleIframeError() {
  console.warn('Error cargando PDF con iframe directo, intentando con Google Docs Viewer...')
  showAlternativeViewer.value = true
}

// Función para manejar errores del Google Docs Viewer
function handleGoogleViewerError() {
  console.warn('Error cargando PDF con Google Docs Viewer, volviendo a iframe directo...')
  showAlternativeViewer.value = false
}

// Función para abrir archivo en nueva pestaña
function openInNewTab(url: string) {
  window.open(url, '_blank')
}

// Función para generar y enviar constancia
async function handleGenerarConstancia() {
  if (!datosCliente.value?.id_pedido_curso) {
    showError('Error', 'No se pudo obtener la información del usuario')
    return
  }

  try {
    await showConfirmation('Confirmación', '¿Estás seguro de querer generar y enviar la constancia?', async () => {
      generandoConstancia.value = true
      await withSpinner(async () => {
        const response = await generarYEnviarConstancia(datosCliente.value!.id_pedido_curso)
        
        
        if (response.success) {
          showSuccess('Éxito', 'Constancia generada y enviada correctamente')
          
          // Recargar los datos del cliente después de 1 segundo
          setTimeout(async () => {
            datosCliente.value = await cargarDatosClientePorPedido(Number(route.params.id))
            if (datosCliente.value) {
              form.value = { ...datosCliente.value }
            }
          }, 1000)
        } else {
          showError('Error', response.error || 'Error al generar y enviar la constancia')
        }
      }, 'Generando constancia...')
      generandoConstancia.value = false
    })
  } catch (err) {
    generandoConstancia.value = false
    showError('Error', 'Error al generar y enviar la constancia')
  }
}

// Función para enviar instrucciones de cambio de contraseña
async function handleEnviarInstruccionesCambioPassword() {
  if (!datosCliente.value?.id_pedido_curso) {
    showError('Error', 'No se pudo obtener la información del pedido')
    return
  }

  try {
    await showConfirmation(
      'Enviar instrucciones',
      '¿Estás seguro de querer enviar las instrucciones para cambiar la contraseña por WhatsApp?',
      async () => {
        enviandoInstrucciones.value = true
        await withSpinner(async () => {
          const response = await sendInstruccionesCambioPassword(datosCliente.value!.id_pedido_curso)
          
          if (response.success) {
            showSuccess('Éxito', 'Instrucciones enviadas correctamente por WhatsApp')
          } else {
            showError('Error', response.error || 'Error al enviar las instrucciones')
          }
        }, 'Enviando instrucciones...')
        enviandoInstrucciones.value = false
      }
    )
  } catch (err) {
    enviandoInstrucciones.value = false
    showError('Error', 'Error al enviar las instrucciones')
  }
}
</script>
