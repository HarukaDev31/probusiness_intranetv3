<template>
  <div class="min-h-screen">
    <div class="max-w-9/10 mx-auto px-">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">
          Registro de cotización
        </h1>
        <p class="text-lg">
          Complete todos los pasos para registrar la cotización
        </p>
      </div>

      <!-- Stepper -->
      <UCard class="mb-8">
        <div class="flex items-center justify-center">
          <div class="flex items-center space-x-4">
            <div v-for="step in totalSteps" :key="step" class="flex items-center">
              <div
                @click="handleStepClick(step)"
                class="flex flex-col items-center cursor-pointer group"
                :class="{ 'cursor-not-allowed opacity-50': !canGoToStep(step) }"
              >
                <div :class="[
                  'text-sm font-medium transition-colors mb-2 group-hover:text-green-700',
                  currentStep >= step ? 'text-green-600' : 'text-gray-500'
                ]">
                  {{ getStepLabel(step) }}
                </div>
                <div :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all',
                  currentStep >= step
                    ? 'bg-green-600 text-white group-hover:bg-green-700 group-hover:scale-110'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 group-hover:scale-110'
                ]">
                  {{ step }}
                </div>
              </div>

              <div v-if="step < totalSteps" :class="[
                'w-16 h-0.5 transition-colors mx-4 mt-6',
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              ]"></div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Step Content -->
      <UCard class="rounded-lg shadow-lg">
        <!-- Paso 1: Documento + Datos del cliente -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div>
            <div class="flex items-center gap-3 flex-wrap mb-1">
              <h2 class="text-xl font-semibold">
                Documento de la cotización <span class="text-primary">*</span>
              </h2>
              <UBadge :color="scanState === 'done' ? 'success' : 'warning'" variant="soft">
                {{ scanState === 'done' ? 'Archivo guardado' : 'Obligatorio' }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-500 max-w-2xl mb-4">
              El documento es obligatorio: queda guardado como respaldo interno de la cotización y además
              rellena parte de los campos del registro. Los datos que no aparezcan en el archivo los
              completas a mano abajo.
            </p>

            <!-- idle / con archivo pendiente de escanear -->
            <div v-if="scanState === 'idle'">
              <FileUploader
                :model-files="archivo ? [archivo] : []"
                :accepted-types="['.pdf', '.xlsx', '.xls', '.csv']"
                custom-message="Arrastra el archivo aquí o usa «Subir archivo» (Excel o PDF, hasta 10 MB)"
                @files-selected="onArchivoSeleccionado"
                @file-removed="onArchivoRemovido"
              />
              <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span class="text-xs font-bold">Qué leemos del documento:</span>
                <UBadge v-for="chip in READS_CHIPS" :key="chip" color="neutral" variant="soft">
                  {{ chip }}
                </UBadge>
              </div>
            </div>

            <!-- escaneando -->
            <div
              v-else-if="scanState === 'scanning'"
              class="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-6 flex gap-4 items-start"
            >
              <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary text-2xl shrink-0 mt-1" />
              <div class="flex-1 min-w-0 space-y-2">
                <p class="font-semibold">Escaneando {{ archivo?.name }}…</p>
                <p class="text-sm text-gray-500">
                  Guardando el archivo y leyendo los datos del cliente. Esto toma unos segundos.
                </p>
                <UProgress :model-value="null" class="max-w-sm" />
              </div>
            </div>

            <!-- listo -->
            <div
              v-else
              class="border border-green-200 dark:border-green-900 rounded-lg bg-green-50 dark:bg-green-900/10 p-5 flex gap-4 items-center flex-wrap"
            >
              <UIcon name="i-heroicons-check-circle" class="text-green-600 text-3xl shrink-0" />
              <div class="flex-1 min-w-[220px]">
                <p class="font-semibold">
                  {{ archivo?.name }} guardado · {{ camposCompletadosCount }} de {{ CLIENTE_FIELDS.length }} campos completados
                </p>
                <p class="text-sm text-gray-500">
                  {{ archivo ? formatFileSize(archivo.size) : '' }} · revisa los campos marcados y completa a mano lo que falte
                </p>
              </div>
              <UButton color="neutral" variant="outline" @click="reiniciarArchivo">
                Reemplazar archivo
              </UButton>
            </div>
          </div>

          <div :class="scanState !== 'done' ? 'opacity-70' : ''">
            <div class="flex items-center gap-3 flex-wrap mb-4">
              <h2 class="text-xl font-semibold">Información del Cliente</h2>
              <UBadge v-if="scanState === 'done'" color="success" variant="soft">
                prellenado desde el documento
              </UBadge>
              <UBadge v-else color="warning" variant="soft" icon="i-heroicons-lock-closed">
                Sube el documento para habilitar el formulario
              </UBadge>
            </div>

            <h3 class="text-base font-semibold mb-3">Escoge el tipo de cliente:</h3>
            <div class="flex gap-3 mb-7">
              <UButton
                v-for="ct in ['ID', 'RUC']"
                :key="ct"
                :color="clienteInfo.tipoDocumento === ct ? 'primary' : 'neutral'"
                :variant="clienteInfo.tipoDocumento === ct ? 'solid' : 'outline'"
                :disabled="scanState !== 'done'"
                @click="clienteInfo.tipoDocumento = ct as 'ID' | 'RUC'"
              >
                {{ ct }}
              </UButton>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="f in CLIENTE_FIELDS" :key="f.key" class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                  <label class="text-sm font-medium">
                    {{ f.label(clienteInfo.tipoDocumento) }}
                    <span v-if="f.required" class="text-primary">*</span>
                  </label>
                  <UBadge v-if="necesitaRevision(f.key)" color="warning" variant="soft" size="xs">
                    completar a mano
                  </UBadge>
                </div>
                <UInput
                  v-model="clienteInfo[f.key]"
                  :placeholder="f.placeholder"
                  :disabled="scanState !== 'done'"
                  :color="camposEscaneados[f.key] ? 'success' : necesitaRevision(f.key) ? 'warning' : 'neutral'"
                  class="w-full"
                  @update:model-value="onClienteCampoEditado(f.key)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Paso 2: Información de la carga -->
        <div v-if="currentStep === 2">
          <div class="flex items-center justify-between gap-6 flex-wrap mb-6">
            <h2 class="text-xl font-semibold">Información de la Carga</h2>
            <div class="flex gap-6 text-sm text-gray-500">
              <span>Total Cbm: <strong class="text-gray-900 dark:text-gray-100">{{ totalCbm }}</strong></span>
              <span>Total Proveedores: <strong class="text-gray-900 dark:text-gray-100">{{ providers.length }}</strong></span>
              <span>Total Cajas: <strong class="text-gray-900 dark:text-gray-100">{{ totalCajas }}</strong></span>
            </div>
          </div>

          <div
            v-for="(prov, idx) in providers"
            :key="prov.id"
            class="py-5"
            :class="idx > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''"
          >
            <div class="flex items-center justify-between gap-4 mb-4">
              <h3 class="text-base font-semibold">Proveedor #{{ idx + 1 }}</h3>
              <UButton
                v-if="providers.length > 1"
                size="xs"
                color="error"
                variant="soft"
                icon="i-heroicons-trash"
                @click="removeProvider(idx)"
              />
            </div>

            <div class="flex flex-wrap gap-5 items-end">
              <UFormField label="CBM Total" required class="w-36">
                <UInput v-model.number="prov.cbmTotal" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Peso Total" class="w-36">
                <UInput v-model.number="prov.pesoTotal" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Qty Cajas" class="w-36">
                <UInput v-model.number="prov.qtyCajas" type="number" min="0" step="1" class="w-full" />
              </UFormField>
              <UFormField label="Productos del proveedor" required class="flex-1 min-w-[220px]">
                <UInput v-model="prov.productos" placeholder="Ej. Tijeras de poda, guantes de jardín…" class="w-full" />
              </UFormField>
            </div>
          </div>

          <UButton class="mt-4" color="success" size="sm" icon="i-heroicons-plus" @click="addProvider">
            Agregar Proveedor
          </UButton>
        </div>

        <!-- Paso 3: Terminar -->
        <div v-if="currentStep === 3">
          <h2 class="text-xl font-semibold mb-6">Terminar</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="Cantidad proveedores" hint="Sincronizado con los proveedores del paso 2">
              <UInput :model-value="providers.length" disabled class="w-full" />
            </UFormField>

            <UFormField label="Descuento (opcional)">
              <UInput v-model.number="descuento" type="number" min="0" step="0.01" class="w-full">
                <template #leading>
                  <span class="text-gray-400">$</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Selecciona el vendedor" required>
              <USelect v-model="selectedVendedor" :items="vendedoresOptions" placeholder="Seleccionar" class="w-full" />
            </UFormField>

            <UFormField label="Selecciona el consolidado" required>
              <USelect v-model="selectedContenedor" :items="contenedoresOptions" placeholder="Seleccionar" class="w-full" />
            </UFormField>
          </div>
        </div>
      </UCard>

      <!-- Navigation -->
      <div class="flex justify-between items-center my-6">
        <UButton
          @click="handlePrevStep"
          :disabled="currentStep === 1"
          color="primary"
          size="lg"
          icon="i-heroicons-arrow-left"
          label="Anterior"
        />

        <div class="text-center">
          <span>Paso {{ currentStep }} de {{ totalSteps }}</span>
        </div>

        <UButton
          v-if="currentStep < totalSteps"
          @click="nextStep"
          :disabled="!canGoNext"
          color="primary"
          size="lg"
          icon="i-heroicons-arrow-right"
          label="Siguiente"
        />
        <UButton
          v-else
          @click="finalizar"
          :loading="saving"
          :disabled="!canFinalizar"
          color="primary"
          size="lg"
          icon="i-heroicons-check"
          label="Finalizar"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import { CotizacionService } from '~/services/cargaconsolidada/cotizacionService'
import { useModal } from '@/composables/commons/useModal'

definePageMeta({
  middleware: 'auth'
})

const { showError } = useModal()

const totalSteps = 3
const currentStep = ref(1)
const maxStepReached = ref(1)

function getStepLabel(step: number) {
  return ({ 1: 'Datos', 2: 'Carga', 3: 'Terminar' } as Record<number, string>)[step] ?? String(step)
}

function canGoToStep(step: number) {
  if (step === 1) return true
  return scanState.value === 'done' && step <= maxStepReached.value
}

function handleStepClick(step: number) {
  if (!canGoToStep(step)) return
  currentStep.value = step
}

// ─── Paso 1: documento + IA ────────────────────────────────────────────────
const READS_CHIPS = ['Datos del cliente', 'RUC / ID', 'Proveedores', 'CBM y peso', 'Productos']

type ScanState = 'idle' | 'scanning' | 'done'
const scanState = ref<ScanState>('idle')
const archivo = ref<File | null>(null)
let scanTimeout: ReturnType<typeof setTimeout> | null = null

type ClienteKey = 'nombre' | 'documento' | 'whatsapp' | 'correo'
const CLIENTE_FIELDS: {
  key: ClienteKey
  label: (tipo: 'ID' | 'RUC') => string
  required: boolean
  placeholder: string
}[] = [
  { key: 'nombre', label: () => 'Nombre completo', required: true, placeholder: '' },
  { key: 'documento', label: (tipo) => (tipo === 'RUC' ? 'RUC' : 'ID'), required: false, placeholder: '' },
  { key: 'whatsapp', label: () => 'WhatsApp', required: true, placeholder: '593 991234567' },
  { key: 'correo', label: () => 'Correo', required: false, placeholder: '' }
]

const clienteInfo = reactive<{ tipoDocumento: 'ID' | 'RUC' } & Record<ClienteKey, string>>({
  tipoDocumento: 'ID',
  nombre: '',
  documento: '',
  whatsapp: '',
  correo: ''
})

/** true = la IA lo llenó y el usuario no lo tocó después, false = la IA no pudo leerlo. */
const camposEscaneados = ref<Partial<Record<ClienteKey, boolean>>>({})

function necesitaRevision(key: ClienteKey) {
  return scanState.value === 'done' && camposEscaneados.value[key] === false
}

function onClienteCampoEditado(key: ClienteKey) {
  // Una vez editado a mano deja de mostrarse como "pendiente de revisión" o "auto-detectado".
  delete camposEscaneados.value[key]
}

const camposCompletadosCount = computed(
  () => Object.values(camposEscaneados.value).filter(Boolean).length
)

function onArchivoSeleccionado(files: File[]) {
  const file = files[0]
  if (!file) return
  archivo.value = file
  procesarArchivo(file)
}

function onArchivoRemovido() {
  archivo.value = null
}

/**
 * TODO: reemplazar por la llamada real al endpoint de subida + extracción IA
 * (POST cotizacion_proveedor_archivo_ia) una vez exista en el backend. Por
 * ahora simula el escaneo para poder construir y validar el flujo completo.
 */
function procesarArchivo(file: File) {
  scanState.value = 'scanning'
  if (scanTimeout) clearTimeout(scanTimeout)
  scanTimeout = setTimeout(() => {
    clienteInfo.nombre = 'Comercial Andina del Pacífico S.A.'
    clienteInfo.tipoDocumento = 'RUC'
    clienteInfo.documento = '1792458630001'
    clienteInfo.whatsapp = '593 991234567'
    clienteInfo.correo = ''
    camposEscaneados.value = { nombre: true, documento: true, whatsapp: true, correo: false }
    scanState.value = 'done'
    maxStepReached.value = Math.max(maxStepReached.value, 1)
  }, 1800)
}

function reiniciarArchivo() {
  if (scanTimeout) clearTimeout(scanTimeout)
  archivo.value = null
  scanState.value = 'idle'
  clienteInfo.nombre = ''
  clienteInfo.documento = ''
  clienteInfo.whatsapp = ''
  clienteInfo.correo = ''
  clienteInfo.tipoDocumento = 'ID'
  camposEscaneados.value = {}
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Paso 2: proveedores ────────────────────────────────────────────────────
interface ProveedorResumen {
  id: number
  cbmTotal: number
  pesoTotal: number
  qtyCajas: number
  productos: string
}

let nextProviderId = 1
function crearProveedor(): ProveedorResumen {
  return { id: nextProviderId++, cbmTotal: 0, pesoTotal: 0, qtyCajas: 0, productos: '' }
}

const providers = ref<ProveedorResumen[]>([crearProveedor()])

function addProvider() {
  providers.value.push(crearProveedor())
}

function removeProvider(idx: number) {
  if (providers.value.length <= 1) return
  providers.value.splice(idx, 1)
}

const totalCbm = computed(() =>
  providers.value.reduce((acc, p) => acc + (Number(p.cbmTotal) || 0), 0).toFixed(2)
)
const totalCajas = computed(() =>
  providers.value.reduce((acc, p) => acc + (Number(p.qtyCajas) || 0), 0)
)

// ─── Paso 3: terminar ───────────────────────────────────────────────────────
const descuento = ref(0)
const vendedoresOptions = ref<{ label: string; value: number }[]>([])
const contenedoresOptions = ref<{ label: string; value: number }[]>([])
const selectedVendedor = ref<number | null>(null)
const selectedContenedor = ref<number | null>(null)

async function loadVendedores() {
  try {
    const response = await CotizacionService.getVendedoresDropdown()
    vendedoresOptions.value = response.data || response
  } catch (error) {
    console.error('Error al obtener vendedores:', error)
  }
}

async function loadContenedores() {
  try {
    const response = await CotizacionService.getCargasDisponiblesDropdown()
    contenedoresOptions.value = response.data || response
  } catch (error) {
    console.error('Error al obtener cargas disponibles:', error)
  }
}

onMounted(() => {
  loadVendedores()
  loadContenedores()
})

// ─── Navegación / validación por paso ──────────────────────────────────────
const canGoNext = computed(() => {
  if (currentStep.value === 1) {
    return scanState.value === 'done' && !!clienteInfo.nombre.trim() && !!clienteInfo.whatsapp.trim()
  }
  if (currentStep.value === 2) {
    return providers.value.every((p) => p.cbmTotal > 0 && p.productos.trim() !== '')
  }
  return true
})

const canFinalizar = computed(
  () => !!selectedVendedor.value && !!selectedContenedor.value && canGoNext.value
)

function nextStep() {
  if (!canGoNext.value || currentStep.value >= totalSteps) return
  currentStep.value += 1
  maxStepReached.value = Math.max(maxStepReached.value, currentStep.value)
}

function handlePrevStep() {
  if (currentStep.value <= 1) return
  currentStep.value -= 1
}

// ─── Guardar ────────────────────────────────────────────────────────────────
const saving = ref(false)

/**
 * TODO: reemplazar por la llamada real de guardado (crear Cotizacion +
 * CotizacionProveedor en modo 'resumen' + CotizacionProveedorResumen) una vez
 * exista el endpoint en el backend.
 */
async function finalizar() {
  if (!canFinalizar.value) return
  saving.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    showError(
      'Guardado no disponible todavía',
      'El endpoint para registrar esta cotización aún no existe en el backend. La vista y su validación ya están listas.'
    )
  } finally {
    saving.value = false
  }
}
</script>
