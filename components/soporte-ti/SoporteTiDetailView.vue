<template>
  <div class="flex min-h-0 w-full max-w-full flex-1 flex-col">
    <div v-if="esVistaSolicitante" class="flex min-h-0 flex-1 flex-col">
      <UCard v-if="mostrarBarraSla" class="mb-3 shrink-0">
        <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Avance SLA
        </p>
        <SoporteTiSlaBar :sla="ticket.slaHoras" :transcurridas="ticket.horasTranscurridas" />
      </UCard>
      <SoporteTiDetailChatSection
        modo-solicitante
        panel-class="min-h-0 flex-1"
        :chat-uuid="ticket.chatUuid"
        :codigo-ticket="ticket.codigo"
        :contador-activo="ticket.gestion.contadorActivo"
        :contador-pausado="ticket.gestion.contadorPausado"
        :contador-fin="ticket.gestion.contadorFin"
        :contador-restante-segundos="ticket.gestion.contadorRestanteSegundos"
        :contador-vencido="ticket.gestion.contadorVencido"
        :termino-maximo="ticket.gestion.terminoEstimado"
      />
    </div>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-stretch lg:gap-4 lg:overflow-hidden"
    >
      <div class="flex min-h-0 flex-col lg:col-span-2 lg:min-h-0 lg:overflow-hidden">
        <SoporteTiDetailChatSection
          panel-class="min-h-0 flex-1"
          :chat-uuid="ticket.chatUuid"
          :codigo-ticket="ticket.codigo"
          :contador-activo="ticket.gestion.contadorActivo"
          :contador-pausado="ticket.gestion.contadorPausado"
          :contador-fin="ticket.gestion.contadorFin"
          :contador-restante-segundos="ticket.gestion.contadorRestanteSegundos"
          :contador-vencido="ticket.gestion.contadorVencido"
          :termino-maximo="ticket.gestion.terminoEstimado"
          :mostrar-fases-cabecera="ticket.tipo === 'A'"
          :fase-index="ticket.faseIndex ?? 0"
        />
      </div>

      <div class="min-w-0 space-y-5 overflow-y-auto lg:col-span-1 lg:max-h-[calc(100dvh-8rem)]">
        <UCard>
          <div class="mb-4 flex flex-wrap items-center gap-1.5">
            <UBadge :color="badgeColorEstado(ticket.estadoCodigo)" variant="subtle">
              {{ ticket.estado }}
            </UBadge>
            <UBadge :color="badgeColorTipo" variant="subtle">
              {{ ticket.tipo === 'A' ? 'A' : ticket.subtipoB || 'B' }}
            </UBadge>
            <UBadge
              v-if="mostrarComplejidad"
              :color="badgeColorComplejidad(ticket.criticidad)"
              variant="subtle"
            >
              {{ ticket.criticidad }}
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
              <dt class="mb-0.5 text-[10px] text-muted">Código</dt>
              <dd class="font-mono text-xs font-medium text-highlighted">{{ ticket.codigo }}</dd>
            </div>
            <div>
              <dt class="mb-0.5 text-[10px] text-muted">Área</dt>
              <dd class="text-xs font-medium text-highlighted">{{ ticket.area }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="mb-0.5 text-[10px] text-muted">Solicitante</dt>
              <dd class="text-xs font-medium text-highlighted">{{ ticket.solicitante }}</dd>
            </div>
            <div v-if="mostrarTiempoEstimado">
              <dt class="mb-0.5 text-[10px] text-muted">
                {{ ticket.gestion.tiempoEstimadoRango ? 'Tiempo estimado (aprox.)' : 'Tiempo estimado' }}
              </dt>
              <dd class="text-xs font-medium text-highlighted">{{ ticket.gestion.slaEtiqueta }}</dd>
            </div>
            <div v-if="mostrarTermino">
              <dt class="mb-0.5 text-[10px] text-muted">Término estimado</dt>
              <dd class="text-xs font-medium text-highlighted">{{ ticket.gestion.terminoEstimado }}</dd>
            </div>
          </dl>
        </UCard>

        <SoporteTiMaquetaPreview
          v-if="ticket.tipo === 'A' && ticket.maqueta && rolActivo !== 'PM'"
          :maqueta="ticket.maqueta"
          :rol="rolActivo"
          @approve="aprobarMaqueta"
          @reject="rechazarMaqueta"
        />

        <UCard v-if="ticket.gestion.esStaff && (ticket.gestion.puedeComplejidadPm || ticket.gestion.puedeComplejidadAnalista || ticket.gestion.puedeComplejidad || ticket.gestion.puedeEstado)">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {{ tituloGestionStaff }}
          </p>
          <SoporteTiAnalistaGestionSelect :ticket="ticket" />
        </UCard>

        <UCard v-if="ticket.gestion.esCreador && ticket.gestion.puedeEstado">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Confirmación
          </p>
          <div class="max-w-xs space-y-2" @click.stop @pointerdown.stop>
            <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Estado
            </span>
            <USelect
              :model-value="ticket.gestion.estadoValor ?? undefined"
              :items="estadosItems(ticket.gestion.estados)"
              value-key="value"
              label-key="label"
              size="sm"
              class="w-full min-w-0"
              :placeholder="ticket.gestion.estadoPlaceholder"
              @update:model-value="void onCambioEstadoCreador($event)"
            />
            <p class="text-[11px] text-gray-500 dark:text-gray-400">
              Solo puedes elegir <strong>Operativo</strong> u <strong>Observado</strong>. El cambio
              se aplica cuando el ticket está <strong>Desplegado</strong>.
            </p>
          </div>
        </UCard>

        <UCard v-if="mostrarBarraSla">
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">SLA</p>
          <SoporteTiSlaBar :sla="ticket.slaHoras" :transcurridas="ticket.horasTranscurridas" />
          <div class="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
            <span class="text-green-600 dark:text-green-400">&lt; 75%</span>
            <span class="text-amber-600 dark:text-amber-400">75–100%</span>
            <span class="text-red-600 dark:text-red-400">&gt; 100%</span>
          </div>
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
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiAcciones } from '~/composables/useSoporteTiAcciones'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { estadosItems } from '~/utils/soporteTiGestion'
import SoporteTiAnalistaGestionSelect from '~/components/soporte-ti/SoporteTiAnalistaGestionSelect.vue'
import SoporteTiSlaBar from '~/components/soporte-ti/SoporteTiSlaBar.vue'
import SoporteTiMaquetaPreview from '~/components/soporte-ti/SoporteTiMaquetaPreview.vue'
import SoporteTiDetailChatSection from '~/components/soporte-ti/SoporteTiDetailChatSection.vue'
import SoporteTiModalMaquetaPm from '~/components/soporte-ti/SoporteTiModalMaquetaPm.vue'

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

