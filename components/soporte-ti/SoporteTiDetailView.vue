<template>
  <div class="w-full max-w-full">
    <div class="flex flex-col gap-5 lg:flex-row">
      <div class="min-w-0 flex-1 space-y-5">
        <UCard>
          <div class="mb-4 flex flex-wrap items-center gap-1.5">
            <UBadge :color="badgeColorEstado(ticket.estadoCodigo)" variant="subtle">
              {{ ticket.estado }}
            </UBadge>
            <UBadge :color="badgeColorTipo" variant="subtle">
              {{ ticket.tipo === 'A' ? 'A' : ticket.subtipoB || 'B' }}
            </UBadge>
            <UBadge :color="badgeColorComplejidad(ticket.criticidad)" variant="subtle">
              {{ etiquetaComplejidadBadge }}
            </UBadge>
            <span class="ml-2 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-calendar-days" class="size-3" />
              {{ ticket.fechaRegistro }}
            </span>
            <span class="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-clock" class="size-3" />
              Últ: {{ ticket.ultimaActualizacion }}
            </span>
          </div>
          <dl class="grid grid-cols-2 gap-3">
            <div>
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">Código</dt>
              <dd class="font-mono text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.codigo }}</dd>
            </div>
            <div>
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">Área</dt>
              <dd class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.area }}</dd>
            </div>
            <div>
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">Solicitante</dt>
              <dd class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.solicitante }}</dd>
            </div>
            <div v-if="ticket.pm">
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">PM</dt>
              <dd class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.pm }}</dd>
            </div>
            <div>
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">Analista</dt>
              <dd class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.analista || 'Por asignar' }}</dd>
            </div>
            <div>
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">Complejidad</dt>
              <dd class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.criticidad }}</dd>
            </div>
            <div>
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">Estado</dt>
              <dd class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.estado }}</dd>
            </div>
            <div v-if="ticket.fechaFinEstimado">
              <dt class="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">Fin estimado</dt>
              <dd class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ ticket.fechaFinEstimado }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard v-if="ticket.tipo === 'A'">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Fase actual
            </p>
            <p class="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{{ faseActualNombre }}</p>
            <p v-if="ticket.fechaFinEstimado" class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              Fin estimado: {{ ticket.fechaFinEstimado }}
            </p>
          </div>
        </UCard>

        <SoporteTiMaquetaPreview
          v-if="ticket.tipo === 'A' && ticket.maqueta"
          :maqueta="ticket.maqueta"
          :rol="rolActivo"
          @approve="aprobarMaqueta"
          @reject="rechazarMaqueta"
        />

        <UCard v-if="rolActivo === 'Analista'">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Gestión del analista
          </p>
          <div class="space-y-4">
            <div
              class="grid w-full min-w-0 max-w-md grid-cols-2 gap-3"
              @click.stop
              @pointerdown.stop
            >
              <div class="min-w-0 space-y-1">
                <span
                  class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Complejidad
                </span>
                <USelect
                  :model-value="valorComplejidadAnalistaSelect"
                  :items="itemsComplejidadAnalistaLista"
                  value-key="value"
                  label-key="label"
                  size="sm"
                  class="w-full min-w-0"
                  placeholder="Definir"
                  @update:model-value="void onCambioComplejidadAnalista($event)"
                />
              </div>
              <div class="min-w-0 space-y-1">
                <span
                  class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Estado
                </span>
                <p
                  v-if="!estadoAnalistaHabilitado"
                  class="text-[10px] leading-tight text-amber-600 dark:text-amber-400"
                >
                  Define complejidad primero.
                </p>
                <USelect
                  :model-value="ticket.estadoCodigo"
                  :items="itemsEstadoAnalistaLista"
                  :disabled="!estadoAnalistaHabilitado"
                  value-key="value"
                  label-key="label"
                  size="sm"
                  class="w-full min-w-0"
                  :title="!estadoAnalistaHabilitado ? 'Define primero la complejidad' : undefined"
                  placeholder="Estado"
                  @update:model-value="void onCambioEstadoAnalista($event)"
                />
              </div>
            </div>
            <p class="text-[11px] text-gray-500 dark:text-gray-400">
              Primero asigna la <strong>complejidad</strong> (Baja, Media, Alta o Máxima); con eso se habilita el
              <strong>estado</strong>. Para pasar a <strong>En progreso</strong> aplican las reglas del flujo; en tipo A con maqueta, esta debe estar aprobada.
            </p>
          </div>
        </UCard>

        <UCard v-if="mostrarBloqueSla">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">SLA</p>
          <SoporteTiSlaBar :sla="ticket.slaHoras" :transcurridas="ticket.horasTranscurridas" />
          <div class="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
            <span class="text-green-600 dark:text-green-400">&lt; 75%</span>
            <span class="text-amber-600 dark:text-amber-400">75–100%</span>
            <span class="text-red-600 dark:text-red-400">&gt; 100%</span>
          </div>
        </UCard>
      </div>

      <div class="w-full shrink-0 space-y-3 lg:w-[280px]">
        <SoporteTiUploadPanel
          v-if="mostrarSubidaMaqueta"
          @upload="onMaquetaUpload"
        />

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
          </div>
        </UCard>

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
import { estadoPorCodigo, SOPORTE_TI_ESTADOS } from '~/constants/soporteTiEstados'
import type { SoporteTiRol } from '~/constants/soporteTi'
import type { SoporteTiMaqueta, SoporteTiSolicitud } from '~/types/soporteTi'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import {
  SOPORTE_TI_COMPLEJIDADES,
  esComplejidadDefinida,
  esComplejidadCatalogo,
  puedePasarAEnProgreso
} from '~/utils/soporteTiCriticidad'
import { aplicarCambioEstadoEnSolicitud } from '~/utils/soporteTiEstadoTransition'
import SoporteTiSlaBar from '~/components/soporte-ti/SoporteTiSlaBar.vue'
import SoporteTiMaquetaPreview from '~/components/soporte-ti/SoporteTiMaquetaPreview.vue'
import SoporteTiUploadPanel from '~/components/soporte-ti/SoporteTiUploadPanel.vue'
import SoporteTiChatPanel from '~/components/soporte-ti/SoporteTiChatPanel.vue'

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

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
const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()

