<template>
  <UCard
    class="flex min-h-0 flex-col overflow-hidden"
    :class="alturaClase"
    :ui="cardUi"
  >
    <template #header>
      <div
        v-if="mostrarCabeceraSla"
        class="grid gap-2 border-b border-default px-3 py-3 sm:grid-cols-3 sm:gap-3 sm:px-4"
      >
        <UCard variant="subtle" :ui="{ body: 'p-2.5 sm:p-2.5' }">
          <div class="flex items-start gap-2">
            <UIcon name="i-heroicons-hashtag" class="mt-0.5 size-4 shrink-0 text-muted" />
            <div class="min-w-0">
              <p class="text-[10px] font-medium uppercase tracking-wide text-muted">Código</p>
              <p class="truncate font-mono text-sm font-semibold text-highlighted">{{ codigoTicket }}</p>
            </div>
          </div>
        </UCard>
        <UCard variant="subtle" :ui="{ body: 'p-2.5 sm:p-2.5' }">
          <div class="flex items-start gap-2 sm:justify-center">
            <UIcon
              name="i-heroicons-clock"
              class="mt-0.5 size-4 shrink-0"
              :class="contadorVencidoUi ? 'text-error' : 'text-muted'"
            />
            <div class="min-w-0 text-left sm:text-center">
              <p class="text-[10px] font-medium uppercase tracking-wide text-muted">Tiempo restante</p>
              <p
                class="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight"
                :class="contadorVencidoUi ? 'text-error' : 'text-highlighted'"
              >
                <template v-if="contadorActivo && etiquetaContadorMostrar">
                  {{ etiquetaContadorMostrar }}
                </template>
                <span v-else class="text-sm font-normal text-muted">—</span>
              </p>
              <p v-if="contadorActivo && contadorPausado" class="text-[10px] font-medium text-muted">
                Pausado
              </p>
              <p v-else-if="contadorActivo && contadorVencidoUi" class="text-[10px] font-medium text-error">
                Plazo vencido
              </p>
            </div>
          </div>
        </UCard>
        <UCard variant="subtle" :ui="{ body: 'p-2.5 sm:p-2.5' }">
          <div class="flex items-start gap-2 sm:justify-end">
            <UIcon name="i-heroicons-calendar-days" class="mt-0.5 size-4 shrink-0 text-muted" />
            <div class="min-w-0 text-left sm:text-right">
              <p class="text-[10px] font-medium uppercase tracking-wide text-muted">Término máximo</p>
              <p class="mt-0.5 text-sm font-semibold text-highlighted">{{ terminoMaximo || '—' }}</p>
            </div>
          </div>
        </UCard>
      </div>
      <div
        v-if="!modoSolicitante"
        class="border-b border-default px-4 py-3"
        :class="mostrarFasesCabecera ? 'space-y-3' : ''"
      >
        <div class="flex items-center gap-2.5">
          <UCard color="neutral" variant="soft" :ui="{ body: 'flex items-center justify-center p-2 sm:p-2' }">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="size-5 text-primary" />
          </UCard>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-highlighted">Conversación</p>
            <p class="truncate font-mono text-[11px] text-muted">{{ codigoTicket }}</p>
          </div>
          <UBadge v-if="mensajes.length" color="neutral" variant="soft" size="sm">
            {{ mensajes.length }}
          </UBadge>
        </div>
        <SoporteTiFasesProyectoBar
          v-if="mostrarFasesCabecera"
          :fase-index="faseIndex"
          compacto
        />
      </div>
    </template>

    <div class="relative flex min-h-0 flex-1 flex-col">
      <div v-if="modoVistaAdjunto" class="flex min-h-0 flex-1 flex-col bg-neutral-950">
        <div
          v-if="!documentoPendiente"
          class="flex shrink-0 items-center gap-2 border-b border-white/10 px-2 py-2 sm:px-3"
        >
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-heroicons-x-mark"
            class="text-white/80"
            title="Cancelar"
            @click="descartarAdjuntos"
          />
          <p class="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {{ tituloVistaAdjunto }}
          </p>
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            size="sm"
            icon="i-heroicons-plus"
            class="text-white"
            :disabled="imagenesPendientes.length >= SOPORTE_TI_MAX_IMAGENES_CHAT"
            title="Añadir imagen"
            @click="fileInputImagenRef?.click()"
          />
        </div>

        <SoporteTiChatDocumentoPreview
          v-if="documentoPendiente"
          :nombre="documentoPendiente.file.name"
          :tamano-bytes="documentoPendiente.file.size"
        />

        <div v-else class="relative flex min-h-0 flex-1 flex-col">
          <UButton
            v-if="imagenesPendientes.length > 1 && indiceAdjunto > 0"
            type="button"
            color="neutral"
            variant="solid"
            size="sm"
            icon="i-heroicons-chevron-left"
            class="absolute left-2 top-1/2 z-40 -translate-y-1/2 rounded-full shadow-lg"
            @click="cambiarAdjunto(indiceAdjunto - 1)"
          />
          <SoporteTiChatImagenEditor
            v-if="imagenAdjuntoActual"
            ref="editorAdjuntoRef"
            :src="imagenAdjuntoActual.preview"
            :nombre-archivo="imagenAdjuntoActual.file.name"
            @update="onImagenEditada"
          />
          <UButton
            v-if="imagenesPendientes.length > 1 && indiceAdjunto < imagenesPendientes.length - 1"
            type="button"
            color="neutral"
            variant="solid"
            size="sm"
            icon="i-heroicons-chevron-right"
            class="absolute right-2 top-1/2 z-40 -translate-y-1/2 rounded-full shadow-lg"
            @click="cambiarAdjunto(indiceAdjunto + 1)"
          />
          <UButton
            type="button"
            color="neutral"
            variant="solid"
            size="xs"
            icon="i-heroicons-trash"
            class="absolute bottom-3 left-3 z-40 rounded-full shadow-lg"
            title="Quitar esta imagen"
            @click="quitarImagen(indiceAdjunto)"
          />
        </div>

        <div
          v-if="!documentoPendiente && imagenesPendientes.length > 1"
          class="flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-neutral-950 px-3 py-2"
        >
          <button
            v-for="(img, i) in imagenesPendientes"
            :key="i"
            type="button"
            class="shrink-0 rounded-lg ring-2 ring-transparent transition"
            :class="i === indiceAdjunto ? 'ring-primary' : 'opacity-60 hover:opacity-100'"
            @click="cambiarAdjunto(i)"
          >
            <UCard class="size-14 overflow-hidden p-0" :ui="{ body: 'p-0 sm:p-0' }">
              <img :src="img.preview" :alt="img.file.name" class="size-full object-cover">
            </UCard>
          </button>
        </div>
      </div>

      <div
        v-else
        ref="scrollRef"
        class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scroll-smooth px-3 py-4 sm:px-4"
        @scroll="onScroll"
      >
        <SoporteTiChatPanelSkeleton v-if="loadingChat" class="flex-1" />

        <template v-else>
          <div v-if="hasMoreOlder" class="sticky top-0 z-10 flex justify-center pb-1">
            <UButton
              type="button"
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-heroicons-arrow-up"
              :loading="loadingOlder"
              :disabled="loadingOlder"
              @click="solicitarAnteriores"
            >
              Mensajes anteriores
            </UButton>
          </div>

          <div
            v-if="!mensajes.length"
            class="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <UCard variant="subtle" :ui="{ body: 'flex items-center justify-center p-4 sm:p-4' }">
              <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="size-7 text-muted" />
            </UCard>
            <div class="max-w-xs space-y-1">
              <p class="text-sm font-medium text-highlighted">Sin mensajes aún</p>
              <p class="text-xs text-muted">
                Escribe abajo para contactar al equipo. Los avisos del ticket aparecerán aquí.
              </p>
            </div>
          </div>

          <template v-for="m in mensajes" :key="m.id">
            <div v-if="m.esSistema" class="w-full shrink-0 py-0.5">
              <UCard variant="subtle" color="warning" class="w-full" :ui="{ body: 'p-0 sm:p-0' }">
                <div class="flex flex-col items-center gap-2 px-4 py-3 text-center sm:px-5">
                  <UIcon name="i-heroicons-information-circle" class="size-5 text-warning" />
                  <p
                    class="w-full text-[11px] leading-relaxed whitespace-pre-wrap break-words text-default"
                  >
                    {{ m.texto }}
                  </p>
                </div>
              </UCard>
            </div>

            <div
              v-else
              class="group flex gap-2.5"
              :class="m.esPropio ? 'flex-row-reverse' : 'flex-row'"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-inverted ring-2 ring-default"
                :style="{ background: m.color }"
              >
                {{ m.iniciales }}
              </div>

              <div class="min-w-0" :class="anchoBurbuja">
                <div
                  class="mb-1 flex items-center gap-1.5 text-[10px] text-muted"
                  :class="m.esPropio ? 'flex-row-reverse' : 'flex-row'"
                >
                  <span v-if="!m.esPropio" class="font-medium text-highlighted">{{ m.remitente }}</span>
                  <UButton
                    type="button"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-arrow-uturn-left"
                    class="opacity-0 transition group-hover:opacity-100"
                    title="Responder"
                    @click="iniciarRespuesta(m)"
                  />
                </div>

                <div :class="m.esPropio ? 'flex items-end gap-0.5 flex-row' : ''">
                  <UButton
                    v-if="m.esPropio && m.id > 0"
                    type="button"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-chevron-down"
                    class="mb-1 shrink-0 opacity-0 transition group-hover:opacity-100"
                    title="Info. del mensaje"
                    aria-label="Info. del mensaje"
                    @click="abrirInfoMensaje(m)"
                  />

                  <UCard
                  :color="m.esPropio ? 'primary' : 'neutral'"
                  :variant="m.esPropio ? 'solid' : 'soft'"
                  class="min-w-0 flex-1 overflow-hidden shadow-sm"
                  :class="
                    m.esPropio
                      ? 'rounded-2xl rounded-tr-md text-inverted'
                      : 'rounded-2xl rounded-tl-md'
                  "
                  :ui="{ body: 'p-0 sm:p-0' }"
                >
                  <div
                    v-if="m.replyTo"
                    class="border-b border-default px-2 py-2"
                    :class="m.esPropio ? 'border-inverted/20' : ''"
                  >
                    <SoporteTiChatReplyPreview
                      :remitente="m.replyTo.remitente"
                      :texto="m.replyTo.texto"
                      :imagen-url="m.replyTo.imagenUrl"
                      :inverted="m.esPropio"
                    />
                  </div>

                  <p
                    v-if="m.texto"
                    class="whitespace-pre-wrap px-3 py-2 text-[12px] leading-relaxed"
                    :class="m.esPropio ? '' : 'text-default'"
                  >
                    {{ m.texto }}
                  </p>

                  <div v-if="m.imagenes?.length" class="flex flex-col gap-1.5 p-2 pt-0">
                    <SoporteTiChatAdjuntoMensaje
                      v-for="(img, idx) in m.imagenes"
                      :key="idx"
                      :url="img.url"
                      :nombre="img.nombre"
                      :tamano="img.tamano"
                      :inverted="m.esPropio"
                      @abrir="abrirPreview"
                    />
                  </div>

                  <div v-else-if="m.archivoNombre" class="px-2 pb-1 pt-0">
                    <SoporteTiChatAdjuntoMensaje
                      :url="urlAdjuntoArchivo(m)"
                      :nombre="m.archivoNombre"
                      :inverted="m.esPropio"
                      forzar-documento
                      @abrir="abrirPreview"
                    />
                  </div>

                  <div
                    class="flex items-center justify-end gap-1 px-3 pb-2 pt-0.5"
                    :class="m.texto || m.imagenes?.length || m.archivoNombre ? '' : 'pt-2'"
                  >
                    <span
                      class="text-[10px] tabular-nums"
                      :class="m.esPropio ? 'text-inverted/70' : 'text-muted'"
                    >
                      {{ m.marcaTiempo }}
                    </span>
                    <SoporteTiChatEstadoEnvio
                      v-if="m.esPropio && m.estadoEnvio"
                      :estado="m.estadoEnvio"
                      :inverted="m.esPropio"
                    />
                  </div>
                </UCard>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <UButton
          v-if="mostrarBajar && !modoVistaAdjunto && !loadingChat && mensajes.length"
          type="button"
          size="sm"
          color="neutral"
          variant="solid"
          icon="i-heroicons-arrow-down"
          class="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 shadow-md"
          @click="bajarAlFinal"
        />
      </Transition>
    </div>

    <template #footer>
      <div
        class="border-t"
        :class="modoVistaAdjunto ? 'border-white/10 bg-neutral-950' : 'border-default'"
      >
        <UCard
          v-if="replyTarget && !modoVistaAdjunto"
          color="neutral"
          variant="soft"
          class="mx-3 mt-3"
          :ui="{ body: 'flex items-start gap-2 p-2.5 sm:p-2.5' }"
        >
          <div class="min-w-0 flex-1">
            <p class="mb-1.5 text-[10px] font-medium text-muted">Respondiendo</p>
            <SoporteTiChatReplyPreview
              :remitente="replyTarget.remitente"
              :texto="replyTarget.texto"
              :imagen-url="replyPreviewImagenUrl"
            />
          </div>
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-heroicons-x-mark"
            class="shrink-0"
            @click="cancelarRespuesta"
          />
        </UCard>

        <div
          v-if="documentoPendiente && modoVistaAdjunto"
          class="flex justify-center px-3 pt-2"
        >
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-heroicons-x-mark"
            class="text-white/80"
            label="Cancelar"
            @click="descartarAdjuntos"
          />
        </div>

        <div class="flex items-end gap-2 p-3" :class="modoVistaAdjunto ? 'px-4 pb-4 pt-1' : ''">
          <input
            ref="fileInputImagenRef"
            type="file"
            class="hidden"
            accept="image/*"
            multiple
            @change="onPickImagenes"
          >
          <input
            ref="fileInputDocumentoRef"
            type="file"
            class="hidden"
            :accept="SOPORTE_TI_CHAT_ACCEPT_DOCUMENTOS"
            @change="onPickDocumento"
          >

          <UPopover
            v-if="!modoVistaAdjunto"
            v-model:open="menuAdjuntosAbierto"
            :content="{ side: 'top', align: 'start' }"
          >
            <UButton
              type="button"
              color="neutral"
              variant="soft"
              size="md"
              icon="i-heroicons-plus"
              class="shrink-0"
              title="Adjuntar"
            />
            <template #content>
              <div class="flex min-w-[11rem] flex-col gap-0.5 p-1">
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-heroicons-photo"
                  label="Fotos y videos"
                  class="justify-start"
                  @click="abrirSelectorImagenes"
                />
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-heroicons-document"
                  label="Documento"
                  class="justify-start"
                  @click="abrirSelectorDocumento"
                />
              </div>
            </template>
          </UPopover>

          <div class="relative min-w-0 flex-1">
            <UCard
              class="min-w-0"
              :color="modoVistaAdjunto ? undefined : 'neutral'"
              :variant="modoVistaAdjunto ? 'outline' : 'soft'"
              :ui="{
                root: modoVistaAdjunto ? 'bg-neutral-800 ring-white/10' : '',
                body: 'flex items-end gap-1 p-1.5 pe-10 sm:p-1.5 sm:pe-10'
              }"
            >
              <UTextarea
                v-model="texto"
                :rows="1"
                autoresize
                :maxrows="5"
                variant="none"
                class="w-full text-[13px]"
                :class="modoVistaAdjunto ? 'text-white placeholder:text-white/40' : ''"
                :placeholder="modoVistaAdjunto ? 'Escribe un mensaje' : 'Escribe un mensaje…'"
                @keydown="onKeydown"
              />
            </UCard>
            <SoporteTiChatEmojiPicker
              class="absolute bottom-1.5 right-1.5"
              :oscuro="modoVistaAdjunto"
              @pick="insertarEmoji"
            />
          </div>

          <UButton
            color="primary"
            size="md"
            icon="i-heroicons-paper-airplane"
            class="shrink-0"
            :disabled="!puedeEnviar"
            @click="enviar"
          />
        </div>
      </div>
    </template>
  </UCard>

  <SoporteTiChatMensajeInfoModal
    v-model:open="infoMensajeAbierto"
    :chat-uuid="salaUuid"
    :mensaje-id="infoMensajeId"
  />
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onUnmounted, toRef } from 'vue'
import { useOverlay } from '#imports'
import type { SoporteTiMensaje, SoporteTiEnviarMensajePayload } from '~/types/soporteTi'
import type { FileItem } from '~/types/commons/file'
import { SOPORTE_TI_MAX_IMAGENES_CHAT, SOPORTE_TI_MAX_IMAGEN_MB } from '~/constants/soporteTi'
import { useSoporteTiContador } from '~/composables/useSoporteTiContador'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import SoporteTiChatReplyPreview from '~/components/soporte-ti/SoporteTiChatReplyPreview.vue'
import SoporteTiChatImagenEditor from '~/components/soporte-ti/SoporteTiChatImagenEditor.vue'
import SoporteTiChatDocumentoPreview from '~/components/soporte-ti/SoporteTiChatDocumentoPreview.vue'
import SoporteTiChatEmojiPicker from '~/components/soporte-ti/SoporteTiChatEmojiPicker.vue'
import SoporteTiChatEstadoEnvio from '~/components/soporte-ti/SoporteTiChatEstadoEnvio.vue'
import SoporteTiChatAdjuntoMensaje from '~/components/soporte-ti/SoporteTiChatAdjuntoMensaje.vue'
import SoporteTiChatMensajeInfoModal from '~/components/soporte-ti/SoporteTiChatMensajeInfoModal.vue'
import SoporteTiChatPanelSkeleton from '~/components/soporte-ti/SoporteTiChatPanelSkeleton.vue'
import SoporteTiFasesProyectoBar from '~/components/soporte-ti/SoporteTiFasesProyectoBar.vue'
import { SOPORTE_TI_CHAT_ACCEPT_DOCUMENTOS } from '~/constants/soporteTiChat'
import { esImagenAdjunto } from '~/utils/soporteTiChatAdjunto'

