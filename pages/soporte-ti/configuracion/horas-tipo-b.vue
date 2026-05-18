<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-highlighted md:text-2xl">
          Horas SLA — Tipo B
        </h1>
        <p class="mt-1 max-w-xl text-sm text-muted">
          Define cuántas horas tiene el equipo para resolver un requerimiento TI según la
          complejidad asignada. Al guardar, las solicitudes nuevas y las que cambien de
          complejidad usarán estos valores.
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

    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default bg-muted/40">
              <th class="px-4 py-3 text-left font-medium text-muted">Complejidad</th>
              <th class="px-4 py-3 text-left font-medium text-muted">Horas SLA</th>
              <th class="px-4 py-3 text-left font-medium text-muted whitespace-nowrap">
                Última actualización
              </th>
              <th class="w-28 px-4 py-3 text-right font-medium text-muted">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filasEdit"
              :key="row.id"
              class="border-b border-default last:border-0"
            >
              <td class="px-4 py-3 font-medium text-highlighted">{{ row.criticidad }}</td>
              <td class="px-4 py-3">
                <UInput
                  v-model.number="row.horas"
                  type="number"
                  min="1"
                  max="9999"
                  class="w-28"
                  :disabled="guardandoId === row.id"
                />
              </td>
              <td class="px-4 py-3 text-xs text-muted whitespace-nowrap">
                {{ formatTs(row.updatedAt) }}
              </td>
              <td class="px-4 py-3 text-right">
                <UButton
                  label="Guardar"
                  size="xs"
                  color="primary"
                  :loading="guardandoId === row.id"
                  :disabled="!horasValidas(row.horas)"
                  @click="guardar(row)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <p v-if="!loading && filasEdit.length" class="text-xs text-muted">
      Los proyectos tipo A usan el mantenedor «Horas tipo A» (fases PM y configuración del analista).
      Aquí solo se configuran requerimientos tipo B (B1 y B2).
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { navigateTo } from '#imports'
import { useSoporteTiSlaHoras } from '~/composables/useSoporteTiSlaHoras'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import type { SoporteTiSlaHorasFila } from '~/composables/useSoporteTiSlaHoras'

definePageMeta({
  middleware: 'auth'
})

const { hasRole, fetchCurrentUser } = useUserRole()
const { filas, loading, error, cargar, guardarFila } = useSoporteTiSlaHoras('B')
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

const filasEdit = ref<SoporteTiSlaHorasFila[]>([])
const guardandoId = ref<number | null>(null)

onMounted(async () => {
  await fetchCurrentUser()
  if (!hasRole(ROLES.SOPORTE) && !hasRole(ROLES.PM)) {
    void navigateTo('/soporte-ti')
    return
  }
  await cargar()
  filasEdit.value = filas.value.map((f) => ({ ...f }))
})

watch(filas, (lista) => {
  if (guardandoId.value == null) {
    filasEdit.value = lista.map((f) => ({ ...f }))
  }
})

function horasValidas(h: number) {
  return Number.isFinite(h) && h >= 1 && h <= 9999
}

function formatTs(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

async function guardar(row: SoporteTiSlaHorasFila) {
  if (!horasValidas(row.horas)) {
    showError('Horas inválidas', 'Ingresa un valor entre 1 y 9999.')
    return
  }

  guardandoId.value = row.id
  try {
    await withSpinner(async () => {
      await guardarFila(row.id, Math.round(row.horas))
    }, 'Guardando…')
    showSuccess('Guardado', `Horas para ${row.criticidad} actualizadas.`)
    filasEdit.value = filas.value.map((f) => ({ ...f }))
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'No se pudo guardar.')
  } finally {
    guardandoId.value = null
  }
}
</script>
