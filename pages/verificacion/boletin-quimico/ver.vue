<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <UButton
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        @click="navigateTo('/verificacion?tab=boletin-quimico')"
      >
        Regresar
      </UButton>
    </div>

    <template v-if="itemsList.length === 0 && !loadingInitial">
      <p class="text-gray-500">No hay ítems para mostrar. Vuelva al listado y use «Ver» en una fila.</p>
    </template>

    <template v-else>
      <!-- Skeleton inicial mientras se cargan los títulos de todos los ítems -->
      <template v-if="loadingInitial">
        <div class="flex gap-2 mb-6">
          <USkeleton v-for="i in 4" :key="i" class="h-9 w-24 rounded-full" />
        </div>
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <USkeleton class="h-6 w-full max-w-md rounded" />
          <div class="flex gap-4 flex-wrap">
            <USkeleton class="h-5 w-32 rounded" />
            <USkeleton class="h-5 w-24 rounded" />
            <USkeleton class="h-5 w-20 rounded" />
          </div>
        </div>
        <USkeleton class="h-6 w-28 rounded mb-4" />
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <USkeleton v-for="i in 6" :key="i" class="h-40 rounded-lg" />
        </div>
      </template>

      <template v-else>
        <UTabs
          v-model="activeTab"
          :items="tabItems"
          color="neutral"
          variant="pill"
          class="mb-6"
          @update:model-value="onTabChange"
        />

        <!-- Skeleton mientras carga el detalle del tab -->
        <template v-if="loading">
          <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <USkeleton class="h-6 w-full max-w-md rounded" />
            <div class="flex gap-4 flex-wrap">
              <USkeleton class="h-5 w-32 rounded" />
              <USkeleton class="h-5 w-24 rounded" />
              <USkeleton class="h-5 w-20 rounded" />
            </div>
          </div>
          <USkeleton class="h-6 w-28 rounded mb-4" />
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <USkeleton v-for="i in 6" :key="i" class="h-40 rounded-lg" />
          </div>
        </template>

        <template v-else-if="detalle">
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="text-lg font-semibold text-gray-900 dark:text-white flex flex-row justify-between flex-wrap gap-2">
            <span>{{ detalle.cliente }} — {{ detalle.item_nombre }}</span>
            <div>
              Consolidado: <span class="text-primary-600">#{{ detalle.consolidado }}</span>
              · Monto: <span class="text-primary-600">{{ formatCurrency(detalle.monto_boletin, 'PEN') }}</span>
              · Estado: <UBadge :label="estadoLabel(detalle.estado)" :color="estadoBadgeColor" variant="soft" />
            </div>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Adelantos</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="pago in detalle.pagos"
            :key="pago.id"
            class="rounded-lg border p-4 transition-colors"
            :class="{
              'bg-green-50 border-green-200 dark:bg-green-800/30 dark:border-green-700': pago.status === 'CONFIRMADO',
              'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700': pago.status === 'PENDIENTE',
              'bg-red-50 border-red-200 dark:bg-red-800/30 dark:border-red-700': pago.status === 'OBSERVADO'
            }"
          >
            <div class="mb-3">
              <span class="font-medium text-gray-900 dark:text-white">Monto: {{ formatCurrency(pago.monto, 'PEN') }}</span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-200">Fecha:</span>
                <span class="font-medium">{{ pago.payment_date ? formatDateTimeToDmy(pago.payment_date) : '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-200">Banco:</span>
                <span class="font-medium">{{ pago.banco || '—' }}</span>
              </div>
              <div v-if="pago.voucher_url" class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-200">Voucher:</span>
                <a :href="pago.voucher_url" target="_blank" class="text-primary-600 hover:underline text-xs truncate max-w-24">Ver</a>
              </div>
            </div>
            <div v-if="isAdministracion" class="mt-4">
              <USelect
                :model-value="pago.status"
                :items="estadosOptions"
                placeholder="Estado"
                size="sm"
                @update:model-value="(value: string) => handleStatusChange(pago.id, value)"
              />
            </div>
          </div>
        </div>
        <p v-if="detalle.pagos && detalle.pagos.length === 0" class="text-gray-500 text-sm">Sin adelantos registrados.</p>
      </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BoletinQuimicoService } from '~/services/basedatos/boletinQuimicoService'
import type { BoletinQuimicoItem } from '~/services/basedatos/boletinQuimicoService'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'
import { formatCurrency, formatDateTimeToDmy } from '~/utils/formatters'
import { UButton, UTabs, UBadge, USelect } from '#components'

definePageMeta({ layout: 'default' })

const route = useRoute()
const itemsList = ref<BoletinQuimicoItem[]>([])
const activeTab = ref<number | null>(null)
const detalle = ref<any>(null)
const loading = ref(false)
const loadingInitial = ref(false)
const { hasRole } = useUserRole()
const isAdministracion = computed(() => hasRole(ROLES.ADMINISTRACION))

const estadosOptions = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Confirmado', value: 'CONFIRMADO' },
  { label: 'Observado', value: 'OBSERVADO' }
]

