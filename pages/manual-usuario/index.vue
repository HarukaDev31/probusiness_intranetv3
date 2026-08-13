<template>
  <div class="manual-shell flex min-h-0 flex-1 gap-0 md:min-h-[calc(100dvh)]">
    <!-- Sidebar interno del manual -->
    <aside
      class="manual-toc hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:flex lg:w-72"
    >
      <button
        type="button"
        class="flex items-center justify-center gap-2 border-b border-gray-200 px-4 py-4 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
        @click="goHome"
      >
        <img
          :src="logoSrc"
          alt="Probusiness"
          class="h-10 w-auto object-contain"
          width="140"
          height="40"
        >
      </button>

      <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Manual
        </p>
        <p class="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
          {{ activeRoleLabel || 'Mi rol' }}
        </p>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 py-3" aria-label="Secciones del manual">
        <div v-for="(sec, idx) in toc" :key="sec.key" class="mb-1">
          <button
            type="button"
            class="flex w-full items-start gap-1 rounded-lg px-2 py-2 text-left text-sm transition"
            :class="isActiveNav(sec.key)
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60'"
            @click="onTocParentClick(sec)"
          >
            <span
              v-if="sec.children?.length"
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-gray-400"
              @click.stop="toggleTocExpand(sec.key)"
            >
              <UIcon
                :name="isTocExpanded(sec.key) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                class="h-4 w-4"
              />
            </span>
            <span
              v-else
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              :class="isActiveNav(sec.key)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-100'"
            >
              {{ idx + 1 }}
            </span>
            <span class="min-w-0 flex-1 leading-snug">
              <span
                v-if="sec.children?.length"
                class="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold align-middle"
                :class="isActiveNav(sec.key)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-100'"
              >{{ idx + 1 }}</span>
              {{ sec.title }}
            </span>
          </button>

          <div v-if="sec.children?.length && isTocExpanded(sec.key)" class="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2 dark:border-gray-600">
            <template v-for="child in sec.children" :key="child.key">
              <button
                type="button"
                class="flex w-full items-start gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition"
                :class="isActiveNav(child.key)
                  ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'"
                @click="scrollToChapter(child.key)"
              >
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                <span class="leading-snug">{{ child.title }}</span>
              </button>
              <div
                v-if="child.children?.length"
                class="ml-3 space-y-0.5 border-l border-gray-100 pl-2 dark:border-gray-700"
              >
                <button
                  v-for="grand in child.children"
                  :key="grand.key"
                  type="button"
                  class="flex w-full items-start gap-1.5 rounded-md px-2 py-1 text-left text-xs transition"
                  :class="isActiveNav(grand.key)
                    ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60'"
                  @click="scrollToChapter(grand.key)"
                >
                  <span class="leading-snug">{{ grand.title }}</span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </nav>

      <div class="space-y-2 border-t border-gray-200 p-3 dark:border-gray-700">
        <UButton
          block
          size="sm"
          icon="i-heroicons-arrow-down-tray"
          color="primary"
          :loading="downloadingRole"
          :disabled="!manual"
          @click="downloadRole"
        >
          Descargar PDF
        </UButton>
        <UButton
          v-if="context?.can_download_global_pdf"
          block
          size="sm"
          icon="i-heroicons-document-arrow-down"
          variant="outline"
          color="neutral"
          :loading="downloadingGlobal"
          @click="downloadGlobal"
        >
          PDF global
        </UButton>
        <UButton
          block
          size="sm"
          variant="ghost"
          color="neutral"
          icon="i-heroicons-home"
          @click="goHome"
        >
          Volver al inicio
        </UButton>
      </div>
    </aside>

    <!-- Contenido -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div class="shrink-0 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 md:px-6">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="min-w-0">
            <div class="mb-2 flex items-center gap-2 md:hidden">
              <button type="button" class="rounded-lg border border-gray-200 p-1.5 dark:border-gray-600" @click="goHome">
                <img :src="logoSrc" alt="Inicio" class="h-7 w-auto">
              </button>
              <UButton size="xs" variant="soft" icon="i-heroicons-list-bullet" @click="mobileTocOpen = !mobileTocOpen">
                Secciones
              </UButton>
            </div>
            <h1 class="truncate text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
              {{ context?.title || 'Manual de usuario' }}
            </h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ context?.description || 'Guía por rol, paso a paso.' }}
            </p>
          </div>

          <div v-if="context?.is_root" class="flex w-full max-w-xs flex-col gap-2">
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Ver manual de</label>
            <USelect
              v-model="selectedSlug"
              :items="roleSelectItems"
              placeholder="Seleccionar rol"
              class="w-full"
              @update:model-value="onRoleChange"
            />
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-heroicons-wrench-screwdriver"
              to="/manual-usuario/admin"
            >
              Mantenedor CMS
            </UButton>
          </div>
        </div>

        <!-- TOC móvil -->
        <div v-if="mobileTocOpen" class="mt-3 max-h-56 overflow-y-auto rounded-lg border border-gray-200 p-2 md:hidden dark:border-gray-600">
          <div v-for="(sec, idx) in toc" :key="`m-${sec.key}`" class="mb-1">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium text-gray-800 dark:text-gray-100"
              @click="scrollToChapter(sec.key); if (!sec.children?.length) mobileTocOpen = false"
            >
              <span class="text-xs font-bold text-primary-600">{{ idx + 1 }}.</span>
              {{ sec.title }}
            </button>
            <div v-if="sec.children?.length" class="ml-4 space-y-0.5">
              <button
                v-for="child in sec.children"
                :key="`m-${child.key}`"
                type="button"
                class="block w-full rounded px-2 py-1 text-left text-sm text-gray-600 dark:text-gray-300"
                @click="scrollToChapter(child.key); mobileTocOpen = false"
              >
                {{ child.title }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref="scrollRoot" class="flex-1 overflow-y-auto px-3 py-4 md:px-5 md:py-5">
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>

        <div
          v-else-if="error"
          class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        >
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
          <UButton variant="outline" color="error" size="sm" class="mt-3" @click="initialize">
            Reintentar
          </UButton>
        </div>

        <div v-else-if="manual" class="w-full max-w-none space-y-6 pb-16">
          <article
            v-for="(sec, idx) in sections"
            :id="`cap-${sec.key}`"
            :key="sec.key"
            class="scroll-mt-4"
          >
            <UCard>
              <template #header>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ sec.title }}
                  </h2>
                  <p v-if="sec.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ sec.description }}
                  </p>
                </div>
              </template>

              <div v-if="sec.page" class="space-y-4">
                <ManualBlockRenderer
                  v-for="block in sec.page.blocks"
                  :key="block.id"
                  :block="block"
                />
              </div>
            </UCard>
          </article>
        </div>

        <div v-else class="py-12 text-center text-gray-500 dark:text-gray-400">
          No hay contenido de manual disponible para tu rol.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ManualUsuarioService } from '~/services/manualUsuarioService'
