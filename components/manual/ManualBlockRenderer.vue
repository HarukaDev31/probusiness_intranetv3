<template>
  <div class="space-y-3">
    <!-- Grupo artículo (plantilla propuesta) -->
    <UCard
      v-if="tipo === 'grupo' && isArticulo"
      :id="`cap-b-${block.id}`"
      class="scroll-mt-4"
    >
      <template #header>
        <nav v-if="articleCrumbs.length" class="mu-breadcrumb text-muted" aria-label="Ruta">
          <template v-for="(crumb, i) in articleCrumbs" :key="`${crumb.label}-${i}`">
            <span v-if="i > 0" class="sep text-muted" aria-hidden="true">→</span>
            <a
              v-if="crumb.anchorKey && !crumb.current"
              :href="crumbAnchorHref(crumb.anchorKey)"
              class="mu-crumb-link font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              @click="onManualCrumbClick(crumb, $event)"
            >
              {{ crumb.label }}
            </a>
            <NuxtLink
              v-else-if="crumb.to && !crumb.current"
              :to="crumb.to"
              class="mu-crumb-link font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {{ crumb.label }}
            </NuxtLink>
            <span
              v-else
              class="font-semibold text-highlighted"
              :aria-current="crumb.current ? 'page' : undefined"
            >{{ crumb.label }}</span>
          </template>
        </nav>
        <h3 class="mu-article-title text-highlighted">{{ block.titulo }}</h3>
        <div v-if="articleTags.length" class="mu-tags">
          <UBadge v-for="tag in articleTags" :key="tag" color="neutral" variant="subtle" size="sm">{{ tag }}</UBadge>
        </div>
      </template>
      <ManualBlockRenderer
        v-for="child in sortedChildren"
        :key="child.id"
        :block="child"
        :variant="variant"
      />
    </UCard>

    <!-- Grupo colapsable (acordeón) -->
    <UCard
      v-else-if="tipo === 'grupo' && isColapsable"
      :id="`cap-b-${block.id}`"
      class="scroll-mt-4"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <details class="mu-acc">
        <summary class="text-highlighted">{{ block.titulo || 'Sección' }}</summary>
        <div class="mu-acc-body text-sm leading-relaxed text-default">
          <ManualBlockRenderer
            v-for="child in sortedChildren"
            :key="child.id"
            :block="child"
            :variant="variant"
          />
        </div>
      </details>
    </UCard>

    <!-- Grupo: título + clave; hijos recursivos (vertical) -->
    <div
      v-else-if="tipo === 'grupo'"
      :id="`cap-b-${block.id}`"
      class="scroll-mt-4 space-y-4"
    >
      <div>
        <a
          v-if="block.titulo && grupoTitleLink"
          :href="grupoTitleLink.href"
          :target="grupoTitleLink.external ? '_blank' : undefined"
          :rel="grupoTitleLink.external ? 'noopener noreferrer' : undefined"
          class="mu-grupo-title text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {{ block.titulo }}
        </a>
        <div v-else-if="block.titulo" class="mu-grupo-title text-gray-900 dark:text-white">
          {{ block.titulo }}
        </div>
        <p v-if="block.clave && !grupoTitleLink" class="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
          {{ block.clave }}
        </p>
        <p v-if="payload.subtitulo && !isRouteLike(String(payload.subtitulo))" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ payload.subtitulo }}
        </p>
      </div>
      <div v-if="(block.children || []).length" class="space-y-4">
        <ManualBlockRenderer
          v-for="child in sortedChildren"
          :key="child.id"
          :block="child"
          :variant="variant"
        />
      </div>
    </div>

    <!-- Timeline: pasos horizontales -->
    <div v-else-if="tipo === 'timeline'" class="space-y-3">
      <a
        v-if="block.titulo && widgetTitleLink"
        :href="widgetTitleLink.href"
        :target="widgetTitleLink.external ? '_blank' : undefined"
        :rel="widgetTitleLink.external ? 'noopener noreferrer' : undefined"
        class="text-sm font-semibold text-primary-600 hover:underline dark:text-primary-300"
      >
        {{ block.titulo }}
      </a>
      <div v-else-if="block.titulo" class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ block.titulo }}
      </div>
      <p
        v-if="payload.subtitulo && !widgetTitleLink"
        class="text-xs text-gray-500 dark:text-gray-400"
      >
        {{ payload.subtitulo }}
      </p>
      <div
        v-if="sortedChildren.length"
        class="flex items-stretch gap-0 overflow-x-auto pb-2"
      >
        <template v-for="(child, ci) in sortedChildren" :key="child.id">
          <div class="flex min-w-[140px] max-w-xs shrink-0 flex-col">
            <div class="flex items-center gap-2 mb-2">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                {{ Number(ci) + 1 }}
              </span>
              <span class="truncate text-xs font-medium text-gray-600 dark:text-gray-300">
                {{ child.titulo || child.tipo }}
              </span>
            </div>
            <UCard class="flex-1" :ui="{ body: 'p-2 sm:p-2' }">
              <ManualBlockRenderer :block="{ ...child, titulo: '' }" :variant="variant" />
            </UCard>
          </div>
          <div
            v-if="Number(ci) < sortedChildren.length - 1"
            class="mx-1 flex w-8 shrink-0 items-center justify-center self-center pt-6"
            aria-hidden="true"
          >
            <UIcon name="i-heroicons-arrow-right" class="h-5 w-5 text-primary-400" />
          </div>
        </template>
      </div>
      <p v-else class="text-xs text-gray-400">Agrega widgets como pasos del flujo.</p>
    </div>

    <div v-else :id="`cap-b-${block.id}`" class="scroll-mt-4 space-y-2">
      <a
        v-if="block.titulo && widgetTitleLink && !hideWidgetTitle && !hideMediaMaintainerMeta"
        :href="widgetTitleLink.href"
        :target="widgetTitleLink.external ? '_blank' : undefined"
        :rel="widgetTitleLink.external ? 'noopener noreferrer' : undefined"
        class="text-sm font-semibold text-primary-600 hover:underline dark:text-primary-300"
      >
        {{ block.titulo }}
      </a>
      <div v-else-if="block.titulo && !hideWidgetTitle && !hideMediaMaintainerMeta" class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ block.titulo }}
      </div>
      <p
        v-if="payload.subtitulo && !widgetTitleLink && !hideMediaMaintainerMeta"
        :class="tipo === 'media'
          ? 'text-base font-medium leading-snug text-gray-800 dark:text-gray-100'
          : 'text-xs text-gray-500 dark:text-gray-400'"
      >
        {{ payload.subtitulo }}
      </p>

      <!-- texto QA (plantilla ¿Qué es? / ¿Para qué sirve?) -->
      <div v-if="tipo === 'texto' && isQa" class="mu-qa">
        <div v-if="block.titulo" class="mu-q text-gray-500 dark:text-gray-400">{{ block.titulo }}</div>
        <div
          class="mu-a whitespace-pre-line text-sm leading-relaxed text-gray-900 dark:text-gray-100"
          :class="{ 'mu-placeholder': isPlaceholderText(snap.body) }"
        >{{ snap.body }}</div>
      </div>

      <!-- texto -->
      <div
        v-else-if="tipo === 'texto'"
        class="mu-a text-sm leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100"
        :class="{ 'mu-placeholder': isPlaceholderText(snap.body) }"
      >
        {{ snap.body }}
      </div>

      <!-- resultado esperado -->
      <div v-else-if="tipo === 'callout' && isResultCallout" class="mu-result whitespace-pre-line">
        <b>{{ snap.title || 'Resultado esperado:' }}</b>
        {{ snap.body }}
      </div>

      <!-- callout -->
      <div
        v-else-if="tipo === 'callout'"
        class="mu-callout"
        :class="calloutClass"
      >
        <p v-if="snap.title" class="mb-1 font-semibold">{{ snap.title }}</p>
        <p class="whitespace-pre-wrap">{{ snap.body }}</p>
      </div>

      <!-- accion = un botón -->
      <div v-else-if="tipo === 'accion'">
        <UButton
          size="sm"
          :icon="snap.icon || undefined"
          :label="snap.label || block.titulo || 'Acción'"
          :color="(snap.color as any) || 'primary'"
          :variant="(snap.variant as any) || 'solid'"
        />
      </div>

      <!-- toolbar -->
      <div v-else-if="tipo === 'toolbar'" class="flex flex-wrap items-center gap-2">
        <UButton
          v-for="(btn, i) in (snap.buttons || [])"
          :key="i"
          size="sm"
          :icon="btn.icon || undefined"
          :label="btn.label || undefined"
          :color="(btn.color as any) || 'primary'"
          :variant="(btn.variant as any) || 'solid'"
        />
      </div>

      <!-- card = UCard real -->
      <UCard v-else-if="tipo === 'card'">
        <template v-if="snap.title || snap.icon || (snap.buttons || []).length" #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <UIcon v-if="snap.icon" :name="snap.icon" class="h-5 w-5 shrink-0 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ snap.title || block.titulo || 'Card' }}</h3>
            </div>
            <div v-if="(snap.buttons || []).length" class="flex flex-wrap gap-2">
              <UButton
                v-for="(btn, i) in snap.buttons"
                :key="i"
                size="sm"
                :icon="btn.icon || undefined"
                :label="btn.label || undefined"
                :color="(btn.color as any) || 'primary'"
                :variant="(btn.variant as any) || 'solid'"
              />
            </div>
          </div>
        </template>
        <p v-if="snap.body" class="mb-3 text-sm text-gray-600 dark:text-gray-300">{{ snap.body }}</p>
        <div v-if="(snap.fields || []).length" class="grid gap-3 sm:grid-cols-2">
          <div v-for="(field, i) in snap.fields" :key="i">
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ field.label }}</label>
            <USelect
              v-if="field.type === 'select' || (field.options || []).length"
              v-model="cardLocalValues[field.key || field.label || i]"
              :items="(field.options || []).map((o: any) => ({ label: o.label, value: o.value }))"
              class="w-full"
            />
            <UInput v-else v-model="cardLocalValues[field.key || field.label || i]" class="w-full" />
          </div>
        </div>
        <p v-else-if="!snap.body" class="text-xs text-gray-400">Contenido de card</p>
      </UCard>

      <!-- filtros -->
      <UCard v-else-if="tipo === 'filtros'" :ui="{ body: 'p-3 sm:p-3' }">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div v-for="(field, i) in (snap.fields || [])" :key="i">
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ field.label }}</label>
            <USelect
              v-if="field.type === 'select' || (field.options || []).length"
              v-model="filterLocalValues[field.key || field.label || i]"
              :items="(field.options || []).map((o: any) => ({ label: o.label, value: o.value }))"
              class="w-full"
            />
            <UInput v-else v-model="filterLocalValues[field.key || field.label || i]" class="w-full" />
          </div>
        </div>
      </UCard>

      <!-- tabs = UTabs real (mismo estilo pill) -->
      <div v-else-if="tipo === 'tabs'" class="space-y-2">
        <UTabs
          :model-value="activeTab"
          :items="tabItems"
          variant="pill"
          class="mb-1 w-80 h-15"
          @update:model-value="onActiveTabChange"
        />
        <p v-if="activeTabContent" class="text-sm text-gray-700 dark:text-gray-300">{{ activeTabContent }}</p>
      </div>

      <!-- tabla documental (campos / errores) -->
      <UCard v-else-if="tipo === 'tabla' && isDocTable" :ui="{ body: 'overflow-x-auto p-0 sm:p-0' }">
        <table class="mu-doc-table">
          <thead>
            <tr>
              <th v-for="(col, ci) in docTableHeaders" :key="ci">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in docTableRows" :key="ri">
              <td
                v-for="(cell, ci) in row"
                :key="ci"
                :class="{ 'mu-placeholder': isPlaceholderText(cell) }"
              >{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <!-- tabla = DataTable real (mismos estilos) -->
      <div v-else-if="tipo === 'tabla'" class="manual-datatable-embed">
        <DataTable
          :title="block.titulo || ''"
          :show-title="false"
          :show-top-section="true"
          :show-body-top="false"
          :show-pagination="false"
          :show-bottom-section="false"
          :show-export="Boolean(snap.show_export ?? true)"
          :show-primary-search="Boolean(snap.show_search ?? true)"
          :show-filters="tableFilterConfig.length > 0"
          :fill-viewport="false"
          :data="tableData"
          :columns="tableColumns"
          :filter-config="tableFilterConfig"
          :filters-value="tableFiltersValue"
          empty-state-message="Sin filas de ejemplo"
        />
      </div>

      <!-- modal -->
      <UCard v-else-if="tipo === 'modal'">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-highlighted">{{ snap.title || block.titulo || 'Modal' }}</p>
            <span class="text-muted">×</span>
          </div>
        </template>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="(field, i) in (snap.fields || [])" :key="i">
            <label class="mb-1 block text-xs font-medium text-muted">{{ field.label }}</label>
            <USelect
              v-if="field.type === 'select' || (field.options || []).length"
              :model-value="field.value"
              :items="(field.options || []).map((o: any) => ({ label: o.label, value: o.value }))"
              class="w-full"
            />
            <UInput v-else :model-value="field.value" class="w-full" disabled />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              v-for="(action, ai) in (snap.actions || ['Cancelar', 'Guardar'])"
              :key="ai"
              size="sm"
              :color="ai === (snap.actions || []).length - 1 ? 'primary' : 'neutral'"
              :variant="ai === (snap.actions || []).length - 1 ? 'solid' : 'ghost'"
              class="pointer-events-none"
            >
              {{ action }}
            </UButton>
          </div>
        </template>
      </UCard>

      <!-- media -->
      <div v-else-if="tipo === 'media'" class="space-y-2">
        <div class="flex justify-center">
          <img
            v-if="resolvedMediaSrc"
            :src="resolvedMediaSrc"
            :alt="snap.nombre || snap.alt || 'Captura'"
            class="max-h-64 w-auto max-w-full rounded-lg border border-default object-contain sm:max-h-72"
          >
          <UCard
            v-else
            variant="subtle"
            class="w-full max-w-lg"
            :ui="{ body: 'flex flex-col items-center justify-center gap-2 px-6 py-8 sm:px-6 sm:py-8' }"
          >
            <img src="/assets/img/manual/captura-pendiente.svg" alt="Plantilla de captura" class="max-h-36 w-auto object-contain">
            <template v-if="isAdminView">
              <p v-if="snap.caption" class="text-center text-sm font-medium leading-snug text-highlighted">
                {{ snap.caption }}
              </p>
              <p class="text-center text-xs text-muted">
                En el mantenedor, sustituye esta plantilla por la captura real.
              </p>
            </template>
          </UCard>
        </div>
        <p v-if="isAdminView && snap.caption && resolvedMediaSrc" class="text-center text-xs text-muted">{{ snap.caption }}</p>
      </div>

      <!-- embed -->
      <UCard v-else-if="tipo === 'embed'" class="space-y-2">
        <div :class="['overflow-hidden p-3', embedScopeClass]">
          <div v-html="snap.html || ''" />
        </div>
      </UCard>

      <!-- flow = pasos numerados (plantilla) -->
      <UCard v-else-if="tipo === 'flow'" variant="subtle">
        <h4 v-if="block.titulo" class="mu-steps-title text-primary-600 dark:text-primary-400">{{ block.titulo }}</h4>
        <p v-if="snap.hint" class="mb-3 whitespace-pre-line text-sm leading-relaxed text-default">{{ snap.hint }}</p>
        <ol class="mu-steps-list text-sm text-default">
          <li v-for="(step, si) in (snap.steps || [])" :key="si">
            <b v-if="step.title" class="block">{{ step.title }}</b>
            <span
              v-if="step.body"
              class="whitespace-pre-line"
              :class="step.title ? 'mt-0.5 block leading-relaxed' : ''"
            >{{ step.body }}</span>
            <div v-if="flowMediaAt(Number(si))" class="mt-3">
              <ManualBlockRenderer :block="{ ...flowMediaAt(Number(si)), titulo: '' }" :variant="variant" />
            </div>
          </li>
        </ol>
      </UCard>

      <UAlert v-else color="warning" variant="soft" :title="`Bloque no soportado: ${tipo}`" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { ManualBlock } from '~/types/manualUsuario'
import type { FilterConfig } from '~/types/data-table'
import DataTable from '~/components/DataTable.vue'
import {
  MANUAL_NAV_KEY,
  type ManualNavCrumb,
} from '~/composables/manual-usuario/useManualNav'

const props = withDefaults(defineProps<{
  block: ManualBlock
  /** reader = manual público; admin = mantenedor (muestra hints de captura) */
  variant?: 'reader' | 'admin'
}>(), {
  variant: 'reader',
})

const isAdminView = computed(() => props.variant === 'admin')
const emit = defineEmits<{
  'update:active': [value: string]
}>()

const { fetchAsset } = useManualUsuario()
const manualNav = inject(MANUAL_NAV_KEY, computed(() => null))

const payload = computed(() => props.block.payload || {})
const snap = computed(() => (payload.value.snapshot || {}) as Record<string, any>)
const tipo = computed(() => String(props.block.tipo || ''))

/** Detecta URL absoluta o ruta tipo /curso?tab=… / modulo/ruta */
function isRouteLike(raw: unknown): boolean {
  const t = String(raw ?? '').trim()
  if (!t || /\s/.test(t)) return false
  if (/^https?:\/\//i.test(t)) return true
  if (t.startsWith('/') && t.length > 1) return true
  // ruta relativa con / o ? (p. ej. curso?tab=alumnos, pages/curso/index)
  if (/^[a-z0-9][\w\-./?=&%#]*$/i.test(t) && (t.includes('/') || t.includes('?'))) return true
  return false
}

function parseManualRoute(raw: unknown): { href: string; external: boolean } | null {
  const t = String(raw ?? '').trim()
  if (!isRouteLike(t)) return null
  if (/^https?:\/\//i.test(t)) {
    return { href: t, external: true }
  }
  const path = t.startsWith('/') ? t : `/${t}`
  return { href: path, external: false }
}

const grupoTitleLink = computed(() => {
  if (isArticulo.value) return null
  return parseManualRoute(props.block.clave)
})
const widgetTitleLink = computed(() => parseManualRoute(payload.value.subtitulo))

const isArticulo = computed(() => tipo.value === 'grupo' && String(snap.value.variant || '') === 'articulo')
const isColapsable = computed(() => tipo.value === 'grupo' && Boolean(snap.value.colapsable))
const isQa = computed(() => tipo.value === 'texto' && Boolean(snap.value.qa))
const isResultCallout = computed(() => {
  if (tipo.value !== 'callout') return false
  const tone = String(snap.value.tone || '')
  return tone === 'success' || tone === 'result'
})
const isDocTable = computed(() => {
  if (tipo.value !== 'tabla') return false
  const variant = String(snap.value.variant || '')
  return variant === 'doc' || Boolean(snap.value.simple)
})
const hideWidgetTitle = computed(() => isQa.value || isResultCallout.value || tipo.value === 'flow')
const hideMediaMaintainerMeta = computed(() => tipo.value === 'media' && !isAdminView.value)

const articleTags = computed(() => {
  const tags = snap.value.tags
  return Array.isArray(tags) ? tags.map((t: unknown) => String(t)).filter(Boolean) : []
})
const articleCrumbs = computed((): Array<ManualNavCrumb & { to?: string }> => {
  const breadcrumb = String(snap.value.breadcrumb || '').trim()

  if (manualNav.value) {
    return manualNav.value.resolveCrumbs(breadcrumb, props.block.id)
  }

  if (!breadcrumb) return []

  const labels = breadcrumb
    .split(/\s*→\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  const clave = parseManualRoute(props.block.clave)
  const screenPath = clave && !clave.external ? clave.href : null
  const modulePath = screenPath ? String(screenPath).split('?')[0] : null

  return labels.map((label, i) => {
    const last = i === labels.length - 1
    const secondLast = i === labels.length - 2
    let to: string | undefined
    if (i === 0 && /^inicio$/i.test(label)) {
      to = '/'
    } else if (last && screenPath) {
      to = screenPath
    } else if (secondLast && modulePath && modulePath !== '/') {
      to = modulePath
    } else if (i === 1) {
      to = '/manual-usuario'
    }
    return { label, to, current: last }
  })
})

function crumbAnchorHref(anchorKey: string) {
  return anchorKey === '__top__' ? '#' : `#cap-${anchorKey}`
}

function onManualCrumbClick(crumb: ManualNavCrumb, event: MouseEvent) {
  if (!manualNav.value || !crumb.anchorKey) return
  event.preventDefault()
  if (crumb.anchorKey === '__top__') {
    manualNav.value.scrollToTop()
    return
  }
  manualNav.value.scrollTo(crumb.anchorKey)
}

function isPlaceholderText(value: unknown): boolean {
  return /pendiente de definir/i.test(String(value || ''))
}

const docTableHeaders = computed(() => {
  const cols = snap.value.columns || []
  return cols.map((c: any, i: number) => {
    if (typeof c === 'string') return c
    return String(c?.header ?? c?.label ?? c?.accessorKey ?? `Col ${i + 1}`)
  })
})
const docTableRows = computed(() => {
  const rows = snap.value.rows || []
  const headers = docTableHeaders.value
  return rows.map((row: any) => {
    if (Array.isArray(row)) return row.map((c) => String(c ?? ''))
    if (row && typeof row === 'object') {
      const cols = snap.value.columns || []
      return headers.map((_h: string, i: number) => {
        const col = cols[i]
        const key = typeof col === 'string' ? `c${i}` : String(col?.accessorKey ?? col?.key ?? `c${i}`)
        return String(row[key] ?? row[_h] ?? '')
      })
    }
    return [String(row ?? '')]
  })
})

const sortedChildren = computed(() =>
  [...(props.block.children || [])].sort((a, b) => a.orden - b.orden || a.id - b.id)
)

const flowMediaChildren = computed(() =>
  sortedChildren.value.filter((child) => String(child.tipo || '') === 'media')
)

function flowMediaAt(index: number) {
  return flowMediaChildren.value[Number(index)] || null
}

const activeTab = ref<string>(snap.value.active || snap.value.tabs?.[0]?.key || '')
const filterLocalValues = reactive<Record<string, any>>({})
const cardLocalValues = reactive<Record<string, any>>({})
const resolvedMediaSrc = ref<string | null>(null)
let mediaObjectUrl: string | null = null
const embedScopeClass = computed(() => `mui-scope-${props.block.id}`)
let embedStyleEl: HTMLStyleElement | null = null

function syncFilterLocalValues() {
  const fields = snap.value.fields || []
  for (const [i, field] of fields.entries()) {
    const key = String(field.key || field.label || i)
    if (!(key in filterLocalValues)) {
      filterLocalValues[key] = field.value ?? field.options?.[0]?.value ?? ''
    }
  }
}

function syncCardLocalValues() {
  const fields = snap.value.fields || []
  for (const [i, field] of fields.entries()) {
    const key = String(field.key || field.label || i)
    if (!(key in cardLocalValues)) {
      cardLocalValues[key] = field.value ?? field.options?.[0]?.value ?? ''
    }
  }
}
syncFilterLocalValues()
syncCardLocalValues()

const tabItems = computed(() =>
  (snap.value.tabs || []).map((t: any) => ({
    label: String(t.label ?? t.key ?? ''),
    value: String(t.key ?? t.value ?? ''),
  })).filter((t: { label: string; value: string }) => t.value !== '')
)

const activeTabContent = computed(() => {
  const tab = (snap.value.tabs || []).find((t: any) => t.key === activeTab.value || t.value === activeTab.value)
  return tab?.content || ''
})

function onActiveTabChange(value: string | number) {
  const next = String(value ?? '')
  if (!next || next === activeTab.value) return
  activeTab.value = next
  emit('update:active', next)
}

const calloutClass = computed(() => {
  const tone = snap.value.tone || 'info'
  if (tone === 'warning') return 'is-warning'
  if (tone === 'danger') return 'is-danger'
  if (tone === 'note') return 'is-note'
  return 'is-info'
})

const columnLabels = computed(() => {
  const cols = snap.value.columns || []
  return cols.map((c: any, i: number) => {
    if (typeof c === 'string') return c
    return String(c?.header ?? c?.label ?? c?.accessorKey ?? `Col ${i + 1}`)
  })
})

const tableColumns = computed(() => {
  const cols = snap.value.columns || []
  return cols.map((c: any, i: number) => {
    if (typeof c === 'string') {
      return {
        accessorKey: `c${i}`,
        header: c,
        cell: ({ row }: { row: any }) => h('span', { class: 'whitespace-pre-line text-sm' }, String(row.original?.[`c${i}`] ?? '')),
      }
    }
    const accessorKey = String(c?.accessorKey ?? c?.key ?? `c${i}`)
    const header = String(c?.header ?? c?.label ?? accessorKey)
    return {
      accessorKey,
      header,
      cell: ({ row }: { row: any }) => renderManualCell(c, row.original || row),
    }
  })
})

function formatManualMoney(value: unknown, currency = 'PEN'): string {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value ?? '')
  const prefix = String(currency).toUpperCase() === 'USD' ? 'US$ ' : 'S/ '
  return prefix + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function computePagoEstado(row: Record<string, any>): string {
  const importe = Number(row.Ss_Total ?? 0)
  const pagos = Number(row.total_pagos ?? 0)
  if (pagos > importe) return 'sobrepago'
  if (pagos < importe && pagos !== 0) return 'adelanto'
  if (pagos === importe && importe !== 0) return 'pagado'
  return 'pendiente'
}

function renderManualCell(col: any, row: Record<string, any>) {
  const type = String(col?.type || 'text')
  const key = String(col?.accessorKey ?? '')
  const valueKey = String(col?.value_key || key)
  const readonly = Boolean(col?.readonly)
  const USelect = resolveComponent('USelect')
  const UButton = resolveComponent('UButton')
  const UInput = resolveComponent('UInput')

  if (type === 'select') {
    const options = Array.isArray(col.options) ? col.options : []
    let model = row[valueKey] ?? row[key]
    if (col.compute === 'pago_estado') {
      model = computePagoEstado(row)
    }
    return h(USelect as any, {
      modelValue: model,
      items: options.map((o: any) => ({ label: String(o.label ?? o.value ?? ''), value: o.value })),
      disabled: readonly || options.length === 0,
      size: 'sm',
      class: 'w-full min-w-[8rem]',
    })
  }

  if (type === 'input') {
    return h(UInput as any, {
      modelValue: row[valueKey] ?? row[key] ?? '',
      size: 'sm',
      disabled: readonly,
      class: 'w-full min-w-[6rem]',
    })
  }

  if (type === 'buttons') {
    const buttons = Array.isArray(col.buttons) ? col.buttons : []
    return h(
      'div',
      { class: 'flex flex-wrap items-center gap-1' },
      buttons.map((b: any, bi: number) =>
        h(UButton as any, {
          key: bi,
          size: 'xs',
          icon: b.icon || undefined,
          label: b.label || undefined,
          color: b.color || 'primary',
          variant: b.variant || 'outline',
        })
      )
    )
  }

  if (type === 'pago_grid') {
    const slots = Math.max(1, Number(col.slots || 4))
    const currency = String(col.currency || 'PEN')
    const detailsRaw = row.pagos_details ?? row[valueKey] ?? row[key] ?? []
    const details = Array.isArray(detailsRaw) ? detailsRaw : []
    const cells: any[] = []
    for (const p of details.slice(0, slots)) {
      const monto = p?.monto ?? p?.Ss_Total ?? ''
      cells.push(
        h(
          'div',
          {
            class: 'flex min-w-[4.5rem] items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium tabular-nums text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
            title: 'Detalle del adelanto',
          },
          formatManualMoney(monto, currency)
        )
      )
    }
    for (let i = details.length; i < slots; i++) {
      cells.push(
        h(
          'div',
          {
            class: 'flex min-w-[4.5rem] items-center justify-center rounded-md border border-dashed border-default px-2 py-1.5 text-muted',
            title: String(col.modal_hint || 'Registrar Pago'),
          },
          [h(resolveComponent('UIcon') as any, { name: 'i-heroicons-plus', class: 'h-4 w-4' })]
        )
      )
    }
    return h('div', { class: 'flex flex-wrap gap-1.5' }, cells)
  }

  if (type === 'currency') {
    const raw = row[valueKey] ?? row[key] ?? row.Ss_Total ?? ''
    // Si ya viene formateado (S/ …) mostrarlo tal cual
    if (typeof raw === 'string' && /^(S\/|US\$)/.test(raw)) {
      return h('span', { class: 'tabular-nums text-sm' }, raw)
    }
    return h('span', { class: 'tabular-nums text-sm' }, formatManualMoney(raw, col.currency || 'PEN'))
  }

  if (type === 'multiline') {
    let text = String(row[key] ?? '')
    if (!text && Array.isArray(col.fields)) {
      text = col.fields.map((f: string) => row[f]).filter(Boolean).join('\n')
    }
    text = text.replace(/ · /g, '\n')
    return h('div', { class: 'whitespace-pre-line text-sm leading-snug' }, text)
  }

  const text = String(row[key] ?? '').replace(/ · /g, '\n')
  return h('span', { class: 'whitespace-pre-line text-sm' }, text)
}

const tableData = computed(() => {
  const rows = snap.value.rows || []
  const cols = tableColumns.value
  return rows.map((row: any, ri: number) => {
    if (row && !Array.isArray(row) && typeof row === 'object') {
      return { id: row.id ?? ri, ...row }
    }
    const cells = Array.isArray(row) ? row : [row]
    const obj: Record<string, any> = { id: ri }
    cols.forEach((col: any, i: number) => {
      obj[col.accessorKey] = cells[i] ?? ''
    })
    return obj
  })
})

const tableFilterConfig = computed<FilterConfig[]>(() => {
  const filters = snap.value.filters || []
  return filters.map((f: any, i: number) => ({
    key: String(f.key || `f${i}`),
    label: String(f.label || `Filtro ${i + 1}`),
    type: f.type || 'select',
    placeholder: String(f.placeholder || 'Seleccionar'),
    options: Array.isArray(f.options)
      ? f.options.map((o: any) => ({
          label: String(o.label ?? o.value ?? ''),
          value: String(o.value ?? o.label ?? ''),
        }))
      : [],
  }))
})

const tableFiltersValue = computed(() => {
  const out: Record<string, any> = {}
  for (const f of snap.value.filters || []) {
    const key = String(f.key || '')
    if (key) out[key] = f.value ?? ''
  }
  return out
})

const scopedEmbedCss = computed(() => {
  const css = String(snap.value.css || '').trim()
  if (!css) return ''
  const scope = `.${embedScopeClass.value}`
  return css.replace(/(^|})\s*([^{@}]+)\s*\{/g, (_m, brace, selectors) => {
    const scoped = String(selectors).split(',').map((s) => `${scope} ${s.trim()}`).join(', ')
    return `${brace} ${scoped}{`
  })
})

const revokeMedia = () => {
  if (mediaObjectUrl) {
    try { URL.revokeObjectURL(mediaObjectUrl) } catch { /* noop */ }
    mediaObjectUrl = null
  }
  resolvedMediaSrc.value = null
}

const loadMedia = async () => {
  revokeMedia()
  const url = snap.value.url as string | undefined
  if (!url) return
  if (!String(url).includes('/api/manual-usuario/')) {
    resolvedMediaSrc.value = url
    return
  }
  try {
    const blob = await fetchAsset(url)
    mediaObjectUrl = URL.createObjectURL(blob)
    resolvedMediaSrc.value = mediaObjectUrl
  } catch {
    resolvedMediaSrc.value = null
  }
}

const syncEmbedStyle = () => {
  if (!import.meta.client || tipo.value !== 'embed') {
    if (embedStyleEl) { embedStyleEl.remove(); embedStyleEl = null }
    return
  }
  const css = scopedEmbedCss.value
  if (!css) {
    if (embedStyleEl) { embedStyleEl.remove(); embedStyleEl = null }
    return
  }
  if (!embedStyleEl) {
    embedStyleEl = document.createElement('style')
    embedStyleEl.setAttribute('data-manual-ui-embed', String(props.block.id))
    document.head.appendChild(embedStyleEl)
  }
  embedStyleEl.textContent = css
}

watch(
  () => [props.block.id, tipo.value, snap.value.url, snap.value.html, snap.value.css, snap.value.active, snap.value.fields],
  () => {
    activeTab.value = snap.value.active || snap.value.tabs?.[0]?.key || ''
    if (tipo.value === 'filtros') syncFilterLocalValues()
    if (tipo.value === 'card') syncCardLocalValues()
    if (tipo.value === 'media') void loadMedia()
    syncEmbedStyle()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  revokeMedia()
  if (embedStyleEl) { embedStyleEl.remove(); embedStyleEl = null }
})
</script>
