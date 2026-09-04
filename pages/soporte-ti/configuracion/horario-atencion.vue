<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-6">
    <!-- Cabecera -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-highlighted md:text-2xl">Horario de atención</h1>
        <p class="mt-1 max-w-xl text-sm text-muted">
          Define los días y horarios hábiles del equipo. El contador de término máximo solo
          descuenta tiempo dentro de estas ventanas.
        </p>
      </div>
      <UButton
        label="Volver"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        class="shrink-0"
        @click="navigateTo('/soporte-ti')"
      />
    </div>

    <UCard v-if="error" color="warning" variant="subtle">
      <p class="text-sm">{{ error }}</p>
    </UCard>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="size-10 animate-spin text-primary" />
    </div>

    <template v-else>
      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default bg-muted/40">
                <th class="px-4 py-3 text-left font-medium text-muted">Día</th>
                <th class="px-4 py-3 text-left font-medium text-muted">Activo</th>
                <th class="px-4 py-3 text-left font-medium text-muted">Desde</th>
                <th class="px-4 py-3 text-left font-medium text-muted">Hasta</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="dia in diasEdit"
                :key="dia.diaSemana"
                class="border-b border-default last:border-0"
                :class="{ 'opacity-50': !dia.activo }"
              >
                <td class="px-4 py-3 font-medium text-highlighted">{{ dia.nombreDia }}</td>
                <td class="px-4 py-3">
                  <UToggle v-model="dia.activo" />
                </td>
                <td class="px-4 py-3">
                  <UInput
                    v-model="dia.horaInicio"
                    type="time"
                    :disabled="!dia.activo"
                    class="w-32"
                  />
                </td>
                <td class="px-4 py-3">
                  <UInput
                    v-model="dia.horaFin"
                    type="time"
                    :disabled="!dia.activo"
                    class="w-32"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <div class="flex justify-end">
        <UButton
          label="Guardar cambios"
          icon="i-heroicons-check"
          color="primary"
          :loading="guardando"
          @click="onGuardar"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { navigateTo } from '#imports'
import { useSoporteTiHorarioAtencion } from '~/composables/useSoporteTiHorarioAtencion'
import type { SoporteTiHorarioDia } from '~/composables/useSoporteTiHorarioAtencion'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { ROLES } from '~/constants/roles'

definePageMeta({ middleware: 'auth' })

const { hasRole, fetchCurrentUser } = useUserRole()
const { dias, loading, guardando, error, cargar, guardar } = useSoporteTiHorarioAtencion()
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

const diasEdit = ref<SoporteTiHorarioDia[]>([])

onMounted(async () => {
  await fetchCurrentUser()
  if (!hasRole(ROLES.SOPORTE) && !hasRole(ROLES.PM)) {
    void navigateTo('/soporte-ti')
    return
  }
  await cargar()
  diasEdit.value = dias.value.map((d) => ({ ...d }))
})

watch(dias, (lista) => {
  if (!guardando.value) {
    diasEdit.value = lista.map((d) => ({ ...d }))
  }
})

async function onGuardar() {
  const invalido = diasEdit.value.find(
    (d) => d.activo && d.horaInicio >= d.horaFin
  )
  if (invalido) {
    showError('Horario inválido', `En ${invalido.nombreDia} la hora de inicio debe ser anterior a la de fin.`)
    return
  }
  try {
    await withSpinner(() => guardar(diasEdit.value), 'Guardando horario…')
    showSuccess('Horario actualizado', 'El contador de término máximo usará el nuevo horario.')
    diasEdit.value = dias.value.map((d) => ({ ...d }))
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'No se pudo guardar.')
  }
}
</script>
