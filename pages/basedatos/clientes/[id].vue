<template>
  <div class="md:p-6">
    <!-- Header -->
    <PageHeader title="Detalles del Cliente" subtitle="Información completa del cliente" icon="i-heroicons-user"
      :loading="loading" @back="navigateBack" :hideBackButton="false" />

    <!-- Loading state (improved skeleton: left column ~md:1/3, right content flex-1) -->
    <div v-if="loading" class="flex flex-col md:flex-row gap-8 items-start">
      <!-- Skeleton para la información básica (columna izquierda) -->
      <UCard class="w-full md:w-1/3">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 w-full flex flex-col">
          <div class="flex items-center mb-4 flex-col">
            <div class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mr-4"></div>
            <div class="flex-1">
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse w-3/4"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
            </div>
          </div>

          <div class="mt-4 space-y-3">
            <div v-for="i in 5" :key="`right-${i}`"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex gap-4 items-center justify-between align-middle">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse md:w-1/4 items-center"></div>
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:w-3/4 items-center"></div>
              </div>
          </div>
        </div>
      </UCard>

      <!-- Skeleton para el historial (columna derecha) -->
      <UCard class="w-full md:flex-1 bg-transparent shadow-none">
        <div class="p-6">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse w-1/4"></div>
          <div class="space-y-3 w-full">
            <div v-for="i in 4" :key="`row-${i}`" class="flex space-x-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-30"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-30"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-42"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-34"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-30"></div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error state -->
    <ErrorState v-else-if="error" :message="error || 'Error desconocido'" />

    <!-- Cliente details -->
    <div v-else-if="cliente" class="flex flex-col md:flex-row gap-8 items-start w-full">
      <!-- Card de información del cliente -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 w-full md:w-1/3 flex flex-col items-center">
        <div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
          <UIcon name="i-heroicons-user" class="w-14 h-14 md:w-20 md:h-20 text-gray-400" />
        </div>
        <h2 class="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">{{ cliente?.nombre }}</h2>
        <div class="w-full">
          <div class="grid grid-cols-2 md:grid-cols-2 gap-y-2 text-sm">
            <div class="font-medium text-gray-500 dark:text-gray-400">País:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.pais || 'Perú' }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">Ciudad:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.ciudad || 'Lima' }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">DNI:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.documento }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">WhatsApp:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.telefono }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">Correo:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full" :title="cliente?.correo">{{ cliente?.correo }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">Empresa:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.empresa }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">RUC:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.ruc }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">Capacidad comercial:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.capacidad_comercial }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">Rubro:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.rubro }}</div>
            <div class="font-medium text-gray-500 dark:text-gray-400">Red social:</div>
              <div class="text-gray-900 dark:text-gray-100 break-words whitespace-normal max-w-full">{{ cliente?.red_social }}</div>
          </div>
        </div>
        <div v-if="cliente?.id_user || cliente?.primer_servicio?.servicio == 'Curso'" class="mt-6 w-full flex flex-col gap-2">
          <UButton 
            @click="handleEnviarInstruccionesRecuperacionContrasena" 
            color="primary" 
            icon="i-heroicons-key"
            :loading="enviandoInstrucciones"
            class="w-full"
          >
            Enviar mensaje de recuperación de contraseña
          </UButton>
          <UButton
            @click="handleCopiarMensajeRecuperacionContrasena(cliente?.nombre)"
            color="success"
            icon="i-heroicons-clipboard"
            :loading="copiandoMensajeRecuperacionContrasena"
            class="w-full"
          >
            Copiar mensaje de recuperación de contraseña
          </UButton>
        </div>

        <div v-if="cliente?.id_user" class="mt-6 w-full rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Cambiar contraseña del portal
          </h3>
          <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Asigna una nueva contraseña para el acceso del cliente al portal.
          </p>
          <form class="flex flex-col gap-3" @submit.prevent="handleActualizarContrasena">
            <UFormField label="Nueva contraseña" required>
              <UInput
                :key="mostrarPasswordNueva ? 'pwd-nueva-text' : 'pwd-nueva-hidden'"
                v-model="formContrasena.password"
                :type="mostrarPasswordNueva ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                :ui="{ trailing: 'pe-1' }"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    :icon="mostrarPasswordNueva ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    variant="link"
                    color="neutral"
                    size="sm"
                    type="button"
                    :aria-label="mostrarPasswordNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click.prevent.stop="() => { mostrarPasswordNueva = !mostrarPasswordNueva }"
                  />
                </template>
              </UInput>
            </UFormField>
            <UFormField label="Confirmar contraseña" required>
              <UInput
                :key="mostrarPasswordConfirmacion ? 'pwd-conf-text' : 'pwd-conf-hidden'"
                v-model="formContrasena.password_confirmation"
                :type="mostrarPasswordConfirmacion ? 'text' : 'password'"
                placeholder="Repita la contraseña"
                autocomplete="new-password"
                :ui="{ trailing: 'pe-1' }"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    :icon="mostrarPasswordConfirmacion ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    variant="link"
                    color="neutral"
                    size="sm"
                    type="button"
                    :aria-label="mostrarPasswordConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click.prevent.stop="() => { mostrarPasswordConfirmacion = !mostrarPasswordConfirmacion }"
                  />
                </template>
              </UInput>
            </UFormField>
            <UButton
              type="submit"
              color="primary"
              icon="i-heroicons-lock-closed"
              :loading="guardandoContrasena"
              class="w-full"
            >
              Guardar contraseña
            </UButton>
          </form>
        </div>
      </div>

      <!-- Historial de compras -->
      <div class="flex-1 w-full max-w-3xl mx-auto">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Historial de compras</h3>
          <UButton
            v-if="tieneConsolidados"
            label="Descargar documentos"
            icon="i-heroicons-arrow-down-tray"
            color="primary"
            variant="outline"
            :loading="descargandoDocumentos"
            class="w-full sm:w-auto"
            @click="handleDescargarDocumentos"
          />
        </div>
        <div class="overflow-x-auto">
          <DataTable
            title=""
            :data="historialComprasPaginado"
            :columns="historialColumns"
            :loading="loading"
            :show-primary-search="false"
            :show-top-section="true"
            :show-pagination="true"
            :current-page="currentPageHistorial"
            :total-pages="totalPagesHistorial"
            :total-records="totalRecordsHistorial"
            :items-per-page="itemsPerPageHistorial"
            @page-change="handlePageChangeHistorial"
            @items-per-page-change="handleItemsPerPageChangeHistorial"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { createLazyView } from '~/utils/lazyView'

