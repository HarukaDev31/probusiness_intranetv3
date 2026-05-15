<template>
  <div class="flex-1 overflow-y-auto p-5">
    <button
      type="button"
      class="mb-3 flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-800"
      @click="emit('back')"
    >
      <UIcon name="i-heroicons-chevron-left" class="size-3.5" />
      Volver al listado
    </button>

    <div class="flex flex-col gap-5 lg:flex-row">
      <div class="min-w-0 flex-1">
        <div class="mb-4 rounded-xl border border-slate-200 bg-white p-5">
          <h1 class="mb-2 text-[17px] font-semibold text-slate-800">{{ ticket.titulo }}</h1>
          <div class="mb-4 flex flex-wrap items-center gap-1.5">
            <SoporteTiBadge :etiqueta="ticket.estado" />
            <SoporteTiBadge :etiqueta="ticket.tipo === 'A' ? 'A' : (ticket.subtipoB || 'B')" />
            <SoporteTiBadge :etiqueta="ticket.criticidad" />
            <span class="ml-2 flex items-center gap-1 text-[11px] text-slate-400">
              <UIcon name="i-heroicons-calendar-days" class="size-3" />
              {{ ticket.fechaRegistro }}
            </span>
            <span class="flex items-center gap-1 text-[11px] text-slate-400">
              <UIcon name="i-heroicons-clock" class="size-3" />
              Últ: {{ ticket.ultimaActualizacion }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="mb-0.5 text-[10px] text-slate-400">Código</p>
              <p class="font-mono text-[12px] font-medium text-slate-700">{{ ticket.codigo }}</p>
            </div>
            <div>
              <p class="mb-0.5 text-[10px] text-slate-400">Área</p>
              <p class="text-[12px] font-medium text-slate-700">{{ ticket.area }}</p>
            </div>
            <div>
              <p class="mb-0.5 text-[10px] text-slate-400">Solicitante</p>
              <p class="text-[12px] font-medium text-slate-700">{{ ticket.solicitante }}</p>
            </div>
            <div v-if="ticket.pm">
              <p class="mb-0.5 text-[10px] text-slate-400">PM</p>
              <p class="text-[12px] font-medium text-slate-700">{{ ticket.pm }}</p>
            </div>
            <div>
              <p class="mb-0.5 text-[10px] text-slate-400">Analista</p>
              <p class="text-[12px] font-medium text-slate-700">{{ ticket.analista || 'Por asignar' }}</p>
            </div>
            <div v-if="ticket.fechaFinEstimado">
              <p class="mb-0.5 text-[10px] text-slate-400">Fin estimado</p>
              <p class="text-[12px] font-medium text-slate-700">{{ ticket.fechaFinEstimado }}</p>
            </div>
          </div>
        </div>

        <div v-if="ticket.tipo === 'A'" class="mb-4 rounded-xl border border-slate-200 bg-white p-5">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Fases del proyecto
          </p>
          <div class="mb-4 flex">
            <div
              v-for="(f, i) in fasesA"
              :key="f"
              class="flex-1 border-t-[3px] py-1.5 text-center text-[10px]"
              :class="claseFase(i)"
            >
              {{ prefijoFase(i) }}{{ f }}
            </div>
          </div>
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p class="mb-0.5 text-[10px] font-semibold text-blue-700">Fase actual</p>
            <p class="text-[13px] font-semibold text-slate-800">{{ faseActualNombre }}</p>
            <p v-if="ticket.fechaFinEstimado" class="mt-0.5 text-[11px] text-slate-500">
              Fin estimado: {{ ticket.fechaFinEstimado }}
            </p>
          </div>
        </div>

        <SoporteTiMaquetaPreview
          v-if="ticket.tipo === 'A' && ticket.maqueta"
          :maqueta="ticket.maqueta"
          :rol="rolActivo"
          @approve="aprobarMaqueta"
          @reject="rechazarMaqueta"
        />

        <div class="mb-4 rounded-xl border border-slate-200 bg-white p-5">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">SLA</p>
          <SoporteTiSlaBar :sla="ticket.slaHoras" :transcurridas="ticket.horasTranscurridas" />
          <div class="mt-2 flex gap-3 text-[10px] text-slate-400">
            <span class="text-green-600">● &lt; 75%</span>
            <span class="text-amber-600">● 75–100%</span>
            <span class="text-red-600">● &gt; 100%</span>
          </div>
        </div>
      </div>

      <div class="w-full shrink-0 space-y-3 lg:w-[280px]">
        <SoporteTiUploadPanel
          v-if="mostrarSubidaMaqueta"
          @upload="onMaquetaUpload"
        />

        <div v-if="acciones.length" class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Acciones</p>
          <div class="flex flex-col gap-2">
            <button
              v-for="a in acciones"
              :key="a.key"
              type="button"
              class="w-full rounded-lg border py-2 text-[12px] font-medium transition"
              :class="a.clase"
              @click="ejecutarAccion(a.key)"
            >
              {{ a.label }}
            </button>
          </div>
        </div>

        <SoporteTiChatPanel
          :codigo-ticket="ticket.codigo"
          :sala-uuid="ticket.chatUuid"
          :mensajes="mensajesDe(ticket.chatUuid)"
          :has-more-older="metaDe(ticket.chatUuid).hasMoreOlder"
          :loading-chat="metaDe(ticket.chatUuid).loading"
          :loading-older="metaDe(ticket.chatUuid).loadingOlder"
          @send="(payload) => void enviarChat(ticket.chatUuid, payload)"
          @load-older="void cargarMensajesAnteriores(ticket.chatUuid)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { SOPORTE_TI_FASES_A } from '~/constants/soporteTi'
import { estadoPorCodigo } from '~/constants/soporteTiEstados'
import type { SoporteTiRol } from '~/constants/soporteTi'
import type { SoporteTiMaqueta, SoporteTiSolicitud } from '~/types/soporteTi'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import SoporteTiBadge from '~/components/soporte-ti/SoporteTiBadge.vue'
import SoporteTiSlaBar from '~/components/soporte-ti/SoporteTiSlaBar.vue'
import SoporteTiMaquetaPreview from '~/components/soporte-ti/SoporteTiMaquetaPreview.vue'
import SoporteTiUploadPanel from '~/components/soporte-ti/SoporteTiUploadPanel.vue'
import SoporteTiChatPanel from '~/components/soporte-ti/SoporteTiChatPanel.vue'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

const emit = defineEmits<{
  back: []
}>()

const {
  rolActivo,
  actualizarSolicitud,
  agregarMensajeSistema,
  registrarMaquetaLocal,
  enviarChat,
  mensajesDe,
  metaDe,
  cargarChatInicial,
  cargarMensajesAnteriores,
  etiquetaAhora
} = useSoporteTi()

const { setSalaActiva } = useSoporteTiChatRoom()

watch(
  () => props.ticket.chatUuid,
  (uuid) => {
    if (!uuid) return
    setSalaActiva(uuid)
    void cargarChatInicial(uuid)
  },
  { immediate: true }
)

onUnmounted(() => {
  setSalaActiva(null)
})

const fasesA = SOPORTE_TI_FASES_A

/** Clave de acción → código en `soporte_ti_estados` */
const MAPA_ACCION_ESTADO_CODIGO: Record<string, string> = {
  en_maqueta: 'en_maqueta',
  en_progreso: 'en_progreso',
  hecho: 'hecho',
  desplegado: 'desplegado',
  operativo: 'operativo',
  observado: 'observado'
}

const mostrarSubidaMaqueta = computed(
  () =>
    rolActivo.value === 'PM' &&
    props.ticket.tipo === 'A' &&
    props.ticket.estadoCodigo === 'en_maqueta' &&
    !props.ticket.maqueta
)

const faseActualNombre = computed(() => fasesA[props.ticket.faseIndex || 0])

function claseFase(i: number) {
  const fi = props.ticket.faseIndex || 0
  if (i < fi) return 'border-green-500 font-medium text-green-600'
  if (i === fi) return 'border-blue-500 font-semibold text-blue-700'
  return 'border-slate-200 text-slate-400'
}

function prefijoFase(i: number) {
  const fi = props.ticket.faseIndex || 0
  if (i < fi) return '✓ '
  if (i === fi) return '● '
  return ''
}

type AccionKey =
  | 'en_maqueta'
  | 'en_progreso'
  | 'hecho'
  | 'desplegado'
  | 'operativo'
  | 'observado'

const acciones = computed(() => {
  const t = props.ticket
  const rol = rolActivo.value as SoporteTiRol
  const a: { key: AccionKey; label: string; clase: string }[] = []
  if (rol === 'Solicitante' && t.estadoCodigo === 'desplegado') {
    a.push({
      key: 'operativo',
      label: 'Confirmar Operativo',
      clase: 'border-green-300 text-green-700 hover:bg-green-50'
    })
    a.push({
      key: 'observado',
      label: 'Devolver con observaciones',
      clase: 'border-red-200 text-red-600 hover:bg-red-50'
    })
  }
  if (rol === 'PM' && t.tipo === 'A' && t.estadoCodigo === 'pendiente') {
    a.push({
      key: 'en_maqueta',
      label: 'Pasar a En maqueta',
      clase: 'border-slate-300 text-slate-700 hover:bg-slate-50'
    })
  }
  if (rol === 'Analista') {
    if (t.tipo === 'B') {
      if (t.estadoCodigo === 'pendiente') {
        a.push({
          key: 'en_progreso',
          label: 'Tomar — En progreso',
          clase: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
        })
      }
      if (t.estadoCodigo === 'en_progreso') {
        a.push({
          key: 'hecho',
          label: 'Marcar Hecho',
          clase: 'border-green-300 text-green-700 hover:bg-green-50'
        })
      }
      if (t.estadoCodigo === 'hecho') {
        a.push({
          key: 'desplegado',
          label: 'Marcar Desplegado',
          clase: 'border-amber-300 text-amber-700 hover:bg-amber-50'
        })
      }
      if (t.estadoCodigo === 'observado') {
        a.push({
          key: 'en_progreso',
          label: 'Retomar En progreso',
          clase: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
        })
      }
    }
    if (t.tipo === 'A') {
      if (t.estadoCodigo === 'en_maqueta' && t.maqueta?.aprobada) {
        a.push({
          key: 'en_progreso',
          label: 'Pasar a En progreso',
          clase: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
        })
      }
      if (t.estadoCodigo === 'en_progreso') {
        a.push({
          key: 'desplegado',
          label: 'Marcar Desplegado',
          clase: 'border-amber-300 text-amber-700 hover:bg-amber-50'
        })
      }
      if (t.estadoCodigo === 'observado') {
        a.push({
          key: 'en_progreso',
          label: 'Retomar En progreso',
          clase: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
        })
      }
    }
  }
  return a
})

function ejecutarAccion(key: AccionKey) {
  const t = props.ticket
  const codigoNuevo = MAPA_ACCION_ESTADO_CODIGO[key] ?? t.estadoCodigo
  const def = estadoPorCodigo(codigoNuevo)
  if (!def) return
  let faseIndex = t.faseIndex || 0
  if (t.tipo === 'A') {
    if (key === 'en_maqueta') faseIndex = 1
    else if (key === 'en_progreso' && faseIndex < 2) faseIndex = 2
  }
  const progreso = key === 'operativo' ? 100 : t.progreso
  void actualizarSolicitud({
    ...t,
    estadoId: def.id,
    estadoCodigo: def.codigo,
    estado: def.nombre,
    faseIndex,
    progreso,
    ultimaActualizacion: etiquetaAhora()
  })
  agregarMensajeSistema(
    t.chatUuid,
    t.codigo,
    `Estado actualizado a "${def.nombre}" por ${rolActivo.value}.`
  )
}

function onMaquetaUpload(mq: SoporteTiMaqueta & { dataUrl?: string | null }) {
  const t = props.ticket
  registrarMaquetaLocal(t.chatUuid, mq, 'He subido la maqueta para revisión.', mq.nombre)
}

function aprobarMaqueta() {
  const t = props.ticket
  if (!t.maqueta) return
  void actualizarSolicitud({
    ...t,
    maqueta: { ...t.maqueta, aprobada: true },
    ultimaActualizacion: etiquetaAhora()
  })
  agregarMensajeSistema(
    t.chatUuid,
    t.codigo,
    'Maqueta aprobada por el solicitante. El Analista puede avanzar a En progreso.'
  )
}

function rechazarMaqueta() {
  const t = props.ticket
  void actualizarSolicitud({
    ...t,
    maqueta: null,
    ultimaActualizacion: etiquetaAhora()
  })
  agregarMensajeSistema(t.chatUuid, t.codigo, 'Maqueta rechazada. PM debe subir nueva versión.')
}
</script>
