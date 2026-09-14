<template>
  <div class="flex min-h-0 w-full max-w-full flex-1 flex-col">
    <div v-if="esVistaSolicitante" class="flex min-h-0 flex-1 flex-col">
      <SoporteTiDetailChatSection
        modo-solicitante
        panel-class="min-h-[280px] flex-1"
        :chat-uuid="ticket.chatUuid"
        :codigo-ticket="ticket.codigo"
        :contador-activo="ticket.gestion.contadorActivo"
        :contador-pausado="ticket.gestion.contadorPausado"
        :contador-fin="ticket.gestion.contadorFin"
        :contador-restante-segundos="ticket.gestion.contadorRestanteSegundos"
        :contador-vencido="ticket.gestion.contadorVencido"
        :termino-maximo="ticket.gestion.terminoEstimado"
        :mostrar-confirmacion-creador="mostrarConfirmacionCreador"
        :ticket-confirmacion="ticket"
        :puede-aprobar-maqueta="puedeAprobarMaquetaEnChat"
        :maqueta-aprobada="Boolean(ticket.maqueta?.aprobada)"
        :maqueta-nombre="ticket.maqueta?.nombre ?? null"
        :procesando-maqueta-chat="procesandoMaqueta"
        @cambio-estado="void onCambioEstadoCreador($event)"
        @aprobar-maqueta="void onAprobarMaqueta()"
        @rechazar-maqueta="void onRechazarMaqueta()"
      />
    </div>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-stretch lg:gap-4 lg:overflow-hidden"
    >
      <div class="flex min-h-0 flex-col lg:col-span-2 lg:min-h-0 lg:overflow-hidden">
        <SoporteTiDetailChatSection
          panel-class="min-h-[280px] flex-1"
          :chat-uuid="ticket.chatUuid"
          :codigo-ticket="ticket.codigo"
          :contador-activo="ticket.gestion.contadorActivo"
          :contador-pausado="ticket.gestion.contadorPausado"
          :contador-fin="ticket.gestion.contadorFin"
          :contador-restante-segundos="ticket.gestion.contadorRestanteSegundos"
          :contador-vencido="ticket.gestion.contadorVencido"
          :termino-maximo="ticket.gestion.terminoEstimado"
          :ver-sla="ticket.gestion.verSla"
          :mostrar-fases-cabecera="ticket.tipo === 'A'"
          :fase-index="faseIndexEfectivo(ticket)"
          :puede-avanzar-fase="puedeAvanzarFase"
          @avanzar-fase="void cambiarFase($event)"
        />
      </div>

      <div class="min-w-0 space-y-5 overflow-y-auto lg:col-span-1 lg:max-h-[calc(100dvh-8rem)]">
        <UCard>
          <div class="mb-4 flex flex-wrap items-center gap-1.5">
            <UBadge :color="uBadgeColorEstado(ticket.estadoCodigo)" variant="subtle">
              {{ ticket.estado }}
            </UBadge>
            <UBadge :color="badgeColorTipo" variant="subtle">
              {{ ticket.tipo === 'A' ? 'A' : ticket.subtipoB || 'B' }}
            </UBadge>
            <UBadge
              v-if="mostrarComplejidad"
              :color="uBadgeColorComplejidad(ticket.criticidad)"
              variant="subtle"
            >
              {{ ticket.criticidad }}
            </UBadge>
          </div>
          <dl class="grid grid-cols-2 gap-3">
            <div>
              <dt class="mb-0.5 text-[10px] text-muted">Área</dt>
              <dd class="text-xs font-medium text-highlighted">{{ ticket.area }}</dd>
            </div>
            <div>
              <dt class="mb-0.5 text-[10px] text-muted">Solicitante</dt>
              <dd class="text-xs font-medium text-highlighted">{{ ticket.solicitante }}</dd>
            </div>
            <div v-if="mostrarTiempoEstimado">
              <dt class="mb-0.5 text-[10px] text-muted">Horas de la etapa</dt>
              <dd class="text-xs font-medium text-highlighted">{{ ticket.gestion.slaEtiqueta }}</dd>
            </div>
          </dl>
        </UCard>

        <SoporteTiMaquetaPreview
          v-if="ticket.tipo === 'A' && ticket.maqueta && rolActivo !== 'Solicitante'"
          :maqueta="ticket.maqueta"
          :rol="rolActivo"
        />

        <SoporteTiAsignacionCard :ticket="ticket" />

        <UCard v-if="ticket.gestion.esStaff && (ticket.gestion.puedeComplejidadPm || ticket.gestion.puedeComplejidadAnalista || ticket.gestion.puedeComplejidad || ticket.gestion.puedeEstado)">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {{ tituloGestionStaff }}
          </p>
          <SoporteTiAnalistaGestionSelect :ticket="ticket" />
        </UCard>

        <UCard v-if="acciones.length">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</p>
          <div class="flex flex-col gap-2">
            <UButton
              v-for="a in acciones"
              :key="a.key"
              block
              size="sm"
              :color="a.color"
              :variant="a.variant"
              @click="void ejecutarAccion(a.key)"
            >
              {{ a.label }}
            </UButton>
            <p v-if="mostrarHintPausaCapacitacion" class="mt-1 text-[11px] text-muted">
              En Capacitación puedes pasar a Pendiente para pausar el contador.
            </p>
          </div>
        </UCard>
      </div>
    </div>

    <SoporteTiModalMaquetaPm
      v-model:open="modalMaquetaAbierto"
      :loading="enviandoMaqueta"
      :cambiar-estado="modalMaquetaCambiarEstado"
      @confirm="onConfirmarMaqueta"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SoporteTiRol } from '~/constants/soporteTi'
