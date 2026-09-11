<template>
  <div class="min-h-screen">
    <div v-if="loadingEdit" class="max-w-9/10 mx-auto py-16 text-center text-gray-500">
      Cargando cotización…
    </div>
    <div v-else class="max-w-9/10 mx-auto px-">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">
          {{ esEdicion ? 'Editar cotización' : 'Registro de cotización' }}
        </h1>
        <p class="text-lg">
          {{ esEdicion
            ? 'Puedes agregar proveedores o costos. Solo se edita en estado COTIZADO.'
            : 'Complete todos los pasos para registrar la cotización' }}
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
                  {{ archivo?.name || archivoStaged?.nombre_original || 'Documento de la cotización' }}
                  · {{ camposCompletadosCount }} de {{ CLIENTE_FIELDS.length }} campos completados
                </p>
                <p class="text-sm text-gray-500">
                  {{ archivo ? formatFileSize(archivo.size) : (esEdicion ? 'Archivo ya registrado' : '') }}
                  · revisa los campos y completa a mano lo que falte
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
                  <UBadge v-if="f.key === 'whatsapp' && clienteBdId" color="success" variant="soft" size="xs">
                    cliente de la org
                  </UBadge>
                  <UBadge v-else-if="necesitaRevision(f.key)" color="warning" variant="soft" size="xs">
                    completar a mano
                  </UBadge>
                </div>
                <UInputMenu
                  v-if="f.key === 'whatsapp'"
                  v-model="whatsappMenu"
                  :items="clientesOptions"
                  :loading="buscandoClientes"
                  :disabled="scanState !== 'done'"
                  :placeholder="whatsappPlaceholder"
                  :color="camposEscaneados.whatsapp ? 'success' : necesitaRevision('whatsapp') ? 'warning' : 'neutral'"
                  create-item
                  ignore-filter
                  class="w-full"
                  @update:search-term="onWhatsappSearch"
                  @update:model-value="onWhatsappMenuChange"
                  @create="onWhatsappCreate"
                >
                  <template #item-label="{ item }">
                    <div class="flex flex-col min-w-0">
                      <span class="truncate">{{ item.telefono || item.label }}</span>
                      <span v-if="item.nombre" class="text-xs text-gray-500 truncate">{{ item.nombre }}</span>
                    </div>
                  </template>
                </UInputMenu>
                <UInput
                  v-else
                  v-model="clienteInfo[f.key]"
                  :placeholder="f.placeholder"
                  :disabled="scanState !== 'done'"
                  :color="camposEscaneados[f.key] ? 'success' : necesitaRevision(f.key) ? 'warning' : 'neutral'"
                  class="w-full"
                  @update:model-value="onClienteCampoEditado(f.key)"
                />
                <p v-if="f.key === 'whatsapp'" class="text-xs text-gray-500">
                  Escribe un número nuevo o elige uno de tus clientes. Sin código de país se usa el del consolidado.
                </p>
              </div>
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                  <label class="text-sm font-medium">
                    Qty Proveedores <span class="text-primary">*</span>
                  </label>
                </div>
                <UInput
                  :model-value="qtyProveedores"
                  type="number"
                  min="1"
                  max="8"
                  :disabled="scanState !== 'done'"
                  class="w-full"
                  @update:model-value="onQtyProveedoresChange"
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
              <span>Total Items: <strong class="text-gray-900 dark:text-gray-100">{{ providers.length }}</strong></span>
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
              <div class="flex items-center gap-2">
                <h3 class="text-base font-semibold">Proveedor #{{ idx + 1 }}</h3>
                <UBadge v-if="prov.codeSupplier" color="neutral" variant="soft" size="xs">
                  {{ prov.codeSupplier }}
                </UBadge>
              </div>
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
              <UFormField label="CBM IMO" class="w-36">
                <UInput v-model.number="prov.cbmImo" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Peso Total" class="w-36">
                <UInput v-model.number="prov.pesoTotal" type="number" min="0" step="0.01" class="w-full" />
              </UFormField>
              <UFormField label="Qty Cajas" class="w-36">
                <UInput v-model.number="prov.qtyCajas" type="number" min="0" step="1" class="w-full" />
              </UFormField>
              <UFormField label="Productos del proveedor" required class="flex-1 min-w-[220px]">
                <UInput v-model="prov.productos" placeholder="Productos del proveedor" class="w-full" />
              </UFormField>
            </div>
            <p v-if="!cbmImoValido(prov)" class="text-xs text-red-500 mt-2">
              El CBM IMO no puede ser mayor al CBM total
            </p>
            <p v-else-if="Number(prov.cbmImo) > 0" class="text-xs text-gray-500 mt-2">
              Se guardará CBM normal {{ cbmNormalProveedor(prov).toFixed(2) }} y CBM IMO {{ Number(prov.cbmImo || 0).toFixed(2) }}
            </p>

            <div class="mt-4 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium">Costos</p>
                <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-plus" @click="prov.costos.push(crearCosto())">
                  Agregar costo
                </UButton>
              </div>
              <div v-for="(costo, cIdx) in prov.costos" :key="costo.id" class="flex flex-wrap gap-2 items-end">
                <UFormField label="Concepto" class="flex-1 min-w-[180px]">
                  <UInput v-model="costo.concepto" placeholder="Mercadería, flete, impuestos…" class="w-full" />
                </UFormField>
                <UFormField label="Valor" class="w-36">
                  <UInput v-model.number="costo.valor" type="number" min="0" step="0.01" class="w-full" />
                </UFormField>
                <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash" @click="prov.costos.splice(cIdx, 1)" />
              </div>
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
              <UInput :model-value="qtyProveedores" type="number" min="1" max="8" class="w-full" @update:model-value="onQtyProveedoresChange" />
            </UFormField>

            <UFormField label="Descuento (opcional)">
              <UInput v-model.number="descuento" type="number" min="0" step="0.01" class="w-full">
                <template #leading>
                  <span class="text-gray-400">$</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Selecciona el vendedor" required>
              <div class="flex gap-2 items-start">
                <USelect v-model="selectedVendedor" :items="vendedoresOptions" placeholder="Seleccionar" class="w-full" />
                <UButton
                  v-if="puedeCrearVendedor"
                  icon="i-heroicons-plus"
                  color="neutral"
                  variant="outline"
                  size="md"
                  title="Crear vendedor"
                  @click="abrirCrearVendedor"
                />
              </div>
            </UFormField>

            <UFormField
              :label="esEdicion ? 'Selecciona el consolidado' : 'Selecciona el consolidado'"
              :required="!esEdicion"
              :hint="esEdicion ? 'Sin consolidado no puedes confirmar la cotización.' : undefined"
            >
              <USelect
                v-model="selectedContenedor"
                :items="contenedoresOptions"
                :disabled="!!contenedorDesdeQuery && !esEdicion"
                placeholder="Seleccionar"
                class="w-full"
              />
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
          :label="esEdicion ? 'Guardar cambios' : 'Finalizar'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import type {
  CotizacionResumenArchivo,
  CotizacionResumenClienteOption,
  CotizacionResumenCosto
} from '~/types/cargaconsolidada/cotizacion-resumen'
import { useCotizacionResumen } from '~/composables/cargaconsolidada/cotizacion-resumen'
import { useModal } from '@/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import { esOrganizacionSocio } from '~/constants/roles'
import CrearVendedorModal from '~/components/cargaconsolidada/cotizaciones/CrearVendedorModal/index.vue'

