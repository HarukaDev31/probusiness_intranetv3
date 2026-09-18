<template>
    <div>
        <div v-if="loading" class="relative">
            <p v-if="title" class="m-0 mb-3 h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div class="flex gap-3 overflow-hidden">
                <div v-for="i in skeletonCount" :key="i" class="h-[72px] min-w-[140px] flex-1 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
        </div>

        <div v-else class="w-full min-w-0">
            <p v-if="title" class="m-0 mb-2 text-base font-semibold text-[#17233a] dark:text-white">
                {{ title }}
            </p>
            <div class="relative">
                <div
                    v-if="canScrollLeft"
                    class="kpi-fade kpi-fade--left"
                    aria-hidden="true"
                />
                <button
                    v-if="canScrollLeft"
                    type="button"
                    class="kpi-scroll-btn left-1"
                    aria-label="Ver anteriores"
                    @click="scrollByDir(-1)"
                >
                    <UIcon name="heroicons:chevron-left" class="w-4 h-4" />
                </button>

                <div
                    ref="scrollerRef"
                    class="kpi-track"
                    @scroll="updateScrollState"
                >
                    <article
                        v-for="(header, index) in headers"
                        :key="header.key || `${header.label}-${index}`"
                        class="customers-kpi kpi-card relative flex items-center gap-2 min-h-[72px] px-3 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-[0_6px_20px_rgba(23,35,58,0.1)] border-l-[3px] border-[#f26522] overflow-hidden"
                        :class="isInteractive(header) ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60' : ''"
                        @click="onHeaderClick(header)"
                    >
                        <div class="w-7 h-7 shrink-0 grid place-items-center text-[#f26522]" aria-hidden="true">
                            <img
                                v-if="isUrl(header.icon)"
                                :src="header.icon"
                                alt=""
                                class="w-6 h-4 object-contain"
                            >
                            <UIcon v-else :name="header.icon || 'fluent:box-32-filled'" class="w-6 h-6" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="m-0 text-[10px] tracking-[0.6px] uppercase text-[#8494b0] truncate">
                                {{ header.label }}
                            </p>
                            <p class="mt-0.5 mb-0 font-bold leading-none text-[#17233a] dark:text-white truncate" :class="String(header.value ?? '').length > 8 ? 'text-base' : 'text-[1.25rem]'">
                                {{ header.value ?? 'N/A' }}
                            </p>
                            <p v-if="header.hint" class="mt-1 mb-0 text-[10px] text-gray-400 truncate">
                                {{ header.hint }}
                            </p>
                        </div>

                        <div
                            v-if="countryRows(header).length || header.sublines?.length"
                            class="customers-kpi__breakdown"
                        >
                            <p class="customers-kpi__breakdown-title">{{ header.label }}</p>
                            <div
                                v-for="line in header.sublines || []"
                                :key="line.label"
                                class="customers-kpi__breakdown-row"
                            >
                                <span>{{ line.label }}</span>
                                <strong>{{ line.value }}</strong>
                            </div>
                            <div
                                v-for="row in countryRows(header)"
                                :key="row.country"
                                class="customers-kpi__breakdown-row"
                            >
                                <span>{{ row.country }}</span>
                                <strong>{{ row.value }}</strong>
                            </div>
                        </div>
                    </article>
                </div>

                <div
                    v-if="canScrollRight"
                    class="kpi-fade kpi-fade--right"
                    aria-hidden="true"
                />
                <button
                    v-if="canScrollRight"
                    type="button"
                    class="kpi-scroll-btn right-1"
                    aria-label="Ver más"
                    @click="scrollByDir(1)"
                >
                    <UIcon name="heroicons:chevron-right" class="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { Header, HeaderCountryRow } from '~/types/data-table'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useModal } from '~/composables/commons/useModal'

