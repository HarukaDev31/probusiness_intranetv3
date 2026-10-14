<template>
  <div class="p-6">
    <PageHeader title="API Clientes (integración)" icon="i-heroicons-key" />

    <UAlert
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="i-heroicons-shield-exclamation"
      title="Credenciales sensibles"
      description="Cada token da acceso a los datos de UNA organización según sus scopes. Se muestra una sola vez al crearlo o rotarlo: cópialo y envíalo por un canal seguro. Nunca queda guardado en claro."
    />

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <p class="text-sm text-gray-500">
        Base de la API: <code class="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">{{ catalogo?.base_path || '/api/integration/v1' }}</code>
      </p>
      <div class="flex-1" />
      <UButton icon="i-heroicons-plus" label="Nuevo API client" @click="abrirCrear" />
    </div>

    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="px-4 py-3 text-left">Nombre</th>
              <th class="px-4 py-3 text-left">Organización</th>
              <th class="px-4 py-3 text-left">Token</th>
              <th class="px-4 py-3 text-left">Scopes</th>
              <th class="px-4 py-3 text-center">Límites</th>
              <th class="px-4 py-3 text-center">Hoy</th>
              <th class="px-4 py-3 text-left">Último uso</th>
              <th class="px-4 py-3 text-center">Estado</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="py-8 text-center"><UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Cargando...</td>
            </tr>
            <tr v-else-if="clients.length === 0">
              <td colspan="9" class="py-8 text-center text-gray-500">Aún no hay API clients.</td>
            </tr>
            <tr v-for="c in clients" :key="c.id" class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-4 py-2 font-medium">{{ c.nombre }}</td>
              <td class="px-4 py-2">{{ c.organizacion || `#${c.organizacion_id}` }}</td>
              <td class="px-4 py-2 font-mono text-xs">{{ c.token_prefix }}…</td>
              <td class="px-4 py-2">
                <div class="flex flex-wrap gap-1">
                  <UBadge v-for="s in c.scopes" :key="s" color="neutral" variant="soft" size="sm">{{ s }}</UBadge>
                </div>
              </td>
              <td class="px-4 py-2 text-center text-xs">{{ c.rate_limit_per_minute }}/min · {{ c.daily_quota }}/día</td>
              <td class="px-4 py-2 text-center">{{ c.requests_hoy }}</td>
              <td class="px-4 py-2 text-xs text-gray-600">
                {{ c.last_used_at ? formatDateTimeToDmy(c.last_used_at) : 'Nunca' }}
                <span v-if="c.last_used_ip" class="block font-mono text-gray-400">{{ c.last_used_ip }}</span>
              </td>
              <td class="px-4 py-2 text-center">
                <UBadge :color="c.revocado ? 'error' : c.activo ? 'success' : 'warning'" variant="subtle">
                  {{ c.revocado ? 'Revocado' : c.activo ? 'Activo' : 'Inactivo' }}
                </UBadge>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center gap-1">
                  <UButton size="xs" icon="i-heroicons-chart-bar" color="primary" variant="ghost" title="Auditoría y uso" @click="abrirAuditoria(c)" />
                  <UButton size="xs" icon="i-heroicons-pencil" color="primary" variant="ghost" title="Editar" @click="abrirEditar(c)" />
                  <UButton size="xs" icon="i-heroicons-arrow-path" color="warning" variant="ghost" title="Rotar token" @click="confirmarRotar(c)" />
                  <UButton v-if="!c.revocado" size="xs" icon="i-heroicons-no-symbol" color="error" variant="ghost" title="Revocar" @click="confirmarRevocar(c)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Crear / editar -->
    <UModal v-model:open="showForm">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">{{ editando ? 'Editar API client' : 'Nuevo API client' }}</h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showForm = false" />
            </div>
          </template>

          <form class="max-h-[70vh] space-y-4 overflow-y-auto pr-1" @submit.prevent="guardar">
            <UFormField label="Nombre" required hint="Ej. Integración ERP Genuino">
              <UInput v-model="form.nombre" maxlength="120" class="w-full" />
            </UFormField>

            <UFormField
              label="Organización"
              required
              :hint="editando ? 'No se puede cambiar' : 'Se crea un usuario BOT en esa organización (será el vendedor de lo que cree la integración).'"
            >
              <USelect v-model="form.organizacion_id" :items="orgOptions" :disabled="!!editando" placeholder="Seleccionar organización" class="w-full" />
            </UFormField>

            <UFormField label="Scopes (permisos)" required>
              <div class="space-y-2">
                <UCheckbox
                  v-for="s in catalogo?.scopes || []"
                  :key="s.key"
                  :model-value="form.scopes.includes(s.key)"
                  :label="s.key"
                  :description="s.label"
                  @update:model-value="(v: boolean | 'indeterminate') => toggleScope(s.key, v === true)"
                />
              </div>
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Requests por minuto" :hint="`máx. ${catalogo?.max_rate_limit_per_minute ?? 600}`">
                <UInput v-model.number="form.rate_limit_per_minute" type="number" min="1" :max="catalogo?.max_rate_limit_per_minute ?? 600" class="w-full" />
              </UFormField>
              <UFormField label="Cuota diaria" :hint="`máx. ${catalogo?.max_daily_quota ?? 100000}`">
                <UInput v-model.number="form.daily_quota" type="number" min="1" :max="catalogo?.max_daily_quota ?? 100000" class="w-full" />
              </UFormField>
            </div>

            <UFormField v-if="editando" label="Activo">
              <USwitch v-model="form.activo" :disabled="editando.revocado" />
            </UFormField>

            <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

            <div class="flex justify-end gap-2 pt-2">
              <UButton variant="ghost" label="Cancelar" @click="showForm = false" />
              <UButton type="submit" :loading="saving" :label="editando ? 'Guardar' : 'Crear y generar token'" />
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Token (única vez) -->
    <UModal v-model:open="showToken" :dismissible="false">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Token generado</h3>
          </template>
          <div class="space-y-3">
            <UAlert color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" title="Cópialo ahora" description="No se vuelve a mostrar. Si lo pierdes, rota el token." />
            <div class="break-all rounded-md bg-gray-100 p-3 font-mono text-sm dark:bg-gray-800">{{ tokenVisible }}</div>
            <div class="flex items-center gap-2">
              <UButton icon="i-heroicons-clipboard-document" :label="copiado ? 'Copiado' : 'Copiar'" @click="copiarToken" />
              <span class="text-xs text-gray-500">Authorization: Bearer &lt;token&gt;</span>
            </div>
          </div>
          <template #footer>
            <div class="flex justify-end">
              <UButton color="neutral" label="Ya lo copié, cerrar" @click="cerrarToken" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Auditoría -->
    <UModal v-model:open="showAudit" :ui="{ content: 'sm:max-w-5xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Uso y auditoría · {{ auditCliente?.nombre }}</h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showAudit = false" />
            </div>
          </template>

          <div class="mb-3 flex flex-wrap items-end gap-3">
            <UFormField label="Desde"><UInput v-model="auditFiltros.desde" type="date" /></UFormField>
            <UFormField label="Hasta"><UInput v-model="auditFiltros.hasta" type="date" /></UFormField>
            <UFormField label="Status"><UInput v-model.number="auditFiltros.status" type="number" placeholder="Ej. 429" class="w-28" /></UFormField>
            <UButton icon="i-heroicons-magnifying-glass" label="Filtrar" @click="cargarAuditoria(1)" />
          </div>

          <div v-if="auditLoading" class="py-6 text-center"><UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Cargando...</div>
          <div v-else-if="audit" class="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <div class="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div v-for="k in kpisAudit" :key="k.label" class="rounded-lg border p-3 text-center">
                <p class="text-xs uppercase text-gray-500">{{ k.label }}</p>
                <p class="text-xl font-semibold">{{ k.value }}</p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <p class="mb-1 text-sm font-medium">Por día</p>
                <div v-for="d in audit.por_dia" :key="d.dia" class="flex justify-between border-b py-1 text-xs"><span>{{ d.dia }}</span><strong>{{ d.total }}</strong></div>
                <p v-if="!audit.por_dia.length" class="text-xs text-gray-500">Sin datos</p>
              </div>
              <div>
                <p class="mb-1 text-sm font-medium">Por ruta</p>
                <div v-for="r in audit.por_ruta" :key="r.method + r.path" class="flex justify-between gap-2 border-b py-1 text-xs"><span class="truncate" :title="r.path">{{ r.method }} {{ r.path }}</span><strong>{{ r.total }}</strong></div>
                <p v-if="!audit.por_ruta.length" class="text-xs text-gray-500">Sin datos</p>
              </div>
              <div>
                <p class="mb-1 text-sm font-medium">Por IP</p>
                <div v-for="i in audit.por_ip" :key="String(i.ip)" class="flex justify-between border-b py-1 text-xs"><span class="font-mono">{{ i.ip || '—' }}</span><strong>{{ i.total }}</strong></div>
                <p v-if="!audit.por_ip.length" class="text-xs text-gray-500">Sin datos</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b">
                    <th class="px-2 py-2 text-left">Fecha</th>
                    <th class="px-2 py-2 text-left">Request</th>
                    <th class="px-2 py-2 text-center">Status</th>
                    <th class="px-2 py-2 text-left">IP</th>
                    <th class="px-2 py-2 text-right">ms</th>
                    <th class="px-2 py-2 text-left">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="l in audit.logs" :key="l.id" class="border-b">
                    <td class="whitespace-nowrap px-2 py-1">{{ formatDateTimeToDmy(l.created_at) }}</td>
                    <td class="px-2 py-1"><span class="font-medium">{{ l.method }}</span> {{ l.path }}</td>
                    <td class="px-2 py-1 text-center">
                      <UBadge :color="l.status_code < 300 ? 'success' : l.status_code < 500 ? 'warning' : 'error'" variant="subtle" size="sm">{{ l.status_code }}</UBadge>
                    </td>
                    <td class="px-2 py-1 font-mono">{{ l.ip || '—' }}</td>
                    <td class="px-2 py-1 text-right">{{ l.duration_ms ?? '—' }}</td>
                    <td class="px-2 py-1 text-gray-600">{{ detalleLog(l) }}</td>
                  </tr>
                  <tr v-if="!audit.logs.length"><td colspan="6" class="py-4 text-center text-gray-500">Sin registros</td></tr>
                </tbody>
              </table>
            </div>

            <div v-if="auditPag.last_page > 1" class="flex items-center justify-center gap-2">
              <UButton size="xs" variant="outline" icon="i-heroicons-chevron-left" :disabled="auditPag.current_page <= 1" @click="cargarAuditoria(auditPag.current_page - 1)" />
              <span class="text-xs">{{ auditPag.current_page }} / {{ auditPag.last_page }}</span>
              <UButton size="xs" variant="outline" icon="i-heroicons-chevron-right" :disabled="auditPag.current_page >= auditPag.last_page" @click="cargarAuditoria(auditPag.current_page + 1)" />
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ApiClientService from '~/services/panelAcceso/apiClientService'
import type { ApiClient, ApiClientAuditoria, ApiClientCatalogo, ApiClientAuditLog } from '~/services/panelAcceso/apiClientService'
import { OrganizacionService } from '~/services/panelAcceso/organizacionService'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { formatDateTimeToDmy } from '~/utils/formatters'

