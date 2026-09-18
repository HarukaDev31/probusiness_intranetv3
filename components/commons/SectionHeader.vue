<template>
    <div>
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[18px]">
            <div v-if="title" class="h-[108px] rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div v-for="i in skeletonCount" :key="i" class="h-[108px] rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>

        <div v-else class="w-full min-w-0">
            <p v-if="title" class="m-0 mb-3 text-base font-semibold text-[#17233a] dark:text-white">
                {{ title }}
            </p>
            <div
                class="grid grid-cols-1 sm:grid-cols-2 gap-[18px] w-full min-w-0"
                :class="gridClass"
            >
                <article
                    v-for="(header, index) in headers"
                    :key="header.key || `${header.label}-${index}`"
                    class="customers-kpi relative flex items-start gap-4 min-h-[108px] px-5 py-[22px] rounded-xl bg-white dark:bg-gray-800 shadow-[0_6px_20px_rgba(23,35,58,0.1)] border-l-[3px] border-[#f26522] overflow-hidden"
                    :class="isInteractive(header) ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60' : ''"
                    @click="onHeaderClick(header)"
                >
                    <div class="w-[46px] h-[46px] shrink-0 grid place-items-center text-[#f26522]" aria-hidden="true">
                        <img
                            v-if="isUrl(header.icon)"
                            :src="header.icon"
                            alt=""
                            class="w-9 h-6 object-contain"
                        >
                        <UIcon v-else :name="header.icon || 'fluent:box-32-filled'" class="w-9 h-9" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="m-0 text-[11px] tracking-[0.8px] uppercase text-[#8494b0]">
                            {{ header.label }}
                        </p>
                        <p class="mt-1 mb-0 font-bold leading-none text-[#17233a] dark:text-white" :class="String(header.value ?? '').length > 8 ? 'text-[1.35rem]' : 'text-[2rem]'">
                            {{ header.value ?? 'N/A' }}
                        </p>
                        <p v-if="header.sublines?.length" class="mt-2 mb-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#8494b0]">
                            <span v-for="line in header.sublines" :key="line.label" class="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                                <span>{{ line.label }}</span>
                                <strong class="font-semibold text-[#17233a] dark:text-white">{{ line.value }}</strong>
                            </span>
                        </p>
                        <p v-if="header.hint" class="mt-1 mb-0 text-[11px] text-gray-400">
                            {{ header.hint }}
                        </p>
                    </div>

                    <div
                        v-if="countryRows(header).length"
                        class="customers-kpi__breakdown"
                    >
                        <p class="customers-kpi__breakdown-title">{{ header.label }}</p>
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
        </div>
    </div>
</template>
<script setup lang="ts">
import type { Header, HeaderCountryRow } from '~/types/data-table'
import { computed } from 'vue'
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
    skeletonCount: 3,
    showTitleSkeleton: true,
})

const emit = defineEmits<{
    'click-header': [header: Header]
}>()

const isUrl = (url?: string) => {
    if (!url) return false
    return url.includes('http') || url.includes('https')
}

const gridClass = computed(() => {
    const count = props.headers?.length || 0
    if (count >= 6) return 'xl:grid-cols-6'
    if (count >= 5) return 'xl:grid-cols-5'
    if (count >= 4) return 'xl:grid-cols-4'
    return 'xl:grid-cols-3'
})

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

const isInteractive = (header: Header) => Boolean(header.clickable || header.por_usuario)

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
