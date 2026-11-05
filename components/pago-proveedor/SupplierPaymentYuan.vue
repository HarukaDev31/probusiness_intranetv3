<template>
  <div>
    <div class="mb-4 flex justify-end">
      <UButton color="primary" @click="startManual()">Nueva solicitud</UButton>
    </div>
    <div class="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="card in cards" :key="card.label" variant="subtle">
        <p class="text-[11px] font-bold uppercase tracking-wider text-muted">{{ card.label }}</p>
        <USkeleton v-if="loading" class="mt-2 h-8 w-24" />
        <p v-else class="mt-1 text-2xl font-bold" :class="card.danger ? 'text-error' : 'text-highlighted'">{{ card.value }}</p>
      </UCard>
    </div>
    <DataTable
      sticky-last-column
      title="Pagos en yuanes"
      subtitle="Operaciones"
      icon="i-heroicons-banknotes"
      :data="rows"
      :columns="columns"
      :loading="loading"
      :current-page="1"
      :total-pages="1"
      :total-records="rows.length"
      :items-per-page="50"
      :primary-search-value="search"
      :show-primary-search="true"
      :show-primary-search-label="false"
      primary-search-placeholder="N.° de solicitud, proveedor o WeChat"
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :show-export="false"
      empty-state-message="No hay pagos que coincidan."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
    />

    <SupplierPaymentWindow
      :open="opened"
      title="Pago en yuanes"
      :subtitle="selected ? `${selected.client_name || 'Cliente'} · ${selected.consolidation || 'Sin consolidado'}` : ''"
      :code="selected?.request_code"
      hint="Primero el tipo de cambio y los yuanes, después la constancia. En solicitudes de Perú el aviso al cliente va antes de registrar."
      wide
      @close="opened = false"
    >
      <div v-if="selected" class="grid gap-4 lg:grid-cols-3">
        <SupplierPaymentCard title="Solicitud">
          <SupplierPaymentFact label="Cliente" :value="selected.client_name || '—'" />
          <SupplierPaymentFact label="Consolidado" :value="selected.consolidation || '—'" />
          <SupplierPaymentFact label="Socio" :value="selected.partner" />
          <SupplierPaymentFact label="Vendedor" :value="selected.seller_name || '—'" />
          <p v-if="selected.supplier_payments > 1" class="text-sm text-muted">Pago {{ selected.current_payment }} de {{ selected.supplier_payments }}</p>
          <a v-if="selected.proforma_url" :href="selected.proforma_url" target="_blank" rel="noopener" class="text-sm font-semibold text-primary">Ver proforma</a>
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Proveedor">
          <SupplierPaymentFact label="Código" :value="selected.supplier_code || 'Sin código'" />
          <SupplierPaymentFact label="Nombre" :value="selected.supplier_name || '—'" />
          <SupplierPaymentFact label="Producto" :value="selected.product || '—'" />
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="text-muted">WeChat</span>
            <span class="font-semibold">{{ selected.wechat || '—' }}</span>
            <button type="button" class="text-xs font-semibold text-primary" @click="copy(selected.wechat)">Copiar</button>
          </div>
          <button type="button" class="text-xs font-semibold text-primary" @click="copy(selected.supplier_code)">Copiar código</button>
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Importes">
          <p class="text-3xl font-bold text-warning">¥{{ money(selected.yuan_amount) }}</p>
          <SupplierPaymentFact label="USD recibido" :value="`$${money(selected.usd_amount)}`" />
          <SupplierPaymentFact label="T.C. cotizado" :value="String(selected.quoted_rate)" />
        </SupplierPaymentCard>
      </div>
      <UCard v-if="selected && readOnly" class="text-sm">
        <p>T.C. real {{ selected.real_exchange_rate }} · Recibido ${{ money(selected.usd_amount) }}</p>
        <p class="mt-1">Obtenidos ¥{{ money(selected.yuan_obtained) }} · Pagados ¥{{ money(selected.yuan_paid) }}</p>
        <p class="mt-1">{{ selected.difference_label || 'Sin diferencia' }}</p>
        <a v-if="selected.receipt_url" :href="selected.receipt_url" target="_blank" rel="noopener" class="mt-2 inline-block font-semibold text-primary">Ver constancia</a>
      </UCard>
      <UCard v-if="selected && !readOnly">
        <h4 class="mb-2 text-[15px] font-bold text-highlighted">1. Tipo de cambio y yuanes pagados</h4>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="T.C. real (¥ por $)">
            <UInput v-model.number="rate" type="number" min="0" step="0.0001" class="w-full" />
          </UFormField>
          <UFormField label="Yuanes pagados">
            <UInput v-model.number="yuanPaid" type="number" min="0" step="0.01" class="w-full" />
          </UFormField>
        </div>
        <p class="mt-2 text-sm text-highlighted">Obtenidos ¥{{ money(obtained) }} · diferencia ¥{{ money(differenceYuan) }} (${{ money(differenceUsd) }}) · {{ differenceText }}</p>
        <h4 class="mb-2 mt-4 text-[15px] font-bold text-highlighted">2. Constancia</h4>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="block text-sm text-highlighted" @change="onFile" />
        <p class="mt-1 text-xs text-muted">Queda en el sistema. No se adjunta al aviso del cliente.</p>
      </UCard>
      <UCard v-if="selected && !readOnly && !selected.manual">
        <h4 class="mb-2 text-[15px] font-bold">3. Aviso al cliente</h4>
        <UCard variant="subtle">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <pre class="whitespace-pre-wrap font-sans text-sm" v-html="whatsappHtml(notice) || 'Cargando aviso…'" />
        </UCard>
        <p class="mt-2 text-xs text-muted">Sin importe y sin código de solicitud. Si cambias los yuanes pagados, vuelve a enviarlo.</p>
        <UButton class="mt-3" color="neutral" variant="soft" :disabled="!receipt || !(yuanPaid && yuanPaid > 0) || saving" @click="sendNotice">
          {{ noticeReady ? 'Aviso enviado' : 'Enviar aviso al cliente' }}
        </UButton>
      </UCard>
      <UCard v-else-if="selected && !readOnly" class="text-sm text-muted">
        Solicitud de otro socio. No se avisa a Ventas ni al cliente.
      </UCard>
      <UCard v-if="selected?.can_observe && !readOnly" color="error" variant="subtle">
        <h4 class="mb-2 text-[15px] font-bold text-highlighted">Observar</h4>
        <USelect v-model="reason" :items="motivosObservacion" placeholder="Elige un motivo si hay que observar" class="w-full" />
        <UInput v-if="reason === 'other'" v-model="newReason" placeholder="Nuevo motivo" class="mt-2 w-full" />
        <UInput v-if="reason" v-model="detail" placeholder="Detalle opcional" class="mt-2 w-full" />
      </UCard>
      <template #footer>
        <UButton v-if="!readOnly && reason" color="error" variant="soft" :loading="saving" @click="observe">Observar</UButton>
        <UButton v-if="!readOnly" color="primary" :loading="saving" :disabled="!canSave" @click="save">Registrar pago</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="manualOpen"
      :title="editingId ? 'Editar solicitud' : 'Nueva solicitud'"
      subtitle="Para otros socios. No avisa a Ventas ni al cliente."
      @close="manualOpen = false"
    >
      <form id="yuan-manual" class="grid gap-3 text-sm sm:grid-cols-2" @submit.prevent="createManual">
        <UFormField label="Socio"><USelect v-model="manual.partner" :items="partners.filter((item) => !/pro business/i.test(item))" placeholder="Elige el socio" class="w-full" /></UFormField>
        <UFormField label="Cliente"><UInput v-model="manual.client_name" class="w-full" /></UFormField>
        <UFormField label="Consolidado"><UInput v-model="manual.consolidation" class="w-full" /></UFormField>
        <UFormField label="Producto"><UInput v-model="manual.product" class="w-full" /></UFormField>
        <UFormField label="Código proveedor"><UInput v-model="manual.supplier_code" class="w-full" /></UFormField>
        <UFormField label="Nombre proveedor"><UInput v-model="manual.supplier_name" class="w-full" /></UFormField>
        <UFormField label="Vendedor"><UInput v-model="manual.seller_name" class="w-full" /></UFormField>
        <UFormField label="WeChat"><UInput v-model="manual.wechat" placeholder="Solo dígitos" class="w-full" /></UFormField>
        <UFormField label="USD"><UInput v-model.number="manual.usd_amount" type="number" min="0" step="0.01" class="w-full" /></UFormField>
        <UFormField label="RMB"><UInput v-model.number="manual.yuan_amount" type="number" min="0" step="0.01" class="w-full" /></UFormField>
        <p class="text-muted sm:col-span-2">Tipo de cambio {{ manualRate }}</p>
        <label class="text-muted sm:col-span-2">Proforma (opcional)<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" class="mt-1 block text-highlighted" @change="onProforma" /></label>
      </form>
      <template #footer>
        <UButton type="submit" form="yuan-manual" color="primary" :loading="saving">{{ editingId ? 'Guardar' : 'Crear' }}</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { useSupplierPaymentYuan } from '~/composables/pago-proveedor/useSupplierPaymentYuan'