definePageMeta({
  middleware: 'auth'
})

const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()
const { getUserData } = useUserRole()
const overlay = useOverlay()
const route = useRoute()
const {
  extraerDocumento,
  crearCotizacion,
  getCotizacion,
  actualizarCotizacion,
  loadVendedores,
  loadContenedores,
  searchClientes,
  vendedoresOptions,
  contenedoresOptions,
  clientesOptions,
  buscandoClientes
} = useCotizacionResumen()

const editId = computed(() => {
  const raw = route.query.editar
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) && n > 0 ? n : null
})
const esEdicion = computed(() => !!editId.value)
const loadingEdit = ref(false)

// Organización 1 (Probusiness) ve/gestiona vendedores desde el Panel de Acceso;
// el botón de alta rápida es solo para el resto de organizaciones ("Socios").
// El backend igual fuerza la organización del usuario al crear, esto es solo
// para no mostrar el botón donde no aplica.
const puedeCrearVendedor = computed(() => {
  const orgId = getUserData()?.raw?.organizacion?.id
  return esOrganizacionSocio(orgId)
})
const contenedorDesdeQuery = computed(() => {
  const raw = route.query.contenedor
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) && n > 0 ? n : null
})

function abrirCrearVendedor() {
  const modal = overlay.create(CrearVendedorModal)
  modal.open({
    show: true,
    onCreated: () => {
      loadVendedores()
    }
  })
}