const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

const props = withDefaults(
  defineProps<{
    codigoTicket: string
    salaUuid: string
    mensajes: SoporteTiMensaje[]
    hasMoreOlder?: boolean
    loadingChat?: boolean
    loadingOlder?: boolean
    modoSolicitante?: boolean
    mostrarFasesCabecera?: boolean
    faseIndex?: number
    fullHeight?: boolean
    contadorActivo?: boolean
    contadorPausado?: boolean
    contadorFin?: string | null
    contadorRestanteSegundos?: number | null
    contadorVencido?: boolean
    terminoMaximo?: string | null
  }>(),
  {
    hasMoreOlder: false,
    loadingChat: false,
    loadingOlder: false,
    modoSolicitante: false,
    mostrarFasesCabecera: false,
    faseIndex: 0,
    fullHeight: false,
    contadorActivo: false,
    contadorPausado: false,
    contadorFin: null,
    contadorRestanteSegundos: null,
    contadorVencido: false,
    terminoMaximo: null
  }
)

const emit = defineEmits<{
  send: [payload: SoporteTiEnviarMensajePayload]
  'load-older': []
}>()

const cardUi = {
  root: 'flex flex-col min-h-0 h-full overflow-hidden',
  header: 'shrink-0 p-0 sm:p-0',
  body: 'flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:p-0',
  footer: 'shrink-0 p-0 sm:p-0'
}

