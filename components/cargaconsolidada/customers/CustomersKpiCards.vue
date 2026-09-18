<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 gap-[18px] w-full min-w-0"
    :class="kpiCards.length >= 7 ? 'xl:grid-cols-4' : kpiCards.length >= 6 ? 'xl:grid-cols-6' : kpiCards.length >= 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'"
  >
    <article
      v-for="card in kpiCards"
      :key="card.key"
      class="customers-kpi relative flex items-center gap-4 min-h-[108px] px-5 py-[22px] rounded-xl bg-white dark:bg-gray-800 shadow-[0_6px_20px_rgba(23,35,58,0.1)] border-l-[3px] border-[#f26522] overflow-hidden"
      :class="card.clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60' : ''"
      @click="card.clickable ? emit('filter-nc') : undefined"
    >
      <div class="w-[46px] h-[46px] shrink-0 grid place-items-center text-[#f26522]" aria-hidden="true">
        <img
          v-if="isIconUrl(card.icon)"
          :src="card.icon"
          alt=""
          class="w-9 h-6 object-contain"
        >
        <UIcon v-else :name="card.icon" class="w-9 h-9" />
      </div>
      <div class="min-w-0">
        <p class="m-0 text-[11px] tracking-[0.8px] uppercase text-[#8494b0]">
          {{ card.label }}
        </p>
        <p class="mt-1 mb-0 font-bold leading-none text-[#17233a] dark:text-white" :class="String(card.value).length > 8 ? 'text-[1.35rem]' : 'text-[2rem]'">
          {{ card.value }}
        </p>
        <p v-if="card.hint" class="mt-1 text-[11px] text-gray-400">
          {{ card.hint }}
        </p>
      </div>

      <div
        v-if="card.byCountry.length"
        class="customers-kpi__breakdown"
      >
        <p class="customers-kpi__breakdown-title">{{ card.label }}</p>
        <div
          v-for="row in card.byCountry"
          :key="row.country"
          class="customers-kpi__breakdown-row"
        >
          <span>{{ row.country }}</span>
          <strong>{{ row.value }}</strong>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Header, HeaderCountryRow } from '~/types/data-table'

const props = withDefaults(defineProps<{
  headers?: Record<string, Header> | null
}>(), {
  headers: () => ({}),
})

const emit = defineEmits<{
  'filter-nc': []
}>()

const isIconUrl = (icon?: string) => {
  if (!icon) return false
  return icon.includes('http://') || icon.includes('https://')
}

const countryRows = (header?: Header): HeaderCountryRow[] => {
  const rows = header?.by_country
  if (!Array.isArray(rows)) return []
  return rows
    .map((row) => ({
      country: String(row?.country ?? '').trim() || 'Sin país',
      value: row?.value ?? '0',
    }))
    .filter(row => row.country !== '')
}

const kpiCards = computed(() => {
  const source = props.headers || {}
  const pais = source.cbm_pais
  const vendido = source.cbm_vendido
  const pendiente = source.cbm_pendiente
  const cbm = source.cbm_warehouse
  const fecha60 = source.fecha_cbm_60
  const fecha65 = source.fecha_cbm_65
  const customersHeader = source.total_customers
  const suppliers = source.total_suppliers_code
  const nc = source.total_nc
  const cards: {
    key: string
    label: string
    value: string | number
    icon: string
    clickable: boolean
    hint?: string
    byCountry: HeaderCountryRow[]
  }[] = []

  if (pais) {
    cards.push({
      key: 'cbm_pais',
      label: pais.label || 'CBM',
      value: pais.value ?? '0',
      icon: pais.icon || 'fluent:box-32-filled',
      clickable: false,
      byCountry: countryRows(pais),
    })
  }

  if (vendido) {
    cards.push({
      key: 'cbm_vendido',
      label: vendido.label || 'CBM Vendido',
      value: vendido.value ?? '0',
      icon: vendido.icon || 'fluent:box-32-filled',
      clickable: false,
      byCountry: countryRows(vendido),
    })
  }

  if (pendiente) {
    cards.push({
      key: 'cbm_pendiente',
      label: pendiente.label || 'CBM Pendiente',
      value: pendiente.value ?? '0',
      icon: pendiente.icon || 'heroicons:clock',
      clickable: false,
      byCountry: countryRows(pendiente),
    })
  }

  cards.push({
    key: 'cbm_warehouse',
    label: cbm?.label || 'CBM Warehouse',
    value: cbm?.value ?? '0',
    icon: 'fluent:box-32-filled',
    clickable: false,
    byCountry: countryRows(cbm),
  })

  if (fecha60) {
    cards.push({
      key: 'fecha_cbm_60',
      label: fecha60.label || '60 CBM date',
      value: fecha60.value ?? '—',
      icon: fecha60.icon || 'heroicons:calendar-days',
      clickable: false,
      hint: fecha60.hint,
      byCountry: [],
    })
  }
  if (fecha65) {
    cards.push({
      key: 'fecha_cbm_65',
      label: fecha65.label || '65 CBM date',
      value: fecha65.value ?? '—',
      icon: fecha65.icon || 'heroicons:calendar-days',
      clickable: false,
      hint: fecha65.hint,
      byCountry: [],
    })
  }

  cards.push(
    {
      key: 'total_customers',
      label: customersHeader?.label || 'Total customers',
      value: customersHeader?.value ?? 0,
      icon: 'flowbite:users-group-solid',
      clickable: false,
      byCountry: [],
    },
    {
      key: 'total_suppliers_code',
      label: suppliers?.label || 'Total suppliers code',
      value: suppliers?.value ?? 0,
      icon: 'heroicons:arrows-up-down',
      clickable: false,
      byCountry: [],
    },
    {
      key: 'total_nc',
      label: nc?.label || 'Total NC',
      value: nc?.value ?? 0,
      icon: 'heroicons:exclamation-triangle',
      hint: 'Click to filter NC',
      clickable: true,
      byCountry: [],
    },
  )

  return cards
})
</script>

<style scoped>
.customers-kpi__breakdown {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: #fff;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 6;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  pointer-events: none;
  overflow: auto;
  transition: opacity 0.22s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.22s ease;
}

.customers-kpi:hover .customers-kpi__breakdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.customers-kpi__breakdown-title {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #8494b0;
}

.customers-kpi__breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  color: #3d4d66;
}

.customers-kpi__breakdown-row strong {
  color: #17233a;
  font-weight: 700;
}

.dark .customers-kpi__breakdown {
  background: #1f2937;
}

.dark .customers-kpi__breakdown-title {
  color: #93a3c0;
}

.dark .customers-kpi__breakdown-row {
  color: #d5deee;
}

.dark .customers-kpi__breakdown-row strong {
  color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .customers-kpi__breakdown {
    transition: none;
  }
}
</style>