const totalSteps = 3
const currentStep = ref(1)
const maxStepReached = ref(1)

function getStepLabel(step: number) {
  return ({ 1: 'Datos', 2: 'Carga', 3: 'Terminar' } as Record<number, string>)[step] ?? String(step)
}

function canGoToStep(step: number) {
  if (step === 1) return true
  if (esEdicion.value && scanState.value === 'done') return step <= Math.max(maxStepReached.value, 3)
  return scanState.value === 'done' && step <= maxStepReached.value
}

function handleStepClick(step: number) {
  if (!canGoToStep(step)) return
  currentStep.value = step
}

// ─── Paso 1: documento + IA ────────────────────────────────────────────────
const READS_CHIPS = ['Datos del cliente', 'RUC / ID', 'Proveedores', 'CBM y peso', 'Productos', 'Conceptos de costo']

type ScanState = 'idle' | 'scanning' | 'done'
const scanState = ref<ScanState>('idle')
const archivo = ref<File | null>(null)
const archivoStaged = ref<CotizacionResumenArchivo | null>(null)

type ClienteKey = 'nombre' | 'documento' | 'whatsapp' | 'correo'
const CLIENTE_FIELDS: {
  key: ClienteKey
  label: (tipo: 'ID' | 'RUC') => string
  required: boolean
  placeholder: string
}[] = [
  { key: 'nombre', label: () => 'Nombre completo', required: true, placeholder: '' },
  { key: 'documento', label: (tipo) => (tipo === 'RUC' ? 'RUC' : 'ID'), required: false, placeholder: '' },
  { key: 'whatsapp', label: () => 'WhatsApp', required: true, placeholder: '' },
  { key: 'correo', label: () => 'Correo', required: false, placeholder: '' }
]

const clienteInfo = reactive<{ tipoDocumento: 'ID' | 'RUC' } & Record<ClienteKey, string>>({
  tipoDocumento: 'ID',
  nombre: '',
  documento: '',
  whatsapp: '',
  correo: ''
})
const clienteBdId = ref<number | null>(null)
const whatsappMenu = ref<any>('')
let whatsappSearchTimer: ReturnType<typeof setTimeout> | null = null

function telefonoDeOpcion(item: string | CotizacionResumenClienteOption | null | undefined) {
  if (!item) return ''
  if (typeof item === 'string') return item.trim()
  return String(item.telefono || item.value || item.label || '').trim()
}

function aplicarClienteExistente(cliente: CotizacionResumenClienteOption) {
  clienteBdId.value = cliente.id
  clienteInfo.whatsapp = telefonoDeOpcion(cliente)
  if (cliente.nombre) clienteInfo.nombre = cliente.nombre
  if (cliente.documento) {
    clienteInfo.documento = cliente.documento
    clienteInfo.tipoDocumento = cliente.documento.replace(/\D/g, '').length >= 11 ? 'RUC' : 'ID'
  }
  if (cliente.correo) clienteInfo.correo = cliente.correo
  onClienteCampoEditado('whatsapp')
  onClienteCampoEditado('nombre')
  onClienteCampoEditado('documento')
  onClienteCampoEditado('correo')
}

function onWhatsappSearch(term: string) {
  clienteInfo.whatsapp = term
  if (whatsappSearchTimer) clearTimeout(whatsappSearchTimer)
  whatsappSearchTimer = setTimeout(() => {
    searchClientes(term)
  }, 250)
}

function onWhatsappMenuChange(value: string | CotizacionResumenClienteOption | null) {
  if (!value) {
    clienteInfo.whatsapp = ''
    clienteBdId.value = null
    return
  }
  if (typeof value === 'string') {
    clienteInfo.whatsapp = value.trim()
    clienteBdId.value = null
    onClienteCampoEditado('whatsapp')
    return
  }
  aplicarClienteExistente(value)
}