const alturaClase = computed(() =>
  props.fullHeight
    ? 'h-full min-h-0 flex-1'
    : 'h-[min(32rem,calc(100dvh-11rem))] min-h-[260px]'
)

/** Misma cabecera SLA (código, tiempo restante, término) que ve el solicitante. */
const mostrarCabeceraSla = computed(() => {
  if (props.modoSolicitante) return true
  if (props.contadorActivo) return true
  const t = (props.terminoMaximo ?? '').trim()
  return Boolean(t && t !== '—' && t !== 'Por definir')
})

const anchoBurbuja = computed(() =>
  props.modoSolicitante ? 'max-w-[min(36rem,88%)]' : 'max-w-[min(20rem,85%)]'
)

const { etiqueta: etiquetaContador, vencido: contadorVencidoLive } = useSoporteTiContador(
  toRef(props, 'contadorActivo'),
  toRef(props, 'contadorFin'),
  toRef(props, 'contadorPausado'),
  toRef(props, 'contadorRestanteSegundos')
)

const contadorVencidoUi = computed(
  () => props.contadorVencido || contadorVencidoLive.value
)

const etiquetaContadorMostrar = computed(() => {
  if (!props.contadorActivo) return null
  if (contadorVencidoUi.value) return '00:00:00'
  return etiquetaContador.value
})

