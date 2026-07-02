<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-8 p-4 md:p-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-highlighted md:text-2xl">
          Horas SLA — Tipo A (proyectos)
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-muted">
          Matriz por fase y complejidad: el PM asigna su complejidad al ticket y se suman las
          horas de cada fase (sin configuración). El analista define solo la fase configuración.
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

    <UCard v-if="errorMatriz || errorConfig" color="warning" variant="subtle">
      <p v-if="errorMatriz" class="text-sm">{{ errorMatriz }}</p>
      <p v-if="errorConfig" class="text-sm">{{ errorConfig }}</p>
    </UCard>

    <section class="space-y-3">
      <div>
        <h2 class="text-base font-semibold text-highlighted">Fases PM — matriz fase × complejidad</h2>
        <p class="text-sm text-muted">
          Horas por celda según la complejidad que el PM asigne. La fila «Total» es referencial.
        </p>
        <p v-if="!puedeEditarMatriz" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Solo lectura: únicamente el PM puede modificar esta matriz.
        </p>
      </div>

      <div v-if="loadingMatriz" class="flex justify-center py-10">
        <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
      </div>

      <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[36rem] text-sm">
            <thead>
              <tr class="border-b border-default bg-muted/40">
                <th class="sticky left-0 z-10 bg-muted/40 px-3 py-3 text-left font-medium text-muted">
                  Complejidad PM
                </th>
                <th
                  v-for="f in fases"
                  :key="f.codigo"
                  class="px-2 py-3 text-center font-medium text-muted whitespace-nowrap"
                >
                  {{ f.nombre }}
                </th>
                <th class="px-3 py-3 text-center font-medium text-muted">Total</th>
                <th
                  v-if="puedeEditarMatriz"
                  class="w-24 px-2 py-3 text-right font-medium text-muted"
                />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="crit in complejidades"
                :key="crit"
                class="border-b border-default last:border-0"
              >
                <td
                  class="sticky left-0 z-10 bg-default px-3 py-2 font-medium text-highlighted whitespace-nowrap"
                >
                  {{ crit }}
                </td>
                <td
                  v-for="f in fases"
                  :key="`${crit}-${f.codigo}`"
                  class="px-2 py-2 text-center"
                >
                  <UInput
                    v-if="puedeEditarMatriz && celdaEdit(crit, f.codigo)"
                    v-model.number="celdaEdit(crit, f.codigo)!.horas"
                    type="number"
                    min="1"
                    max="9999"
                    size="sm"
                    class="mx-auto w-20"
                    :disabled="guardandoFila === crit"
                  />
                  <span
                    v-else-if="celdaEdit(crit, f.codigo)"
                    class="text-sm font-medium text-highlighted"
                  >
                    {{ celdaEdit(crit, f.codigo)!.horas }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="px-3 py-2 text-center text-xs font-semibold text-muted">
                  {{ totalFilaEdit(crit) }} h
                </td>
                <td v-if="puedeEditarMatriz" class="px-2 py-2 text-right">
                  <UButton
                    label="Guardar"
                    size="xs"
                    color="primary"
                    :loading="guardandoFila === crit"
                    :disabled="!filaValida(crit)"
                    @click="guardarFila(crit)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </section>

    <section class="space-y-3">
      <div>
        <h2 class="text-base font-semibold text-highlighted">Configuración (por complejidad del analista)</h2>
        <p class="text-sm text-muted">
          Horas de la fase configuración según la complejidad que asigne el analista.
        </p>
        <p v-if="!puedeEditarConfig" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Solo lectura: únicamente el analista puede modificar estas horas.
        </p>
      </div>

      <div v-if="loadingConfig" class="flex justify-center py-10">
        <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
      </div>

      <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default bg-muted/40">
                <th class="px-4 py-3 text-left font-medium text-muted">Complejidad analista</th>
                <th class="px-4 py-3 text-left font-medium text-muted">Horas config.</th>
                <th class="px-4 py-3 text-left font-medium text-muted whitespace-nowrap">
                  Última actualización
                </th>
                <th
                  v-if="puedeEditarConfig"
                  class="w-28 px-4 py-3 text-right font-medium text-muted"
                >
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filasConfigEdit"
                :key="row.id"
                class="border-b border-default last:border-0"
              >
                <td class="px-4 py-3 font-medium text-highlighted">{{ row.criticidad }}</td>
                <td class="px-4 py-3">
                  <UInput
                    v-if="puedeEditarConfig"
                    v-model.number="row.horas"
                    type="number"
                    min="1"
                    max="9999"
                    class="w-28"
                    :disabled="guardandoConfigId === row.id"
                  />
                  <span v-else class="text-sm font-medium text-highlighted">{{ row.horas }}</span>
                </td>
                <td class="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {{ formatTs(row.updatedAt) }}
                </td>
                <td v-if="puedeEditarConfig" class="px-4 py-3 text-right">
                  <UButton
                    label="Guardar"
                    size="xs"
                    color="primary"
                    :loading="guardandoConfigId === row.id"
                    :disabled="!horasValidas(row.horas)"
                    @click="guardarConfig(row)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { navigateTo } from '#imports'
import { useSoporteTiFaseHorasA } from '~/composables/useSoporteTiFaseHorasA'
import type { SoporteTiFaseHorasACelda } from '~/composables/useSoporteTiFaseHorasA'
import { useSoporteTiSlaHoras } from '~/composables/useSoporteTiSlaHoras'
import type { SoporteTiSlaHorasFila } from '~/composables/useSoporteTiSlaHoras'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  middleware: 'auth'
})

