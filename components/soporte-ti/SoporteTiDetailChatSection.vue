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
    :contador-pausado="contadorPausado"
    :contador-fin="contadorFin"
    :contador-restante-segundos="contadorRestanteSegundos"
    :contador-vencido="contadorVencido"
    :termino-maximo="terminoMaximo"
    :ver-sla="verSla"
    :mostrar-fases-cabecera="mostrarFasesCabecera"
    :fase-index="faseIndex"
    :mostrar-confirmacion-creador="mostrarConfirmacionCreador"
    :ticket-confirmacion="ticketConfirmacion"
    :puede-aprobar-maqueta="puedeAprobarMaqueta"
    :maqueta-aprobada="maquetaAprobada"
    :maqueta-nombre="maquetaNombre"
    :procesando-maqueta-chat="procesandoMaquetaChat"
    @send="(payload) => void sendChat(chatUuid, payload)"
    @load-older="void cargarMensajesAnteriores(chatUuid)"
    @cambio-estado="emit('cambio-estado', $event)"
    @aprobar-maqueta="emit('aprobar-maqueta')"
    @rechazar-maqueta="emit('rechazar-maqueta')"
  />
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import SoporteTiChatPanel from '~/components/soporte-ti/SoporteTiChatPanel.vue'
import type { SoporteTiSolicitud } from '~/types/soporteTi'

const props = withDefaults(
  defineProps<{
    chatUuid: string
    codigoTicket: string
    modoSolicitante?: boolean
    fullHeight?: boolean
    panelClass?: string
    contadorActivo?: boolean
    contadorPausado?: boolean
    contadorFin?: string | null
    contadorRestanteSegundos?: number | null
    contadorVencido?: boolean
    terminoMaximo?: string | null
    verSla?: boolean
    mostrarFasesCabecera?: boolean
    faseIndex?: number
    mostrarConfirmacionCreador?: boolean
    ticketConfirmacion?: SoporteTiSolicitud | null
    puedeAprobarMaqueta?: boolean
    maquetaAprobada?: boolean
    maquetaNombre?: string | null
    procesandoMaquetaChat?: boolean
  }>(),
  {
    modoSolicitante: false,
    fullHeight: true,
    panelClass: '',
    contadorActivo: false,
    contadorPausado: false,
    contadorFin: null,
    contadorRestanteSegundos: null,
    contadorVencido: false,
    terminoMaximo: null,
    verSla: false,
    mostrarFasesCabecera: false,
    faseIndex: 0,
    mostrarConfirmacionCreador: false,
    ticketConfirmacion: null,
    puedeAprobarMaqueta: false,
    maquetaAprobada: false,
    maquetaNombre: null,
    procesandoMaquetaChat: false
  }
)

const emit = defineEmits<{
  'cambio-estado': [val: unknown]
  'aprobar-maqueta': []
  'rechazar-maqueta': []
}>()

const {
  sendChat,
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