const texto = ref('')
const scrollRef = ref<HTMLElement | null>(null)
const fileInputImagenRef = ref<HTMLInputElement | null>(null)
const fileInputDocumentoRef = ref<HTMLInputElement | null>(null)
const editorAdjuntoRef = ref<InstanceType<typeof SoporteTiChatImagenEditor> | null>(null)
const replyTarget = ref<SoporteTiMensaje | null>(null)
const infoMensajeAbierto = ref(false)
const infoMensajeId = ref<number | null>(null)

function abrirInfoMensaje(m: SoporteTiMensaje) {
  if (!m.esPropio || m.id <= 0) return
  infoMensajeId.value = m.id
  infoMensajeAbierto.value = true
}

const replyPreviewImagenUrl = computed(
  () => replyTarget.value?.imagenes?.[0]?.url ?? null
)
const imagenesPendientes = ref<{ file: File; preview: string }[]>([])
const documentoPendiente = ref<{ file: File } | null>(null)
const indiceAdjunto = ref(0)

const modoVistaAdjunto = computed(
  () => imagenesPendientes.value.length > 0 || documentoPendiente.value !== null
)

const tituloVistaAdjunto = computed(() => {
  if (documentoPendiente.value) return documentoPendiente.value.file.name
  if (imagenesPendientes.value.length === 1) return '1 imagen'
  return `${imagenesPendientes.value.length} imágenes`
})

