<template>
  <div class="space-y-3">
    <!-- Grupo: título + clave; hijos recursivos (vertical) -->
    <div
      v-if="tipo === 'grupo'"
      :id="`cap-b-${block.id}`"
      class="scroll-mt-4 space-y-4"
    >
      <div>
        <div v-if="block.titulo" class="text-base font-semibold text-gray-900 dark:text-white">
          {{ block.titulo }}
        </div>
        <p v-if="block.clave" class="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
          {{ block.clave }}
        </p>
        <p v-if="payload.subtitulo" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ payload.subtitulo }}
        </p>
      </div>
      <div v-if="(block.children || []).length" class="space-y-4 border-l border-gray-200 pl-3 dark:border-gray-700 sm:pl-4">
        <ManualBlockRenderer
          v-for="child in sortedChildren"
          :key="child.id"
          :block="child"
        />
      </div>
    </div>

    <!-- Timeline: pasos horizontales -->
    <div v-else-if="tipo === 'timeline'" class="space-y-3">
      <div v-if="block.titulo" class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ block.titulo }}
      </div>
      <p v-if="payload.subtitulo" class="text-xs text-gray-500 dark:text-gray-400">
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
            <div class="flex-1 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900/40">
              <ManualBlockRenderer :block="{ ...child, titulo: '' }" />
            </div>
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

    <template v-else>
      <div v-if="block.titulo" class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ block.titulo }}
      </div>
      <p v-if="payload.subtitulo" class="text-xs text-gray-500 dark:text-gray-400">
        {{ payload.subtitulo }}
      </p>

      <!-- texto -->
      <div v-if="tipo === 'texto'" class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
        {{ snap.body }}
      </div>

      <!-- callout -->
      <div
        v-else-if="tipo === 'callout'"
        class="rounded-xl border px-3 py-3 text-sm"
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
      <div v-else-if="tipo === 'filtros'" class="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900/40">
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
      </div>

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
        <p v-if="payload.source?.api_hint" class="mt-2 text-[11px] text-gray-400">
          Origen: {{ payload.source.component || payload.source.page_path }} · {{ payload.source.api_hint }}
        </p>
      </div>

      <!-- modal -->
      <div v-else-if="tipo === 'modal'" class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-900/40">
        <div class="mb-3 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
          <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ snap.title || block.titulo || 'Modal' }}</p>
          <span class="text-gray-400">×</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="(field, i) in (snap.fields || [])" :key="i">
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ field.label }}</label>
            <USelect
              v-if="field.type === 'select' || (field.options || []).length"
              :model-value="field.value"
              :items="(field.options || []).map((o: any) => ({ label: o.label, value: o.value }))"
              class="w-full"
            />
            <UInput v-else :model-value="field.value" class="w-full" disabled />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
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
      </div>

      <!-- media -->
      <div v-else-if="tipo === 'media'" class="space-y-2">
        <img
          v-if="resolvedMediaSrc"
          :src="resolvedMediaSrc"
          :alt="snap.alt || 'Captura'"
          class="w-full rounded-lg border border-gray-200 dark:border-gray-600"
        >
        <div v-else class="overflow-hidden rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <img src="/assets/img/manual/captura-pendiente.svg" alt="Captura pendiente" class="w-full">
        </div>
        <p v-if="snap.caption" class="text-xs text-gray-500">{{ snap.caption }}</p>
      </div>

      <!-- embed -->
      <div v-else-if="tipo === 'embed'" class="space-y-2">
        <div :class="['overflow-hidden rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900/40', embedScopeClass]">
          <div v-html="snap.html || ''" />
        </div>
      </div>

      <!-- flow -->
      <div v-else-if="tipo === 'flow'" class="relative pl-2">
        <p v-if="snap.hint" class="mb-3 text-xs text-gray-500">{{ snap.hint }}</p>
        <div class="absolute bottom-2 left-[19px] top-2 w-px bg-gray-200 dark:bg-gray-600" />
        <ol class="space-y-4">
          <li v-for="(step, si) in (snap.steps || [])" :key="si" class="relative pl-10">
            <span class="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-200 bg-white text-xs font-bold text-primary-700 dark:border-primary-700 dark:bg-gray-800 dark:text-primary-200">
              {{ stepNumber(si) }}
            </span>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ step.title }}</p>
            <p class="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{{ step.body }}</p>
          </li>
        </ol>
      </div>

      <div v-else class="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
        Bloque no soportado: {{ tipo }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { ManualBlock } from '~/types/manualUsuario'
import type { FilterConfig } from '~/types/data-table'
import { ManualUsuarioService } from '~/services/manualUsuarioService'
import DataTable from '~/components/DataTable.vue'

const props = defineProps<{ block: ManualBlock }>()
const emit = defineEmits<{
  'update:active': [value: string]
}>()

const payload = computed(() => props.block.payload || {})
const snap = computed(() => (payload.value.snapshot || {}) as Record<string, any>)
const tipo = computed(() => String(props.block.tipo || ''))

const sortedChildren = computed(() =>
  [...(props.block.children || [])].sort((a, b) => a.orden - b.orden || a.id - b.id)
)

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

function stepNumber(si: string | number): number {
  return Number(si) + 1
}

const calloutClass = computed(() => {
  const tone = snap.value.tone || 'info'
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100'
  if (tone === 'danger') return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100'
  return 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-100'
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
    const blob = await ManualUsuarioService.fetchAsset(url)
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
