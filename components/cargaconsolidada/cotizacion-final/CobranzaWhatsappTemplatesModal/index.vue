<template>
  <UModal
    v-model:open="isOpen"
    class="sm:max-w-xl"
    :dismissible="false"
    :close="false"
    @update:open="onOpenChange"
  >
    <template #header>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Enviar WhatsApp — Cobranza
        </h3>
        <p class="text-sm text-gray-500 mt-1">
          Cotización #{{ idCotizacion }}
          <span v-if="meta?.cliente"> · {{ meta.cliente }}</span>
          <span v-if="meta?.carga"> · Carga {{ meta.carga }}</span>
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          Vista previa de lo que se enviaría por Meta. Todas vienen seleccionadas; desmarca las que no quieras.
        </p>
      </div>
    </template>

    <template #body>
      <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <label
          v-for="tpl in templates"
          :key="tpl.key"
          class="block rounded-xl border px-3 py-3 cursor-pointer transition-colors"
          :class="selected.includes(tpl.key)
            ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/10'
            : 'border-gray-200 dark:border-gray-700 opacity-70'"
        >
          <div class="flex items-start gap-3 mb-2">
            <UCheckbox
              :model-value="selected.includes(tpl.key)"
              @update:model-value="(v: boolean | 'indeterminate') => toggle(tpl.key, v === true)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ tpl.order ? `${tpl.order}. ` : '' }}{{ tpl.label }}
                </p>
                <UBadge v-if="tpl.has_media" color="primary" variant="soft" size="sm">
                  {{ tpl.media_label || 'Adjunto' }}
                </UBadge>
              </div>
              <p class="text-[11px] text-gray-400 mt-0.5 font-mono truncate">{{ tpl.key }}</p>
            </div>
          </div>

          <!-- Burbuja estilo chat -->
          <div class="ml-8 rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-emerald-900/40 px-3 py-2 shadow-sm">
            <p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
              {{ tpl.preview || tpl.description }}
            </p>
            <p v-if="tpl.has_media" class="mt-2 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5" />
              {{ tpl.media_label || 'Archivo adjunto' }}
            </p>
          </div>
        </label>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center gap-2 w-full">
        <p class="text-xs text-gray-500">
          {{ selected.length }} de {{ templates.length }} seleccionada{{ selected.length === 1 ? '' : 's' }}
        </p>
        <div class="flex gap-2">
          <UButton color="neutral" variant="outline" label="Solo guardar estado" :disabled="loading" @click="skip" />
          <UButton
            color="primary"
            :label="selected.length ? `Enviar (${selected.length})` : 'Enviar'"
            :loading="loading"
            :disabled="!selected.length"
            @click="confirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CobranzaWhatsappTemplate, CobranzaWhatsappPreviewMeta } from '~/types/cargaconsolidada/cotizacion-final/general'

const props = defineProps<{
  open: boolean
  idCotizacion: number | null
  templates: CobranzaWhatsappTemplate[]
  meta?: CobranzaWhatsappPreviewMeta | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [templates: string[]]
  skip: []
}>()

const selected = ref<string[]>([])

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

watch(
  () => [props.open, props.templates] as const,
  ([open]) => {
    if (open) {
      selected.value = props.templates
        .filter((t) => t.selected_by_default !== false)
        .map((t) => t.key)
    }
  },
  { immediate: true, deep: true }
)

const toggle = (key: string, on: boolean) => {
  if (on) {
    if (!selected.value.includes(key)) selected.value = [...selected.value, key]
  } else {
    selected.value = selected.value.filter((k) => k !== key)
  }
}

const onOpenChange = (v: boolean) => {
  emit('update:open', v)
}

const confirm = () => {
  emit('confirm', [...selected.value])
}

const skip = () => {
  emit('skip')
}
</script>
