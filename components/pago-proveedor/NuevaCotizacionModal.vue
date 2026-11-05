<template>
  <SupplierPaymentWindow
    :open="open"
    title="Nueva cotización"
    subtitle="Parte de la cotización de Consolidada del cliente"
    @close="cerrar"
  >
    <div class="flex items-center gap-2.5 text-xs">
      <span class="inline-flex items-center gap-1.5 font-semibold text-highlighted">
        <i class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold not-italic text-white">1</i>
        N.° de cotización
      </span>
      <span class="h-px flex-1 bg-default" />
      <span class="inline-flex items-center gap-1.5 font-semibold text-muted">
        <i class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[11px] font-bold not-italic text-muted">2</i>
        Formulario
      </span>
    </div>

    <UFormField label="N.° de cotización de Consolidada" required class="w-full">
      <UInputMenu
        v-model="seleccion"
        v-model:search-term="busqueda"
        :items="sugerencias"
        :loading="buscandoLista"
        ignore-filter
        label-key="cod_cotizacion_cc"
        icon="i-lucide-search"
        placeholder="Ej: CO10261583"
        class="w-full"
        :reset-search-term-on-blur="false"
        :reset-search-term-on-select="false"
        @update:search-term="alEscribir"
        @update:model-value="alElegir"
      >
        <template #item-label="{ item }">
          <span class="flex min-w-0 flex-col">
            <span class="truncate font-semibold">{{ item.cod_cotizacion_cc }}</span>
            <span class="truncate text-xs text-muted">
              {{ item.cliente_nombre || 'Sin nombre' }}<template v-if="item.cliente_documento"> · {{ item.cliente_documento }}</template>
            </span>
          </span>
        </template>
        <template #item-trailing="{ item }">
          <span class="text-xs text-muted">{{ item.consolidado || '—' }}</span>
        </template>
        <template #empty>
          <div v-if="buscandoLista" class="space-y-2 px-1 py-1">
            <USkeleton class="h-8 w-full" />
            <USkeleton class="h-8 w-full" />
            <USkeleton class="h-8 w-3/4" />
          </div>
          <span v-else-if="busqueda.trim().length < 2">Escribe al menos 2 caracteres.</span>
          <span v-else>No hay cotizaciones con ese texto.</span>
        </template>
        <template #content-bottom>
          <div v-if="paginacion.last_page > 1" class="flex items-center justify-between border-t border-default px-2 py-1.5">
            <span class="text-xs text-muted">{{ paginacion.current_page }} de {{ paginacion.last_page }}</span>
            <span class="flex gap-1">
              <UButton size="xs" color="neutral" variant="ghost" :disabled="paginacion.current_page <= 1 || buscandoLista" @mousedown.prevent @click="irPagina(paginacion.current_page - 1)">Anterior</UButton>
              <UButton size="xs" color="neutral" variant="ghost" :disabled="paginacion.current_page >= paginacion.last_page || buscandoLista" @mousedown.prevent @click="irPagina(paginacion.current_page + 1)">Siguiente</UButton>
            </span>
          </div>
        </template>
      </UInputMenu>
    </UFormField>
    <p v-if="busqueda.trim().length < 2 && !seleccion" class="text-xs text-muted">Escribe el código, el cliente o el documento. Por ejemplo CO10261583. De ahí se trae la información del cliente.</p>
    <p v-if="error" class="text-sm text-error">{{ error }}</p>

    <UCard v-if="buscando" variant="subtle">
      <USkeleton class="h-4 w-2/3" />
      <div class="mt-3 flex items-center gap-3">
        <USkeleton class="h-11 w-11 rounded-full" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-3 w-1/3" />
        </div>
      </div>
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <USkeleton class="h-8 w-full" />
        <USkeleton class="h-8 w-full" />
      </div>
    </UCard>

    <UCard v-else-if="!resultado && !error" variant="subtle">
      <div class="flex items-center gap-3 text-sm text-muted">
        <UAvatar icon="i-lucide-user" size="lg" />
        <div>
          <p class="font-semibold text-highlighted">Aquí verás al cliente</p>
          <p class="mt-0.5">Su nombre, DNI/RUC, el consolidado y sus proveedores aparecerán al elegir una cotización.</p>
        </div>
      </div>
    </UCard>

    <UCard v-else-if="resultado" variant="subtle">
      <p class="text-xs font-semibold text-success">Cotización de Consolidada encontrada: {{ resultado.cod_cotizacion_cc }}</p>
      <div class="mt-2.5 flex items-center gap-3">
        <UAvatar :text="iniciales" size="lg" class="bg-primary/10 text-primary" />
        <div>
          <p class="text-base font-bold text-highlighted">{{ resultado.cliente.nombre || 'Sin nombre' }}</p>
          <p class="text-sm text-muted">DNI / RUC · {{ resultado.cliente.documento || '—' }}</p>
        </div>
      </div>
      <dl class="mt-3 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-[11px] font-bold uppercase tracking-wide text-muted">Cliente</dt>
          <dd class="font-bold text-highlighted">{{ resultado.cliente.nombre || '—' }}</dd>
        </div>
        <div>
          <dt class="text-[11px] font-bold uppercase tracking-wide text-muted">DNI / RUC</dt>
          <dd class="font-bold text-highlighted">{{ resultado.cliente.documento || '—' }}</dd>
        </div>
        <div>
          <dt class="text-[11px] font-bold uppercase tracking-wide text-muted">Consolidado</dt>
          <dd class="font-bold text-highlighted">{{ resultado.consolidado || '—' }}</dd>
        </div>
        <div>
          <dt class="text-[11px] font-bold uppercase tracking-wide text-muted">Proveedores</dt>
          <dd class="font-bold text-highlighted">{{ proveedoresTexto }}</dd>
        </div>
      </dl>
      <div v-if="resultado.proveedores.length" class="mt-2 flex flex-wrap gap-1.5">
        <UBadge v-for="proveedor in resultado.proveedores" :key="proveedor.id_proveedor_cc" color="neutral" variant="soft">
          {{ proveedor.code_supplier }}
        </UBadge>
      </div>
      <UAlert v-if="resultado.aviso" class="mt-3" color="warning" variant="subtle" :description="resultado.aviso" />
      <p v-if="!resultado.proveedores.length" class="mt-3 text-sm text-error">Este consolidado todavía no tiene códigos de proveedor. No se puede cotizar el pago.</p>
    </UCard>

    <template #footer>
      <UButton color="neutral" variant="outline" @click="cerrar">Cancelar</UButton>
      <UButton color="primary" :loading="buscando" :disabled="!puedeAceptar" @click="aceptar">Aceptar</UButton>
    </template>
  </SupplierPaymentWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorBusquedaCc, PagoProveedorPaginacion, PagoProveedorSugerenciaCc } from '~/types/pago-proveedor'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; accepted: [codigo: string] }>()