import { CODE } from '~/constants/soporteTiEstados'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { faseIndexEfectivo } from '~/utils/soporteTiEstadoTransition'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiAcciones } from '~/composables/useSoporteTiAcciones'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import {
  uBadgeColorComplejidad,
  uBadgeColorEstado
} from '~/constants/soporteTiColores'
import SoporteTiAnalistaGestionSelect from '~/components/soporte-ti/SoporteTiAnalistaGestionSelect.vue'
import SoporteTiMaquetaPreview from '~/components/soporte-ti/SoporteTiMaquetaPreview.vue'
import SoporteTiDetailChatSection from '~/components/soporte-ti/SoporteTiDetailChatSection.vue'
import SoporteTiModalMaquetaPm from '~/components/soporte-ti/SoporteTiModalMaquetaPm.vue'
import SoporteTiAsignacionCard from '~/components/soporte-ti/SoporteTiAsignacionCard.vue'

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

const {
  rolActivo,
  update,
  nowLabel
} = useSoporteTi()

const { setState, submitMockup } = useSoporteTiAcciones()
const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()

const modalMaquetaAbierto = ref(false)
const modalMaquetaCambiarEstado = ref(true)
const enviandoMaqueta = ref(false)
const procesandoMaqueta = ref(false)

const esVistaSolicitante = computed(() => rolActivo.value === 'Solicitante')

const mostrarConfirmacionCreador = computed(
  () => Boolean(props.ticket.gestion.esCreador && props.ticket.gestion.puedeEstado)
)

/** Creador en En maqueta: aprueba desde el mensaje del chat, no desde un bloque aparte. */
const puedeAprobarMaquetaEnChat = computed(
  () =>
    props.ticket.tipo === 'A' &&
    props.ticket.estadoCodigo === CODE.MOCKUP &&
    Boolean(props.ticket.maqueta) &&
    !props.ticket.maqueta?.aprobada &&
    Boolean(props.ticket.gestion.esCreador)
)

function esValorPendiente(valor?: string | null): boolean {
  const v = (valor ?? '').trim().toLowerCase()
  return !v || v === 'por definir' || v === 'por asignar'
}

const mostrarComplejidad = computed(() => !esValorPendiente(props.ticket.criticidad))

const mostrarTiempoEstimado = computed(() => {
  const g = props.ticket.gestion
  if (!g.slaEtiqueta) return false
  return Boolean(g.esStaff && g.verSla)
})

const tituloGestionStaff = computed(() => {
  if (rolActivo.value === 'PM') return 'Gestión del PM'
  if (rolActivo.value === 'Analista') return 'Gestión del analista'
  return 'Gestión'
})

const puedeAvanzarFase = computed(() => {
  const t = props.ticket
  const rol = rolActivo.value
  if (t.tipo !== 'A') return false
  if (rol !== 'Analista' && rol !== 'PM') return false
  if (t.estadoCodigo !== CODE.IN_PROGRESS) return false
  const fi = faseIndexEfectivo(t)
  return fi === 2 || fi === 3
})

