<template>
  <div class="flex h-[480px] flex-col rounded-xl border border-slate-200 bg-white">
    <div class="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700">
      <UIcon name="i-heroicons-chat-bubble-left-right" class="size-4 text-slate-400" />
      <span class="flex-1 truncate">Chat — {{ codigoTicket }}</span>
      <span
        v-if="salaUuid"
        class="max-w-[100px] truncate font-mono text-[9px] font-normal text-slate-400"
        :title="salaUuid"
      >
        {{ salaUuid.slice(0, 8) }}…
      </span>
    </div>

    <div
      ref="scrollRef"
      class="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3"
      @scroll="onScroll"
    >
      <div v-if="loadingChat" class="py-4 text-center text-[11px] text-slate-400">
        Cargando mensajes…
      </div>

      <div v-else-if="hasMoreOlder" class="sticky top-0 z-10 flex justify-center pb-1">
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="loadingOlder"
          @click="solicitarAnteriores"
        >
          {{ loadingOlder ? 'Cargando…' : 'Cargar mensajes anteriores' }}
        </button>
      </div>

      <template v-for="m in mensajes" :key="m.id">
        <div v-if="m.esSistema" class="text-center">
          <span
            class="inline-block rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] text-amber-700"
          >
            {{ m.texto }}
          </span>
        </div>

        <div
          v-else
          class="group flex gap-2"
          :class="{ 'flex-row-reverse': m.esPropio }"
        >
          <div
            class="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
            :style="{ background: m.color }"
          >
            {{ m.iniciales }}
          </div>
          <div class="max-w-[220px]">
            <div
              class="mb-0.5 flex items-center gap-1 text-[9px] text-slate-400"
              :class="{ 'flex-row-reverse': m.esPropio }"
            >
              <span>{{ m.remitente }} · {{ m.marcaTiempo }}</span>
              <button
                type="button"
                class="rounded px-1 text-blue-600 opacity-0 transition hover:bg-blue-50 group-hover:opacity-100"
                title="Responder"
                @click="iniciarRespuesta(m)"
              >
                Responder
              </button>
            </div>

            <div
              class="overflow-hidden rounded-xl text-[11px] leading-relaxed"
              :class="
                m.esPropio
                  ? 'rounded-tr-sm bg-blue-600 text-white'
                  : 'rounded-tl-sm border border-slate-200 bg-slate-100 text-slate-700'
              "
            >
              <div
                v-if="m.replyTo"
                class="border-b px-2.5 py-1.5 text-[10px] opacity-90"
                :class="m.esPropio ? 'border-blue-500 bg-blue-700/40' : 'border-slate-200 bg-slate-50'"
              >
                <p class="font-medium">{{ m.replyTo.remitente }}</p>
                <p class="truncate opacity-80">{{ m.replyTo.texto }}</p>
                <p v-if="m.replyTo.tieneImagen" class="text-[9px] opacity-70">Imagen adjunta</p>
              </div>

              <p v-if="m.texto" class="whitespace-pre-wrap px-2.5 py-1.5">{{ m.texto }}</p>

              <div v-if="m.imagenes?.length" class="flex flex-col gap-1 p-1.5">
                <button
                  v-for="(img, idx) in m.imagenes"
                  :key="idx"
                  type="button"
                  class="block overflow-hidden rounded-lg"
                  @click="abrirImagen(img.url)"
                >
                  <img
                    :src="img.url"
                    :alt="img.nombre"
                    class="max-h-40 w-full object-cover"
                    loading="lazy"
                  >
                </button>
              </div>

              <div
                v-else-if="m.archivoNombre"
                class="flex h-14 items-center justify-center gap-1 px-2 text-[10px]"
                :class="m.esPropio ? 'text-blue-100' : 'text-violet-600'"
              >
                <UIcon name="i-heroicons-document" class="size-4" />
                {{ m.archivoNombre }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="replyTarget"
      class="flex items-start gap-2 border-t border-blue-100 bg-blue-50/80 px-3 py-2"
    >
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-medium text-blue-700">
          Respondiendo a {{ replyTarget.remitente }}
        </p>
        <p class="truncate text-[10px] text-slate-600">{{ replyTarget.texto }}</p>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600" @click="cancelarRespuesta">
        <UIcon name="i-heroicons-x-mark" class="size-4" />
      </button>
    </div>

    <div v-if="imagenesPendientes.length" class="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-2">
      <div
        v-for="(img, i) in imagenesPendientes"
        :key="i"
        class="relative size-14 overflow-hidden rounded-lg border border-slate-200"
      >
        <img :src="img.preview" :alt="img.file.name" class="size-full object-cover">
        <button
          type="button"
          class="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/50 text-white"
          @click="quitarImagen(i)"
        >
          <UIcon name="i-heroicons-x-mark" class="size-3" />
        </button>
      </div>
    </div>

    <div class="flex gap-2 border-t border-slate-200 px-3 py-2.5">
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        accept="image/*"
        multiple
        @change="onPickImagenes"
      >
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-heroicons-photo"
        class="shrink-0 self-end"
        title="Adjuntar imágenes"
        @click="fileInputRef?.click()"
      />
      <UTextarea
        v-model="texto"
        :rows="1"
        autoresize
        :maxrows="4"
        class="min-h-0 flex-1 text-[12px]"
        placeholder="Escribe un mensaje..."
        @keydown="onKeydown"
      />
      <UButton class="shrink-0 self-end text-[11px]" size="sm" :disabled="!puedeEnviar" @click="enviar">
        Enviar
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onUnmounted } from 'vue'
import type { SoporteTiMensaje, SoporteTiEnviarMensajePayload } from '~/types/soporteTi'
import { SOPORTE_TI_MAX_IMAGENES_CHAT, SOPORTE_TI_MAX_IMAGEN_MB } from '~/constants/soporteTi'

