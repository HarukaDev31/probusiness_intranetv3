<template>
    <div>
        <!-- Skeleton cuando está cargando -->
        <div v-if="loading" class="flex flex-wrap gap-2 lg:gap-3">
            <!-- Skeleton del título -->
            <div v-if="showTitleSkeleton" class="flex items-center gap-2">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse skeleton-item"></div>
            </div>
            <!-- Skeleton de los headers -->
            <div v-for="i in skeletonCount" :key="i" class="flex items-center gap-2">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse skeleton-item"></div>
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse skeleton-item"></div>
            </div>
        </div>

        <!-- Contenido real cuando no está cargando -->
        <div v-else>
            <!-- Scroll container: horizontal on small screens, visible overflow on larger -->
            <div class="section-headers-scroll -mx-2 px-2 overflow-x-auto sm:overflow-x-visible">
                <div class="inline-flex items-center gap-2 whitespace-nowrap">
                    <div v-if="title" class="flex items-center pr-4 pl-2 py-3"
                        style="border-bottom: 1px solid #e0e0e0;border-right: 1px solid #e0e0e0;">
                        {{ title }}
                    </div>
                    <div v-for="header in headers" :key="header.value" class="flex items-center px-2 py-3 gap-1"
                        style="border-bottom: 1px solid #e0e0e0;">
                        <div v-if="isUrl(header.icon)" class="flex items-center gap-2">
                            <img :src="header.icon" alt="icon" class="w-5 h-4" />
                        </div>
                        <div v-else>
                            <UIcon :name="header.icon" class="w-5 h-4 mt-1" />
                        </div>
                        <span class="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                            {{ header.label }}:
                        </span>
                        <template v-if="header.por_usuario">
                            <button type="button"
                                class="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 px-2 py-[2px] text-[11px] font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                                @click="openPerUsuarioModal(header)">
                                {{ header.value || 'N/A' }}
                            </button>
                        </template>
                        <template v-else>
                            <UBadge :label="header.value || 'N/A'" color="neutral" variant="soft" size="sm"
                                class="font-medium text-xs" />
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { Header } from '~/types/data-table';
import { computed } from 'vue'
import { useModal } from '~/composables/commons/useModal'

const props = withDefaults(defineProps<{
    title: string | null
    headers: any[]
    loading?: boolean
    skeletonCount?: number
    showTitleSkeleton?: boolean
}>(), {
    loading: false,
    skeletonCount: 3,
    showTitleSkeleton: true
})
const isUrl = (url: string) => {
    return url.includes('http') || url.includes('https')
}

const { showInfo } = useModal()

const openPerUsuarioModal = (header: any) => {
    const data = header?.por_usuario
    if (!data) return
    // Formatear como lista legible: "Nombre: valor • ..."
    const entries = Object.entries(data as Record<string, number | string>)
    const formatNumber = (v: any) => {
        const n = Number(v)
        return isNaN(n) ? String(v) : n.toLocaleString('es-PE', { maximumFractionDigits: 2 })
    }
    const pretty = entries.map(([k, v]) => `• ${k}: ${formatNumber(v)}`).join('\n')
    showInfo(header.label || 'Detalle por usuario', pretty, { persistent: true })
}
</script>

<style scoped>
/* Estilos para el skeleton */
.skeleton-item {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

/* Mejorar las animaciones del skeleton */
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .5;
    }
}

/* Responsive para mobile */
@media (max-width: 768px) {
    .skeleton-item {
        margin: 0.25rem 0;
    }
}

/* Scroll helper for section headers on small screens */
.section-headers-scroll {
    -webkit-overflow-scrolling: touch;
}
.section-headers-scroll::-webkit-scrollbar {
    height: 6px;
}
.section-headers-scroll::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.08);
    border-radius: 9999px;
}
@media (min-width: 640px) {
    .section-headers-scroll { overflow-x: visible !important; }
}
</style>