<template>
  <section class="home-op px-4 xl:px-6">
    <section class="home-op__hero">
      <img
        class="home-op__hero-img"
        src="https://intranet.probusiness.pe/assets/img/backgrounds/inicioview.png"
        alt=""
      >
      <div class="home-op__hero-shade" />
      <h1 class="home-op__hello">
        {{ copy.hello }}<br>{{ copy.welcome }}
      </h1>
    </section>

    <div class="home-op__grid">
      <template v-if="loading">
        <div v-for="n in cardCount" :key="n" class="home-op__card">
          <USkeleton class="h-11 w-11 rounded-lg" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-3 w-28" />
            <USkeleton class="h-8 w-20" />
          </div>
        </div>
      </template>

      <article
        v-for="card in visibleCards"
        v-else
        :key="card.key"
        class="home-op__card"
        @mouseenter="hoverKey = card.key"
        @mouseleave="hoverKey = null"
      >
        <div class="home-op__icon" aria-hidden="true">
          <UIcon :name="iconFor(card.key)" class="w-9 h-9" />
        </div>
        <div class="min-w-0">
          <p class="home-op__label">{{ labelFor(card.key) }}</p>
          <p class="home-op__value">{{ formatValue(card.key, card.value) }}</p>
        </div>

        <div
          v-if="showBreakdown(card) && hoverKey === card.key"
          class="home-op__breakdown"
        >
          <p class="home-op__breakdown-title">{{ labelFor(card.key) }}</p>
          <div
            v-for="row in card.by_country"
            :key="row.country"
            class="home-op__breakdown-row"
          >
            <span>{{ row.country }}</span>
            <strong>{{ formatBreakdown(card.key, row.value) }}</strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HomeStatsCard, HomeStatsCardKey } from '~/types/cargaconsolidada/home-stats'

const props = defineProps<{
  cards: HomeStatsCard[]
  loading?: boolean
  variant: 'almacen' | 'socio'
}>()

const hoverKey = ref<HomeStatsCardKey | null>(null)

const copy = computed(() => props.variant === 'almacen'
  ? { hello: 'Hello,', welcome: 'welcome!' }
  : { hello: '¡Hola,', welcome: 'bienvenido!' }
)

const labels: Record<'almacen' | 'socio', Record<HomeStatsCardKey, string>> = {
  almacen: {
    cbm: 'Total CBM Loaded',
    customers: 'Total happy customers',
    codes: 'Total suppliers code',
    warehouse: 'CBM warehouse',
    containers: 'Total containers',
  },
  socio: {
    cbm: 'CBM despachados',
    customers: 'Clientes atendidos',
    codes: 'Proveedores coordinados',
    warehouse: 'CBM en warehouse',
    containers: 'Número de consolidado',
  },
}

const icons: Record<HomeStatsCardKey, string> = {
  cbm: 'fluent:box-32-filled',
  customers: 'flowbite:users-group-solid',
  codes: 'heroicons:arrows-up-down',
  warehouse: 'heroicons:home',
  containers: 'mingcute:ship-line',
}

const visibleCards = computed(() => {
  if (props.variant === 'almacen') {
    return props.cards.filter(card => card.key !== 'warehouse')
  }
  return props.cards
})
const cardCount = computed(() => props.variant === 'socio' ? 5 : 4)

function labelFor(key: HomeStatsCardKey) {
  return labels[props.variant][key]
}

function iconFor(key: HomeStatsCardKey) {
  return icons[key]
}

function showBreakdown(card: HomeStatsCard) {
  return props.variant === 'almacen' && card.by_country.length > 0
}

function formatCompact(value: number, decimals = 1) {
  if (value >= 1000) {
    const k = value / 1000
    const text = k >= 10 ? k.toFixed(0) : k.toFixed(decimals)
    return `${text.replace(/\.0$/, '')}K`
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

function formatValue(key: HomeStatsCardKey, value: number) {
  return formatCompact(value, key === 'cbm' || key === 'warehouse' ? 1 : 0)
}

function formatBreakdown(key: HomeStatsCardKey, value: number) {
  if (key === 'cbm' || key === 'warehouse') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
</script>

<style scoped>
.home-op {
  padding-bottom: 2.5rem;
}

.home-op__hero {
  position: relative;
  height: 300px;
  border-radius: 14px;
  overflow: hidden;
  background: #12213d;
}

.home-op__hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-op__hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(18, 33, 61, 0.55) 0%, rgba(18, 33, 61, 0.18) 100%);
}

.home-op__hello {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 2rem;
  margin: 0;
  font-weight: 500;
  font-size: 2.5rem;
  line-height: 1.1;
  letter-spacing: -1px;
  color: #fff;
}

.home-op__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(236px, 1fr));
  gap: 18px;
  margin: -46px 0 0;
  padding: 0 12px;
  position: relative;
  z-index: 5;
}

.home-op__card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(23, 35, 58, 0.1);
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 108px;
}

.dark .home-op__card {
  background: #1f2937;
}

.home-op__icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: #f26522;
}

.home-op__label {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #8494b0;
}

.home-op__value {
  margin: 4px 0 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: #17233a;
}

.dark .home-op__value {
  color: #fff;
}

.home-op__breakdown {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: #12213d;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 6;
}

.home-op__breakdown-title {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #93a3c0;
}

.home-op__breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  color: #d5deee;
}

.home-op__breakdown-row strong {
  color: #fff;
  font-weight: 700;
}

@media (max-width: 640px) {
  .home-op__hero {
    height: 40vh;
  }

  .home-op__hello {
    font-size: 1.75rem;
    padding: 0 1.25rem;
  }

  .home-op__grid {
    margin-top: -28px;
    padding: 0;
  }
}
</style>
