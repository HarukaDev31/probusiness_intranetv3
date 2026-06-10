<template>
  <UModal v-model:open="openModel" title="Programar mensaje">
    <template #body>
      <div class="space-y-3">
        <UAlert
          v-if="windowExpiresAt"
          color="info"
          variant="subtle"
          icon="i-heroicons-clock"
          title="Ventana de conversación"
          :description="windowHint"
        />
        <UFormField label="Mensaje" required>
          <UTextarea
            v-model="text"
            :rows="3"
            :maxrows="6"
            autoresize
            placeholder="Escribe el mensaje a enviar…"
          />
        </UFormField>
        <UFormField label="Cuándo enviar" required>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="preset in schedulePresets"
              :key="preset.minutes"
              type="button"
              size="sm"
              :color="selectedPresetMinutes === preset.minutes ? 'primary' : 'neutral'"
              :variant="selectedPresetMinutes === preset.minutes ? 'solid' : 'soft'"
              :label="preset.label"
              :disabled="preset.disabled"
              @click="applyPreset(preset.minutes)"
            />
          </div>
          <UInput
            v-model="scheduledLocal"
            type="datetime-local"
            class="mt-2"
            :min="minLocal"
            :max="maxLocal"
            @update:model-value="selectedPresetMinutes = null"
          />
        </UFormField>
        <UAlert
          v-if="localError"
          color="error"
          variant="subtle"
          :title="localError"
        />
        <p class="text-xs text-muted">
          Solo puedes programar dentro de la ventana de 24 h. Si el horario queda después del cierre, usa una plantilla.
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Cancelar" @click="openModel = false" />
        <UButton
          color="primary"
          label="Programar"
          icon="i-heroicons-clock"
          :loading="scheduling"
          :disabled="!canSubmit"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open?: boolean
    initialText?: string
    windowExpiresAt?: string | null
    scheduling?: boolean
  }>(),
  {
    open: false,
    initialText: '',
    windowExpiresAt: null,
    scheduling: false
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  schedule: [payload: { text: string; scheduledAt: string }]
}>()

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const DEFAULT_PRESET_MINUTES = 10

const presetDefinitions = [
  { minutes: 10, label: '10 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' }
] as const

const text = ref('')
const scheduledLocal = ref('')
const localError = ref('')
const selectedPresetMinutes = ref<number | null>(DEFAULT_PRESET_MINUTES)

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function parseExpiresAt() {
  if (!props.windowExpiresAt) return null
  const d = new Date(props.windowExpiresAt)
  return Number.isNaN(d.getTime()) ? null : d
}

const minLocal = computed(() => {
  const d = new Date(Date.now() + 60_000)
  return toDatetimeLocalValue(d)
})

const maxLocal = computed(() => {
  const expires = parseExpiresAt()
  if (!expires) return undefined
  const capped = new Date(expires.getTime() - 60_000)
  if (capped.getTime() <= Date.now()) return minLocal.value
  return toDatetimeLocalValue(capped)
})

const windowHint = computed(() => {
  const expires = parseExpiresAt()
  if (!expires) return 'La ventana está abierta para mensajes de texto.'
  return `Cierra el ${expires.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}.`
})

function isPresetWithinWindow(minutes: number) {
  const at = new Date(Date.now() + minutes * 60_000)
  if (at.getTime() <= Date.now()) return false
  const expires = parseExpiresAt()
  if (!expires) return true
  return at.getTime() < expires.getTime()
}

const schedulePresets = computed(() =>
  presetDefinitions.map((preset) => ({
    ...preset,
    disabled: !isPresetWithinWindow(preset.minutes)
  }))
)

function applyPreset(minutes: number) {
  if (!isPresetWithinWindow(minutes)) return
  selectedPresetMinutes.value = minutes
  scheduledLocal.value = toDatetimeLocalValue(new Date(Date.now() + minutes * 60_000))
  localError.value = ''
}

function applyDefaultSchedule() {
  const firstAvailable = presetDefinitions.find((preset) => isPresetWithinWindow(preset.minutes))
  if (firstAvailable) {
    applyPreset(firstAvailable.minutes)
    return
  }
  selectedPresetMinutes.value = null
  scheduledLocal.value = maxLocal.value || minLocal.value
}

const canSubmit = computed(() => Boolean(text.value.trim() && scheduledLocal.value && !props.scheduling))

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    localError.value = ''
    text.value = props.initialText.trim()
    applyDefaultSchedule()
  }
)

function submit() {
  localError.value = ''
  const body = text.value.trim()
  const local = scheduledLocal.value
  if (!body) {
    localError.value = 'Escribe el mensaje a programar.'
    return
  }
  if (!local) {
    localError.value = 'Indica fecha y hora de envío.'
    return
  }

  const scheduledDate = new Date(local)
  if (Number.isNaN(scheduledDate.getTime())) {
    localError.value = 'Fecha u hora no válida.'
    return
  }

  if (scheduledDate.getTime() <= Date.now()) {
    localError.value = 'La fecha debe ser en el futuro.'
    return
  }

  const expires = parseExpiresAt()
  if (expires && scheduledDate.getTime() >= expires.getTime()) {
    localError.value = 'Ese horario queda fuera de la ventana. Usa una plantilla.'
    return
  }

  emit('schedule', {
    text: body,
    scheduledAt: scheduledDate.toISOString()
  })
}
</script>
