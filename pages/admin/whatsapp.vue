<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6">
    <div>
      <PageHeader
        title="WhatsApp"
        subtitle="Crea los números de tu organización y elige qué rol ve cada uno en el chat."
        icon="i-heroicons-chat-bubble-left-right"
        :hide-back-button="false"
        @back="navigateTo('/coordinacion/whatsapp-inbox')"
      />
      <p v-if="organizacionNombre" class="mt-1 text-xs text-muted">
        {{ organizacionNombre }}
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="size-10 animate-spin text-primary" />
    </div>

    <template v-else>
      <UCard v-for="linea in lineas" :key="linea.id ?? 'nueva'">
        <div class="flex flex-col gap-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-highlighted">
                {{ linea.id == null ? 'Nuevo número' : (linea.nombre || 'Número') }}
              </p>
              <p class="text-xs text-muted">Si está apagado, ese número no envía ni recibe.</p>
            </div>
            <UToggle v-model="linea.enabled" />
          </div>

          <UFormField label="Nombre">
            <UInput v-model="linea.nombre" placeholder="Coordinación, Ventas…" />
          </UFormField>

          <UFormField label="Número visible">
            <UInput v-model="linea.display_number" placeholder="+51 999 999 999" />
          </UFormField>

          <UFormField label="ID del número">
            <UInput v-model="linea.phone_number_id" placeholder="Phone number ID de Meta" />
          </UFormField>

          <UFormField label="Roles que lo ven en el chat">
            <USelectMenu
              v-model="linea.roles"
              :items="roles"
              multiple
              value-key="value"
              label-key="label"
              placeholder="Coordinación"
              class="w-full"
            />
            <p class="mt-1 text-xs text-muted">
              Por defecto lo ve Coordinación. Si no marcas ningún rol, lo ve toda la organización.
            </p>
          </UFormField>

          <label class="flex items-center gap-2 text-sm text-highlighted">
            <UCheckbox v-model="linea.is_default" />
            Número de coordinación (el que usa el sistema)
          </label>

          <details class="rounded-lg border border-default px-3 py-2">
            <summary class="cursor-pointer text-sm font-medium text-highlighted">Credenciales</summary>
            <div class="mt-4 flex flex-col gap-4">
              <UFormField label="ID de la cuenta (WABA)">
                <UInput v-model="linea.waba_id" />
              </UFormField>
              <UFormField :label="linea.access_token_set ? 'Token de acceso (vacío = no cambiar)' : 'Token de acceso'">
                <UInput v-model="linea.access_token" type="password" autocomplete="new-password" />
              </UFormField>
              <UFormField :label="linea.app_secret_set ? 'Secreto de la app (vacío = no cambiar)' : 'Secreto de la app'">
                <UInput v-model="linea.app_secret" type="password" autocomplete="new-password" />
              </UFormField>
              <UFormField :label="linea.webhook_verify_token_set ? 'Token del webhook (vacío = no cambiar)' : 'Token del webhook'">
                <UInput v-model="linea.webhook_verify_token" type="password" autocomplete="new-password" />
              </UFormField>
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Versión de la API">
                  <UInput v-model="linea.graph_api_version" />
                </UFormField>
                <UFormField label="Idioma de plantillas">
                  <UInput v-model="linea.default_language" />
                </UFormField>
              </div>
            </div>
          </details>

          <div class="flex justify-end">
            <UButton label="Guardar" icon="i-heroicons-check" color="primary" @click="onGuardar(linea)" />
          </div>
        </div>
      </UCard>

      <div v-if="lineas.length === 0" class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted">
        Todavía no hay números. Agrega el de coordinación para empezar.
      </div>

      <div class="flex justify-end">
        <UButton
          label="Agregar número"
          icon="i-heroicons-plus"
          color="neutral"
          variant="outline"
          @click="agregarLinea"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWhatsappInboxConfig, type WaInboxLineaForm } from '~/composables/whatsapp-inbox/useWhatsappInboxConfig'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  title: 'WhatsApp',
  middleware: ['whatsapp-inbox-config'],
})

const { loading, organizacionNombre, roles, lineas, load, agregarLinea, saveLinea } = useWhatsappInboxConfig()
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

onMounted(async () => {
  try {
    await load()
  } catch (e) {
    showError('No se pudo cargar', e instanceof Error ? e.message : 'Inténtalo de nuevo.')
  }
})

async function onGuardar(linea: WaInboxLineaForm) {
  if (!linea.nombre.trim()) {
    showError('Falta el nombre', 'Ponle un nombre al número, por ejemplo Coordinación o Ventas.')
    return
  }
  if (linea.enabled && !linea.phone_number_id.trim()) {
    showError('Falta el ID del número', 'Actívalo solo cuando ya tengas el ID del número de Meta.')
    return
  }
  if (linea.enabled && !linea.access_token_set && !linea.access_token.trim()) {
    showError('Falta el token', 'Pega el token de acceso para activar este número.')
    return
  }

  try {
    await withSpinner(() => saveLinea(linea), 'Guardando…')
    showSuccess('Guardado', 'El chat de cada rol usará los números que marcaste.')
  } catch (e) {
    showError('No se pudo guardar', e instanceof Error ? e.message : 'Revisa los datos e inténtalo de nuevo.')
  }
}
</script>
