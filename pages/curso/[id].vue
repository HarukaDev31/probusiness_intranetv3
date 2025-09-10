<template>
  <div class="p-6">
    <UButton icon="i-heroicons-arrow-left" @click="volver" class="mb-4">Regresar</UButton>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Información del alumno -->
      <div class="bg-white rounded-lg shadow p-6">
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
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.nombres" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Dni / ID:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.dni" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Correo:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.correo" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">WhatsApp:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.whatsapp" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Fecha de nacimiento:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.nacimiento" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Sexo:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.sexo" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Red social:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.red_social" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">País:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.pais" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Departamento:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.departamento" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Provincia:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.provincia" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Distrito:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.distrito" :readonly="!editMode" />
          </div>
        </div>
      </div>
      <!-- Acceso aula virtual -->
      <div v-if="datosCliente?.Nu_Estado_Usuario_Externo == 2" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center mb-4">
          <span class="i-heroicons-academic-cap mr-2" />
          <h2 class="font-semibold text-lg">ACCESO AULA VIRTUAL</h2>
        </div>
        <div class="space-y-3">
          <div class="flex items-center">
            <span class="w-48 font-medium">Usuario:</span>
            <input :class="[editMode ? 'bg-gray-100' : 'bg-gray-200', 'rounded px-3 py-1 w-full']" v-model="form.usuario_moodle" :readonly="!editMode" />
          </div>
          <div class="flex items-center">
            <span class="w-48 font-medium">Contraseña:</span>
            <input class="bg-gray-200 rounded px-3 py-1 w-full" v-model="form.password_moodle" :readonly="!editMode" />
          </div>
        </div>
      </div>
      <div v-if="datosCliente?.Nu_Estado == 2 && datosCliente?.Nu_Estado_Usuario_Externo != 2">
        <UButton @click="crearUsuarioCursosMoodle(datosCliente?.id_usuario, datosCliente?.id_pedido_curso)">
          Crear usuario
        </UButton>
      </div>
      <div v-if="datosCliente?.url_constancia">
        <UButton @click="descargarConstancia(datosCliente?.url_constancia)">
          Descargar Constancia
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCursos } from '~/composables/useCursos'
import type { DatosClientePorPedido } from '~/types/cursos/cursos'
const route = useRoute()
const router = useRouter()

const datosCliente = ref<DatosClientePorPedido | undefined>(undefined)
const { cargarDatosClientePorPedido, editarDatosCliente } = useCursos()

const volver = () => router.back()

const modalMessage = ref('')
const modalType = ref('') // success, warning, danger
const showModal = ref(false)

const form = ref<Partial<DatosClientePorPedido>>({})
const editMode = ref(false)

onMounted(async () => {
  datosCliente.value = await cargarDatosClientePorPedido(Number(route.params.id))
  if (datosCliente.value) {
    form.value = { ...datosCliente.value }
  }
})

const guardarCambios = async () => {
  if (!datosCliente.value) return
  await editarDatosCliente(datosCliente.value.id_entidad, form.value)
  editMode.value = false
  // Opcional: recargar datos del cliente
  datosCliente.value = await cargarDatosClientePorPedido(Number(route.params.id))
  form.value = { ...datosCliente.value }
}

const sexoLabel = computed(() => {
  if (!datosCliente.value) return ''
  switch (datosCliente.value.sexo) {
    case 1: return 'Masculino'
    case 2: return 'Femenino'
    default: return 'Otros'
  }
})

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

function descargarConstancia(url: string) {
  window.open(url, '_blank')
}
</script>