const itemsComplejidadAnalistaLista = SOPORTE_TI_COMPLEJIDADES.map((c) => ({
  label: c,
  value: c
}))

const itemsEstadoAnalistaLista = computed(() =>
  SOPORTE_TI_ESTADOS.filter(
    (e) =>
      e.codigo !== 'operativo' &&
      (e.tipoSolicitud === null || e.tipoSolicitud === props.ticket.tipo)
  ).map((e) => ({ label: e.nombre, value: e.codigo }))
)

const estadoAnalistaHabilitado = computed(() => esComplejidadCatalogo(props.ticket.criticidad))

const valorComplejidadAnalistaSelect = computed(() => {
  const c = props.ticket.criticidad
  return esComplejidadCatalogo(c) ? c : undefined
})

const mostrarBloqueSla = computed(() => {
  if (rolActivo.value === 'Solicitante') return false
  if (!esComplejidadDefinida(props.ticket.criticidad)) return false
  return esComplejidadCatalogo(props.ticket.criticidad)
})

const etiquetaComplejidadBadge = computed(() => props.ticket.criticidad)

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

const MAPA_ACCION_ESTADO_CODIGO: Record<string, string> = {
  en_maqueta: 'en_maqueta',
  en_progreso: 'en_progreso',
  hecho: 'hecho',
  desplegado: 'desplegado',
  operativo: 'operativo',
  observado: 'observado'
}

type AccionKey =
  | 'en_maqueta'
  | 'en_progreso'
  | 'hecho'
  | 'desplegado'
  | 'operativo'
  | 'observado'

