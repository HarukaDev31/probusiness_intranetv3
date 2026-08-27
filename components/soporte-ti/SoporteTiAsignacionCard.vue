<script setup lang="ts">
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { SoporteTiService } from '~/services/soporteTiService'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

const { updateAssignment } = useSoporteTi()
const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()

const staff = ref<Array<{ id: number; nombre: string; rol: string }>>([])
const cargandoStaff = ref(false)
const guardando = ref(false)

const pmId = ref<number | undefined>(props.ticket.pmUserId ?? undefined)
const analistaId = ref<number | undefined>(props.ticket.analistaUserId ?? undefined)

watch(
  () => [props.ticket.pmUserId, props.ticket.analistaUserId] as const,
  ([pm, an]) => {
    pmId.value = pm ?? undefined
    analistaId.value = an ?? undefined
  }
)

const itemsPm = computed(() =>
  staff.value
    .filter((s) => s.rol.toLowerCase() === 'pm')
    .map((s) => ({ label: s.nombre, value: s.id }))
)

const itemsAnalista = computed(() =>
  staff.value.map((s) => ({
    label: `${s.nombre}${s.rol ? ` (${s.rol})` : ''}`,
    value: s.id
  }))
)

onMounted(async () => {
  if (!props.ticket.gestion.puedeAsignacion) return
  cargandoStaff.value = true
  try {
    const res = await SoporteTiService.listStaff()
    staff.value = Array.isArray(res.data) ? res.data : []
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo cargar el staff'
    showError('Asignación', msg)
  } finally {
    cargandoStaff.value = false
  }
})

async function guardar() {
  guardando.value = true
  try {
    await withSpinner(async () => {
      const res = await updateAssignment(props.ticket, {
        pmUserId: pmId.value ?? null,
        analistaUserId: analistaId.value ?? null
      })
      if (!res.ok) {
        showError('Asignación', res.error)
        return
      }
      showSuccess('Asignación', 'Responsables actualizados')
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo guardar la asignación'
    showError('Asignación', msg)
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <UCard v-if="ticket.gestion.puedeAsignacion">
    <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      Asignación
    </p>
    <div class="space-y-3">
      <div v-if="ticket.tipo === 'A'">
        <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          PM
        </span>
        <USelect
          v-model="pmId"
          :items="itemsPm"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-full"
          placeholder="Por asignar"
          :loading="cargandoStaff"
          :disabled="guardando"
        />
      </div>
      <div>
        <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Analista / Soporte
        </span>
        <USelect
          v-model="analistaId"
          :items="itemsAnalista"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-full"
          placeholder="Por asignar"
          :loading="cargandoStaff"
          :disabled="guardando"
        />
      </div>
      <div class="text-[11px] text-gray-500 dark:text-gray-400">
        <span v-if="ticket.pm">PM: {{ ticket.pm }}</span>
        <span v-if="ticket.pm && ticket.analista"> · </span>
        <span v-if="ticket.analista">Analista: {{ ticket.analista }}</span>
      </div>
      <UButton
        block
        size="sm"
        color="primary"
        :loading="guardando"
        :disabled="cargandoStaff"
        @click="void guardar()"
      >
        Guardar asignación
      </UButton>
    </div>
  </UCard>
</template>
