<template>
  <!-- #1992/#1993: el detalle del cliente se abre como panel lateral, como en la maqueta. -->
  <USlideover
    :open="!!client"
    side="right"
    :title="client?.name || ''"
    :ui="{ content: 'w-full max-w-2xl sm:max-w-2xl', header: 'hidden', body: 'p-0 sm:p-0' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div v-if="client" class="flex min-h-full flex-col bg-elevated/40">
        <div class="flex items-start justify-between gap-3 border-b border-default bg-default px-6 py-5">
          <div class="min-w-0">
            <p class="text-xs text-muted">{{ typeLabel }} · {{ client.country || '—' }}</p>
            <p class="text-xl font-bold text-highlighted">{{ client.name }}</p>
            <p class="text-sm text-toned">{{ contact || '—' }}</p>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="emit('close')" />
        </div>
        <div class="grid grid-cols-3 gap-3 border-b border-default bg-default px-6 py-4">
          <div><p class="text-xs uppercase tracking-wider text-muted">Total facturado</p><p class="text-xl font-bold text-highlighted">{{ usd(client.total_billed) }}</p></div>
          <div><p class="text-xs uppercase tracking-wider text-muted">Pagado</p><p class="text-xl font-bold text-success">{{ usd(client.paid) }}</p></div>
          <div><p class="text-xs uppercase tracking-wider text-muted">Saldo por cobrar</p><p class="text-xl font-bold" :class="client.receivable > 0.005 ? 'text-error' : 'text-highlighted'">{{ usd(client.receivable) }}</p></div>
        </div>

        <div class="px-6 py-5">
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-highlighted">Servicios</p>
            <UButton v-if="client.can_download_balance" color="primary" icon="i-heroicons-arrow-down-tray" @click="emit('balance', client)">Descargar balance de pago</UButton>
          </div>
          <div class="overflow-x-auto rounded-xl border border-default bg-default">
            <table class="w-full text-sm">
              <thead class="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th class="px-3 py-2.5 text-left font-medium">Servicio</th>
                  <th class="px-3 py-2.5 text-right font-medium">Monto</th>
                  <th class="px-3 py-2.5 text-right font-medium">Pagado</th>
                  <th class="px-3 py-2.5 text-right font-medium">Saldo</th>
                  <th class="px-3 py-2.5 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(service, index) in client.services || []" :key="index" class="border-t border-default">
                  <td class="px-3 py-2.5">
                    <p><span class="font-semibold">{{ service.service_name }}</span> <span class="text-xs text-muted">{{ service.code || 'Sin N°' }} · {{ dayLabel(service.issued_on) }}</span></p>
                    <p class="max-w-56 truncate text-xs text-muted" :title="service.description || ''">{{ service.description }}</p>
                  </td>
                  <td class="px-3 py-2.5 text-right font-medium">{{ service.total === null ? '—' : usd(service.total) }}</td>
                  <td class="px-3 py-2.5 text-right">{{ service.received ? usd(service.received) : '—' }}</td>
                  <td class="px-3 py-2.5 text-right font-medium" :class="(service.balance || 0) > 0 ? 'text-error' : ''">{{ service.balance ? usd(service.balance) : '—' }}</td>
                  <td class="px-3 py-2.5"><span class="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" :class="CHINA_STATUS_PILL[service.status]">{{ CHINA_STATUS_LABEL[service.status] }}</span></td>
                </tr>
                <tr v-if="!client.services?.length"><td colspan="5" class="px-3 py-6 text-muted">Este cliente aún no tiene servicios.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CHINA_STATUS_LABEL, CHINA_STATUS_PILL } from '~/constants/chinaBilling'
import type { ChinaClient } from '~/types/china-billing'

const props = defineProps<{ client: ChinaClient | null }>()
const emit = defineEmits<{ close: []; balance: [client: ChinaClient] }>()

const typeLabel = computed(() => (props.client?.type === 'partner' ? 'Socio' : 'Importador'))
const contact = computed(() => [props.client?.contact_name, props.client?.whatsapp].filter(Boolean).join(' · '))
</script>