function onWhatsappCreate(item: string) {
  const numero = (item || '').trim()
  clienteInfo.whatsapp = numero
  clienteBdId.value = null
  whatsappMenu.value = numero
  onClienteCampoEditado('whatsapp')
}

function sincronizarWhatsappMenu(telefono: string, idCliente?: number | null) {
  const tel = (telefono || '').trim()
  clienteInfo.whatsapp = tel
  clienteBdId.value = idCliente && idCliente > 0 ? idCliente : null
  const match = clientesOptions.value.find((c) => c.id === clienteBdId.value || telefonoDeOpcion(c) === tel)
  whatsappMenu.value = match || tel
}

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

async function procesarArchivo(file: File) {
  scanState.value = 'scanning'
  try {
    const res = await extraerDocumento(file)
    if (!res.success) {
      showError('No se pudo procesar el archivo', res.message || 'Intenta nuevamente o completa los datos a mano.')
      scanState.value = 'idle'
      archivo.value = null
      return
    }

    archivoStaged.value = res.archivo

    const cliente = res.data?.cliente
    if (cliente) {
      clienteInfo.nombre = cliente.nombre ?? ''
      clienteInfo.tipoDocumento = cliente.tipo_documento === 'RUC' ? 'RUC' : 'ID'
      clienteInfo.documento = cliente.documento ?? ''
      clienteInfo.whatsapp = cliente.whatsapp ?? ''
      clienteInfo.correo = cliente.correo ?? ''
      sincronizarWhatsappMenu(clienteInfo.whatsapp)
      if (clienteInfo.whatsapp) searchClientes(clienteInfo.whatsapp)
      camposEscaneados.value = {
        nombre: cliente.nombre != null,
        documento: cliente.documento != null,
        whatsapp: cliente.whatsapp != null,
        correo: cliente.correo != null
      }
    } else {
      camposEscaneados.value = {}
    }

    const proveedoresExtraidos = res.data?.proveedores ?? []
    if (proveedoresExtraidos.length > 0) {
      const previos = esEdicion.value ? [...providers.value] : []
      providers.value = proveedoresExtraidos.map((p, idx) => ({
        id: nextProviderId++,
        idProveedor: previos[idx]?.idProveedor,
        codeSupplier: previos[idx]?.codeSupplier ?? null,
        cbmTotal: p.cbm_total ?? 0,
        cbmImo: previos[idx]?.cbmImo ?? 0,
        pesoTotal: p.peso_total ?? 0,
        qtyCajas: p.qty_cajas ?? 0,
        productos: p.productos ?? '',
        unidades: p.unidades ?? p.qty_cajas ?? 0,
        incoterm: p.incoterm || 'Consolidado',
        costos: mapCostosExtraidos(p.costos)
      }))
    }

    if (!res.extracted_by_ai) {
      showError('No se pudo leer el documento automáticamente', res.message || 'Completa los datos a mano.')
    }

    scanState.value = 'done'
    maxStepReached.value = Math.max(maxStepReached.value, 1)
  } catch (error: any) {
    showError('Error al subir el archivo', error?.message || 'Intenta nuevamente.')
    scanState.value = 'idle'
    archivo.value = null
  }
}

