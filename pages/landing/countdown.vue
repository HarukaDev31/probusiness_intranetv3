<template>
  <div class="p-6 space-y-6">
    <PageHeader
      title="Contador landing consolidado"
      subtitle="Define hasta qué fecha/hora corre el contador de la landing de carga consolidada"
      icon="i-heroicons-clock"
      :hide-back-button="true"
    />

    <UCard class="max-w-xl">
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Zona horaria: <span class="font-medium text-highlighted">{{ timezone || 'America/Lima' }}</span>
        </p>

        <UFormField label="Fecha y hora de fin" name="ends_at" required>
          <UInput
            v-model="endsAtLocal"
            type="datetime-local"
            class="w-full"
            :disabled="loading || saving"
          />
        </UFormField>

        <p v-if="previewIso" class="text-xs text-muted">
          Se guardará como: <code class="text-highlighted">{{ previewIso }}</code>
        </p>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
          icon="i-heroicons-exclamation-triangle"
        />

        <UAlert
          v-if="successMessage"
          color="success"
          variant="subtle"
          :title="successMessage"
          icon="i-heroicons-check-circle"
        />

        <div class="flex gap-3">
          <UButton
            color="primary"
            :loading="saving"
            :disabled="loading || !endsAtLocal"
            @click="handleSave"
          >
            Guardar
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            :disabled="loading || saving"
            @click="loadCountdown"
          >
            Recargar
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { LandingCountdownService } from '~/services/landing/landingCountdownService'

definePageMeta({
  layout: 'default',
  title: 'Contador landing'
})

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const timezone = ref('America/Lima')
const endsAtLocal = ref('')

const previewIso = computed(() => {
  if (!endsAtLocal.value) return ''
  try {
    return toIsoFromLocalInput(endsAtLocal.value)
  } catch {
    return ''
  }
})

function toLocalInputValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIsoFromLocalInput(localValue: string): string {
  // datetime-local sin zona → interpretar como America/Lima (UTC-5 fijo, sin DST)
  const [datePart, timePart = '00:00'] = localValue.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-05:00`
}

async function loadCountdown() {
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const data = await LandingCountdownService.getCountdown()
    timezone.value = data.timezone || 'America/Lima'
    endsAtLocal.value = toLocalInputValue(data.ends_at)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar la fecha del contador.'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!endsAtLocal.value) return

  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const data = await LandingCountdownService.updateCountdown(toIsoFromLocalInput(endsAtLocal.value))
    timezone.value = data.timezone || 'America/Lima'
    endsAtLocal.value = toLocalInputValue(data.ends_at)
    successMessage.value = 'Fecha del contador actualizada.'
  } catch (e: any) {
    error.value = e?.message || 'No se pudo guardar la fecha del contador.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadCountdown()
})
</script>