const DataTable = createLazyView(() => import('~/components/DataTable.vue'))
import type { Cliente } from '~/services/clienteService'
import type { TableColumn } from '@nuxt/ui'
import { UButton } from '#components'
import { ClienteService } from '~/services/clienteService'
import { useClientes } from '~/composables/useClientes'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
// Props
const route = useRoute()
const clienteId = parseInt(route.params.id as string)

// State
const cliente = ref<Cliente | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const enviandoInstrucciones = ref(false)
const copiandoMensajeRecuperacionContrasena = ref(false)
const descargandoDocumentos = ref(false)
const guardandoContrasena = ref(false)
const mostrarPasswordNueva = ref(false)
const mostrarPasswordConfirmacion = ref(false)
const formContrasena = ref({
  password: '',
  password_confirmation: ''
})
// Composables
const { enviarInstruccionesRecuperacionContrasena, actualizarContrasenaCliente } = useClientes()
const { showConfirmation, showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

// Historial de compras (datos de ejemplo basados en la imagen)
const historialCompras = ref<any[]>([])
const historialComprasOriginal = ref<any[]>([])

// Pagination state for purchase history
const currentPageHistorial = ref(1)
const itemsPerPageHistorial = ref(10)
const totalRecordsHistorial = computed(() => historialComprasOriginal.value.length)
const totalPagesHistorial = computed(() => Math.ceil(totalRecordsHistorial.value / itemsPerPageHistorial.value))

// Computed for paginated purchase history
const historialComprasPaginado = computed(() => {
  const start = (currentPageHistorial.value - 1) * itemsPerPageHistorial.value
  const end = start + itemsPerPageHistorial.value
  return historialComprasOriginal.value.slice(start, end)
})

const tieneConsolidados = computed(() =>
  historialComprasOriginal.value.some((item) => item.servicio === 'Consolidado')
)

// Configuración de columnas para el historial
const historialColumns: TableColumn<any>[] = [
  {
    accessorKey: 'numero',
    header: 'N.',
    cell: ({ row }: { row: any }) => {
      // Calculate the actual index based on pagination
      const baseIndex = (currentPageHistorial.value - 1) * itemsPerPageHistorial.value
      return baseIndex + row.index + 1
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
      if (servicio === 'Consolidado') {
        return `${servicio} ${detalle}`
      }
      return `${servicio} ${detalle}`
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
      historialComprasOriginal.value = clienteData.servicios.map((servicio: any, index: number) => ({
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
  // Establecer flag para indicar que estamos navegando internamente
  sessionStorage.setItem('clientes_internal_nav', 'true')
  navigateTo('/basedatos/clientes')
}

// Pagination handlers for purchase history
const handlePageChangeHistorial = (page: number) => {
  currentPageHistorial.value = page
}

const handleItemsPerPageChangeHistorial = (items: number) => {
  itemsPerPageHistorial.value = items
  currentPageHistorial.value = 1 // Reset to first page when changing items per page
}

const handleEnviarInstruccionesRecuperacionContrasena = async () => {
  if (!cliente.value?.id) {
    showError('Error', 'No se pudo obtener la información del cliente.')
    return
  }

  try {
    await showConfirmation(
      'Confirmación', 
      '¿Estás seguro de querer enviar las instrucciones de recuperación de contraseña por WhatsApp y correo electrónico?', 
      async () => {
        enviandoInstrucciones.value = true
        await withSpinner(async () => {
          const response = await enviarInstruccionesRecuperacionContrasena(cliente.value!.id)

          if (response.success) {
            showSuccess('Éxito', 'Instrucciones enviadas correctamente por WhatsApp y correo electrónico')
          } else {
            showError('Error', response.error || 'Error al enviar las instrucciones de recuperación de contraseña')
          }
        }, 'Enviando instrucciones...')
        enviandoInstrucciones.value = false
      }
    )
  } catch (err) {
    enviandoInstrucciones.value = false
    showError('Error', 'Error al enviar las instrucciones de recuperación de contraseña')
  }
}

const mensajeRecuperacionContrasena = ref(`Mensaje: 
Hola @nombrecliente! 👋

Para recuperar tu contraseña, puedes hacerlo a través del siguiente enlace:
https://clientes.probusiness.pe/recuperar-contrasena

Si tienes algún problema, no dudes en contactarnos.

¡Saludos!
  Equipo Probusiness`)

const handleCopiarMensajeRecuperacionContrasena = (nombre: string) => {
  navigator.clipboard.writeText(mensajeRecuperacionContrasena.value.replace('@nombrecliente', nombre))
  copiandoMensajeRecuperacionContrasena.value = true
  //show toast notification
  showSuccess('Éxito', 'Mensaje copiado correctamente')
  setTimeout(() => copiandoMensajeRecuperacionContrasena.value = false,1000)
}

const handleDescargarDocumentos = async () => {
  descargandoDocumentos.value = true
  try {
    await withSpinner(async () => {
      const blob = await ClienteService.descargarDocumentos(clienteId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `documentos_cliente_${clienteId}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      showSuccess('Listo', 'Documentos descargados correctamente')
    }, 'Preparando descarga…')
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudieron descargar los documentos')
  } finally {
    descargandoDocumentos.value = false
  }
}

const handleActualizarContrasena = async () => {
  if (!cliente.value?.id) {
    showError('Error', 'No se pudo obtener la información del cliente.')
    return
  }

  const password = formContrasena.value.password.trim()
  const passwordConfirmation = formContrasena.value.password_confirmation.trim()

  if (password.length < 8) {
    showError('Contraseña inválida', 'La contraseña debe tener al menos 8 caracteres.')
    return
  }

  if (password !== passwordConfirmation) {
    showError('Contraseña inválida', 'Las contraseñas no coinciden.')
    return
  }

  try {
    await showConfirmation(
      'Confirmar cambio',
      '¿Deseas actualizar la contraseña del portal de este cliente?',
      async () => {
        guardandoContrasena.value = true
        try {
          await withSpinner(async () => {
            const res = await actualizarContrasenaCliente(cliente.value!.id, {
              password,
              password_confirmation: passwordConfirmation
            })
            if (!res.ok) throw new Error(res.error)
          }, 'Actualizando contraseña…')

          formContrasena.value = { password: '', password_confirmation: '' }
          mostrarPasswordNueva.value = false
          mostrarPasswordConfirmacion.value = false
          showSuccess('Contraseña actualizada', 'El cliente ya puede ingresar con la nueva contraseña.')
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.'
          showError('Error al actualizar', msg)
        } finally {
          guardandoContrasena.value = false
        }
      }
    )
  } catch {
    guardandoContrasena.value = false
  }
}

// Initialize
onMounted(() => {
  loadCliente()
})
</script>