import { EXECUTION_STATUS, YUAN_BUCKET } from '~/constants/supplierPayment'
import type { SupplierPaymentYuan } from '~/types/pago-proveedor'
import { UBadge, UButton } from '#components'

const {
  bucket, search, partner, partners, rows, reasons, loading, saving, opened, readOnly, manualOpen, editingId, startManual, manual,
  selected, rate, yuanPaid, receipt, reason, newReason, detail, notice, noticeReady, cards, manualRate,
  obtained, differenceYuan, differenceUsd, differenceText, canSave, money, tabCount, statusColor,
  load, open, onFile, onProforma, copy, sendNotice, save, observe, createManual, lift, remove
} = useSupplierPaymentYuan()

const filters = ref({ status: YUAN_BUCKET.PENDING, partner: 'todos' })
const motivosObservacion = computed(() => [
  ...reasons.value.map((item) => ({ label: item.label, value: item.code })),
  { label: 'Otro motivo', value: 'other' }
])

const filterConfig = computed(() => [
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Estado',
    options: [
      { value: YUAN_BUCKET.ALL, label: `Todos (${tabCount(YUAN_BUCKET.ALL)})` },
      { value: YUAN_BUCKET.PENDING, label: `Pendiente (${tabCount(YUAN_BUCKET.PENDING)})` },
      { value: YUAN_BUCKET.OBSERVED, label: `Observado (${tabCount(YUAN_BUCKET.OBSERVED)})` },
      { value: YUAN_BUCKET.PAID, label: `Pagado (${tabCount(YUAN_BUCKET.PAID)})` }
    ]
  },
  {
    key: 'partner',
    label: 'Socio',
    type: 'select',
    placeholder: 'Socio',
    options: [
      { value: 'todos', label: 'Todos los socios' },
      ...partners.value.map((item) => ({ value: item, label: item }))
    ]
  }
])

