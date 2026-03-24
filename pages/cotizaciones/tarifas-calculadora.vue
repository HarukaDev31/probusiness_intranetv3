<template>
  <div class="md:p-6 max-w-6xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Tarifas de calculadora de importación
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
          Solo puedes cambiar el monto (USD) y guardar cada fila por separado. Los rangos de CBM y el tipo están fijados.
        </p>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <UButton label="Volver" variant="ghost" icon="i-heroicons-arrow-left" @click="navigateTo('/cotizaciones')" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="group in grouped" :key="group.label" :ui="{ body: { padding: 'p-0 sm:p-0' } }">
        <template #header>
          <span class="font-semibold text-gray-900 dark:text-white">{{ group.label }}</span>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse min-w-[960px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th class="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-300">CBM desde</th>
                <th class="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-300">CBM hasta</th>
                <th class="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                <th class="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-300">Tarifa (USD)</th>
                <th class="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Creado</th>
                <th class="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Actualizado</th>
                <th class="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300 w-28">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in group.items"
                :key="row.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
              >
                <td class="py-2 px-3 align-middle text-gray-700 dark:text-gray-200 tabular-nums">
                  {{ row.limit_inf }}
                </td>
                <td class="py-2 px-3 align-middle text-gray-700 dark:text-gray-200 tabular-nums">
                  {{ row.limit_sup }}
                </td>
                <td class="py-2 px-3 align-middle text-gray-600 dark:text-gray-400">
                  {{ row.type }}
                </td>
                <td class="py-2 px-3 align-middle">
                  <UInput v-model="row.tarifa" type="number" step="0.01" min="0" class="w-28" />
                </td>
                <td class="py-2 px-3 align-middle text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {{ formatTs(row.created_at) }}
                </td>
                <td class="py-2 px-3 align-middle text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {{ formatTs(row.updated_at) }}
                </td>
                <td class="py-2 px-3 align-middle text-right">
                  <UButton
                    label="Guardar"
                    size="xs"
                    color="primary"
                    :loading="savingIds.has(row.id)"
                    @click="saveRow(row)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CalculadoraImportacionService } from '~/services/calculadora-importacion/calculadoraImportacionService'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  middleware: ['auth']
})

interface EditableRow {
  id: number
  label: string
  limit_inf: string
  limit_sup: string
  tarifa: string
  type: 'STANDARD' | 'PLAIN'
  created_at: string | null
  updated_at: string | null
}

const { showSuccess, showError } = useModal()

const loading = ref(true)
/** ids de filas con petición de guardado en curso */
const savingIds = ref<Set<number>>(new Set())
const rows = ref<EditableRow[]>([])

const formatTs = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

const grouped = computed(() => {
  const map = new Map<string, EditableRow[]>()
  for (const r of rows.value) {
    const list = map.get(r.label) || []
    list.push(r)
    map.set(r.label, list)
  }
  return Array.from(map.entries())
    .map(([label, items]) => ({
      label,
      items: [...items].sort((a, b) => Number(a.limit_inf) - Number(b.limit_inf))
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const load = async () => {
  loading.value = true
  try {
    const res = await CalculadoraImportacionService.getTarifas()
    if (!res?.success || !Array.isArray(res.data)) {
      rows.value = []
      showError('Error', 'No se pudieron cargar las tarifas.')
      return
    }
    rows.value = res.data.map((t: any) => ({
      id: Number(t.id),
      label: String(t.label ?? ''),
      limit_inf: String(t.limit_inf ?? ''),
      limit_sup: String(t.limit_sup ?? ''),
      tarifa: String(t.tarifa ?? ''),
      type: (t.type === 'PLAIN' ? 'PLAIN' : 'STANDARD') as 'STANDARD' | 'PLAIN',
      created_at: t.created_at != null ? String(t.created_at) : null,
      updated_at: t.updated_at != null ? String(t.updated_at) : null
    }))
  } catch {
    rows.value = []
    showError('Error', 'No se pudieron cargar las tarifas.')
  } finally {
    loading.value = false
  }
}

const saveRow = async (row: EditableRow) => {
  const value = Number(row.tarifa)
  if (Number.isNaN(value)) {
    showError('Validación', 'Ingresa un monto válido para la tarifa.')
    return
  }

  savingIds.value = new Set(savingIds.value).add(row.id)
  try {
    const result = await CalculadoraImportacionService.updateTarifa(row.id, value)
    if (result?.success && result.data) {
      row.tarifa = String(result.data.tarifa)
      if (result.data.created_at != null) row.created_at = String(result.data.created_at)
      if (result.data.updated_at != null) row.updated_at = String(result.data.updated_at)
      showSuccess('Guardado', 'Tarifa actualizada.')
    } else {
      showError('Error', result?.message || 'No se pudo guardar la tarifa.')
    }
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'No se pudo guardar la tarifa.'
    showError('Error', msg)
  } finally {
    const next = new Set(savingIds.value)
    next.delete(row.id)
    savingIds.value = next
  }
}

onMounted(() => {
  load()
})
</script>
