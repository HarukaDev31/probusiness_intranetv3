<template>
  <UModal
    :open="!!client"
    :title="client?.name || ''"
    :description="client ? `${typeLabel} · ${client.country || '—'}${contact ? ` · ${contact}` : ''}` : ''"
    :ui="{ content: 'w-full max-w-3xl sm:max-w-3xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div v-if="client" class="flex flex-col gap-5">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-elevated/60 px-4 py-3"><p class="text-xs uppercase tracking-wider text-muted">Total facturado</p><p class="text-xl font-bold text-highlighted">{{ usd(client.total_billed) }}</p></div>
          <div class="rounded-xl bg-elevated/60 px-4 py-3"><p class="text-xs uppercase tracking-wider text-muted">Pagado</p><p class="text-xl font-bold text-success">{{ usd(client.paid) }}</p></div>
          <div class="rounded-xl bg-elevated/60 px-4 py-3"><p class="text-xs uppercase tracking-wider text-muted">Saldo por cobrar</p><p class="text-xl font-bold" :class="client.receivable > 0 ? 'text-error' : 'text-highlighted'">{{ usd(client.receivable) }}</p></div>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-semibold text-highlighted">Servicios</p>
            <UButton v-if="client.can_download_balance" color="primary" icon="i-heroicons-arrow-down-tray" @click="emit('balance', client)">Descargar balance de pago</UButton>
          </div>
          <div class="overflow-x-auto rounded-xl border border-default">
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
                    <p class="font-semibold">{{ service.service_name }}</p>
                    <p class="text-xs text-muted">{{ service.code || 'Sin N°' }} · {{ dayLabel(service.issued_on) }}</p>
                    <p class="text-xs text-muted">{{ service.description }}</p>
                  </td>
                  <td class="px-3 py-2.5 text-right">{{ service.total === null ? '—' : usd(service.total) }}</td>
                  <td class="px-3 py-2.5 text-right">{{ service.received ? usd(service.received) : '—' }}</td>
                  <td class="px-3 py-2.5 text-right font-medium" :class="(service.balance || 0) > 0 ? 'text-error' : ''">{{ service.balance ? usd(service.balance) : '—' }}</td>
                  <td class="px-3 py-2.5"><span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="CHINA_STATUS_PILL[service.status]">{{ CHINA_STATUS_LABEL[service.status] }}</span></td>
                </tr>
                <tr v-if="!client.services?.length"><td colspan="5" class="px-3 py-6 text-muted">Este cliente aún no tiene servicios.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CHINA_STATUS_LABEL, CHINA_STATUS_PILL } from '~/constants/chinaBilling'
import type { ChinaClient } from '~/types/china-billing'

const props = defineProps<{ client: ChinaClient | null }>()
const emit = defineEmits<{ close: []; balance: [client: ChinaClient] }>()

const typeLabel = computed(() => (props.client?.type === 'partner' ? 'Socio' : 'Importador'))
const contact = computed(() => [props.client?.contact_name, props.client?.whatsapp, props.client?.email].filter(Boolean).join(' · '))
</script>
