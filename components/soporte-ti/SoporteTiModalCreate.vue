<template>
  <UModal v-model:open="abierto">
    <template #header>
      <div class="flex w-full items-center justify-between">
        <h2 class="text-[15px] font-semibold text-slate-800">Nueva solicitud</h2>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" size="sm" @click="cerrar" />
      </div>
    </template>
    <template #body>
      <div class="max-h-[70vh] space-y-4 overflow-y-auto px-1">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tipo de solicitud</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="cursor-pointer rounded-xl border-2 p-3 text-left transition"
            :class="tipo === 'A' ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300'"
            @click="tipo = 'A'"
          >
            <div class="text-[13px] font-semibold text-slate-800">Tipo A</div>
            <div class="mt-0.5 text-[10px] text-slate-500">Proyecto del mes</div>
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-xl border-2 p-3 text-left transition"
            :class="tipo === 'B' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300'"
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
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none"
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
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none"
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
            placeholder="Página – N° Consolidado – Módulo – Pestaña"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none"
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
            placeholder="Describe brevemente..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none"
          >
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-medium text-slate-600">{{
            tipo === 'A' ? 'Objetivo / alcance' : 'Descripción del problema'
          }}</label>
          <textarea
            v-model="descripcion"
            :placeholder="tipo === 'A' ? '¿Qué busca lograr?' : '¿Qué falla o necesitas?'"
            class="min-h-[60px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-[12px] focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div class="my-4 h-px bg-slate-200" />
        <div>
          <label class="mb-2 block text-[11px] font-medium text-slate-600">Pantallazos (opcional)</label>
          <div
            class="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50/30"
            @click="fileRef?.click()"
            @dragover.prevent
            @drop.prevent="onDropFiles"
          >
            <input
              ref="fileRef"
              type="file"
              class="hidden"
              accept="image/*"
              multiple
              @change="onPickFiles"
            >
            <UIcon name="i-heroicons-photo" class="mx-auto mb-1.5 size-6 text-slate-400" />
            <p class="text-[11px] text-slate-500">Arrastra o haz clic para agregar capturas</p>
            <p class="mt-0.5 text-[10px] text-slate-400">PNG, JPG — múltiples archivos permitidos</p>
          </div>
          <div v-if="capturas.length" class="mt-3 flex flex-wrap gap-2">
            <div
              v-for="sc in capturas"
              :key="sc.id"
              class="group relative size-20 overflow-hidden rounded-lg border border-slate-200"
            >
              <img :src="sc.dataUrl" :alt="sc.nombre" class="size-full object-cover">
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40"
              >
                <button
                  type="button"
                  class="flex size-6 items-center justify-center rounded-full bg-white/90 text-[12px] font-bold text-red-500 opacity-0 shadow transition group-hover:opacity-100"
                  title="Quitar"
                  @click.stop="quitarCaptura(sc.id)"
                >
                  ✕
                </button>
              </div>
              <div class="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                <p class="truncate text-[8px] text-white">{{ sc.nombre }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="cerrar">Cancelar</UButton>
        <UButton @click="guardar">Crear solicitud</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SOPORTE_TI_AREAS, SOPORTE_TI_AREA_DEFAULT } from '~/constants/soporteTi'
import type { SoporteTiCreatePayload, SoporteTiSubtipoB, SoporteTiTipo } from '~/types/soporteTi'

const abierto = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  saved: [payload: SoporteTiCreatePayload]
}>()

const tipo = ref<SoporteTiTipo>('B')
const subtipoB = ref<SoporteTiSubtipoB>('B1')
const area = ref(SOPORTE_TI_AREA_DEFAULT)
const seccionRuta = ref('')
const titulo = ref('')
const descripcion = ref('')
const fileRef = ref<HTMLInputElement | null>(null)
const capturas = ref<{ id: number; nombre: string; dataUrl: string }[]>([])

watch(abierto, (v) => {
  if (v) {
    tipo.value = 'B'
    subtipoB.value = 'B1'
    area.value = SOPORTE_TI_AREA_DEFAULT
    seccionRuta.value = ''
    titulo.value = ''
    descripcion.value = ''
    capturas.value = []
  }
})

function cerrar() {
  abierto.value = false
}

function agregarArchivos(files: FileList | File[]) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      capturas.value.push({
        id: Date.now() + Math.random(),
        nombre: file.name,
        dataUrl: (e.target?.result as string) || ''
      })
    }
    reader.readAsDataURL(file)
  })
}

function onPickFiles(e: Event) {
  const t = e.target as HTMLInputElement
  if (t.files) agregarArchivos(t.files)
}

function onDropFiles(e: DragEvent) {
  if (e.dataTransfer?.files) agregarArchivos(e.dataTransfer.files)
}

function quitarCaptura(id: number) {
  capturas.value = capturas.value.filter((c) => c.id !== id)
}

function guardar() {
  emit('saved', {
    tipo: tipo.value,
    subtipoB: tipo.value === 'B' ? subtipoB.value : null,
    titulo: titulo.value,
    area: area.value,
    seccionRuta: seccionRuta.value,
    descripcion: descripcion.value
  })
  abierto.value = false
}
</script>
