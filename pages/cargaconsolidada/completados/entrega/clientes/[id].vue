<template>
  <div class="p-6">
    <PageHeader
      :title="`Consolidado #${carga || ''} | ${clienteNombre}`"
      :subtitle="clienteNombre || ''"
      icon=""
      :hide-back-button="false"
      @back="router.back()"
    >
      <template #actions>
        <div class="flex gap-2">
          <UButton
            v-if="!editable"
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-heroicons-pencil-square"
            @click="toggleEdit"
          >Editar</UButton>
          <template v-else>
            <UButton
              size="xs"
              color="primary"
              icon="i-heroicons-device-floppy"
              :disabled="!canSave"
              @click="handleSave"
            >Guardar</UButton>
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              icon="i-heroicons-x-mark"
              @click="toggleEdit"
            >Cancelar</UButton>
          </template>
        </div>
      </template>
    </PageHeader>
    <div class="border-t mt-2 pt-4" />

    <div class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 space-y-6">
        <!-- Información de entrega -->
        <section>
          <h3 class="font-semibold mb-2 text-sm uppercase tracking-wide">Información de entrega:</h3>

          <!-- Cabecera: T. Cliente (derivado de type_form) + métricas -->
          <div class="grid grid-cols-12 gap-3 text-xs mb-4">
            <div class="col-span-12 sm:col-span-3">
              <label class="px-2 inline text-[11px] font-medium text-gray-500">T. Cliente:</label>
                <UBadge :label="tipoClienteLabel" :color="isLima ? 'primary' : 'warning'" variant="soft" />
            </div>
            <div class="col-span-6 sm:col-span-3">
              <label class="px-2 inline text-[11px] font-medium text-gray-500">Bultos:</label>
              <UInput v-model="form.qty_box_china" size="xs" :disabled="!editable" />
            </div>
            <div class="col-span-6 sm:col-span-3">
              <label class="px-2 inline text-[11px] font-medium text-gray-500">Peso:</label>
              <UInput v-model="form.cbm_total_china" size="xs" :disabled="!editable" />
            </div>
            <div class="col-span-6 sm:col-span-3">
              <label class="px-2 inline text-[11px] font-medium text-gray-500">{{ isLima ? 'Dni / Id:' : 'Dni / Ruc:' }}</label>
              <UInput v-model="form.documento" size="xs" :disabled="!editable" />
            </div>
            <div v-if="isLima" class="col-span-6 sm:col-span-3">
              <label class="px-2 inline text-[11px] font-medium text-gray-500">Licencia:</label>
              <UInput v-model="form.licencia" size="xs" :disabled="!editable" />
            </div>
          </div>

          <!-- Vista para Lima (Chofer) -->
          <div v-if="isLima" class="mt-2 grid grid-cols-12 gap-3 text-xs">
            <div class="col-span-12 md:col-span-6 lg:col-span-4">
              <label class="inline text-[11px] font-medium text-gray-500">Nombre completo del Chofer:</label>
              <UInput v-model="form.nombre_chofer" size="xs" :disabled="!editable" />
            </div>
            <div class="col-span-12 md:col-span-6 lg:col-span-4">
              <label class="inline text-[11px] font-medium text-gray-500">Dirección final de destino:</label>
              <UInput v-model="form.direccion_final" size="xs" :disabled="!editable" />
            </div>
            <div class="col-span-12 md:col-span-6 lg:col-span-4">
              <label class="inline text-[11px] font-medium text-gray-500">Distrito:</label>
              <UInput v-model="form.distrito" size="xs" :disabled="!editable" />
            </div>
          </div>

          <!-- Vista para clientes fuera de Lima (Agencia y Ubicación) -->
          <div v-else class="mt-2 space-y-3 text-xs">
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-12 md:col-span-6 lg:col-span-6">
                <label class="inline text-[11px] font-medium text-gray-500">Nombre:</label>
                <UInput v-model="form.r_name" size="xs" :disabled="!editable" />
              </div>
              <div class="col-span-6 md:col-span-3 lg:col-span-3">
                <label class="inline text-[11px] font-medium text-gray-500">Celular:</label>
                <UInput v-model="form.r_phone" size="xs" :disabled="!editable" />
              </div>
              <div class="col-span-6 md:col-span-3 lg:col-span-3">
                <label class="inline text-[11px] font-medium text-gray-500">Departamento:</label>
                <UInput v-model="form.departamento" size="xs" :disabled="!editable" />
              </div>
              <div class="col-span-6 md:col-span-3 lg:col-span-3">
                <label class="inline text-[11px] font-medium text-gray-500">Provincia:</label>
                <UInput v-model="form.province_name" size="xs" :disabled="!editable" />
              </div>
              <div class="col-span-6 md:col-span-3 lg:col-span-3">
                <label class="inline text-[11px] font-medium text-gray-500">Distrito:</label>
                <UInput v-model="form.district_name" size="xs" :disabled="!editable" />
              </div>
              <div class="col-span-12 md:col-span-6 lg:col-span-6">
                <label class="inline text-[11px] font-medium text-gray-500">Agencia:</label>
                <UInput v-model="form.agency_name" size="xs" :disabled="!editable" />
              </div>
              <div class="col-span-12 md:col-span-6 lg:col-span-6">
                <label class="inline text-[11px] font-medium text-gray-500">Manifiesto:</label>
                <UInput v-model="form.manifiesto" size="xs" :disabled="!editable" />
              </div>
            </div>
          </div>
        </section>

        <!-- Información de comprobante -->
        <section class="pt-2">
          <h3 class="font-semibold mb-2 text-sm">Información de comprobante:</h3>
          <div class="grid grid-cols-12 gap-3 text-xs">
            <div class="col-span-6 sm:col-span-3">
              <label class="inline text-[11px] font-medium text-gray-500">Dni / Ruc:</label>
              <UInput v-model="form.comp_documento" size="xs" :disabled="!editable" />
            </div>
            <div class="col-span-12 sm:col-span-6">
              <label class="inline text-[11px] font-medium text-gray-500">Nombre:</label>
              <UInput v-model="form.comp_nombre" size="xs" :disabled="!editable" />
            </div>
          </div>
        </section>

        <!-- Fotos de conformidad -->
        <section class="pt-4">
          <h3 class="font-semibold mb-2 text-sm">Foto de conformidad de entrega:</h3>
          <!-- Uploader para subir fotos (usa el componente común) -->
          <div class="mb-3">
            <FileUploader
              ref="uploaderRef"
              :multiple="true"
              :acceptedTypes="['.jpg', '.jpeg', '.png', '.gif']"
              :disabled="!editable"
              :showSaveButton="false"
              :showRemoveButton="editable"
              :customMessage="'Selecciona o arrastra hasta 2 fotos'"
              @files-selected="onUploaderFilesSelected"
              @files-cleared="onUploaderCleared"
              :initial-files="entregaDetalle?.conformidad?.map((item: any) => ({
                id: item.id,
                file_name: item.file_original_name,
                file_url: item.file_url,
                type: item.file_type,
                size: item.file_size,
                lastModified: 0,
                file_ext: item.file_type
              }))"
              @error="onUploaderError"
              @file-removed="(id: number) => onDeleteConformidad(id)"  
            />
          </div>

          <div class="flex gap-4 flex-wrap items-start">
            <!-- Thumbnails reales -->
            <div
              v-for="(f, i) in evidencia"
              :key="i"
              class="w-28 h-32 border rounded-lg flex items-center justify-center overflow-hidden relative bg-gray-50 cursor-pointer"
              @click="onClickThumbnail(i)"
            >
              <img
                v-if="getThumbUrl(i, f.url)"
                :src="getThumbUrl(i, f.url)"
                class="w-full h-full object-cover select-none"
                :alt="`Foto de conformidad ${i + 1}`"
                @dragstart.prevent
              />
              <span v-else class="text-[10px] text-gray-500">Sin imagen</span>
              <!-- Acciones por thumbnail (eliminación inmediata deshabilitada; se gestiona en Guardar) -->
            </div>

            <!-- Inputs ocultos sólo para reemplazar cada foto -->
            <input ref="fileInputReplace1" type="file" accept="image/*" class="hidden" @change="onPickReplace(1, $event)" />
            <input ref="fileInputReplace2" type="file" accept="image/*" class="hidden" @change="onPickReplace(2, $event)" />

            <p class="text-[10px] text-gray-500" v-if="editable">Puedes seleccionar 1 o 2 fotos y reemplazar thumbnails. Los cambios se guardan con el botón Guardar.</p>
          </div>

          <!-- Modal de vista previa -->
          <ImageModal :isOpen="previewOpen" :imageUrl="previewUrl" @close="previewOpen = false" />
        </section>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useEntrega } from '@/composables/cargaconsolidada/entrega/useEntrega'