type AccionDef = {
  key: AccionKey
  label: string
  color: BadgeColor
  variant: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
}

function badgeColorEstado(codigo: string): BadgeColor {
  const c = (codigo || '').toLowerCase()
  const map: Record<string, BadgeColor> = {
    pendiente: 'neutral',
    en_maqueta: 'primary',
    en_progreso: 'primary',
    hecho: 'success',
    desplegado: 'warning',
    operativo: 'success',
    observado: 'error'
  }
  return map[c] ?? 'neutral'
}

const badgeColorTipo = computed((): BadgeColor => {
  if (props.ticket.tipo === 'A') return 'primary'
  const sub = (props.ticket.subtipoB || '').toUpperCase()
  if (sub === 'B1') return 'error'
  if (sub === 'B2') return 'warning'
  return 'neutral'
})

function badgeColorComplejidad(etiqueta: string): BadgeColor {
  const e = (etiqueta || '').toLowerCase()
  if (e.includes('máx') || e.includes('max')) return 'error'
  if (e.includes('alta') || e.includes('crít') || e.includes('crit')) return 'error'
  if (e.includes('media')) return 'warning'
  if (e.includes('baja')) return 'success'
  return 'neutral'
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
  if (i < fi) {
    return 'border-green-500 font-medium text-green-600 dark:text-green-400'
  }
  if (i === fi) {
    return 'border-primary font-semibold text-primary'
  }
  return 'border-gray-200 font-normal text-gray-400 dark:border-gray-600 dark:text-gray-500'
}

function prefijoFase(i: number) {
  const fi = props.ticket.faseIndex || 0
  if (i < fi) return '✓ '
  if (i === fi) return '● '
  return ''
}

