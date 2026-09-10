<script setup lang="ts">
import {
  calcItemTotal,
  formatMoneyWhileTyping,
  formatUsd,
  parseMoneyDraft,
  roundMoney,
  type IntranetItemFormState
} from '~/utils/cargaconsolidada/excelConfirmacion'
import {
  getCaracteristicaFieldConfig,
  getRequiredCaracteristicaValues,
  selectOptions,
  visibleCaracteristicaLabels
} from '~/utils/cargaconsolidada/caracteristicaFields'
import { fetchImageBlobCors } from '~/utils/cargaconsolidada/fotoCors'
import ImageModal from '~/components/ImageModal.vue'

const props = defineProps<{
  item: IntranetItemFormState
  labels: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:item': [IntranetItemFormState]
}>()

const toast = useToast()

const localItem = computed({
  get: () => props.item,
  set: (value) => emit('update:item', value)
})

const total = computed(() => calcItemTotal(localItem.value))
const formattedTotal = computed(() => formatUsd(total.value))

const isOptionalLabel = (label: string) => {
  const key = label.replace(/:$/g, '').trim().toLowerCase()
  return key === 'marca' || key === 'modelo'
}

const visibleLabels = computed(() => visibleCaracteristicaLabels(props.labels))

const caracteristicasRequiredValues = computed(() =>
  getRequiredCaracteristicaValues(
    props.labels,
    localItem.value.caracteristicas,
    isOptionalLabel
  )
)

const caracteristicasCompletas = computed(() => {
  const required = caracteristicasRequiredValues.value
  return (
    required.length === 0 ||
    required.every((value) => value !== null && value !== undefined && String(value).trim() !== '')
  )
})

const updateField = <K extends keyof IntranetItemFormState>(key: K, value: IntranetItemFormState[K]) => {
  if (props.readonly) return
  localItem.value = { ...localItem.value, [key]: value }
}

const updateCaracteristica = (label: string, value: string) => {
  if (props.readonly) return
  localItem.value = {
    ...localItem.value,
    caracteristicas: { ...localItem.value.caracteristicas, [label]: value }
  }
}

const hasFoto = computed(() => String(localItem.value.foto_url || '').trim() !== '')
const caracteristicasOpen = ref(true)
const fotoFile = computed(() => localItem.value.foto_file)
const previewOpen = ref(false)
const copyingFoto = ref(false)

/** No mostrar rutas de storage/CDN en el input de pegar URL (el link del producto es otro campo). */
const fotoUrlPasteDisplay = computed(() => {
  const url = String(localItem.value.foto_url || '').trim()
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return ''
  if (
    url.includes('cdn.probusiness.pe') ||
    url.includes('/excel-confirmacion/fotos/') ||
    url.includes('/files/excel-confirmacion/')
  ) {
    return ''
  }
  return url
})

const revokeIfBlob = (url: string) => {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url)
}

const onFotoChange = (files: File | File[] | null | undefined) => {
  if (props.readonly) return
  const file = Array.isArray(files) ? files[0] : files
  const prevUrl = String(localItem.value.foto_url || '')
  if (!file) {
    revokeIfBlob(prevUrl)
    localItem.value = { ...localItem.value, foto_file: null, foto_url: '' }
    return
  }
  revokeIfBlob(prevUrl)
  localItem.value = {
    ...localItem.value,
    foto_file: file,
    foto_url: URL.createObjectURL(file)
  }
}

const clearFoto = () => {
  if (props.readonly) return
  previewOpen.value = false
  revokeIfBlob(String(localItem.value.foto_url || ''))
  localItem.value = { ...localItem.value, foto_file: null, foto_url: '' }
}

const openFotoPreview = () => {
  if (!hasFoto.value) return
  previewOpen.value = true
}

const blobToPng = async (blob: Blob): Promise<Blob> => {
  if (blob.type === 'image/png') return blob
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el canvas')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('No se pudo convertir a PNG'))),
      'image/png'
    )
  })
}

const copyFoto = async () => {
  const url = String(localItem.value.foto_url || '')
  if (!url || copyingFoto.value) return

  copyingFoto.value = true
  try {
    const source = localItem.value.foto_file ?? (await fetchImageBlobCors(url))
    const png = await blobToPng(source)
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
    toast.add({ title: 'Imagen copiada', color: 'success' })
  } catch (error) {
    console.error('[copyFoto]', error)
    toast.add({
      title: 'No se pudo copiar la imagen',
      description: 'Intenta de nuevo o descarga la foto manualmente',
      color: 'error'
    })
  } finally {
    copyingFoto.value = false
  }
}

