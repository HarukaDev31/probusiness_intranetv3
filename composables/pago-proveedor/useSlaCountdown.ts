import { computed, onUnmounted, ref } from 'vue'
import type { SupplierPaymentSla } from '~/types/pago-proveedor'

/**
 * Plazo (SLA) que calcula el backend en `DepositoVerificacionResource`.
 * El frontend NO inventa tiempos: usa `deadline_at` y `server_now` del servidor
 * y descuenta el tiempo transcurrido desde que se cargó la respuesta.
 */
export type { SupplierPaymentSla }

/** Un solo tick compartido para todas las filas del listado. */
const tick = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
let consumers = 0

function acquire() {
  consumers += 1
  if (timer === null && typeof window !== 'undefined') {
    timer = window.setInterval(() => { tick.value = Date.now() }, 30_000)
  }
}

function release() {
  consumers = Math.max(0, consumers - 1)
  if (consumers === 0 && timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

export function duration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

/**
 * Diferencia entre el reloj del servidor y el del navegador (ms).
 * Se congela por respuesta del backend: si se recalculara en cada render,
 * el tiempo restante nunca avanzaría (`tick` y `Date.now()` crecen juntos).
 */
const offsets = new WeakMap<object, number>()

export function serverOffset(sla?: SupplierPaymentSla | null): number {
  if (!sla?.server_now) return 0
  if (typeof sla === 'object') {
    const cached = offsets.get(sla)
    if (cached !== undefined) return cached
  }
  const server = Date.parse(sla.server_now)
  const offset = Number.isNaN(server) ? 0 : server - Date.now()
  if (typeof sla === 'object') offsets.set(sla, offset)
  return offset
}

/**
 * Texto vivo del plazo: `quedan 1 h 20 min` / `vencido hace 35 min`.
 * Cae al texto del backend cuando no hay `deadline_at`.
 */
export function slaText(sla?: SupplierPaymentSla | null): string | null {
  if (!sla) return null
  if (!sla.deadline_at) return sla.text
  const deadline = Date.parse(sla.deadline_at)
  if (Number.isNaN(deadline)) return sla.text
  const remaining = (deadline - (tick.value + serverOffset(sla))) / 60_000
  return remaining >= 0 ? `quedan ${duration(remaining)}` : `vencido hace ${duration(Math.abs(remaining))}`
}

export function slaOverdue(sla?: SupplierPaymentSla | null): boolean {
  if (!sla?.deadline_at) return !!sla?.overdue
  const deadline = Date.parse(sla.deadline_at)
  if (Number.isNaN(deadline)) return !!sla.overdue
  return deadline - (tick.value + serverOffset(sla)) < 0
}

export function useSlaCountdown() {
  acquire()
  onUnmounted(release)

  return {
    tick: computed(() => tick.value),
    slaText,
    slaOverdue,
    serverOffset,
    duration
  }
}