import { UInput, USelect, UButton, UIcon, UBadge } from '#components'
import PageHeader from '~/components/PageHeader.vue'
import FileUploader from '@/components/commons/FileUploader.vue'
import ImageModal from '~/components/ImageModal.vue'
import { useRouter } from 'vue-router'
const router = useRouter()

// Props/params
const route = useRoute()
const id = Number(route.params.id) // id de cotizacion
// El id del contenedor se derivará desde el detalle (entregaDetalle.id_contenedor)
let contenedorId: number | null = null
const cotizacionId = ref<number | null>(isNaN(id) ? null : id)
// Obtener detalle desde composable (cache si se navegó desde listado)
const { getEntregasDetalle, entregaDetalle, loading, getHeaders, carga, uploadConformidad, updateConformidad, deleteConformidad, saveClienteDetalle } = useEntrega()
// Nombre del cliente (razon_social si existe, sino nombre)
const clienteNombre = computed(() => (entregaDetalle.value as any)?.form_user || entregaDetalle.value?.nombre || '')

// Derivar tipo de cliente desde el detalle: type_form (1 = Lima, 0 = Provincia)
const typeFormValue = computed<number | null>(() => {
  const tf: any = (entregaDetalle.value as any)?.type_form
  if (tf === 1 || tf === '1') return 1
  if (tf === 0 || tf === '0') return 0
  return null
})
const isLima = computed(() => typeFormValue.value === 1)
const tipoClienteLabel = computed(() => (isLima.value ? 'Lima' : 'Provincia'))


