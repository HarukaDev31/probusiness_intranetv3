<template>
  <div class="mb-3 rounded-xl border border-slate-200 bg-white p-4">
    <div class="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      <UIcon name="i-heroicons-arrow-up-tray" class="size-3.5 text-violet-500" />
      Subir maqueta
    </div>
    <div
      v-if="!archivo"
      class="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
      :class="{ 'border-blue-400 bg-blue-50': sobre }"
      @click="inputRef?.click()"
      @dragover.prevent="sobre = true"
      @dragleave="sobre = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="inputRef"
        type="file"
        class="hidden"
        accept="image/*,.pdf"
        @change="onPick"
      >
      <UIcon name="i-heroicons-arrow-up-tray" class="mx-auto mb-2 size-8 text-slate-400" />
      <p class="text-[12px] text-slate-500">Arrastra un archivo o haz clic para seleccionar</p>
      <p class="mt-1 text-[10px] text-slate-400">PNG, JPG, PDF — máx. 10 MB</p>
    </div>
    <div v-else>
      <div class="overflow-hidden rounded-lg border border-slate-200">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Vista previa"
          class="h-36 w-full object-cover"
        >
        <div
          v-else
          class="flex h-24 w-full items-center justify-center gap-2 bg-violet-50 text-[12px] text-violet-600"
        >
          <UIcon name="i-heroicons-document" class="size-5" />
          {{ archivo.nombre }}
        </div>
        <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2">
          <span class="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <UIcon name="i-heroicons-document-duplicate" class="size-3" />
            {{ archivo.nombre }}
          </span>
          <span class="text-[10px] text-slate-400">{{ archivo.tamano }}</span>
        </div>
      </div>
      <div class="mt-2 flex justify-end gap-2">
        <UButton size="xs" variant="outline" color="neutral" @click="limpiar">
          Quitar
        </UButton>
        <UButton size="xs" icon="i-heroicons-arrow-up-tray" @click="enviar">
          Enviar maqueta
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SoporteTiMaqueta } from '~/types/soporteTi'

const emit = defineEmits<{
  upload: [payload: SoporteTiMaqueta & { dataUrl?: string | null }]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const sobre = ref(false)
const archivo = ref<{ nombre: string; tamano: string; file: File } | null>(null)
const previewUrl = ref<string | null>(null)

function tamanoLegible(f: File) {
  if (f.size > 1048576) return `${(f.size / 1048576).toFixed(1)} MB`
  return `${Math.round(f.size / 1024)} KB`
}

function procesarFile(f: File | undefined) {
  if (!f) return
  archivo.value = { nombre: f.name, tamano: tamanoLegible(f), file: f }
  if (f.type.startsWith('image/')) {
    const r = new FileReader()
    r.onload = (e) => {
      previewUrl.value = (e.target?.result as string) ?? null
    }
    r.readAsDataURL(f)
  } else {
    previewUrl.value = null
  }
}

function onPick(e: Event) {
  const t = e.target as HTMLInputElement
  procesarFile(t.files?.[0])
}

function onDrop(e: DragEvent) {
  sobre.value = false
  procesarFile(e.dataTransfer?.files[0])
}

function limpiar() {
  archivo.value = null
  previewUrl.value = null
}

function enviar() {
  if (!archivo.value) return
  const f = archivo.value
  const ahora = new Date()
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const fecha = `${ahora.getDate()} ${meses[ahora.getMonth()]}`
  emit('upload', {
    nombre: f.nombre,
    tamano: f.tamano,
    fechaEntrega: fecha,
    aprobada: false,
    dataUrl: previewUrl.value
  })
  limpiar()
}
</script>