const props = defineProps<{
  codigoTicket: string
  salaUuid: string
  mensajes: SoporteTiMensaje[]
  hasMoreOlder?: boolean
  loadingChat?: boolean
  loadingOlder?: boolean
}>()

const emit = defineEmits<{
  send: [payload: SoporteTiEnviarMensajePayload]
  'load-older': []
}>()

const texto = ref('')
const scrollRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const replyTarget = ref<SoporteTiMensaje | null>(null)
const imagenesPendientes = ref<{ file: File; preview: string }[]>([])

const puedeEnviar = computed(
  () => texto.value.trim().length > 0 || imagenesPendientes.value.length > 0
)

const cercaDelFinal = ref(true)
const scrollHeightAntes = ref(0)
const primerIdAnterior = ref<number | null>(null)

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  cercaDelFinal.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

watch(
  () => props.mensajes,
  async (lista, prev) => {
    await nextTick()
    const el = scrollRef.value
    if (!el) return

    const prepended =
      prev &&
      lista.length > prev.length &&
      lista[0]?.id !== prev[0]?.id &&
      primerIdAnterior.value != null &&
      lista[0]?.id !== primerIdAnterior.value

    if (prepended && scrollHeightAntes.value > 0) {
      el.scrollTop += el.scrollHeight - scrollHeightAntes.value
      scrollHeightAntes.value = 0
      primerIdAnterior.value = lista[0]?.id ?? null
      return
    }

    primerIdAnterior.value = lista[0]?.id ?? null

    if (cercaDelFinal.value || lista.length <= (prev?.length ?? 0) + 1) {
      el.scrollTop = el.scrollHeight
    }
  },
  { deep: true }
)

function solicitarAnteriores() {
  if (!props.hasMoreOlder || props.loadingOlder) return
  if (scrollRef.value) scrollHeightAntes.value = scrollRef.value.scrollHeight
  emit('load-older')
}

function iniciarRespuesta(m: SoporteTiMensaje) {
  replyTarget.value = m
}

function cancelarRespuesta() {
  replyTarget.value = null
}

function onPickImagenes(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const restantes = SOPORTE_TI_MAX_IMAGENES_CHAT - imagenesPendientes.value.length
  Array.from(input.files)
    .slice(0, restantes)
    .forEach((file) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > SOPORTE_TI_MAX_IMAGEN_MB * 1048576) return
      imagenesPendientes.value.push({
        file,
        preview: URL.createObjectURL(file)
      })
    })
  input.value = ''
}

function quitarImagen(index: number) {
  const item = imagenesPendientes.value[index]
  if (item?.preview) URL.revokeObjectURL(item.preview)
  imagenesPendientes.value = imagenesPendientes.value.filter((_, i) => i !== index)
}

function enviar() {
  if (!puedeEnviar.value) return
  emit('send', {
    texto: texto.value.trim(),
    replyToId: replyTarget.value?.id ?? null,
    imagenes: imagenesPendientes.value.map((i) => i.file)
  })
  texto.value = ''
  replyTarget.value = null
  imagenesPendientes.value.forEach((i) => URL.revokeObjectURL(i.preview))
  imagenesPendientes.value = []
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    enviar()
  }
}

function abrirImagen(url: string) {
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener')
}

onUnmounted(() => {
  imagenesPendientes.value.forEach((i) => URL.revokeObjectURL(i.preview))
})
</script>