const mostrarHintPausaCapacitacion = computed(() => {
  const t = props.ticket
  const rol = rolActivo.value
  if (t.tipo !== 'A') return false
  if (rol !== 'Analista' && rol !== 'PM') return false
  return faseIndexEfectivo(t) >= 4 && (t.estadoCodigo === CODE.IN_PROGRESS || t.estadoCodigo === CODE.PENDING)
})

type AccionKey =
  | typeof CODE.MOCKUP
  | typeof CODE.IN_PROGRESS
  | typeof CODE.DONE
  | typeof CODE.DEPLOYED
  | typeof CODE.OPERATIVE
  | typeof CODE.OBSERVED
  | 'fase_pruebas'
  | 'fase_capacitacion'

type AccionDef = {
  key: AccionKey
  label: string
  color: BadgeColor
  variant: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
}

const badgeColorTipo = computed((): BadgeColor => {
  if (props.ticket.tipo === 'A') return 'primary'
  const sub = (props.ticket.subtipoB || '').toUpperCase()
  if (sub === 'B1') return 'error'
  if (sub === 'B2') return 'warning'
  return 'neutral'
})

const acciones = computed((): AccionDef[] => {
  const rol = rolActivo.value as SoporteTiRol
  const t = props.ticket
  if (rol === 'PM' && t.tipo === 'B') {
    return []
  }
  const a: AccionDef[] = []
  if (rol === 'PM' && t.tipo === 'A' && t.estadoCodigo === CODE.PENDING && faseIndexEfectivo(t) < 2) {
    a.push({
      key: CODE.MOCKUP,
      label: 'Pasar a En maqueta',
      color: 'neutral',
      variant: 'outline'
    })
  }
  if (rol === 'PM' && t.tipo === 'A' && t.estadoCodigo === CODE.MOCKUP) {
    a.push({
      key: CODE.MOCKUP,
      label: t.maqueta ? 'Actualizar maqueta' : 'Subir maqueta',
      color: 'neutral',
      variant: 'outline'
    })
  }
  if (rol === 'Analista') {
    if (t.tipo === 'B') {
      if (t.estadoCodigo === CODE.PENDING && t.gestion.puedeEnProgreso) {
        a.push({
          key: CODE.IN_PROGRESS,
          label: 'Tomar — En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
      if (t.estadoCodigo === CODE.IN_PROGRESS) {
        a.push({
          key: CODE.DONE,
          label: 'Marcar Hecho',
          color: 'success',
          variant: 'outline'
        })
      }
      if (t.estadoCodigo === CODE.DONE) {
        a.push({
          key: CODE.DEPLOYED,
          label: 'Marcar Desplegado',
          color: 'warning',
          variant: 'outline'
        })
      }
      if (t.estadoCodigo === CODE.OBSERVED && t.gestion.puedeEnProgreso) {
        a.push({
          key: CODE.IN_PROGRESS,
          label: 'Retomar En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
    }
    if (t.tipo === 'A') {
      if (t.estadoCodigo === CODE.PENDING && t.gestion.puedeEnProgreso) {
        const fi = faseIndexEfectivo(t)
        a.push({
          key: CODE.IN_PROGRESS,
          label: fi >= 2 ? 'Reanudar En progreso' : 'Tomar — En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
      if (t.estadoCodigo === CODE.MOCKUP && t.gestion.puedeEnProgreso) {
        a.push({
          key: CODE.IN_PROGRESS,
          label: 'Pasar a En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
      pushAccionesFaseTipoA(a, t)
      if (t.estadoCodigo === CODE.OBSERVED && t.gestion.puedeEnProgreso) {
        a.push({
          key: CODE.IN_PROGRESS,
          label: 'Retomar En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
    }
  }
  if (rol === 'PM' && t.tipo === 'A') {
    if (t.estadoCodigo === CODE.PENDING && t.gestion.puedeEnProgreso && faseIndexEfectivo(t) >= 2) {
      a.push({
        key: CODE.IN_PROGRESS,
        label: 'Reanudar En progreso',
        color: 'primary',
        variant: 'solid'
      })
    }
    pushAccionesFaseTipoA(a, t)
  }
  return a
})

function pushAccionesFaseTipoA(a: AccionDef[], t: SoporteTiSolicitud) {
  if (t.tipo !== 'A' || t.estadoCodigo !== CODE.IN_PROGRESS) return
  const fi = faseIndexEfectivo(t)
  if (fi === 2) {
    a.push({
      key: 'fase_pruebas',
      label: 'Pasar a Pruebas',
      color: 'primary',
      variant: 'solid'
    })
    return
  }
  if (fi === 3) {
    a.push({
      key: 'fase_capacitacion',
      label: 'Pasar a Capacitación',
      color: 'primary',
      variant: 'solid'
    })
    return
  }
  if (fi >= 4) {
    a.push({
      key: CODE.DEPLOYED,
      label: 'Marcar Desplegado',
      color: 'warning',
      variant: 'outline'
    })
  }
}

async function onCambioEstadoCreador(val: unknown) {
  const codigo = typeof val === 'string' ? val : String(val ?? '')
  await setState(props.ticket, codigo)
}

function abrirModalMaqueta(cambiarEstado: boolean) {
  modalMaquetaCambiarEstado.value = cambiarEstado
  modalMaquetaAbierto.value = true
}

async function ejecutarAccion(key: AccionKey) {
  const t = props.ticket
  if (key === CODE.MOCKUP) {
    abrirModalMaqueta(t.estadoCodigo === CODE.PENDING)
    return
  }
  if (key === 'fase_pruebas') {
    await cambiarFase(3)
    return
  }
  if (key === 'fase_capacitacion') {
    await cambiarFase(4)
    return
  }
  try {
    await withSpinner(async () => {
      const ok = await setState(t, key, { rolEtiqueta: rolActivo.value })
      if (!ok) throw new Error('No se pudo actualizar el estado')
    }, 'Actualizando estado…')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar el estado.'
    showError('Error al actualizar estado', msg)
  }
}

async function cambiarFase(faseIndex: number) {
  const t = props.ticket
  const nombres = ['Levantamiento', 'Maqueta', 'Configuración', 'Pruebas', 'Capacitación']
  const nombre = nombres[faseIndex] ?? 'la siguiente etapa'
  try {
    await withSpinner(async () => {
      const res = await update({
        ...t,
        faseIndex,
        ultimaActualizacion: nowLabel()
      })
      if (res.ok === false) throw new Error(res.error ?? 'No se pudo actualizar la fase')
    }, 'Actualizando fase…')
    showSuccess('Fase actualizada', `El contador ahora usa las horas de ${nombre}.`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar la fase.'
    showError('Error al actualizar fase', msg)
  }
}

async function onConfirmarMaqueta(payload: { archivos: File[]; mensaje: string }) {
  enviandoMaqueta.value = true
  try {
    const ok = await submitMockup(props.ticket, payload.archivos, {
      mensaje: payload.mensaje,
      cambiarEstado: modalMaquetaCambiarEstado.value
    })
    if (ok) modalMaquetaAbierto.value = false
  } finally {
    enviandoMaqueta.value = false
  }
}

async function onAprobarMaqueta() {
  const t = props.ticket
  if (!t.maqueta || procesandoMaqueta.value) return
  procesandoMaqueta.value = true
  try {
    await withSpinner(async () => {
      const res = await update({
        ...t,
        maqueta: { ...t.maqueta!, aprobada: true },
        ultimaActualizacion: nowLabel()
      })
      if (res.ok === false) throw new Error(res.error)
    }, 'Aprobando maqueta…')
    showSuccess('Maqueta aprobada', 'Soporte ya puede pasar el ticket a En progreso.')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo aprobar la maqueta.'
    showError('Error al aprobar maqueta', msg)
  } finally {
    procesandoMaqueta.value = false
  }
}

async function onRechazarMaqueta() {
  const t = props.ticket
  if (procesandoMaqueta.value) return
  procesandoMaqueta.value = true
  try {
    await withSpinner(async () => {
      const res = await update({
        ...t,
        maqueta: null,
        ultimaActualizacion: nowLabel()
      })
      if (res.ok === false) throw new Error(res.error)
    }, 'Rechazando maqueta…')
    showSuccess('Maqueta rechazada', 'El PM debe subir una nueva versión.')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo rechazar la maqueta.'
    showError('Error al rechazar maqueta', msg)
  } finally {
    procesandoMaqueta.value = false
  }
}
</script>