const onFotoUrlInput = (value: string) => {
  if (props.readonly) return
  revokeIfBlob(String(localItem.value.foto_url || ''))
  localItem.value = {
    ...localItem.value,
    foto_file: null,
    foto_url: value
  }
}

const precioFocused = ref(false)
const precioDraft = ref('')

const precioDisplay = computed(() => {
  if (precioFocused.value) return precioDraft.value
  const value = localItem.value.precio_unitario
  if (value === null || value === undefined || Number.isNaN(Number(value))) return ''
  return formatUsd(Number(value))
})

const onPrecioFocus = () => {
  if (props.readonly) return
  precioFocused.value = true
  const value = localItem.value.precio_unitario
  precioDraft.value =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? ''
      : formatMoneyWhileTyping(value)
}

const onPrecioInput = (raw: string | number) => {
  if (props.readonly) return
  const formatted = formatMoneyWhileTyping(raw)
  precioDraft.value = formatted
  updateField('precio_unitario', parseMoneyDraft(formatted))
}

const onPrecioBlur = () => {
  precioFocused.value = false
  const value = localItem.value.precio_unitario
  if (value !== null && value !== undefined && Number.isFinite(Number(value))) {
    updateField('precio_unitario', roundMoney(Number(value)))
  }
  precioDraft.value = ''
}
</script>