const acciones = computed((): AccionDef[] => {
  const rol = rolActivo.value as SoporteTiRol
  const t = props.ticket
  if (rol === 'PM' && t.tipo === 'B') {
    return []
  }
  const a: AccionDef[] = []
  if (rol === 'Solicitante' && t.estadoCodigo === 'desplegado') {
    a.push({
      key: 'operativo',
      label: 'Confirmar Operativo',
      color: 'success',
      variant: 'solid'
    })
    a.push({
      key: 'observado',
      label: 'Devolver con observaciones',
      color: 'error',
      variant: 'outline'
    })
  }
  if (rol === 'PM' && t.tipo === 'A' && t.estadoCodigo === 'pendiente') {
    a.push({
      key: 'en_maqueta',
      label: 'Pasar a En maqueta',
      color: 'neutral',
      variant: 'outline'
    })
  }
  if (rol === 'Analista') {
    if (t.tipo === 'B') {
      if (t.estadoCodigo === 'pendiente' && puedePasarAEnProgreso(t)) {
        a.push({
          key: 'en_progreso',
          label: 'Tomar — En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
      if (t.estadoCodigo === 'en_progreso') {
        a.push({
          key: 'hecho',
          label: 'Marcar Hecho',
          color: 'success',
          variant: 'outline'
        })
      }
      if (t.estadoCodigo === 'hecho') {
        a.push({
          key: 'desplegado',
          label: 'Marcar Desplegado',
          color: 'warning',
          variant: 'outline'
        })
      }
      if (t.estadoCodigo === 'observado' && puedePasarAEnProgreso(t)) {
        a.push({
          key: 'en_progreso',
          label: 'Retomar En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
    }
    if (t.tipo === 'A') {
      if (t.estadoCodigo === 'en_maqueta' && t.maqueta?.aprobada && puedePasarAEnProgreso(t)) {
        a.push({
          key: 'en_progreso',
          label: 'Pasar a En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
      if (t.estadoCodigo === 'en_progreso') {
        a.push({
          key: 'desplegado',
          label: 'Marcar Desplegado',
          color: 'warning',
          variant: 'outline'
        })
      }
      if (t.estadoCodigo === 'observado' && puedePasarAEnProgreso(t)) {
        a.push({
          key: 'en_progreso',
          label: 'Retomar En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
    }
  }
  return a
})

async function onCambioComplejidadAnalista(val: unknown) {
  const raw = typeof val === 'string' ? val : String(val ?? '')
  if (!esComplejidadCatalogo(raw)) return
  const t = props.ticket
  if (t.criticidad === raw) return
  try {
    await withSpinner(async () => {
      const res = await actualizarSolicitud({
        ...t,
        criticidad: raw,
        ultimaActualizacion: etiquetaAhora()
      })
      if (res.ok === false) throw new Error(res.error)
    }, 'Actualizando complejidad…')
    agregarMensajeSistema(t.chatUuid, t.codigo, `Complejidad actualizada a «${raw}».`)
    showSuccess('Complejidad actualizada', `El ticket ${t.codigo} quedó en «${raw}».`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar la complejidad.'
    showError('Error al actualizar complejidad', msg)
  }
}

async function onCambioEstadoAnalista(val: unknown) {
  if (!estadoAnalistaHabilitado.value) return
  const nuevoCodigo = typeof val === 'string' ? val : String(val ?? '')
  const t = props.ticket
  if (!nuevoCodigo || nuevoCodigo === t.estadoCodigo) return
  if (nuevoCodigo === 'en_progreso' && !puedePasarAEnProgreso(t)) {
    showError(
      'No se puede pasar a En progreso',
      'Revisa la complejidad y el flujo (en tipo A con maqueta, debe estar aprobada).'
    )
    return
  }
  const actualizada = aplicarCambioEstadoEnSolicitud(t, nuevoCodigo)
  try {
    await withSpinner(async () => {
      const res = await actualizarSolicitud({
        ...actualizada,
        ultimaActualizacion: etiquetaAhora()
      })
      if (res.ok === false) throw new Error(res.error)
    }, 'Actualizando estado…')
    agregarMensajeSistema(t.chatUuid, t.codigo, `Estado actualizado a "${actualizada.estado}" (analista).`)
    showSuccess('Estado actualizado', `El ticket ${t.codigo} pasó a «${actualizada.estado}».`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar el estado.'
    showError('Error al actualizar estado', msg)
  }
}

async function ejecutarAccion(key: AccionKey) {
  const t = props.ticket
  const codigoNuevo = MAPA_ACCION_ESTADO_CODIGO[key] ?? t.estadoCodigo
  if (codigoNuevo === 'en_progreso' && !puedePasarAEnProgreso(t)) {
    showError(
      'No se puede pasar a En progreso',
      'Asigna la complejidad (Baja, Media, Alta o Máxima). En tipo A con maqueta, debe estar aprobada.'
    )
    return
  }
  const def = estadoPorCodigo(codigoNuevo)
  if (!def) return
  let faseIndex = t.faseIndex || 0
  if (t.tipo === 'A') {
    if (key === 'en_maqueta') faseIndex = 1
    else if (key === 'en_progreso' && faseIndex < 2) faseIndex = 2
  }
  const progreso = key === 'operativo' ? 100 : t.progreso
  try {
    await withSpinner(async () => {
      const res = await actualizarSolicitud({
        ...t,
        estadoId: def.id,
        estadoCodigo: def.codigo,
        estado: def.nombre,
        faseIndex,
        progreso,
        ultimaActualizacion: etiquetaAhora()
      })
      if (res.ok === false) throw new Error(res.error)
    }, 'Actualizando estado…')
    agregarMensajeSistema(
      t.chatUuid,
      t.codigo,
      `Estado actualizado a "${def.nombre}" por ${rolActivo.value}.`
    )
    showSuccess('Estado actualizado', `El ticket ${t.codigo} pasó a «${def.nombre}».`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar el estado.'
    showError('Error al actualizar estado', msg)
  }
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