import type {
  ManualUsuarioContext,
  ManualUsuarioManualData,
  ManualPage,
  ManualBlock,
} from '~/types/manualUsuario'
import ManualBlockRenderer from '~/components/manual/ManualBlockRenderer.vue'

definePageMeta({
  name: 'manual-usuario',
  layout: 'default',
})

useHead({
  title: 'Manual de usuario',
})

const toast = useToast()
const logoSrc = '/assets/img/logos/logo_probusiness.webp'

const loading = ref(true)
const error = ref<string | null>(null)
const context = ref<ManualUsuarioContext | null>(null)
const manual = ref<ManualUsuarioManualData | null>(null)
const selectedSlug = ref<string | undefined>(undefined)
const downloadingRole = ref(false)
const downloadingGlobal = ref(false)
const activeChapterId = ref<string | null>(null)
const mobileTocOpen = ref(false)
const scrollRoot = ref<HTMLElement | null>(null)
const tocExpanded = reactive<Record<string, boolean>>({})

type ManualSection = {
  key: string
  title: string
  description?: string | null
  page: ManualPage
}

type TocNode = {
  key: string
  title: string
  children?: TocNode[]
}

const roleSelectItems = computed(() =>
  (context.value?.roles || []).map((r) => ({
    label: r.nombre,
    value: r.slug,
  }))
)

const activeRoleLabel = computed(() => {
  if (manual.value?.role?.nombre) return manual.value.role.nombre
  return context.value?.my_role?.nombre || ''
})

const sections = computed<ManualSection[]>(() => {
  if (!manual.value) return []
  return (manual.value.pages || []).map((p) => ({
    key: `p-${p.id}`,
    title: p.titulo,
    description: p.descripcion,
    page: p,
  }))
})

const blockToTocNode = (block: ManualBlock): TocNode | null => {
  if (block.tipo !== 'grupo') return null
  const title = (block.titulo || block.clave || '').trim()
  if (!title) return null
  const children = (block.children || [])
    .map(blockToTocNode)
    .filter((n): n is TocNode => !!n)
  return {
    key: `b-${block.id}`,
    title,
    children: children.length ? children : undefined,
  }
}

const toc = computed<TocNode[]>(() =>
  sections.value.map((sec) => {
    const children = (sec.page.blocks || [])
      .map(blockToTocNode)
      .filter((n): n is TocNode => !!n)
    return {
      key: sec.key,
      title: sec.title,
      children: children.length ? children : undefined,
    }
  })
)