const imagenAdjuntoActual = computed(
  () => imagenesPendientes.value[indiceAdjunto.value] ?? null
)

const menuAdjuntosAbierto = ref(false)

const puedeEnviar = computed(
  () =>
    texto.value.trim().length > 0 ||
    imagenesPendientes.value.length > 0 ||
    documentoPendiente.value !== null
)

const cercaDelFinal = ref(true)
const scrollHeightAntes = ref(0)
const primerIdAnterior = ref<number | null>(null)

const mostrarBajar = computed(() => !cercaDelFinal.value)

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  cercaDelFinal.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

function bajarAlFinal() {
  const el = scrollRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  cercaDelFinal.value = true
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

function insertarEmoji(emoji: string) {
  texto.value += emoji
}

function abrirSelectorImagenes() {
  menuAdjuntosAbierto.value = false
  fileInputImagenRef.value?.click()
}

function abrirSelectorDocumento() {
  menuAdjuntosAbierto.value = false
  fileInputDocumentoRef.value?.click()
}

function limpiarImagenesPendientes() {
  imagenesPendientes.value.forEach((i) => URL.revokeObjectURL(i.preview))
  imagenesPendientes.value = []
  indiceAdjunto.value = 0
}

function onPickDocumento(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > SOPORTE_TI_MAX_IMAGEN_MB * 1048576) return
  if (esImagenAdjunto(file)) {
    limpiarImagenesPendientes()
    documentoPendiente.value = null
    imagenesPendientes.value = [{ file, preview: URL.createObjectURL(file) }]
    indiceAdjunto.value = 0
    return
  }
  limpiarImagenesPendientes()
  documentoPendiente.value = { file }
}

