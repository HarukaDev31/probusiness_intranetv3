<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-6">
    <div>
      <PageHeader
        title="WhatsApp"
        subtitle="Configura el número de tu organización. Cada empresa gestiona el suyo."
        icon="i-heroicons-chat-bubble-left-right"
        :hide-back-button="false"
        @back="navigateTo('/coordinacion/whatsapp-inbox')"
      />
      <p v-if="config?.organizacion_nombre" class="mt-1 text-xs text-muted">
        {{ config.organizacion_nombre }}
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="size-10 animate-spin text-primary" />
    </div>

    <template v-else>
      <UCard>
        <div class="flex flex-col gap-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-highlighted">Activar WhatsApp</p>
              <p class="text-xs text-muted">Si está apagado, no se envían ni reciben chats de esta organización.</p>
            </div>
            <UToggle v-model="form.enabled" />
          </div>

          <UFormField label="Número visible">
            <UInput v-model="form.display_number" placeholder="+51 999 999 999" />
          </UFormField>

          <UFormField label="ID del número">
            <UInput v-model="form.phone_number_id" placeholder="Phone number ID de Meta" />
          </UFormField>

          <UFormField label="ID de la cuenta (WABA)">
            <UInput v-model="form.waba_id" />
          </UFormField>

          <UFormField :label="tokenSet ? 'Token de acceso (dejar vacío para no cambiar)' : 'Token de acceso'">
            <UInput v-model="form.access_token" type="password" autocomplete="new-password" />
          </UFormField>

          <UFormField :label="secretSet ? 'Secreto de la app (dejar vacío para no cambiar)' : 'Secreto de la app'">
            <UInput v-model="form.app_secret" type="password" autocomplete="new-password" />
          </UFormField>

          <UFormField :label="verifyTokenSet ? 'Token del webhook (dejar vacío para no cambiar)' : 'Token del webhook'">
            <UInput v-model="form.webhook_verify_token" type="password" autocomplete="new-password" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Versión de la API">
              <UInput v-model="form.graph_api_version" />
            </UFormField>
            <UFormField label="Idioma de plantillas">
              <UInput v-model="form.default_language" />
            </UFormField>
          </div>
        </div>
      </UCard>

      <div class="flex justify-end">
        <UButton
          label="Guardar"
          icon="i-heroicons-check"
          color="primary"
          @click="onGuardar"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWhatsappInboxConfig } from '~/composables/whatsapp-inbox/useWhatsappInboxConfig'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  title: 'WhatsApp',
  middleware: ['whatsapp-inbox-config'],
})

const { loading, config, form, tokenSet, secretSet, verifyTokenSet, load, save } = useWhatsappInboxConfig()
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

onMounted(async () => {
  try {
    await load()
  } catch (e) {
    showError('No se pudo cargar', e instanceof Error ? e.message : 'Inténtalo de nuevo.')
  }
})

async function onGuardar() {
  if (form.value.enabled && !form.value.phone_number_id.trim()) {
    showError('Falta el ID del número', 'Actívalo solo cuando ya tengas el ID del número de Meta.')
    return
  }
  if (form.value.enabled && !tokenSet.value && !form.value.access_token?.trim()) {
    showError('Falta el token', 'Pega el token de acceso para activar WhatsApp.')
    return
  }

  try {
    await withSpinner(() => save(), 'Guardando…')
    showSuccess('Guardado', 'Tu organización ya puede usar este WhatsApp.')
  } catch (e) {
    showError('No se pudo guardar', e instanceof Error ? e.message : 'Revisa los datos e inténtalo de nuevo.')
  }
}
</script>
