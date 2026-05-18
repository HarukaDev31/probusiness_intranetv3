<template>
  <SoporteTiChatPanel
    :key="chatUuid"
    :modo-solicitante="modoSolicitante"
    :full-height="fullHeight"
    :class="panelClass"
    :codigo-ticket="codigoTicket"
    :sala-uuid="chatUuid"
    :mensajes="mensajes"
    :has-more-older="chatMeta.hasMoreOlder"
    :loading-chat="chatMeta.loading"
    :loading-older="chatMeta.loadingOlder"
    :contador-activo="contadorActivo"
    :contador-fin="contadorFin"
    :contador-vencido="contadorVencido"
    :termino-maximo="terminoMaximo"
    :mostrar-fases-cabecera="mostrarFasesCabecera"
    :fase-index="faseIndex"
    @send="(payload) => void enviarChat(chatUuid, payload)"
    @load-older="void cargarMensajesAnteriores(chatUuid)"
  />
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import SoporteTiChatPanel from '~/components/soporte-ti/SoporteTiChatPanel.vue'

const props = withDefaults(
  defineProps<{
    chatUuid: string
    codigoTicket: string
    modoSolicitante?: boolean
    fullHeight?: boolean
    panelClass?: string
    contadorActivo?: boolean
    contadorFin?: string | null
    contadorVencido?: boolean
    terminoMaximo?: string | null
    mostrarFasesCabecera?: boolean
    faseIndex?: number
  }>(),
  {
    modoSolicitante: false,
    fullHeight: true,
    panelClass: '',
    contadorActivo: false,
    contadorFin: null,
    contadorVencido: false,
    terminoMaximo: null,
    mostrarFasesCabecera: false,
    faseIndex: 0
  }
)

const {
  enviarChat,
  mensajesDe,
  metaDe,
  cargarChatInicial,
  cargarMensajesAnteriores,
  resetSala
} = useSoporteTi()

const { setSalaActiva } = useSoporteTiChatRoom()

const chatUuid = computed(() => props.chatUuid)
const mensajes = computed(() => mensajesDe(props.chatUuid))
const chatMeta = computed(() => metaDe(props.chatUuid))

watch(
  chatUuid,
  (uuid) => {
    if (!uuid) return
    setSalaActiva(uuid)
    void cargarChatInicial(uuid)
  },
  { immediate: true }
)

onUnmounted(() => {
  const uuid = props.chatUuid
  setSalaActiva(null)
  if (uuid) resetSala(uuid)
})
</script>