function onPickImagenes(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  documentoPendiente.value = null
  const restantes = SOPORTE_TI_MAX_IMAGENES_CHAT - imagenesPendientes.value.length
  const nuevas: { file: File; preview: string }[] = []
  Array.from(input.files)
    .slice(0, restantes)
    .forEach((file) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > SOPORTE_TI_MAX_IMAGEN_MB * 1048576) return
      nuevas.push({
        file,
        preview: URL.createObjectURL(file)
      })
    })
  if (nuevas.length) {
    imagenesPendientes.value = [...imagenesPendientes.value, ...nuevas]
    indiceAdjunto.value = imagenesPendientes.value.length - 1
  }
  input.value = ''
}

function descartarAdjuntos() {
  limpiarImagenesPendientes()
  documentoPendiente.value = null
}

async function cambiarAdjunto(i: number) {
  if (i === indiceAdjunto.value || i < 0 || i >= imagenesPendientes.value.length) return
  await editorAdjuntoRef.value?.aplicar()
  indiceAdjunto.value = i
}

function onImagenEditada(payload: { file: File; preview: string }) {
  const i = indiceAdjunto.value
  const item = imagenesPendientes.value[i]
  if (!item) return
  if (item.preview !== payload.preview) URL.revokeObjectURL(item.preview)
  imagenesPendientes.value[i] = { file: payload.file, preview: payload.preview }
}

