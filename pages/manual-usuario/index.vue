<template>
  <div class="manual-propuesta manual-shell flex min-h-0 flex-1 gap-0 md:min-h-[calc(100dvh)]">
    <aside class="mu-sidebar hidden shrink-0 flex-col md:flex">
      <button type="button" class="mu-brand w-full text-left" @click="goHome">
        <span class="mu-brand-dot" />
        <span class="mu-brand-name">probusiness</span>
      </button>
      <div class="mu-eyebrow">Manual de Usuario</div>
      <p class="truncate px-5 pb-3 text-[13px] font-semibold" style="color: var(--mu-navy)">
        {{ activeRoleLabel || 'Mi rol' }}
      </p>

      <nav class="flex-1 overflow-y-auto px-2.5 pb-4" aria-label="Secciones del manual">
        <div v-for="(sec, idx) in toc" :key="sec.key" class="mb-0.5">
          <button
            type="button"
            class="mu-nav-item w-full text-left"
            :class="{ 'is-active': isActiveNav(sec.key) }"
            @click="onTocParentClick(sec)"
          >
            <span class="mu-nav-num">{{ idx + 1 }}</span>
            <span class="min-w-0 flex-1 leading-snug">{{ sec.title }}</span>
          </button>

          <div v-if="sec.children?.length && isTocExpanded(sec.key)">
            <template v-for="child in sec.children" :key="child.key">
              <button
                type="button"
                class="mu-sub flex w-full text-left"
                :class="{ 'is-active': isActiveNav(child.key) }"
                @click="scrollToChapter(child.key)"
              >
                ↳ {{ child.title }}
              </button>
              <div v-if="child.children?.length" class="ml-2">
                <button
                  v-for="grand in child.children"
                  :key="grand.key"
                  type="button"
                  class="mu-sub flex w-full text-left"
                  :class="{ 'is-active': isActiveNav(grand.key) }"
                  @click="scrollToChapter(grand.key)"
                >
                  {{ grand.title }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </nav>

      <div class="space-y-2 border-t p-3" style="border-color: var(--mu-border)">
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

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div class="mu-topbar shrink-0">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="min-w-0">
            <div class="mb-2 flex items-center gap-2 md:hidden">
              <button type="button" class="rounded-lg border p-1.5" style="border-color: var(--mu-border)" @click="goHome">
                <img :src="logoSrc" alt="Inicio" class="h-7 w-auto">
              </button>
              <UButton size="xs" variant="soft" icon="i-heroicons-list-bullet" @click="toggleMobileToc">
                Secciones
              </UButton>
            </div>
            <h1>{{ context?.title || 'Manual de usuario' }}</h1>
            <div class="mu-meta">
              {{ context?.description || 'Guía por rol, paso a paso.' }}
              <span v-if="activeRoleLabel"> · Rol: {{ activeRoleLabel }}</span>
            </div>
          </div>

          <div class="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
            <div class="mu-search">
              <UIcon name="i-heroicons-magnifying-glass" class="mu-search-icon h-3.5 w-3.5" />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Buscar (ej. 'filtros', 'alumno', 'pago')..."
              >
              <div class="mu-search-status">{{ searchStatus }}</div>
            </div>
            <div v-if="context?.is_root" class="flex w-full max-w-xs flex-col gap-2">
              <label class="mb-1 block text-xs font-medium" style="color: var(--mu-navy-soft)">Ver manual de</label>
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
        </div>

        <div v-if="mobileTocOpen" class="mt-3 max-h-56 overflow-y-auto rounded-lg border p-2 md:hidden" style="border-color: var(--mu-border)">
          <div v-for="(sec, idx) in toc" :key="`m-${sec.key}`" class="mb-1">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium"
              @click="scrollToChapter(sec.key); if (!sec.children?.length) mobileTocOpen = false"
            >
              <span class="text-xs font-bold" style="color: var(--mu-orange)">{{ idx + 1 }}.</span>
              {{ sec.title }}
            </button>
            <div v-if="sec.children?.length" class="ml-4 space-y-0.5">
              <button
                v-for="child in sec.children"
                :key="`m-${child.key}`"
                type="button"
                class="block w-full rounded px-2 py-1 text-left text-sm"
                style="color: var(--mu-gray)"
                @click="scrollToChapter(child.key); mobileTocOpen = false"
              >
                {{ child.title }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref="scrollRoot" class="flex-1 overflow-y-auto">
        <div class="mu-content">
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-xl bg-gray-200" />
          </div>

          <div
            v-else-if="error"
            class="rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <p class="text-red-800">{{ error }}</p>
            <UButton variant="outline" color="error" size="sm" class="mt-3" @click="initialize">
              Reintentar
            </UButton>
          </div>

          <div v-else-if="visibleSections.length" class="space-y-16 pb-8">
            <article
              v-for="(sec, idx) in visibleSections"
              :id="`cap-${sec.key}`"
              :key="sec.key"
              class="scroll-mt-24"
            >
              <template v-if="!isArticuloPage(sec)">
                <div class="mu-section-tag">Sección {{ idx + 1 }}</div>
                <h2 class="mu-section-title">{{ sec.title }}</h2>
                <p v-if="sec.description" class="mu-page-desc">{{ sec.description }}</p>
              </template>

              <div v-if="sec.page" class="space-y-4">
                <ManualBlockRenderer
                  v-for="block in sec.page.blocks"
                  :key="block.id"
                  :block="block"
                />
              </div>
            </article>
          </div>

          <div v-else-if="searchQuery.trim() && manual" class="py-16 text-center" style="color: var(--mu-gray)">
            No se encontraron coincidencias. Borra la búsqueda para ver todo el contenido.
          </div>

          <div v-else class="py-12 text-center" style="color: var(--mu-gray)">
            No hay contenido de manual disponible para tu rol.
          </div>
        </div>
        <footer class="mu-footer">Probusiness · Manual de Usuario</footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/manual-usuario.css'
import type {
  ManualUsuarioContext,
  ManualUsuarioManualData,
  ManualPage,
  ManualBlock,
} from '~/types/manualUsuario'
import ManualBlockRenderer from '~/components/manual/ManualBlockRenderer.vue'
import {
  MANUAL_NAV_KEY,
  createManualNavContext,
} from '~/composables/manual-usuario/useManualNav'

definePageMeta({
  name: 'manual-usuario',
  layout: 'default',
})

useHead({
  title: 'Manual de usuario',
})

const toast = useToast()
const {
  getContext,
  getMyManual,
  getRoleManual,
  downloadMyPdf,
  downloadRolePdf,
  downloadGlobalPdf,
} = useManualUsuario()
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
const searchQuery = ref('')

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
  if (block.payload?.snapshot?.colapsable) return null
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

const isArticuloPage = (sec: ManualSection) => {
  const first = sec.page?.blocks?.[0]
  return first?.tipo === 'grupo' && String(first?.payload?.snapshot?.variant || '') === 'articulo'
}

const blockSearchText = (block: ManualBlock): string => {
  const parts: string[] = [
    String(block.titulo || ''),
    String(block.clave || ''),
    String(block.payload?.subtitulo || ''),
    JSON.stringify(block.payload?.snapshot || {}),
  ]
  for (const child of block.children || []) {
    parts.push(blockSearchText(child))
  }
  return parts.join(' ')
}

const visibleSections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sections.value
  return sections.value.filter((sec) => {
    const hay = `${sec.title} ${sec.description || ''} ${(sec.page.blocks || []).map(blockSearchText).join(' ')}`
    return hay.toLowerCase().includes(q)
  })
})