const ID_ORGANIZACION_ADMIN = 1 // el mantenedor de organizaciones no lista la org 1 como destino

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()

const clients = ref<ApiClient[]>([])
const catalogo = ref<ApiClientCatalogo | null>(null)
const orgOptions = ref<{ label: string; value: number }[]>([])
const loading = ref(false)

const showForm = ref(false)
const editando = ref<ApiClient | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  nombre: '',
  organizacion_id: 0,
  scopes: [] as string[],
  rate_limit_per_minute: 60,
  daily_quota: 2000,
  activo: true,
})

// El token en claro vive solo en memoria mientras el modal está abierto.
const showToken = ref(false)
const tokenVisible = ref('')
const copiado = ref(false)

const showAudit = ref(false)
const auditCliente = ref<ApiClient | null>(null)
const audit = ref<ApiClientAuditoria | null>(null)
const auditLoading = ref(false)
const auditFiltros = reactive<{ desde: string; hasta: string; status: number | undefined }>({ desde: '', hasta: '', status: undefined })
const auditPag = reactive({ current_page: 1, last_page: 1 })

const kpisAudit = computed(() => {
  const r = audit.value?.resumen
  return [
    { label: 'Requests', value: Number(r?.total ?? 0) },
    { label: 'Exitosos', value: Number(r?.ok ?? 0) },
    { label: 'Error cliente', value: Number(r?.errores_cliente ?? 0) },
    { label: 'Error servidor', value: Number(r?.errores_servidor ?? 0) },
    { label: 'Limitados 429', value: Number(r?.limitados ?? 0) },
    { label: 'ms promedio', value: Number(r?.ms_promedio ?? 0) },
  ]
})