// Formulario reactivo
const form = ref<any>({
  tipo_cliente: 'Lima',
  tipo_entrega: 'Lima',
  qty_box_china: '',
  cbm_total_china: '',

  // Lima
  documento: '',
  licencia: '',
  nombre_chofer: '',
  direccion_final: '',
  distrito: '',

  // Provincia
  agency_address_final_delivery: '',
  agency_address_initial_delivery: '',
  departamento: '',
  district_name: '',
  province_name: '',
  agency_ruc: '',
  agency_name: '',
  home_adress_delivery: '',
  r_doc: '',
  r_name: '',
  r_phone: '',
  // Comprobante
  comp_documento: '',
  comp_nombre: ''
})

const initialSnapshot = ref<string>('')
type EvidenceItem = { url: string; key?: 'photo_1_url' | 'photo_2_url' }
const evidencia = ref<EvidenceItem[]>([])
const conformidadId = computed<number | null>(() => (entregaDetalle.value as any)?.conformidad_id ?? null)
const editable = ref<boolean>(false) // En completados iniciamos en modo lectura

const snapshot = () => JSON.stringify(form.value)
const dirty = computed(() => snapshot() !== initialSnapshot.value)

const toggleEdit = () => {
  editable.value = !editable.value
  if (!editable.value) {
    form.value = JSON.parse(initialSnapshot.value)
  }
}