const searchStatus = computed(() => {
  const q = searchQuery.value.trim()
  if (!q || !manual.value) return ''
  return `${visibleSections.value.length} sección${visibleSections.value.length === 1 ? '' : 'es'} con coincidencias`
})

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

const goHome = () => {
  void navigateTo('/')
}
const toggleMobileToc = () => {
  mobileTocOpen.value = !mobileTocOpen.value
}

const scrollToChapter = (id: string) => {
  activeChapterId.value = id
  const el = document.getElementById(`cap-${id}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const scrollToManualTop = () => {
  scrollRoot.value?.scrollTo({ top: 0, behavior: 'smooth' })
  activeChapterId.value = sections.value[0]?.key ?? null
}

const manualNav = computed(() => {
  if (!manual.value) return null
  return createManualNavContext(manual.value, scrollToChapter, scrollToManualTop)
})

provide(MANUAL_NAV_KEY, manualNav)

const onTocParentClick = (sec: TocNode) => {
  if (sec.children?.length && !isTocExpanded(sec.key)) {
    tocExpanded[sec.key] = true
  }
  scrollToChapter(sec.key)
}

const loadManualForSlug = async (slug?: string | null) => {
  if (!slug) {
    manual.value = await getMyManual()
  } else if (context.value?.my_role?.slug === slug && !context.value.is_root) {
    manual.value = await getMyManual()
  } else {
    manual.value = await getRoleManual(slug)
  }
  if (sections.value[0]) activeChapterId.value = sections.value[0].key
}

const initialize = async () => {
  loading.value = true
  error.value = null
  try {
    context.value = await getContext()
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
      ? await downloadRolePdf(slug)
      : await downloadMyPdf()
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
    const blob = await downloadGlobalPdf()
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
