<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Noticias del Sistema</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Gestiona las noticias y actualizaciones del sistema
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        @click="openCreateModal"
      >
        Nueva Noticia
      </UButton>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-4">
      <USelect
        v-model="filters.type"
        :items="typeOptions"
        placeholder="Filtrar por tipo"
        class="w-48"
        @update:model-value="applyFilters"
      />
      <USelect
        v-model="filters.solicitada_por"
        :items="solicitadaPorOptions"
        placeholder="Filtrar por solicitada por"
        class="w-48"
        @update:model-value="applyFilters"
      />
      <USelect
        v-model="filters.is_published"
        :items="publishedOptions"
        placeholder="Filtrar por estado"
        class="w-48"
        @update:model-value="applyFilters"
      />
      <UButton
        variant="outline"
        icon="i-heroicons-x-mark"
        @click="clearFilters"
      >
        Limpiar filtros
      </UButton>
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
        @click="loadAdminNews"
      >
        Reintentar
      </UButton>
    </div>

    <!-- News Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Título
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Solicitada por
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha Publicación
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Creado por
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="item in news"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.title }}
                </div>
                <div v-if="item.summary" class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {{ item.summary }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge
                  :color="getTypeColor(item.type)"
                  variant="subtle"
                >
                  {{ getTypeLabel(item.type) }}
                </UBadge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge
                  v-if="item.solicitada_por"
                  color="primary"
                  variant="subtle"
                >
                  {{ getSolicitadaPorLabel(item.solicitada_por) }}
                </UBadge>
                <span v-else class="text-sm text-gray-400 dark:text-gray-500">No especificado</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge
                  :color="item.is_published ? 'green' : 'gray'"
                  variant="subtle"
                >
                  {{ item.is_published ? 'Publicada' : 'Borrador' }}
                </UBadge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(item.published_at || item.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ item.created_by_name || 'N/A' }}
                </div>
                <div v-if="item.redirect" class="text-xs text-primary-600 dark:text-primary-400 mt-1">
                  <UIcon name="i-heroicons-link" class="w-3 h-3 inline mr-1" />
                  {{ item.redirect }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <UButton
                    icon="i-heroicons-pencil"
                    variant="ghost"
                    size="xs"
                    @click="openEditModal(item)"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    variant="ghost"
                    color="red"
                    size="xs"
                    @click="confirmDelete(item)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="news.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-newspaper" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400 text-lg">No hay noticias</p>
        <UButton
          class="mt-4"
          @click="openCreateModal"
        >
          Crear primera noticia
        </UButton>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > pagination.per_page" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {{ (pagination.current_page - 1) * pagination.per_page + 1 }} a
            {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} de
            {{ pagination.total }} noticias
          </div>
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

    <!-- Create/Edit Modal -->
    <UModal v-model="isModalOpen" :ui="{ width: 'w-full max-w-3xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingNews ? 'Editar Noticia' : 'Nueva Noticia' }}
            </h3>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              size="sm"
              @click="closeModal"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Título" required>
            <UInput
              v-model="form.title"
              placeholder="Título de la noticia"
            />
          </UFormField>

          <UFormField label="Resumen (opcional)">
            <UTextarea
              v-model="form.summary"
              placeholder="Breve resumen de la noticia"
              :rows="2"
            />
          </UFormField>

          <UFormField label="Contenido" required>
            <UTextarea
              v-model="form.content"
              placeholder="Contenido completo de la noticia"
              :rows="8"
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Tipo" required>
              <USelect
                v-model="form.type"
                :items="typeOptions"
                placeholder="Seleccionar tipo"
              />
            </UFormField>

            <UFormField label="Solicitada por">
              <USelect
                v-model="form.solicitada_por"
                :items="solicitadaPorOptions"
                placeholder="Seleccionar equipo/persona"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Publicar">
              <UCheckbox
                v-model="form.is_published"
                label="Publicar noticia"
              />
            </UFormField>

            <UFormField label="Fecha de publicación (opcional)">
              <UInput
                v-model="form.published_at"
                type="date"
                placeholder="Fecha de publicación"
              />
            </UFormField>
          </div>

          <UFormField label="URL de redirección (opcional)">
            <UInput
              v-model="form.redirect"
              placeholder="/ruta/donde/se-implemento"
              helper="URL donde se implementó la modificación (ej: /calendar, /cargaconsolidada)"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="outline"
              @click="closeModal"
            >
              Cancelar
            </UButton>
            <UButton
              @click="saveNews"
              :loading="loading"
            >
              {{ editingNews ? 'Actualizar' : 'Crear' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNews } from '~/composables/useNews'
import { useModal } from '~/composables/commons/useModal'
import type { SystemNews, NewsFilters, CreateNewsRequest } from '~/types/news'

const {
  news,
  loading,
  error,
  pagination,
  loadAdminNews,
  createNews,
  updateNews,
  deleteNews,
  getTypeColor,
  getTypeLabel,
  getSolicitadaPorLabel,
  formatDate
} = useNews()

const { showConfirmation, showSuccess, showError } = useModal()

const filters = ref<NewsFilters>({
  per_page: 10,
  page: 1
})

const isModalOpen = ref(false)
const editingNews = ref<SystemNews | null>(null)

const form = ref<CreateNewsRequest>({
  title: '',
  content: '',
  summary: '',
  type: 'update',
  solicitada_por: undefined,
  is_published: false,
  published_at: undefined,
  redirect: undefined
})

const typeOptions = [
  { label: 'Actualización', value: 'update' },
  { label: 'Nueva Funcionalidad', value: 'feature' },
  { label: 'Corrección', value: 'fix' },
  { label: 'Anuncio', value: 'announcement' }
]

const solicitadaPorOptions = [
  { label: 'Por el CEO', value: 'CEO' },
  { label: 'Equipo de Coordinación', value: 'EQUIPO_DE_COORDINACION' },
  { label: 'Equipo de Ventas', value: 'EQUIPO_DE_VENTAS' },
  { label: 'Equipo de Curso', value: 'EQUIPO_DE_CURSO' },
  { label: 'Equipo de Documentación', value: 'EQUIPO_DE_DOCUMENTACION' },
  { label: 'Administración', value: 'ADMINISTRACION' },
  { label: 'Equipo de TI', value: 'EQUIPO_DE_TI' },
  { label: 'Equipo de Marketing', value: 'EQUIPO_DE_MARKETING' }
]

const publishedOptions = [
  { label: 'Todas', value: undefined },
  { label: 'Publicadas', value: true },
  { label: 'Borradores', value: false }
]

const applyFilters = async () => {
  filters.value.page = 1
  await loadAdminNews(filters.value)
}

const clearFilters = async () => {
  filters.value = {
    per_page: 10,
    page: 1
  }
  await loadAdminNews(filters.value)
}

const changePage = async (page: number) => {
  filters.value.page = page
  await loadAdminNews(filters.value)
}

const openCreateModal = () => {
  editingNews.value = null
  form.value = {
    title: '',
    content: '',
    summary: '',
    type: 'update',
    solicitada_por: undefined,
    is_published: false,
    published_at: undefined,
    redirect: undefined
  }
  isModalOpen.value = true
}

const openEditModal = (item: SystemNews) => {
  editingNews.value = item
  form.value = {
    title: item.title,
    content: item.content,
    summary: item.summary || '',
    type: item.type,
    solicitada_por: item.solicitada_por || undefined,
    is_published: item.is_published,
    published_at: item.published_at || undefined,
    redirect: item.redirect || undefined
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingNews.value = null
}

const saveNews = async () => {
  try {
    if (editingNews.value) {
      await updateNews(editingNews.value.id, form.value)
      showSuccess('Noticia actualizada exitosamente')
    } else {
      await createNews(form.value)
      showSuccess('Noticia creada exitosamente')
    }
    closeModal()
  } catch (err: any) {
    showError(err.message || 'Error al guardar noticia')
  }
}

const confirmDelete = async (item: SystemNews) => {
  const confirmed = await showConfirmation(
    '¿Estás seguro de eliminar esta noticia?',
    'Esta acción no se puede deshacer.'
  )

  if (confirmed) {
    try {
      await deleteNews(item.id)
      showSuccess('Noticia eliminada exitosamente')
    } catch (err: any) {
      showError(err.message || 'Error al eliminar noticia')
    }
  }
}

onMounted(async () => {
  await loadAdminNews(filters.value)
})
</script>

