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

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary-500" />
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BoletinQuimicoService } from '~/services/basedatos/boletinQuimicoService'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'
import { formatCurrency } from '~/utils/formatters'
import { formatDateTimeToDmy } from '~/utils/formatters'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = Number(route.params.id)
const detalle = ref<any>(null)
const loading = ref(true)
const { hasRole } = useUserRole()
const isAdministracion = computed(() => hasRole(ROLES.ADMINISTRACION))

const estadosOptions = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Confirmado', value: 'CONFIRMADO' },
  { label: 'Observado', value: 'OBSERVADO' }
]

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

async function load () {
  loading.value = true
  try {
    const res = await BoletinQuimicoService.getItemDetalle(id)
    if (res.success) detalle.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleStatusChange (idPago: number, status: string) {
  try {
    await BoletinQuimicoService.updateEstadoPago(idPago, status)
    await load()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => load())
</script>
