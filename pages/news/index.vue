<template>
  <div class="md:p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="md:text-3xl text-2xl font-bold text-gray-900 dark:text-white">Noticias y Actualizaciones</h1>
      <p class="text-gray-600 dark:text-gray-400 text-xs md:text-base mt-2">
        Mantente informado sobre las últimas actualizaciones y mejoras del sistema
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 w-5 h-5 mr-2" />
        <span class="text-red-800 dark:text-red-200">{{ error }}</span>
      </div>
      <UButton 
        variant="outline" 
        color="error" 
        size="sm" 
        class="mt-3"
        @click="() => loadNews()"
      >
        Reintentar
      </UButton>
    </div>

    <!-- News List -->
    <div v-else class="space-y-6">
      <div
        v-for="item in news"
        :key="item.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow overflow-hidden"
      >
        <div class="p-6">
          <!-- Header with icon and badges -->
          <div class="flex items-start gap-4 mb-4">
            <!-- Icon -->
            <div 
              class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
              :class="getIconBgClass(item.type)"
            >
              <UIcon 
                :name="getTypeIcon(item.type)" 
                class="w-6 h-6"
                :class="getIconColorClass(item.type)"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <UBadge
                    :color="getTypeColor(item.type) as any"
                    variant="subtle"
                  >
                    {{ getTypeLabel(item.type) }}
                  </UBadge>
                  <UBadge
                    v-if="item.solicitada_por"
                    color="primary"
                    variant="subtle"
                  >
                    <UIcon name="i-heroicons-user-group" class="w-3 h-3 mr-1" />
                    {{ getSolicitadaPorLabel(item.solicitada_por) }}
                  </UBadge>
                </div>
                <div class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap md:flex-shrink-0">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  <span>{{ formatDate(item.published_at || item.created_at) }}</span>
                </div>
              </div>

              <h2 class="md:text-xl text-md font-semibold text-gray-900 dark:text-white mb-2">
                {{ item.title }}
              </h2>

              <p v-if="item.summary" class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4">
                {{ item.summary }}
              </p>
            </div>
          </div>

          <!-- Content -->
          <div class="prose dark:prose-invert max-w-none mb-4">
            <div v-html="item.content" class="text-gray-700 dark:text-gray-300 text-xs md:text-sm"></div>
          </div>

          <!-- Footer with author and redirect button -->
          <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div v-if="item.created_by_name" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-user-circle" class="w-4 h-4" />
              <span>
                Publicado por <span class="font-medium">{{ item.created_by_name }}</span>
              </span>
            </div>
            <div v-else></div>
            
            <UButton
              v-if="item.redirect"
              :color="getTypeColor(item.type) as any"
              variant="outline"
              class="cursor-pointer"
              trailing-icon="i-heroicons-arrow-right"
              @click="handleRedirect(item.redirect)"
            >
              Ver más detalles
            </UButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="news.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-newspaper" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400 text-lg">No hay noticias disponibles</p>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > pagination.per_page" class="flex justify-center mt-6">
        <div class="flex gap-2">
          <UButton
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === 1"
            @click="changePage(pagination.current_page - 1)"
          >
            Anterior
          </UButton>
          
          <div class="flex items-center px-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Página {{ pagination.current_page }} de {{ pagination.last_page }}
            </span>
          </div>
          
          <UButton
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === pagination.last_page"
            @click="changePage(pagination.current_page + 1)"
          >
            Siguiente
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNews } from '~/composables/useNews'
import type { NewsFilters, SystemNews } from '~/types/news'

const {
  news,
  loading,
  error,
  pagination,
  loadNews,
  getTypeColor,
  getTypeLabel,
  getSolicitadaPorLabel,
  formatDate
} = useNews()

const currentPage = ref(1)

const changePage = async (page: number) => {
  currentPage.value = page
  const filters: NewsFilters = {
    page,
    per_page: 10
  }
  await loadNews(filters)
}

// Helper functions for styling based on type
const getTypeIcon = (type: SystemNews['type']) => {
  const icons = {
    update: 'i-heroicons-arrow-path',
    feature: 'i-heroicons-sparkles',
    fix: 'i-heroicons-wrench-screwdriver',
    announcement: 'i-heroicons-megaphone'
  }
  return icons[type] || 'i-heroicons-information-circle'
}

const getIconBgClass = (type: SystemNews['type']) => {
  const classes = {
    update: 'bg-blue-100 dark:bg-blue-900/30',
    feature: 'bg-green-100 dark:bg-green-900/30',
    fix: 'bg-yellow-100 dark:bg-yellow-900/30',
    announcement: 'bg-purple-100 dark:bg-purple-900/30'
  }
  return classes[type] || 'bg-gray-100 dark:bg-gray-700'
}

const getIconColorClass = (type: SystemNews['type']) => {
  const classes = {
    update: 'text-blue-600 dark:text-blue-400',
    feature: 'text-green-600 dark:text-green-400',
    fix: 'text-yellow-600 dark:text-yellow-400',
    announcement: 'text-purple-600 dark:text-purple-400'
  }
  return classes[type] || 'text-gray-600 dark:text-gray-400'
}

const handleRedirect = (redirect: string) => {
  navigateTo(redirect)
}

onMounted(async () => {
  await loadNews({ per_page: 10, page: 1 })
})
</script>