const busqueda = ref('')
const seleccion = ref<PagoProveedorSugerenciaCc | undefined>()
const buscando = ref(false)
const buscandoLista = ref(false)
const error = ref('')
const resultado = ref<PagoProveedorBusquedaCc | null>(null)
const sugerencias = ref<PagoProveedorSugerenciaCc[]>([])
const paginacion = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 8, total: 0 })
let secuencia = 0
let listaSecuencia = 0
let espera: ReturnType<typeof setTimeout> | undefined

const puedeAceptar = computed(() => !!resultado.value && resultado.value.proveedores.length > 0)
const iniciales = computed(() => {
  const partes = (resultado.value?.cliente.nombre || '?').split(/\s+/).filter(Boolean).slice(0, 2)
  return partes.map((parte) => parte[0]).join('').toUpperCase() || '?'
})
const proveedoresTexto = computed(() => {
  const lista = resultado.value?.proveedores || []
  if (!lista.length) return '0'
  return `${lista.length} · ${lista.map((proveedor) => proveedor.code_supplier).join(', ')}`
})

watch(() => props.open, (abierto) => {
  if (!abierto) return
  busqueda.value = ''
  seleccion.value = undefined
  error.value = ''
  resultado.value = null
  sugerencias.value = []
  paginacion.value = { current_page: 1, last_page: 1, per_page: 8, total: 0 }
})

function alEscribir(texto: string) {
  error.value = ''
  const elegido = seleccion.value?.cod_cotizacion_cc
  if (elegido && texto.trim().toUpperCase() === elegido) return
  if (elegido) {
    seleccion.value = undefined
    resultado.value = null
  }
  if (espera) clearTimeout(espera)
  espera = setTimeout(() => cargarSugerencias(1), 250)
}

function irPagina(page: number) {
  cargarSugerencias(page)
}

async function cargarSugerencias(page: number) {
  const texto = busqueda.value.trim()
  if (texto.length < 2) {
    sugerencias.value = []
    paginacion.value = { current_page: 1, last_page: 1, per_page: 8, total: 0 }
    return
  }
  const actual = ++listaSecuencia
  buscandoLista.value = true
  try {
    const respuesta = await PagoProveedorService.sugerirConsolidada({ q: texto, page, per_page: 8 })
    if (actual !== listaSecuencia) return
    sugerencias.value = respuesta.data || []
    paginacion.value = respuesta.pagination
  } catch (err: any) {
    if (actual !== listaSecuencia) return
    sugerencias.value = []
    error.value = err?.data?.message || err?.message || 'No se pudo buscar.'
  } finally {
    if (actual === listaSecuencia) buscandoLista.value = false
  }
}

function alElegir(item: PagoProveedorSugerenciaCc | null | undefined) {
  if (!item?.cod_cotizacion_cc) return
  resultado.value = null
  busqueda.value = item.cod_cotizacion_cc
  buscar(item.cod_cotizacion_cc)
}

async function buscar(codigo: string) {
  const limpio = codigo.trim().toUpperCase()
  if (!/^CO\d{8}$/.test(limpio)) {
    error.value = 'Elige una cotización de la lista.'
    resultado.value = null
    return
  }
  const actual = ++secuencia
  buscando.value = true
  error.value = ''
  try {
    const respuesta = await PagoProveedorService.buscarConsolidada(limpio)
    if (actual !== secuencia) return
    resultado.value = respuesta.data
  } catch (err: any) {
    if (actual !== secuencia) return
    resultado.value = null
    error.value = err?.data?.message || err?.message || 'No encontramos esa cotización de Consolidada. Revisa el número.'
  } finally {
    if (actual === secuencia) buscando.value = false
  }
}

function aceptar() {
  if (!resultado.value || !puedeAceptar.value) return
  emit('accepted', resultado.value.cod_cotizacion_cc)
  emit('close')
}

function cerrar() {
  emit('close')
}
</script>