function mensajeError(res: { message?: string | Record<string, string[]> }, fallback: string): string {
  const m = res.message
  if (!m) return fallback
  if (typeof m === 'string') return m
  return Object.values(m).flat().join(' ') || fallback
}

async function cargar() {
  loading.value = true
  try {
    const res = await ApiClientService.listar()
    if (res.success) clients.value = res.data ?? []
    else showError('No se pudo cargar', mensajeError(res, 'Intenta nuevamente.'))
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.nombre = ''
  form.organizacion_id = 0
  form.scopes = []
  form.rate_limit_per_minute = catalogo.value?.default_rate_limit_per_minute ?? 60
  form.daily_quota = catalogo.value?.default_daily_quota ?? 2000
  form.activo = true
  formError.value = ''
}

function abrirCrear() {
  editando.value = null
  resetForm()
  showForm.value = true
}

function abrirEditar(c: ApiClient) {
  editando.value = c
  form.nombre = c.nombre
  form.organizacion_id = c.organizacion_id
  form.scopes = [...c.scopes]
  form.rate_limit_per_minute = c.rate_limit_per_minute
  form.daily_quota = c.daily_quota
  form.activo = c.activo
  formError.value = ''
  showForm.value = true
}

function toggleScope(key: string, on: boolean) {
  const sin = form.scopes.filter(s => s !== key)
  form.scopes = on ? [...sin, key] : sin
}

async function guardar() {
  formError.value = ''
  if (form.nombre.trim().length < 3) { formError.value = 'El nombre debe tener al menos 3 caracteres.'; return }
  if (!editando.value && !form.organizacion_id) { formError.value = 'Selecciona la organización.'; return }
  if (form.scopes.length === 0) { formError.value = 'Selecciona al menos un scope.'; return }

  saving.value = true
  try {
    if (editando.value) {
      const res = await ApiClientService.actualizar(editando.value.id, {
        nombre: form.nombre.trim(),
        scopes: form.scopes,
        rate_limit_per_minute: form.rate_limit_per_minute,
        daily_quota: form.daily_quota,
        activo: form.activo,
      })
      if (!res.success) { formError.value = mensajeError(res, 'No se pudo guardar.'); return }
      showForm.value = false
      showSuccess('Actualizado', 'Los cambios se guardaron.')
    } else {
      const res = await ApiClientService.crear({
        organizacion_id: form.organizacion_id,
        nombre: form.nombre.trim(),
        scopes: form.scopes,
        rate_limit_per_minute: form.rate_limit_per_minute,
        daily_quota: form.daily_quota,
      })
      if (!res.success || !res.token) { formError.value = mensajeError(res, 'No se pudo crear.'); return }
      showForm.value = false
      mostrarToken(res.token)
    }
    await cargar()
  } finally {
    saving.value = false
  }
}

function mostrarToken(token: string) {
  tokenVisible.value = token
  copiado.value = false
  showToken.value = true
}

async function copiarToken() {
  try {
    await navigator.clipboard.writeText(tokenVisible.value)
    copiado.value = true
  } catch {
    showError('No se pudo copiar', 'Selecciona el texto y cópialo manualmente.')
  }
}

function cerrarToken() {
  tokenVisible.value = ''
  copiado.value = false
  showToken.value = false
}

function confirmarRotar(c: ApiClient) {
  showConfirmation(
    'Rotar token',
    `Se genera un token nuevo para "${c.nombre}" y el actual deja de funcionar al instante. ¿Continuar?`,
    async () => {
      await withSpinner(async () => {
        const res = await ApiClientService.rotarToken(c.id)
        if (!res.success || !res.token) {
          showError('No se pudo rotar', mensajeError(res, 'Intenta nuevamente.'))
          return
        }
        mostrarToken(res.token)
        await cargar()
      }, 'Rotando token…')
    }
  )
}

function confirmarRevocar(c: ApiClient) {
  showConfirmation(
    'Revocar acceso',
    `"${c.nombre}" dejará de poder usar la API. Para reactivarlo hay que rotar el token. ¿Continuar?`,
    async () => {
      await withSpinner(async () => {
        const res = await ApiClientService.revocar(c.id)
        if (!res.success) {
          showError('No se pudo revocar', mensajeError(res, 'Intenta nuevamente.'))
          return
        }
        showSuccess('Revocado', 'El token ya no funciona.')
        await cargar()
      }, 'Revocando…')
    }
  )
}

async function abrirAuditoria(c: ApiClient) {
  auditCliente.value = c
  audit.value = null
  auditFiltros.desde = ''
  auditFiltros.hasta = ''
  auditFiltros.status = undefined
  showAudit.value = true
  await cargarAuditoria(1)
}

async function cargarAuditoria(page: number) {
  if (!auditCliente.value) return
  auditLoading.value = true
  try {
    const res = await ApiClientService.auditoria(auditCliente.value.id, {
      desde: auditFiltros.desde || undefined,
      hasta: auditFiltros.hasta || undefined,
      status: auditFiltros.status || undefined,
      page,
    })
    if (!res.success || !res.data) {
      showError('No se pudo cargar la auditoría', mensajeError(res, 'Intenta nuevamente.'))
      return
    }
    audit.value = res.data
    auditPag.current_page = res.pagination?.current_page ?? 1
    auditPag.last_page = res.pagination?.last_page ?? 1
  } finally {
    auditLoading.value = false
  }
}

function detalleLog(l: ApiClientAuditLog): string {
  const partes: string[] = []
  if (l.error) partes.push(l.error)
  if (l.meta?.id_cotizacion) partes.push(`cotización #${l.meta.id_cotizacion}`)
  if (l.meta?.id_proveedor) partes.push(`proveedor #${l.meta.id_proveedor}`)
  if (l.meta?.code_anterior || l.meta?.code_nuevo) partes.push(`${l.meta.code_anterior ?? '—'} → ${l.meta.code_nuevo ?? '—'}`)
  return partes.join(' · ') || '—'
}

onMounted(async () => {
  // El backend es quien autoriza (org 1 + GERENCIA / GERENTE GENERAL): si responde 403 no se muestra nada.
  const [cat, orgs] = await Promise.all([ApiClientService.getCatalogo(), OrganizacionService.getOrganizaciones()])
  if (!cat.success || !cat.data) {
    showError('Acceso restringido', 'No tienes permiso para administrar API clients.')
    await navigateTo('/')
    return
  }
  catalogo.value = cat.data
  orgOptions.value = (orgs.data ?? [])
    .filter(o => Number(o.id) !== ID_ORGANIZACION_ADMIN && Number(o.estado) === 1)
    .map(o => ({ label: o.no_organizacion, value: o.id }))
  await cargar()
})
</script>