function quitarImagen(index: number) {
  const item = imagenesPendientes.value[index]
  if (item?.preview) URL.revokeObjectURL(item.preview)
  const restantes = imagenesPendientes.value.filter((_, i) => i !== index)
  imagenesPendientes.value = restantes
  if (!restantes.length) {
    indiceAdjunto.value = 0
    return
  }
  if (indiceAdjunto.value >= restantes.length) {
    indiceAdjunto.value = restantes.length - 1
  } else if (indiceAdjunto.value > index) {
    indiceAdjunto.value -= 1
  }
}

async function enviar() {
  if (!puedeEnviar.value) return
  await editorAdjuntoRef.value?.aplicar()
  const archivos = documentoPendiente.value
    ? [documentoPendiente.value.file]
    : imagenesPendientes.value.map((i) => i.file)
  emit('send', {
    texto: texto.value.trim(),
    replyToId: replyTarget.value?.id ?? null,
    imagenes: archivos.length ? archivos : undefined
  })
  texto.value = ''
  replyTarget.value = null
  descartarAdjuntos()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    enviar()
  }
}

function urlAdjuntoArchivo(m: SoporteTiMensaje): string {
  return m.imagenes?.[0]?.url ?? ''
}

function extensionDesde(url: string, nombre?: string): string {
  const base = (nombre || url).split('?')[0] || ''
  return (base.split('.').pop() || 'jpg').toLowerCase()
}

function abrirPreview(url: string, nombre?: string) {
  if (!url) return
  const ext = extensionDesde(url, nombre)
  const esImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const fileItem: FileItem = {
    id: 0,
    file_name: nombre || 'archivo',
    file_url: url,
    type: esImg ? 'image' : 'file',
    size: 0,
    lastModified: 0,
    file_ext: ext
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}

onUnmounted(() => {
  descartarAdjuntos()
})
</script>
