<template>
  <UModal
    v-model:open="open"
    title="Info. del mensaje"
    :ui="{ width: 'sm:max-w-md' }"
  >
    <template #body>
      <div v-if="msg" class="space-y-0">
        <div
          class="flex justify-end rounded-t-lg bg-[#0b141a] px-4 py-6 dark:bg-[#0b141a]"
          style="background-image: url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        >
          <WhatsappInboxMessageBody
            class="max-w-[85%] shrink-0"
            :msg="msg"
            :direction="msg.direction"
            :avatar-text="avatarText"
            :time-label="timeLabel"
            :delivery-icon="msg.direction === 'out' ? deliveryIcon : undefined"
            :delivery-class="msg.direction === 'out' ? deliveryClass : undefined"
            :reply-preview="replyPreview"
          />
        </div>

        <ul class="divide-y divide-default rounded-b-lg border border-t-0 border-default bg-default">
          <li
            v-for="(row, idx) in statusRows"
            :key="idx"
            class="flex items-start gap-3 px-4 py-3"
          >
            <span
              class="mt-0.5 inline-flex min-w-6 select-none text-lg font-bold leading-none"
              :class="row.iconClass"
            >
              <UIcon v-if="row.iconName" :name="row.iconName" class="size-5" />
              <template v-else>{{ row.iconText }}</template>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-highlighted">{{ row.label }}</p>
              <p v-if="row.time" class="text-xs text-muted">{{ row.time }}</p>
              <p v-if="row.detail" class="mt-0.5 text-xs text-error">{{ row.detail }}</p>
            </div>
          </li>
        </ul>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cerrar" @click="open = false" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'
import WhatsappInboxMessageBody from '~/components/whatsapp-inbox/WhatsappInboxMessageBody.vue'
import { formatDatePe } from '~/utils/formatters'
import { formatWaMessageStatusTime } from '~/utils/whatsappInboxChatDate'

const props = defineProps<{
  msg: WaInboxMessage | null
  avatarText?: string
  replyPreview?: {
    metaId: string
    label: string
    text: string
    imageUrl?: string | null
  } | null
}>()

const open = defineModel<boolean>('open', { default: false })

const timeLabel = computed(() => {
  if (!props.msg?.sent_at) return props.msg?.time_label || ''
  return formatDatePe(props.msg.sent_at)
})

const deliveryIcon = computed(() => {
  const status = props.msg?.delivery_status
  if (status === 'read') return '✓✓'
  if (status === 'delivered') return '✓✓'
  if (status === 'sent') return '✓'
  if (status === 'failed') return '✗'
  return ''
})

const deliveryClass = computed(() => {
  const status = props.msg?.delivery_status
  if (status === 'failed') return 'text-error'
  if (status === 'read') return 'text-info'
  if (status === 'delivered') return 'text-highlighted'
  return 'text-muted'
})

type StatusRow = {
  label: string
  time?: string
  detail?: string
  iconText?: string
  iconName?: string
  iconClass?: string
}

const statusRows = computed<StatusRow[]>(() => {
  const msg = props.msg
  if (!msg) return []

  const at = formatWaMessageStatusTime(msg.sent_at)

  if (msg.direction === 'in') {
    return [{ label: 'Recibido', time: at, iconName: 'i-heroicons-check', iconClass: 'text-muted' }]
  }

  const status = msg.delivery_status
  const rows: StatusRow[] = []

  if (status === 'read') {
    rows.push({ label: 'Leído', time: at, iconText: '✓✓', iconClass: 'text-info' })
    rows.push({ label: 'Entregado', time: at, iconText: '✓✓', iconClass: 'text-muted' })
  } else if (status === 'delivered') {
    rows.push({ label: 'Entregado', time: at, iconText: '✓✓', iconClass: 'text-muted' })
  } else if (status === 'sent') {
    rows.push({ label: 'Enviado', time: at, iconText: '✓', iconClass: 'text-muted' })
  } else if (status === 'pending') {
    rows.push({
      label: 'Enviando',
      time: at,
      iconName: 'i-heroicons-clock',
      iconClass: 'text-warning'
    })
  } else if (status === 'failed') {
    rows.push({
      label: 'No entregado',
      time: at,
      detail: msg.failed_reason?.trim() || undefined,
      iconText: '✗',
      iconClass: 'text-error'
    })
  } else {
    rows.push({ label: 'Enviado', time: at, iconText: '✓', iconClass: 'text-muted' })
  }

  return rows
})
</script>