const tabItems = computed(() =>
  itemsList.value.map((it, i) => ({
    value: it.id,
    label: it.item_nombre || `Ítem ${i + 1}`
  }))
)

/** Verde solo cuando todos los pagos están confirmados; si no, gris. */
const estadoBadgeColor = computed(() => {
  const d = detalle.value
  if (!d) return 'neutral'
  const pagos = d.pagos || []
  const allConfirmados = pagos.length > 0 && pagos.every((p: { status: string }) => p.status === 'CONFIRMADO')
  if (d.estado === 'pagado') return allConfirmados ? 'success' : 'neutral'
  if (d.estado === 'pagado_gris') return 'neutral'
  if (d.estado === 'adelanto_pagado') return 'warning'
  return 'neutral'
})

function estadoLabel (estado: string) {
  if (estado === 'pagado') return 'Pagado'
  if (estado === 'pagado_gris') return 'Pagado'
  if (estado === 'adelanto_pagado') return 'Adelanto'
  return 'Pendiente'
}

function initFromState () {
  const raw = history.state as { userState?: { items?: BoletinQuimicoItem[] }; items?: BoletinQuimicoItem[] } | undefined
  const state = raw?.userState ?? raw
  if (state?.items?.length) {
    itemsList.value = [...state.items]
    if (activeTab.value == null) activeTab.value = state.items[0].id
    return
  }
  const idsStr = route.query.ids as string | undefined
  if (idsStr) {
    const ids = idsStr.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n))
    if (ids.length) {
      itemsList.value = ids.map((id) => ({ id, item_nombre: '', monto_boletin: 0, estado: '', total_pagado: 0, pagos_count: 0, pagos_details: [] } as BoletinQuimicoItem))
      if (activeTab.value == null) activeTab.value = ids[0]
    }
  }
}

/** Carga el nombre (y datos mínimos) de todos los ítems para mostrar títulos en los tabs desde el inicio. */
async function loadAllItemTitles () {
  const needNames = itemsList.value.some((it) => !it.item_nombre)
  if (!needNames || itemsList.value.length === 0) return
  loadingInitial.value = true
  try {
    const results = await Promise.all(
      itemsList.value.map((it) => BoletinQuimicoService.getItemDetalle(it.id))
    )
    results.forEach((res, idx) => {
      if (res.success && res.data && itemsList.value[idx]) {
        const item = itemsList.value[idx]
        item.item_nombre = res.data.item_nombre ?? item.item_nombre
      }
    })
  } catch (e) {
    console.error(e)
  } finally {
    loadingInitial.value = false
  }
}

async function loadDetalle (itemId: number) {
  loading.value = true
  detalle.value = null
  try {
    const res = await BoletinQuimicoService.getItemDetalle(itemId)
    if (res.success) detalle.value = res.data
    const item = itemsList.value.find((i) => i.id === itemId)
    if (item && res.success && res.data?.item_nombre) item.item_nombre = res.data.item_nombre
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onTabChange (value: number) {
  if (value != null) loadDetalle(value)
}

async function handleStatusChange (idPago: number, status: string) {
  try {
    await BoletinQuimicoService.updateEstadoPago(idPago, status)
    if (activeTab.value != null) await loadDetalle(activeTab.value)
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  initFromState()
  await loadAllItemTitles()
  if (activeTab.value != null) loadDetalle(activeTab.value)
})
</script>