const handleSave = async () => {
  if (!cotizacionId.value) return
  // 1) Guardar formulario de cliente conforme contrato backend
  const typeFormLocal = isLima.value ? 1 : 0
  const payloadForm: any = { type_form: typeFormLocal }
  const addIf = (key: string, val: any) => {
    if (val !== undefined && val !== null && String(val) !== '') payloadForm[key] = val
  }
  if (isLima.value) {
    // Lima
    addIf('voucher_doc', form.value.comp_documento)
    addIf('voucher_name', form.value.comp_nombre)
    addIf('voucher_email', form.value.comp_email)
    addIf('drver_name', form.value.nombre_chofer)
    addIf('driver_doc', form.value.documento)
    addIf('driver_license', form.value.licencia)
    addIf('final_destination_place', form.value.direccion_final)
    addIf('final_destination_district', form.value.distrito)
  } else {
    // Provincia
    addIf('import_name', form.value.nombre)
    addIf('r_doc', form.value.r_doc)
    addIf('r_name', form.value.r_name)
    addIf('r_phone', form.value.r_phone)
    addIf('agency_ruc', form.value.agency_ruc)
    addIf('agency_name', form.value.agency_name)
    addIf('agency_address_initial_delivery', form.value.agency_address_initial_delivery)
    addIf('agency_address_final_delivery', form.value.agency_address_final_delivery)
    addIf('voucher_doc', form.value.comp_documento)
    addIf('voucher_name', form.value.comp_nombre)
    addIf('voucher_email', form.value.comp_email)
  }
  await saveClienteDetalle(cotizacionId.value, payloadForm)

  // 2) Guardar fotos (create/update si hay picks nuevos)
  const id_contenedor = contenedorId as number
  const id_cotizacion = cotizacionId.value as number
  const typeFormForPhotos = isLima.value ? 1 : 0
  try {
    if (picked1.value || picked2.value) {
      await uploadConformidad({ id_contenedor: id_contenedor as number, id_cotizacion: id_cotizacion as number, type_form: typeFormForPhotos as 0 | 1, photo_1: picked1.value || undefined, photo_2: picked2.value || undefined })

      picked1.value = null
      picked2.value = null
      if (uploaderRef.value?.clearSelectedFiles) uploaderRef.value.clearSelectedFiles()
    }
  } catch (err) {
    console.error('Error al guardar fotos de conformidad', err)
  }

  // Refrescar y cerrar edición
  await refreshEvidencia()
  await getEntregasDetalle(cotizacionId.value)
  initialSnapshot.value = snapshot()
  editable.value = false
}

// Preview modal state
const previewOpen = ref(false)
const previewUrl = ref('')
const openPreview = (url: string) => {
  if (!url) return
  previewUrl.value = url
  previewOpen.value = true
}

const fileInputReplace1 = ref<HTMLInputElement | null>(null)
const fileInputReplace2 = ref<HTMLInputElement | null>(null)
const picked1 = ref<File | null>(null)
const picked2 = ref<File | null>(null)
const uploaderRef = ref<any>(null)
const canSubmitConformidad = computed(() => !!(picked1.value || picked2.value))
const canSave = computed(() => dirty.value || !!(picked1.value || picked2.value))

// Handlers para FileUploader
const onUploaderFilesSelected = (files: File[]) => {
  if (!editable.value) return
  // Limitar a 2 archivos en memoria para crear/actualizar
  const selected = files.slice(0, 2)
  picked1.value = selected[0] || null
  picked2.value = selected[1] || null
  // Si el usuario seleccionó más de 2, recortar visualmente en el uploader
  if (files.length > 2 && uploaderRef.value?.clearSelectedFiles && uploaderRef.value?.addFiles) {
    uploaderRef.value.clearSelectedFiles()
    uploaderRef.value.addFiles(selected)
  }
}
const onUploaderCleared = () => {
  console.log('onUploaderCleared')
  picked1.value = null
  picked2.value = null
}
const onUploaderError = (message: string) => {
  console.error('[FileUploader] error:', message)
}

const onClickThumbnail = (i: number) => {
  if (!editable.value) {
    // vista previa cuando no se edita
    const url = evidencia.value[i]?.url
    if (url) openPreview(url)
    return
  }
  // Reemplazar específica (1 o 2)
  if (i === 0) fileInputReplace1.value?.click()
  else if (i === 1) fileInputReplace2.value?.click()
}
const onPickReplace = async (which: 1 | 2, e: Event) => {
  if (!editable.value) return
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  // Si ya existe conformidad, actualizar de inmediato
  if (conformidadId.value) {
    const payload = which === 1 ? { photo_1: file } : { photo_2: file }
    await updateConformidad(conformidadId.value, payload)
    await refreshEvidencia()
  } else {
    // Aún no existe: preparar para subir
    if (which === 1) picked1.value = file
    else picked2.value = file
  }
}
const submitConformidad = async () => {
  if (!editable.value) return
  const id_contenedor = contenedorId as number
  const id_cotizacion = cotizacionId.value as number
  const type_form = isLima.value ? 1 : 0
  try {
    if (conformidadId.value) {
      // actualizar: permite una o ambas; si no hay picks, no hacer nada
      if (!picked1.value && !picked2.value) return
      await updateConformidad(conformidadId.value, { photo_1: picked1.value || undefined, photo_2: picked2.value || undefined })
    } else {
      // subir nueva: permite 1 o 2 fotos
      if (!picked1.value && !picked2.value) return
      await uploadConformidad({ id_contenedor: id_contenedor as number, id_cotizacion: id_cotizacion as number, type_form: type_form as 0 | 1, photo_1: picked1.value || undefined, photo_2: picked2.value || undefined })
    }
    // limpiar picks y refrescar UI
    picked1.value = null
    picked2.value = null
    // limpiar selección visual del uploader
    if (uploaderRef.value?.clearSelectedFiles) uploaderRef.value.clearSelectedFiles()
    await refreshEvidencia()
  } catch (err) {
    console.error('Error al enviar conformidad', err)
  }
}
const onDeleteConformidad = async (id: number) => {
  //get type form
  const typeForm = isLima.value ? 1 : 0
  if (!editable.value || !id) return
  try {
    await deleteConformidad(id, typeForm)
    picked1.value = null
    picked2.value = null
    await refreshEvidencia()
  } catch (err) {
    console.error('Error al borrar conformidad', err)
  }
}