const {
  rolActivo,
  actualizarSolicitud,
  agregarMensajeSistema,
  etiquetaAhora
} = useSoporteTi()

const { cambiarEstado, pasarEnMaqueta } = useSoporteTiAcciones()
const { showError } = useModal()
const { withSpinner } = useSpinner()

const modalMaquetaAbierto = ref(false)
const modalMaquetaCambiarEstado = ref(true)
const enviandoMaqueta = ref(false)

const esVistaSolicitante = computed(() => rolActivo.value === 'Solicitante')

function esValorPendiente(valor?: string | null): boolean {
  const v = (valor ?? '').trim().toLowerCase()
  return !v || v === 'por definir' || v === 'por asignar'
}

const mostrarComplejidad = computed(() => !esValorPendiente(props.ticket.criticidad))

const mostrarTermino = computed(() => !esValorPendiente(props.ticket.gestion.terminoEstimado))

const mostrarTiempoEstimado = computed(() => {
  const g = props.ticket.gestion
  if (!g.slaEtiqueta) return false
  return g.esCreador || (g.esStaff && props.ticket.tipo === 'A' && g.verSla)
})

const mostrarBarraSla = computed(
  () =>
    props.ticket.slaHoras > 0 &&
    (props.ticket.gestion.verSla || props.ticket.gestion.contadorActivo)
)

const tituloGestionStaff = computed(() => {
  if (rolActivo.value === 'PM') return 'Gestión del PM'
  if (rolActivo.value === 'Analista') return 'Gestión del analista'
  return 'Gestión'
})

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

const acciones = computed((): AccionDef[] => {
  const rol = rolActivo.value as SoporteTiRol
  const t = props.ticket
  if (rol === 'PM' && t.tipo === 'B') {
    return []
  }
  const a: AccionDef[] = []
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
      if (t.estadoCodigo === 'pendiente' && t.gestion.puedeEnProgreso) {
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
      if (t.estadoCodigo === 'observado' && t.gestion.puedeEnProgreso) {
        a.push({
          key: 'en_progreso',
          label: 'Retomar En progreso',
          color: 'primary',
          variant: 'solid'
        })
      }
    }
    if (t.tipo === 'A') {
      if (t.estadoCodigo === 'en_maqueta' && t.gestion.puedeEnProgreso) {
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
      if (t.estadoCodigo === 'observado' && t.gestion.puedeEnProgreso) {
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

async function onCambioEstadoCreador(val: unknown) {
  const codigo = typeof val === 'string' ? val : String(val ?? '')
  await cambiarEstado(props.ticket, codigo)
}

function abrirModalMaqueta(cambiarEstado: boolean) {
  modalMaquetaCambiarEstado.value = cambiarEstado
  modalMaquetaAbierto.value = true
}

async function ejecutarAccion(key: AccionKey) {
  if (key === 'en_maqueta') {
    abrirModalMaqueta(true)
    return
  }

  const t = props.ticket
  const codigo = MAPA_ACCION_ESTADO_CODIGO[key] ?? t.estadoCodigo
  let faseIndex = t.faseIndex || 0
  if (t.tipo === 'A' && key === 'en_progreso' && faseIndex < 2) {
    faseIndex = 2
  }
  try {
    await withSpinner(async () => {
      const ok = await cambiarEstado(t, codigo, { rolEtiqueta: rolActivo.value })
      if (!ok) throw new Error('No se pudo actualizar el estado')
      if (faseIndex !== t.faseIndex) {
        const resProg = await actualizarSolicitud({
          ...t,
          faseIndex,
          ultimaActualizacion: etiquetaAhora()
        })
        if (resProg.ok === false) throw new Error(resProg.error)
      }
    }, 'Actualizando estado…')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo actualizar el estado.'
    showError('Error al actualizar estado', msg)
  }
}

async function onConfirmarMaqueta(payload: { archivos: File[]; mensaje: string }) {
  enviandoMaqueta.value = true
  try {
    const ok = await pasarEnMaqueta(props.ticket, payload.archivos, {
      mensaje: payload.mensaje,
      cambiarEstado: modalMaquetaCambiarEstado.value
    })
    if (ok) modalMaquetaAbierto.value = false
  } finally {
    enviandoMaqueta.value = false
  }
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