watch(
  toc,
  (items) => {
    for (const item of items) {
      if (item.children?.length && tocExpanded[item.key] === undefined) {
        tocExpanded[item.key] = true
      }
    }
  },
  { immediate: true }
)

const isTocExpanded = (key: string) => tocExpanded[key] !== false
const toggleTocExpand = (key: string) => {
  tocExpanded[key] = !isTocExpanded(key)
}

const isActiveNav = (key: string) => {
  const active = activeChapterId.value
  if (!active) return false
  if (active === key) return true
  // página activa si el bloque activo es hijo
  if (key.startsWith('p-')) {
    const sec = toc.value.find((t) => t.key === key)
    const walk = (nodes?: TocNode[]): boolean => {
      if (!nodes) return false
      for (const n of nodes) {
        if (n.key === active) return true
        if (walk(n.children)) return true
      }
      return false
    }
    return walk(sec?.children)
  }
  return false
}

const goHome = () => navigateTo('/')

const scrollToChapter = (id: string) => {
  activeChapterId.value = id
  const el = document.getElementById(`cap-${id}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const onTocParentClick = (sec: TocNode) => {
  if (sec.children?.length && !isTocExpanded(sec.key)) {
    tocExpanded[sec.key] = true
  }
  scrollToChapter(sec.key)
}

const loadManualForSlug = async (slug?: string | null) => {
  if (!slug) {
    manual.value = await ManualUsuarioService.getMyManual()
  } else if (context.value?.my_role?.slug === slug && !context.value.is_root) {
    manual.value = await ManualUsuarioService.getMyManual()
  } else {
    manual.value = await ManualUsuarioService.getRoleManual(slug)
  }
  if (sections.value[0]) activeChapterId.value = sections.value[0].key
}

const initialize = async () => {
  loading.value = true
  error.value = null
  try {
    context.value = await ManualUsuarioService.getContext()
    if (context.value.is_root) {
      selectedSlug.value = context.value.my_role?.slug || context.value.roles[0]?.slug
      await loadManualForSlug(selectedSlug.value)
    } else {
      selectedSlug.value = context.value.my_role?.slug
      await loadManualForSlug(null)
    }
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar el manual de usuario'
    manual.value = null
  } finally {
    loading.value = false
  }
}

const onRoleChange = async (slug: string | undefined) => {
  if (!slug || !context.value?.is_root) return
  loading.value = true
  error.value = null
  try {
    await loadManualForSlug(slug)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar el rol seleccionado'
  } finally {
    loading.value = false
  }
}

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const file = blob.type === 'application/pdf'
    ? blob
    : new Blob([blob], { type: 'application/pdf' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const downloadRole = async () => {
  downloadingRole.value = true
  try {
    const slug = manual.value?.role?.slug || selectedSlug.value
    const blob = slug && context.value?.is_root
      ? await ManualUsuarioService.downloadRolePdf(slug)
      : await ManualUsuarioService.downloadMyPdf()
    triggerBlobDownload(blob, `manual-${slug || 'rol'}-${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.add({ title: 'PDF descargado', color: 'success' })
  } catch (e: any) {
    toast.add({
      title: 'Error al descargar PDF',
      description: e?.message || 'Intenta de nuevo',
      color: 'error',
    })
  } finally {
    downloadingRole.value = false
  }
}

const downloadGlobal = async () => {
  downloadingGlobal.value = true
  try {
    const blob = await ManualUsuarioService.downloadGlobalPdf()
    triggerBlobDownload(blob, `manual-global-${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.add({ title: 'PDF global descargado', color: 'success' })
  } catch (e: any) {
    toast.add({
      title: 'Error al descargar PDF global',
      description: e?.message || 'Intenta de nuevo',
      color: 'error',
    })
  } finally {
    downloadingGlobal.value = false
  }
}

let observer: IntersectionObserver | null = null

const setupObserver = () => {
  observer?.disconnect()
  if (!import.meta.client) return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible?.target?.id) return
      activeChapterId.value = visible.target.id.replace(/^cap-/, '')
    },
    { root: scrollRoot.value, rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.4, 0.7] }
  )
  const observeKey = (key: string) => {
    const el = document.getElementById(`cap-${key}`)
    if (el) observer?.observe(el)
  }
  for (const sec of toc.value) {
    observeKey(sec.key)
    for (const child of sec.children || []) {
      observeKey(child.key)
      for (const grand of child.children || []) observeKey(grand.key)
    }
  }
}

watch(toc, async () => {
  await nextTick()
  setupObserver()
})

onMounted(() => {
  void initialize().then(() => nextTick().then(setupObserver))
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>