const { hasRole, fetchCurrentUser } = useUserRole()

const puedeEditarMatriz = computed(() => hasRole(ROLES.PM))
const puedeEditarConfig = computed(() => hasRole(ROLES.SOPORTE))
const {
  fases,
  complejidades,
  celdas,
  loading: loadingMatriz,
  error: errorMatriz,
  cargar: cargarMatriz,
  guardarCeldas
} = useSoporteTiFaseHorasA()
const {
  filas: filasConfig,
  loading: loadingConfig,
  error: errorConfig,
  cargar: cargarConfig,
  guardarFila: guardarConfigApi
} = useSoporteTiSlaHoras('A', 'analista_config')
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

/** Edición local: clave criticidad|faseCodigo */
const editMap = reactive<Record<string, SoporteTiFaseHorasACelda>>({})
const filasConfigEdit = ref<SoporteTiSlaHorasFila[]>([])
const guardandoFila = ref<string | null>(null)
const guardandoConfigId = ref<number | null>(null)

function syncEditMap() {
  for (const key of Object.keys(editMap)) {
    delete editMap[key]
  }
  for (const c of celdas.value) {
    editMap[`${c.criticidad}|${c.faseCodigo}`] = { ...c }
  }
}

function celdaEdit(criticidad: string, faseCodigo: string) {
  return editMap[`${criticidad}|${faseCodigo}`]
}

function totalFilaEdit(criticidad: string) {
  return fases.value.reduce((acc, f) => {
    const c = celdaEdit(criticidad, f.codigo)
    return acc + (c?.horas ?? 0)
  }, 0)
}

onMounted(async () => {
  await fetchCurrentUser()
  if (!hasRole(ROLES.SOPORTE) && !hasRole(ROLES.PM)) {
    void navigateTo('/soporte-ti')
    return
  }
  await Promise.all([cargarMatriz(), cargarConfig()])
  syncEditMap()
  filasConfigEdit.value = filasConfig.value.map((f) => ({ ...f }))
})

watch(celdas, () => {
  if (guardandoFila.value == null) {
    syncEditMap()
  }
})

watch(filasConfig, (lista) => {
  if (guardandoConfigId.value == null) {
    filasConfigEdit.value = lista.map((f) => ({ ...f }))
  }
})

function horasValidas(h: number) {
  return Number.isFinite(h) && h >= 1 && h <= 9999
}

function filaValida(criticidad: string) {
  return fases.value.every((f) => {
    const c = celdaEdit(criticidad, f.codigo)
    return c != null && horasValidas(c.horas)
  })
}

function formatTs(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

async function guardarFila(criticidad: string) {
  if (!puedeEditarMatriz.value) return
  if (!filaValida(criticidad)) {
    showError('Horas inválidas', 'Cada celda debe tener un valor entre 1 y 9999.')
    return
  }
  const items = fases.value
    .map((f) => celdaEdit(criticidad, f.codigo))
    .filter((c): c is SoporteTiFaseHorasACelda => c != null)
    .map((c) => ({ id: c.id, horas: Math.round(c.horas) }))

  guardandoFila.value = criticidad
  try {
    await withSpinner(async () => {
      await guardarCeldas(items)
    }, 'Guardando fila…')
    showSuccess('Guardado', `Horas PM para ${criticidad} actualizadas (${totalFilaEdit(criticidad)} h total).`)
    syncEditMap()
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'No se pudo guardar.')
  } finally {
    guardandoFila.value = null
  }
}

async function guardarConfig(row: SoporteTiSlaHorasFila) {
  if (!puedeEditarConfig.value) return
  if (!horasValidas(row.horas)) {
    showError('Horas inválidas', 'Ingresa un valor entre 1 y 9999.')
    return
  }
  guardandoConfigId.value = row.id
  try {
    await withSpinner(async () => {
      await guardarConfigApi(row.id, Math.round(row.horas))
    }, 'Guardando…')
    showSuccess('Guardado', `Horas de configuración (${row.criticidad}) actualizadas.`)
    filasConfigEdit.value = filasConfig.value.map((f) => ({ ...f }))
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'No se pudo guardar.')
  } finally {
    guardandoConfigId.value = null
  }
}
</script>