const props = withDefaults(defineProps<{
    title?: string | null
    headers: Header[]
    loading?: boolean
    skeletonCount?: number
    showTitleSkeleton?: boolean
}>(), {
    title: null,
    loading: false,
    skeletonCount: 8,
    showTitleSkeleton: true,
})

const emit = defineEmits<{
    'click-header': [header: Header]
}>()

const scrollerRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
let resizeObserver: ResizeObserver | null = null

const isUrl = (url?: string) => {
    if (!url) return false
    return url.includes('http') || url.includes('https')
}

const updateScrollState = () => {
    const el = scrollerRef.value
    if (!el) {
        canScrollLeft.value = false
        canScrollRight.value = false
        return
    }
    const max = el.scrollWidth - el.clientWidth
    canScrollLeft.value = el.scrollLeft > 4
    canScrollRight.value = max > 4 && el.scrollLeft < max - 4
}

const scrollByDir = (dir: number) => {
    const el = scrollerRef.value
    if (!el) return
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.5, 160), behavior: 'smooth' })
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

const isInteractive = (header: Header) => Boolean(
    header.clickable
    || header.por_usuario
    || header.sublines?.length
    || countryRows(header).length
)

const { showInfo } = useModal()

const openPerUsuarioModal = (header: Header) => {
    const data = header?.por_usuario
    if (!data) return
    const entries = Object.entries(data)
    const formatNumber = (v: number | string) => {
        const n = Number(v)
        return Number.isNaN(n) ? String(v) : n.toLocaleString('es-PE', { maximumFractionDigits: 2 })
    }
    const pretty = entries.map(([k, v]) => `• ${k}: ${formatNumber(v)}`).join('\n')
    showInfo(header.label || 'Detalle por usuario', pretty, { persistent: true })
}

const onHeaderClick = (header: Header) => {
    if (header.por_usuario) {
        openPerUsuarioModal(header)
        return
    }
    if (header.clickable) {
        emit('click-header', header)
    }
}

const bindScroller = () => {
    resizeObserver?.disconnect()
    if (!scrollerRef.value || typeof ResizeObserver === 'undefined') {
        updateScrollState()
        return
    }
    resizeObserver = new ResizeObserver(() => updateScrollState())
    resizeObserver.observe(scrollerRef.value)
    updateScrollState()
}

watch(() => [props.headers, props.loading], async () => {
    await nextTick()
    bindScroller()
}, { deep: true })

onMounted(async () => {
    await nextTick()
    bindScroller()
})

onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
})
</script>

<style scoped>
.kpi-track {
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    padding: 2px 2px 6px;
}

.kpi-card {
    flex: 1 0 calc((100% - 84px) / 8);
    min-width: max(140px, calc((100% - 84px) / 8));
}

.kpi-fade {
    position: absolute;
    top: 0;
    bottom: 6px;
    width: 48px;
    z-index: 8;
    pointer-events: none;
}

.kpi-fade--left {
    left: 0;
    background: linear-gradient(to right, #f0f4f9 10%, transparent);
}

.kpi-fade--right {
    right: 0;
    background: linear-gradient(to left, #f0f4f9 10%, transparent);
}

.dark .kpi-fade--left {
    background: linear-gradient(to right, #111827 10%, transparent);
}

.dark .kpi-fade--right {
    background: linear-gradient(to left, #111827 10%, transparent);
}

.kpi-scroll-btn {
    position: absolute;
    top: 50%;
    z-index: 9;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #f26522;
    display: grid;
    place-items: center;
    box-shadow: 0 4px 12px rgba(23, 35, 58, 0.12);
    cursor: pointer;
}

.kpi-scroll-btn:hover {
    background: #fff7ed;
}

.dark .kpi-scroll-btn {
    background: #1f2937;
    border-color: #374151;
    color: #fb923c;
}

.customers-kpi__breakdown {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: #fff;
    padding: 14px 16px;
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
    .customers-kpi__breakdown,
    .kpi-track {
        transition: none;
        scroll-behavior: auto;
    }
}
</style>