const columns: TableColumn<SupplierPaymentYuan>[] = [
  { accessorKey: 'order_number', header: 'N.° de orden', cell: ({ row }) => row.original.order_number ?? '—' },
  { accessorKey: 'request_code', header: 'Código de solicitud', cell: ({ row }) => h('span', { class: 'font-semibold' }, row.original.request_code || '—') },
  { accessorKey: 'supplier_code', header: 'Proveedor', cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, row.original.supplier_code || 'Sin código'),
    row.original.supplier_name ? h('div', { class: 'text-xs text-muted' }, row.original.supplier_name) : null,
    h('div', { class: 'text-xs text-muted' }, row.original.product || '—'),
    h('div', { class: 'text-xs text-muted' }, `WeChat ${row.original.wechat || '—'}`)
  ]) },
  { accessorKey: 'client_name', header: 'Cliente', cell: ({ row }) => h('div', [
    h('div', row.original.client_name || '—'),
    h('div', { class: 'text-xs text-muted' }, row.original.consolidation ? `Consolidado ${row.original.consolidation}` : '—')
  ]) },
  { accessorKey: 'partner', header: 'Socio' },
  { accessorKey: 'usd_amount', header: 'Monto USD', cell: ({ row }) => h('span', { class: 'font-semibold' }, `$${money(row.original.usd_amount)}`) },
  { accessorKey: 'yuan_amount', header: 'Monto RMB', cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold text-warning' }, `¥${money(row.original.yuan_amount)}`),
    h('div', { class: 'text-xs text-muted' }, `T.C. ${row.original.quoted_rate ?? '—'}`)
  ]) },
  { accessorKey: 'yuan_obtained', header: 'Recibido del socio', cell: ({ row }) => h('div', [
    h('div', `$${money(row.original.usd_amount)}`),
    row.original.yuan_obtained != null ? h('div', { class: 'text-xs text-muted' }, `¥${money(row.original.yuan_obtained)}`) : null
  ]) },
  { accessorKey: 'yuan_paid', header: 'Pagado RMB', cell: ({ row }) => row.original.yuan_paid == null ? '—' : h('div', [
    h('div', { class: 'font-semibold' }, `¥${money(row.original.yuan_paid)}`),
    h('div', { class: 'text-xs text-muted' }, `T.C. real ${row.original.real_exchange_rate ?? '—'}`)
  ]) },
  { accessorKey: 'difference_label', header: 'Diferencia', cell: ({ row }) => row.original.difference_label || '—' },
  { accessorKey: 'status_label', header: 'Estado', cell: ({ row }) => h('div', [
    h(UBadge, { color: statusColor(row.original.status), variant: 'soft', label: row.original.status_label }),
    row.original.supplier_payments > 1 ? h('p', { class: 'mt-1 text-xs text-muted' }, `Pago ${row.original.current_payment} de ${row.original.supplier_payments}`) : null,
    row.original.observation_label ? h('p', { class: 'mt-1 text-xs text-error' }, `${row.original.observation_label}${row.original.observation_until_text ? ` · ${row.original.observation_until_text}` : ''}`) : null
  ]) },
  { accessorKey: 'provider_id', header: 'Acciones', cell: ({ row }) => h('div', { class: 'flex flex-wrap justify-end gap-1' }, [
    row.original.can_register ? h(UButton, { size: 'sm', color: 'primary', onClick: () => open(row.original, false) }, () => 'Registrar') : null,
    !row.original.can_register && row.original.status === EXECUTION_STATUS.PAID ? h(UButton, { size: 'sm', color: 'neutral', variant: 'soft', onClick: () => open(row.original, true) }, () => 'Ver') : null,
    row.original.can_lift ? h(UButton, { size: 'sm', color: 'primary', variant: 'soft', onClick: () => lift(row.original) }, () => 'Levantar') : null,
    row.original.can_edit ? h(UButton, { size: 'sm', color: 'neutral', variant: 'soft', onClick: () => startManual(row.original) }, () => 'Editar') : null,
    row.original.manual && row.original.can_register ? h(UButton, { size: 'sm', color: 'error', variant: 'ghost', onClick: () => remove(row.original) }, () => 'Eliminar') : null
  ]) }
]

function onSearch(value: string) {
  search.value = value
  load()
}

function onFilter(key: string, value: unknown) {
  const normalized = value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)
    ? (value as Record<string, unknown>).value
    : value
  const next = String(normalized ?? '')
  filters.value = { ...filters.value, [key]: next }
  if (key === 'status') bucket.value = next
  if (key === 'partner') partner.value = next === 'todos' ? '' : next
  load()
}
</script>