function reiniciarArchivo() {
  archivo.value = null
  archivoStaged.value = null
  scanState.value = 'idle'
  if (!esEdicion.value) {
    clienteInfo.nombre = ''
    clienteInfo.documento = ''
    clienteInfo.whatsapp = ''
    clienteInfo.correo = ''
    clienteInfo.tipoDocumento = 'ID'
    clienteBdId.value = null
    whatsappMenu.value = ''
    camposEscaneados.value = {}
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Paso 2: proveedores ────────────────────────────────────────────────────
interface CostoResumen {
  id: number
  concepto: string
  valor: number
}

interface ProveedorResumen {
  id: number
  idProveedor?: number
  codeSupplier?: string | null
  cbmTotal: number
  cbmImo: number
  pesoTotal: number
  qtyCajas: number
  productos: string
  unidades: number
  incoterm: string
  costos: CostoResumen[]
}

let nextProviderId = 1
let nextCostoId = 1

function crearCosto(concepto = '', valor = 0): CostoResumen {
  return { id: nextCostoId++, concepto, valor }
}

function crearProveedor(): ProveedorResumen {
  return {
    id: nextProviderId++,
    cbmTotal: 0,
    cbmImo: 0,
    pesoTotal: 0,
    qtyCajas: 0,
    productos: '',
    unidades: 0,
    incoterm: '',
    costos: []
  }
}

function mapCostosExtraidos(extraidos?: CotizacionResumenCosto[] | null): CostoResumen[] {
  return (extraidos || [])
    .filter((c) => (c.concepto || '').trim() !== '')
    .map((c) => crearCosto(c.concepto.trim(), Number(c.valor) || 0))
}

const qtyProveedores = computed(() => providers.value.length)

function onQtyProveedoresChange(value: string | number) {
  const target = Math.min(8, Math.max(1, Number(value) || 1))
  while (providers.value.length < target) addProvider()
  while (providers.value.length > target) providers.value.pop()
}

function cbmNormalProveedor(prov: ProveedorResumen) {
  const total = Number(prov.cbmTotal) || 0
  const imo = Number(prov.cbmImo) || 0
  return Math.max(0, total - imo)
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

function cbmImoValido(prov: ProveedorResumen) {
  const total = Number(prov.cbmTotal) || 0
  const imo = Number(prov.cbmImo) || 0
  return imo >= 0 && imo <= total + 0.0001
}

// ─── Paso 3: terminar ───────────────────────────────────────────────────────
const descuento = ref(0)
const selectedVendedor = ref<number | null>(null)
const selectedContenedor = ref<number | null>(null)
const whatsappPlaceholder = computed(() => {
  const opt = contenedoresOptions.value.find((o) => o.value === selectedContenedor.value)
  const code = opt && 'phone_code' in opt ? String((opt as { phone_code?: string }).phone_code || '') : ''
  return code ? `${code} …` : 'Número de WhatsApp'
})

onMounted(async () => {
  await Promise.all([loadVendedores(), loadContenedores(), searchClientes('')])
  if (contenedorDesdeQuery.value && !esEdicion.value) {
    selectedContenedor.value = contenedorDesdeQuery.value
  }
  if (editId.value) {
    await cargarEdicion(editId.value)
  }
})

async function cargarEdicion(id: number) {
  loadingEdit.value = true
  try {
    const res = await getCotizacion(id)
    if (!res.success || !res.data) {
      showError('No se pudo cargar', res.message || 'Intenta nuevamente.')
      await navigateTo('/cotizaciones/resumen')
      return
    }
    if (res.data.estado !== 'COTIZADO') {
      showError('No se puede editar', 'Solo se puede editar una cotización en estado COTIZADO.')
      await navigateTo('/cotizaciones/resumen')
      return
    }
    const d = res.data
    clienteInfo.nombre = d.cliente.nombre || ''
    clienteInfo.tipoDocumento = d.cliente.tipo_documento === 'RUC' ? 'RUC' : 'ID'
    clienteInfo.documento = d.cliente.documento || ''
    clienteInfo.whatsapp = d.cliente.whatsapp || ''
    clienteInfo.correo = d.cliente.correo || ''
    await searchClientes(clienteInfo.whatsapp)
    sincronizarWhatsappMenu(clienteInfo.whatsapp, d.cliente.id)
    descuento.value = d.descuento || 0
    selectedVendedor.value = d.id_usuario
    selectedContenedor.value = d.id_contenedor
    if (d.archivo) {
      archivoStaged.value = {
        path: d.archivo.path,
        nombre_original: d.archivo.nombre_original || '',
        mime_type: '',
        size: 0
      }
    }
    providers.value = (d.proveedores.length ? d.proveedores : []).map((p) => ({
      id: nextProviderId++,
      idProveedor: p.id,
      codeSupplier: p.code_supplier,
      cbmTotal: Number(p.cbm_total) || 0,
      cbmImo: Number(p.cbm_imo) || 0,
      pesoTotal: Number(p.peso_total) || 0,
      qtyCajas: Number(p.qty_cajas) || 0,
      productos: p.productos || '',
      unidades: Number(p.unidades) || 0,
      incoterm: p.incoterm || '',
      costos: mapCostosExtraidos(p.costos)
    }))
    if (providers.value.length === 0) providers.value = [crearProveedor()]
    scanState.value = 'done'
    maxStepReached.value = 3
  } catch (e: any) {
    showError('Error al cargar la cotización', e?.message || 'Intenta nuevamente.')
    await navigateTo('/cotizaciones/resumen')
  } finally {
    loadingEdit.value = false
  }
}

// ─── Navegación / validación por paso ──────────────────────────────────────
const canGoNext = computed(() => {
  if (currentStep.value === 1) {
    const whatsapp = telefonoDeOpcion(whatsappMenu.value) || clienteInfo.whatsapp
    return scanState.value === 'done' && !!clienteInfo.nombre.trim() && !!whatsapp.trim()
  }
  if (currentStep.value === 2) {
    return providers.value.every((p) => p.cbmTotal > 0 && p.productos.trim() !== '' && cbmImoValido(p))
  }
  return true
})

const canFinalizar = computed(() => {
  if (!selectedVendedor.value || !canGoNext.value) return false
  if (!esEdicion.value && !selectedContenedor.value) return false
  return true
})

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

function payloadWizard() {
  return {
    id_contenedor: selectedContenedor.value || null,
    id_usuario: selectedVendedor.value!,
    cliente: {
      id: clienteBdId.value || undefined,
      nombre: clienteInfo.nombre.trim(),
      tipo_documento: clienteInfo.tipoDocumento,
      documento: clienteInfo.documento || undefined,
      whatsapp: telefonoDeOpcion(whatsappMenu.value) || clienteInfo.whatsapp || undefined,
      correo: clienteInfo.correo || undefined
    },
    proveedores: providers.value.map((p) => ({
      ...(p.idProveedor ? { id: p.idProveedor } : {}),
      cbm_total: p.cbmTotal,
      cbm_imo: Number(p.cbmImo) || 0,
      peso_total: p.pesoTotal || undefined,
      qty_cajas: p.qtyCajas || undefined,
      productos: p.productos.trim(),
      unidades: p.unidades || undefined,
      incoterm: p.incoterm || undefined,
      costos: p.costos
        .filter((c) => c.concepto.trim() !== '' && Number(c.valor) > 0)
        .map((c) => ({ concepto: c.concepto.trim(), valor: Number(c.valor) }))
    })),
    descuento: descuento.value || undefined,
    archivo: archivoStaged.value
  }
}

async function finalizar() {
  if (!canFinalizar.value || !selectedVendedor.value) return
  if (!esEdicion.value && !selectedContenedor.value) return
  if (providers.value.some((p) => !cbmImoValido(p))) {
    showError('CBM IMO inválido', 'El CBM IMO no puede ser mayor al CBM total del proveedor.')
    return
  }
  saving.value = true
  try {
    const payload = payloadWizard()
    const res = await withSpinner(
      () => esEdicion.value && editId.value
        ? actualizarCotizacion(editId.value, payload)
        : crearCotizacion({ ...payload, id_contenedor: selectedContenedor.value! }),
      esEdicion.value ? 'Guardando cambios…' : 'Registrando cotización…'
    )

    if (res.success) {
      showSuccess(
        esEdicion.value ? 'Cotización actualizada' : 'Cotización registrada',
        esEdicion.value ? 'Los cambios se guardaron. Los códigos de proveedor se mantienen.' : 'La cotización se registró correctamente.'
      )
      const contenedorId = contenedorDesdeQuery.value || selectedContenedor.value
      if (contenedorId) {
        await navigateTo(`/cargaconsolidada/abiertos/cotizaciones/${contenedorId}?tab=prospectos`)
      } else {
        await navigateTo('/cotizaciones/resumen')
      }
    } else {
      showError(
        esEdicion.value ? 'No se pudo guardar' : 'No se pudo registrar la cotización',
        res.message || 'Intenta nuevamente.'
      )
    }
  } catch (error: any) {
    showError(
      esEdicion.value ? 'Error al guardar' : 'Error al registrar la cotización',
      error?.message || 'Intenta nuevamente.'
    )
  } finally {
    saving.value = false
  }
}
</script>