// Helpers de UI para evidencia
const getThumbUrl = (index: number, serverUrl?: string) => {
  if (index === 0 && picked1.value) return URL.createObjectURL(picked1.value)
  if (index === 1 && picked2.value) return URL.createObjectURL(picked2.value)
  return serverUrl || ''
}
const refreshEvidencia = async () => {
  if (!cotizacionId.value) return
  await getEntregasDetalle(cotizacionId.value)
  evidencia.value = []
  const d: any = entregaDetalle.value
  if (d?.photo_1_url) evidencia.value.push({ url: d.photo_1_url, key: 'photo_1_url' })
  if (d?.photo_2_url) evidencia.value.push({ url: d.photo_2_url, key: 'photo_2_url' })
}

onMounted(async () => {
  // Cargar detalle si no está cacheado o corresponde a otro id
  if (!entregaDetalle.value || entregaDetalle.value.id_cotizacion !== cotizacionId.value) {
    await getEntregasDetalle(cotizacionId.value as number)
  }
  // Derivar contenedor desde el detalle si existe
  if (entregaDetalle.value?.id_contenedor) {
    contenedorId = entregaDetalle.value.id_contenedor as any
  }
  // Obtener headers/carga sólo si aún no está y tenemos id_contenedor
  if (contenedorId && !carga.value) {
    await getHeaders(contenedorId)
  }
  if (entregaDetalle.value) {
    // Inicializar formulario con datos del detalle
    const d: any = entregaDetalle.value
    form.value.qty_box_china = d.qty_box_china || ''
    form.value.cbm_total_china = d.cbm_total_china || ''
    form.value.nombre = d.import_name || ''
    form.value.documento = d.documento || ''

    // Lima
    form.value.nombre_chofer = d.nombre_chofer || ''
    form.value.distrito = d.distrito || ''
    form.value.licencia = d.licencia || ''
    form.value.direccion_final = d.direccion_final || ''

    // Provincia
    form.value.agency_address_final_delivery = d.agency_address_final_delivery || ''
    form.value.agency_address_initial_delivery = d.agency_address_initial_delivery || ''
    form.value.departamento = d.department_name || d.departamento || ''
    form.value.province_name = d.province_name || d.provincia || ''
    form.value.district_name = d.district_name || ''
    form.value.agency_name = d.agency_name || ''
    form.value.agency_ruc = d.agency_ruc || ''
    form.value.home_adress_delivery = d.home_adress_delivery || ''
    form.value.r_name = d.r_name || ''
    form.value.r_phone = d.r_phone || ''
    
    // Comprobante
    form.value.comp_documento = d.comp_documento || d.documento || ''
    form.value.comp_nombre = d.comp_nombre || d.nombre || ''
    form.value.comp_email = d.comp_email || ''

    // T. Cliente derivado
    form.value.tipo_cliente = isLima.value ? 'Lima' : 'Provincia'
    form.value.tipo_entrega = d.tipo_entrega || form.value.tipo_entrega

    // Conformidad: inicializar evidencia real a partir de URLs disponibles
    form.value.photo_1_url = d.photo_1_url || ''
    form.value.photo_2_url = d.photo_2_url || ''
    evidencia.value = []
    if (form.value.photo_1_url) evidencia.value.push({ url: form.value.photo_1_url, key: 'photo_1_url' })
    if (form.value.photo_2_url) evidencia.value.push({ url: form.value.photo_2_url, key: 'photo_2_url' })
  }
  initialSnapshot.value = snapshot()
  
})
</script>
