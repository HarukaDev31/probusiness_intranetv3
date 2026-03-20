<template>
  <div class="p-6">
    <PageHeader
      title="Planes del curso (web)"
      subtitle="Aquí defines precios y textos de las tarjetas que ven los visitantes en la página del curso. Al guardar, los cambios quedan listos para la web."
      icon="i-heroicons-currency-dollar"
      :hide-back-button="false"
      @back="navigateTo('/curso')"
    />

    <div class="flex flex-wrap gap-2 mb-4">
      <UButton icon="i-heroicons-plus" label="Nuevo plan" @click="openModalCreate" />
      <UButton
        icon="i-heroicons-arrow-path"
        label="Recargar"
        color="neutral"
        variant="outline"
        :loading="loading"
        @click="loadPlanes"
      />
    </div>

    <UCard>
      <div class="overflow-x-auto">
        <UTable :data="planes" :columns="columns" class="w-full" :loading="loading">
          <template #empty-state>
            <div class="text-center py-8 text-muted text-sm">No hay planes. Usa «Nuevo plan» para añadir el primero.</div>
          </template>
        </UTable>
      </div>
    </UCard>

    <UModal v-model:open="modalOpen">
      <template #content>
        <UCard class="max-w-3xl">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold">
                {{ isEditing ? 'Editar plan' : 'Nuevo plan' }}
              </h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" size="xs" @click="modalOpen = false" />
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
            <UFormField label="Orden" hint="">
              <UInput v-model.number="form.sort_order" type="number" min="1" />
            </UFormField>
            <UFormField label="Título">
              <UInput v-model="form.title" placeholder="Plan Pro Business" />
            </UFormField>
            <UFormField label="Subtítulo">
              <UInput v-model="form.subtitle" placeholder="Clase en Vivo (4 días en Zoom)" />
            </UFormField>
            <UFormField label="Monto principal (PEN)">
              <UInput v-model.number="form.price_amount" type="number" min="1" placeholder="200" />
            </UFormField>
            <div class="sm:col-span-2 flex flex-col gap-3">
              <UCheckbox v-model="form.tiene_descuento" label="Precio tachado" />
              <UFormField v-if="form.tiene_descuento" label="Precio de lista (PEN)" class="max-w-xs">
                <UInput v-model.number="form.price_original_amount" type="number" min="1" placeholder="550" />
              </UFormField>
            </div>
            <UFormField label="Beneficios" class="sm:col-span-2">
              <UTextarea v-model="form.benefitsText" :rows="6" class="w-full font-mono text-sm" placeholder="Clases grabadas&#10;Material de apoyo&#10;Certificado" />
            </UFormField>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton label="Cancelar" color="neutral" variant="ghost" @click="modalOpen = false" />
              <UButton label="Guardar" color="primary" :loading="saving" @click="handleSave" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent, onMounted, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { WebCursoPlan } from '~/types/cursos/webCursoPlanes'
import { useWebCursoMembresiaPlanes } from '~/composables/useWebCursoMembresiaPlanes'
import { useModal } from '~/composables/commons/useModal'
import { formatPrecioPlanSoles } from '~/utils/cursos'

definePageMeta({
  title: 'Planes del curso (web)'
})

const UButton = resolveComponent('UButton')

const {
  planes,
  loading,
  saving,
  form,
  isEditing,
  loadPlanes,
  openCreate,
  openEdit,
  save,
  remove
} = useWebCursoMembresiaPlanes()

const modalOpen = ref(false)
const { showConfirmation, showSuccess, showError } = useModal()

watch(
  () => form.value.tiene_descuento,
  (on) => {
    if (!on) form.value.price_original_amount = null
  }
)

const openModalCreate = () => {
  openCreate()
  modalOpen.value = true
}

const openModalEdit = (plan: WebCursoPlan) => {
  openEdit(plan)
  modalOpen.value = true
}

const handleSave = async () => {
  try {
    await save()
    showSuccess('Guardado', 'El plan se guardó correctamente.')
    modalOpen.value = false
  } catch (e) {
    showError('Error', e instanceof Error ? e.message : 'No se pudo guardar')
  }
}

const handleDelete = (plan: WebCursoPlan) => {
  showConfirmation('Eliminar plan', `¿Eliminar «${plan.title}»?`, async () => {
    try {
      await remove(plan.id)
      showSuccess('Eliminado', 'Plan eliminado.')
    } catch (e) {
      showError('Error', e instanceof Error ? e.message : 'No se pudo eliminar')
    }
  })
}

const columns: TableColumn<WebCursoPlan>[] = [
  { accessorKey: 'sort_order', header: 'Orden', cell: ({ row }) => row.original.sort_order },
  { accessorKey: 'title', header: 'Título', cell: ({ row }) => row.original.title },
  { accessorKey: 'subtitle', header: 'Subtítulo', cell: ({ row }) => row.original.subtitle ?? '—' },
  {
    accessorKey: 'price_amount',
    header: 'Monto',
    cell: ({ row }) => {
      const p = row.original
      const m = p.price_amount
      const tachado = p.price_original && String(p.price_original).trim() !== ''
      if (m == null) return p.price_current || '—'
      return tachado
        ? `${String(p.price_original).trim()} → ${formatPrecioPlanSoles(m)}`
        : formatPrecioPlanSoles(m)
    }
  },
  {
    accessorKey: 'acciones',
    header: '',
    cell: ({ row }) => {
      const p = row.original
      return h('div', { class: 'flex gap-1 justify-end' }, [
        h(UButton, {
          size: 'xs',
          variant: 'ghost',
          icon: 'i-heroicons-pencil-square',
          onClick: () => openModalEdit(p)
        }),
        h(UButton, {
          size: 'xs',
          color: 'error',
          variant: 'ghost',
          icon: 'i-heroicons-trash',
          onClick: () => handleDelete(p)
        })
      ])
    }
  }
]

onMounted(() => {
  loadPlanes().catch(() => {})
})
</script>
