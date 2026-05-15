<template>
  <UModal :open="abierto" @update:open="onUpdateOpen">
    <template #header>
      <div class="flex w-full items-center justify-between">
        <h2 class="text-[15px] font-semibold text-slate-800">Nueva solicitud</h2>
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
      <div
        class="max-h-[70vh] space-y-4 overflow-y-auto px-1 transition-opacity"
        :class="loading ? 'pointer-events-none opacity-60' : ''"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tipo de solicitud</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="rounded-xl border-2 p-3 text-left transition"
            :class="[
              tipo === 'A' ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300',
              loading ? 'cursor-not-allowed' : 'cursor-pointer'
            ]"
            :disabled="loading"
            @click="tipo = 'A'"
          >
            <div class="text-[13px] font-semibold text-slate-800">Tipo A</div>
            <div class="mt-0.5 text-[10px] text-slate-500">Proyecto del mes</div>
          </button>
          <button
            type="button"
            class="rounded-xl border-2 p-3 text-left transition"
            :class="[
              tipo === 'B' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300',
              loading ? 'cursor-not-allowed' : 'cursor-pointer'
            ]"
            :disabled="loading"
            @click="tipo = 'B'"
          >
            <div class="text-[13px] font-semibold text-slate-800">Tipo B</div>
            <div class="mt-0.5 text-[10px] text-slate-500">Requerimiento TI</div>
          </button>
        </div>
        <div v-if="tipo === 'B'">
          <label class="mb-1 block text-[11px] font-medium text-slate-600">Subtipo</label>
          <select
            v-model="subtipoB"
            :disabled="loading"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none disabled:opacity-60"
          >
            <option value="B1">B1 — Incidencia (fallo / error)</option>
            <option value="B2">B2 — Configuración (ajuste / acceso)</option>
          </select>
        </div>
        <div class="my-4 h-px bg-slate-200" />
        <div>
          <label class="mb-1 block text-[11px] font-medium text-slate-600">Área solicitante</label>
          <select
            v-model="area"
            :disabled="loading"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none disabled:opacity-60"
          >
            <option v-for="a in SOPORTE_TI_AREAS" :key="a" :value="a">{{ a }}</option>
          </select>
          <p class="mt-1 text-[10px] text-slate-400">Preseleccionada según tu perfil</p>
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-medium text-slate-600">Sección o Ruta</label>
          <input
            v-model="seccionRuta"
            type="text"
            :disabled="loading"
            placeholder="Página – N° Consolidado – Módulo – Pestaña"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none disabled:opacity-60"
          >
          <p class="mt-1 text-[10px] text-slate-400">
            Indica dónde ocurre: Página, N° Consolidado, Módulo, Pestaña
          </p>
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-medium text-slate-600">Título</label>
          <input
            v-model="titulo"
            type="text"
            :disabled="loading"
            placeholder="Describe brevemente..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none disabled:opacity-60"
          >
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-medium text-slate-600">{{
            tipo === 'A' ? 'Objetivo / alcance' : 'Descripción del problema'
          }}</label>
          <textarea
            v-model="descripcion"
            :disabled="loading"
            :placeholder="tipo === 'A' ? '¿Qué busca lograr?' : '¿Qué falla o necesitas?'"
            class="min-h-[60px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none disabled:opacity-60"
          />
        </div>
        <div class="my-4 h-px bg-slate-200" />
        <div>
          <label class="mb-2 block text-[11px] font-medium text-slate-600">Pantallazos (opcional)</label>
          <FileUploader
            :model-files="pantallazos"
            multiple
            :max-file-size="SOPORTE_TI_MAX_IMAGEN_MB * 1024 * 1024"
            :accepted-types="['.jpg', '.jpeg', '.png', '.gif', '.webp']"
            custom-message="Arrastra capturas o usa «Subir archivo»"
            @files-selected="onPantallazosAgregados"
            @file-removed="onPantallazoEliminado"
          />
          <p class="mt-1.5 text-[10px] text-slate-400">
            Hasta {{ SOPORTE_TI_MAX_IMAGENES_CHAT }} imágenes (máx. {{ SOPORTE_TI_MAX_IMAGEN_MB }} MB c/u)
          </p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="loading" @click="cerrar">Cancelar</UButton>
        <UButton :loading="loading" :disabled="loading" @click="guardar">Crear solicitud</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  SOPORTE_TI_AREAS,
  SOPORTE_TI_AREA_DEFAULT,
  SOPORTE_TI_MAX_IMAGENES_CHAT,
  SOPORTE_TI_MAX_IMAGEN_MB
} from '~/constants/soporteTi'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { SoporteTiCreatePayload, SoporteTiSubtipoB, SoporteTiTipo } from '~/types/soporteTi'

const abierto = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    loading?: boolean
  }>(),
  { loading: false }
)

const emit = defineEmits<{
  saved: [payload: SoporteTiCreatePayload]
}>()

const tipo = ref<SoporteTiTipo>('B')
const subtipoB = ref<SoporteTiSubtipoB>('B1')
const area = ref(SOPORTE_TI_AREA_DEFAULT)
const seccionRuta = ref('')
const titulo = ref('')
const descripcion = ref('')
const pantallazos = ref<File[]>([])

watch(abierto, (v) => {
  if (v) {
    tipo.value = 'B'
    subtipoB.value = 'B1'
    area.value = SOPORTE_TI_AREA_DEFAULT
    seccionRuta.value = ''
    titulo.value = ''
    descripcion.value = ''
    pantallazos.value = []
  }
})

function onUpdateOpen(value: boolean) {
  if (!value && props.loading) {
    return
  }
  abierto.value = value
}

function cerrar() {
  if (props.loading) {
    return
  }
  abierto.value = false
}

function onPantallazosAgregados(nuevos: File[]) {
  const merged = [...pantallazos.value, ...nuevos].slice(0, SOPORTE_TI_MAX_IMAGENES_CHAT)
  pantallazos.value = merged
}

function onPantallazoEliminado(idx: number) {
  pantallazos.value = pantallazos.value.filter((_, i) => i !== idx)
}

function guardar() {
  if (props.loading) {
    return
  }
  const payload: SoporteTiCreatePayload = {
    tipo: tipo.value,
    subtipoB: tipo.value === 'B' ? subtipoB.value : null,
    titulo: titulo.value,
    area: area.value,
    seccionRuta: seccionRuta.value,
    descripcion: descripcion.value
  }
  if (pantallazos.value.length) {
    payload.imagenes = [...pantallazos.value]
  }
  emit('saved', payload)
}
</script>