<template>
  <div class="border-t border-default">
    <!-- Datos principales: foto compacta + campos -->
    <section class="p-4 sm:p-5">
      <div class="flex flex-col lg:flex-row gap-4 lg:gap-5">
        <!-- Media -->
        <div class="w-full lg:w-44 xl:w-48 shrink-0 space-y-2">
          <div
            v-if="hasFoto"
            class="relative aspect-square w-full overflow-hidden rounded-lg border border-default bg-elevated/40 group"
          >
            <img
              :src="localItem.foto_url"
              alt="Producto"
              class="size-full object-contain p-2"
            >
            <div
              class="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <button
                type="button"
                class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                title="Ampliar"
                aria-label="Ampliar imagen"
                @click="openFotoPreview"
              >
                <UIcon name="i-heroicons-magnifying-glass-plus" class="size-5" />
              </button>
              <button
                type="button"
                class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-50"
                title="Copiar imagen"
                aria-label="Copiar imagen"
                :disabled="copyingFoto"
                @click="copyFoto"
              >
                <UIcon name="i-heroicons-clipboard-document" class="size-5" />
              </button>
              <button
                v-if="!readonly"
                type="button"
                class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                title="Quitar foto"
                aria-label="Quitar foto"
                @click="clearFoto"
              >
                <UIcon name="i-heroicons-trash" class="size-5" />
              </button>
            </div>
          </div>
          <UFileUpload
            v-else-if="!readonly"
            :model-value="fotoFile"
            accept="image/*"
            label="Subir foto"
            description="JPG, PNG"
            icon="i-heroicons-camera"
            class="w-full"
            :ui="{
              root: 'w-full',
              base: 'w-full aspect-square min-h-36 items-center justify-center',
              wrapper: 'flex flex-col items-center justify-center text-center px-2'
            }"
            @update:model-value="onFotoChange"
          />
          <div
            v-else
            class="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-default bg-elevated/30 text-muted"
          >
            <UIcon name="i-heroicons-photo" class="size-8 opacity-40" />
            <span class="text-[11px] font-medium">Sin foto</span>
          </div>
          <ImageModal
            :isOpen="previewOpen"
            :imageUrl="String(localItem.foto_url || '')"
            altText="Producto"
            @close="previewOpen = false"
          />
          <UFormField
            v-if="!readonly"
            label="O pegar URL de imagen"
            size="sm"
            class="w-full"
          >
            <UInput
              class="w-full"
              size="sm"
              :model-value="fotoUrlPasteDisplay"
              placeholder="https://... (solo si pegas una imagen externa)"
              icon="i-heroicons-photo"
              @update:model-value="onFotoUrlInput"
            />
          </UFormField>
        </div>

        <!-- Campos -->
        <div class="min-w-0 flex-1 space-y-3">
          <UFormField label="Nombre comercial" required size="sm" class="w-full">
            <UInput
              class="w-full"
              size="sm"
              :disabled="readonly"
              :model-value="localItem.nombre_comercial"
              placeholder="Nombre del producto"
              @update:model-value="updateField('nombre_comercial', $event)"
            />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="HS Code" size="sm" class="w-full min-w-0">
              <UInput
                class="w-full"
                size="sm"
                :disabled="readonly"
                :model-value="localItem.hs_code"
                placeholder="6403.99.00"
                @update:model-value="updateField('hs_code', $event)"
              />
            </UFormField>

            <UFormField label="Link del producto" size="sm" class="w-full min-w-0">
              <UInput
                class="w-full"
                size="sm"
                :disabled="readonly"
                :model-value="localItem.link_producto"
                type="url"
                placeholder="https://..."
                @update:model-value="updateField('link_producto', $event)"
              />
            </UFormField>

            <UFormField label="Cantidad" required size="sm" class="w-full min-w-0">
              <UInput
                v-model.number="localItem.qty"
                class="w-full"
                size="sm"
                :disabled="readonly"
                type="number"
                min="0"
                step="1"
              />
            </UFormField>

            <UFormField label="Precio EXW" required size="sm" class="w-full min-w-0">
              <UInput
                class="w-full"
                size="sm"
                :disabled="readonly"
                :model-value="precioDisplay"
                type="text"
                inputmode="decimal"
                placeholder="0.00"
                @focus="onPrecioFocus"
                @blur="onPrecioBlur"
                @update:model-value="onPrecioInput"
              >
                <template #leading>
                  <span class="text-muted text-sm">$</span>
                </template>
              </UInput>
            </UFormField>
          </div>

          <div
            class="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
            :class="total > 0
              ? 'bg-primary/10 text-primary'
              : 'bg-elevated text-muted'"
          >
            <span class="text-xs font-medium uppercase tracking-wide opacity-80">Total USD</span>
            <span class="text-base font-semibold tabular-nums">${{ formattedTotal }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Características -->
    <section
      v-if="visibleLabels.length"
      class="border-t border-default bg-elevated/40 px-4 py-3 sm:px-5"
    >
      <UCollapsible v-model:open="caracteristicasOpen" :unmount-on-hide="false">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 py-1 text-left transition-colors duration-200 hover:opacity-90"
        >
          <UIcon name="i-heroicons-adjustments-horizontal" class="size-4 text-primary shrink-0" />
          <span class="text-sm font-semibold text-highlighted">Características</span>
          <UBadge
            :color="caracteristicasCompletas ? 'success' : 'warning'"
            variant="subtle"
            size="xs"
          >
            {{ caracteristicasCompletas ? 'Listo' : 'Pendiente' }}
          </UBadge>
          <UIcon
            name="i-heroicons-chevron-down"
            class="ms-auto size-4 text-muted shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': caracteristicasOpen }"
          />
        </button>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2.5 pt-3 pb-1">
            <UFormField
              v-for="label in visibleLabels"
              :key="label"
              :label="getCaracteristicaFieldConfig(label).displayLabel"
              size="sm"
              class="w-full min-w-0"
            >
              <div
                v-if="getCaracteristicaFieldConfig(label).kind === 'value_with_unit'"
                class="flex gap-2 items-stretch"
              >
                <UInput
                  class="min-w-0 flex-1"
                  :disabled="readonly"
                  :model-value="localItem.caracteristicas[label] || ''"
                  placeholder="—"
                  size="sm"
                  @update:model-value="updateCaracteristica(label, $event)"
                />
                <USelect
                  class="w-[7rem] shrink-0"
                  :disabled="readonly"
                  :model-value="localItem.caracteristicas[getCaracteristicaFieldConfig(label).unitKey!] || undefined"
                  :items="selectOptions(getCaracteristicaFieldConfig(label).options || [])"
                  placeholder="Und."
                  size="sm"
                  @update:model-value="updateCaracteristica(getCaracteristicaFieldConfig(label).unitKey!, String($event ?? ''))"
                />
              </div>
              <USelect
                v-else-if="getCaracteristicaFieldConfig(label).kind === 'select'"
                class="w-full"
                :disabled="readonly"
                :model-value="localItem.caracteristicas[label] || undefined"
                :items="selectOptions(getCaracteristicaFieldConfig(label).options || [])"
                placeholder="Seleccionar"
                size="sm"
                @update:model-value="updateCaracteristica(label, String($event ?? ''))"
              />
              <UInput
                v-else
                class="w-full"
                :disabled="readonly"
                :model-value="localItem.caracteristicas[label] || ''"
                placeholder="—"
                size="sm"
                @update:model-value="updateCaracteristica(label, $event)"
              />
            </UFormField>
          </div>
        </template>
      </UCollapsible>
    </section>
  </div>
</template>
