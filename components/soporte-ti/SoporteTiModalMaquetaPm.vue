<template>
  <UModal :open="abierto" @update:open="onUpdateOpen">
    <template #header>
      <div class="flex w-full items-center justify-between gap-2">
        <h2 class="text-base font-semibold text-highlighted">{{ titulo }}</h2>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark"
          size="sm"
          :disabled="loading"
          @click="cerrar"
        />
      </div>
    </template>
    <template #body>
      <div class="space-y-4" :class="loading ? 'pointer-events-none opacity-60' : ''">
        <p class="text-sm text-muted">
          Adjunta la maqueta (imagen o PDF). El equipo verá un mensaje en el chat con el archivo.
        </p>

        <UFormField
          label="Archivos de maqueta"
          required
          :hint="`Máx. ${SOPORTE_TI_MAX_IMAGENES_CHAT} archivos · ${MAQUETA_MAX_MB} MB c/u`"
          :error="errorArchivos"
        >
          <div :class="errorArchivos ? 'rounded-lg ring-2 ring-error' : ''">
            <FileUploader
              :model-files="archivos"
              multiple
              :max-file-size="MAQUETA_MAX_MB * 1024 * 1024"
              :accepted-types="['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']"
              custom-message="Arrastra archivos o usa «Subir archivo»"
              @files-selected="onArchivosAgregados"
              @file-removed="onArchivoEliminado"
            />
          </div>
        </UFormField>

        <UFormField label="Mensaje en el chat" hint="Opcional; visible para todos en la conversación">
          <UTextarea
            v-model="mensaje"
            :rows="2"
            class="w-full"
            :disabled="loading"
            placeholder="He subido la maqueta para revisión."
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="loading" @click="cerrar">
          Cancelar
        </UButton>
        <UButton :loading="loading" :disabled="loading || !archivos.length" @click="confirmar">
          {{ etiquetaConfirmar }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SOPORTE_TI_MAX_IMAGENES_CHAT } from '~/constants/soporteTi'
import FileUploader from '~/components/commons/FileUploader.vue'

const MAQUETA_MAX_MB = 20

const abierto = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    loading?: boolean
    /** Si true, el flujo también pasa el ticket a «En maqueta» */
    cambiarEstado?: boolean
  }>(),
  { loading: false, cambiarEstado: true }
)

const emit = defineEmits<{
  confirm: [payload: { archivos: File[]; mensaje: string }]
}>()

const archivos = ref<File[]>([])
const mensaje = ref('He subido la maqueta para revisión.')
const errorArchivos = ref('')

const titulo = computed(() =>
  props.cambiarEstado ? 'Subir maqueta y pasar a En maqueta' : 'Subir maqueta'
)

const etiquetaConfirmar = computed(() =>
  props.cambiarEstado ? 'Subir y pasar a En maqueta' : 'Subir maqueta'
)

watch(abierto, (v) => {
  if (v) {
    archivos.value = []
    mensaje.value = 'He subido la maqueta para revisión.'
    errorArchivos.value = ''
  }
})

function onUpdateOpen(value: boolean) {
  if (!value && props.loading) return
  abierto.value = value
}

function cerrar() {
  if (props.loading) return
  abierto.value = false
}

function onArchivosAgregados(nuevos: File[]) {
  archivos.value = [...archivos.value, ...nuevos].slice(0, SOPORTE_TI_MAX_IMAGENES_CHAT)
  if (archivos.value.length) errorArchivos.value = ''
}

function onArchivoEliminado(idx: number) {
  archivos.value = archivos.value.filter((_, i) => i !== idx)
}

function confirmar() {
  if (props.loading) return
  if (!archivos.value.length) {
    errorArchivos.value = 'Debes adjuntar al menos un archivo.'
    return
  }
  emit('confirm', {
    archivos: [...archivos.value],
    mensaje: mensaje.value.trim() || 'He subido la maqueta para revisión.'
  })
}
</script>
