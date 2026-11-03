<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs text-gray-500">Operaciones</p>
        <h2 class="text-xl font-bold text-gray-800">Pagos en yuanes</h2>
      </div>
      <UButton color="primary" @click="startManual()">Nueva solicitud</UButton>
    </div>
    <div class="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in cards" :key="card.label" class="rounded-2xl border border-gray-200 bg-white px-4 py-4">
        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ card.label }}</p>
        <USkeleton v-if="loading" class="mt-2 h-8 w-24" />
        <p v-else class="mt-1 text-2xl font-bold" :class="card.danger ? 'text-red-600' : 'text-gray-900'">{{ card.value }}</p>
      </article>
    </div>
    <div class="mb-3.5 flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex-1 border-r border-gray-200 px-4 py-3.5 text-left text-xs text-gray-500 last:border-r-0"
        :class="bucket === tab.key ? 'border-b-4 border-b-primary-500 bg-primary-50 text-gray-800' : ''"
        @click="changeBucket(tab.key)"
      >
        {{ tab.label }}
        <USkeleton v-if="loading" class="mt-1 h-8 w-10" />
        <b v-else class="mt-0.5 block text-2xl text-gray-900">{{ tabCount(tab.key) }}</b>
      </button>
    </div>
    <div class="mb-3 flex flex-wrap gap-2">
      <input
        v-model="search"
        placeholder="Código, proveedor o WeChat"
        class="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        @keyup.enter="load"
      />
      <select v-model="partner" class="rounded-lg border border-gray-300 px-3 py-2 text-sm" @change="load">
        <option value="">Todos los socios</option>
        <option v-for="item in partners" :key="item" :value="item">{{ item }}</option>
      </select>
      <UButton color="neutral" variant="soft" @click="load">Buscar</UButton>
    </div>
    <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table class="w-full min-w-[1100px] border-collapse text-sm">
        <thead>
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <th class="px-3 py-3">N.º</th>
            <th class="px-3 py-3">Solicitud</th>
            <th class="px-3 py-3">Proveedor</th>
            <th class="px-3 py-3">Cliente</th>
            <th class="px-3 py-3">Socio</th>
            <th class="px-3 py-3">USD</th>
            <th class="px-3 py-3">RMB</th>
            <th class="px-3 py-3">Recibido</th>
            <th class="px-3 py-3">Pagado</th>
            <th class="px-3 py-3">Diferencia</th>
            <th class="px-3 py-3">Estado</th>
            <th class="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="row in 5" :key="`sk-${row}`">
              <td v-for="col in 12" :key="col" class="px-3 py-3"><USkeleton class="h-4 w-full" /></td>
            </tr>
          </template>
          <tr v-else-if="!rows.length">
            <td colspan="12" class="px-3.5 py-8 text-center text-sm text-gray-400">No hay pagos en esta pestaña.</td>
          </tr>
          <template v-else>
            <tr v-for="row in rows" :key="row.provider_id" class="border-t border-gray-100 align-top">
              <td class="px-3 py-3">{{ row.order_number || '—' }}</td>
              <td class="px-3 py-3 font-semibold">{{ row.request_code || '—' }}</td>
              <td class="px-3 py-3">
                <p class="font-semibold">{{ row.supplier_code || 'Sin código' }}</p>
                <p class="text-xs text-gray-500">{{ row.supplier_name || '—' }}</p>
                <p class="text-xs text-gray-500">{{ row.product || '—' }}</p>
                <p class="text-xs text-gray-500">WeChat {{ row.wechat || '—' }}</p>
              </td>
              <td class="px-3 py-3">
                <p>{{ row.client_name || '—' }}</p>
                <p class="text-xs text-gray-500">{{ row.consolidation || '—' }}</p>
              </td>
              <td class="px-3 py-3">{{ row.partner }}</td>
              <td class="px-3 py-3">${{ money(row.usd_amount) }}</td>
              <td class="px-3 py-3">
                <p class="font-semibold text-orange-600">¥{{ money(row.yuan_amount) }}</p>
                <p class="text-xs text-gray-500">T.C. {{ row.quoted_rate }}</p>
              </td>
              <td class="px-3 py-3">
                <span v-if="row.yuan_paid">${{ money(row.usd_amount) }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-3 py-3">
                <template v-if="row.yuan_paid">
                  <p>¥{{ money(row.yuan_paid) }}</p>
                  <p class="text-xs text-gray-500">T.C. {{ row.real_exchange_rate }}</p>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-3 py-3">
                <span v-if="row.difference_label">{{ row.difference_label }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-3 py-3">
                <UBadge :color="statusColor(row.status)" variant="soft" :label="row.status_label" />
                <p v-if="row.supplier_payments > 1" class="mt-1 text-xs text-gray-500">Pago {{ row.current_payment }} de {{ row.supplier_payments }}</p>
                <p v-if="row.observation_label" class="mt-1 text-xs text-red-600">{{ row.observation_label }}</p>
              </td>
              <td class="px-3 py-3 text-right">
                <UButton v-if="row.can_register" size="sm" color="primary" @click="open(row, false)">Registrar</UButton>
                <UButton v-else-if="row.status === 'pagado'" size="sm" color="neutral" variant="soft" @click="open(row, true)">Ver</UButton>
                <UButton v-if="row.can_lift" size="sm" color="primary" variant="soft" class="ml-1" @click="lift(row)">Levantar</UButton>
                <UButton v-if="row.can_edit" size="sm" color="neutral" variant="soft" class="ml-1" @click="startManual(row)">Editar</UButton>
                <UButton v-if="row.manual && row.can_register" size="sm" color="error" variant="ghost" class="ml-1" @click="remove(row)">Eliminar</UButton>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

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
          <p v-if="selected.supplier_payments > 1" class="text-sm text-gray-600">Pago {{ selected.current_payment }} de {{ selected.supplier_payments }}</p>
          <a v-if="selected.proforma_url" :href="selected.proforma_url" target="_blank" rel="noopener" class="text-sm font-semibold text-primary-600">Ver proforma</a>
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Proveedor">
          <SupplierPaymentFact label="Código" :value="selected.supplier_code || 'Sin código'" />
          <SupplierPaymentFact label="Nombre" :value="selected.supplier_name || '—'" />
          <SupplierPaymentFact label="Producto" :value="selected.product || '—'" />
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="text-gray-500">WeChat</span>
            <span class="font-semibold">{{ selected.wechat || '—' }}</span>
            <button type="button" class="text-xs font-semibold text-primary-600" @click="copy(selected.wechat)">Copiar</button>
          </div>
          <button type="button" class="text-xs font-semibold text-primary-600" @click="copy(selected.supplier_code)">Copiar código</button>
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Importes">
          <p class="text-3xl font-bold text-orange-600">¥{{ money(selected.yuan_amount) }}</p>
          <SupplierPaymentFact label="USD recibido" :value="`$${money(selected.usd_amount)}`" />
          <SupplierPaymentFact label="T.C. cotizado" :value="String(selected.quoted_rate)" />
        </SupplierPaymentCard>
      </div>
      <section v-if="selected && readOnly" class="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p>T.C. real {{ selected.real_exchange_rate }} · Recibido ${{ money(selected.usd_amount) }}</p>
        <p class="mt-1">Obtenidos ¥{{ money(selected.yuan_obtained) }} · Pagados ¥{{ money(selected.yuan_paid) }}</p>
        <p class="mt-1">{{ selected.difference_label || 'Sin diferencia' }}</p>
        <a v-if="selected.receipt_url" :href="selected.receipt_url" target="_blank" rel="noopener" class="mt-2 inline-block font-semibold text-primary-600">Ver constancia</a>
      </section>
      <section v-if="selected && !readOnly" class="rounded-2xl border border-gray-200 bg-white p-4">
        <h4 class="mb-2 text-[15px] font-bold text-gray-900">1. Tipo de cambio y yuanes pagados</h4>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-sm text-gray-500">T.C. real (¥ por $)
            <input v-model.number="rate" type="number" min="0" step="0.0001" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900" />
          </label>
          <label class="text-sm text-gray-500">Yuanes pagados
            <input v-model.number="yuanPaid" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-semibold text-orange-600" />
          </label>
        </div>
        <p class="mt-2 text-sm text-gray-700">Obtenidos ¥{{ money(obtained) }} · diferencia ¥{{ money(differenceYuan) }} (${{ money(differenceUsd) }}) · {{ differenceText }}</p>
        <h4 class="mb-2 mt-4 text-[15px] font-bold text-gray-900">2. Constancia</h4>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="block text-sm text-gray-800" @change="onFile" />
        <p class="mt-1 text-xs text-gray-500">Queda en el sistema. No se adjunta al aviso del cliente.</p>
      </section>
      <section v-if="selected && !readOnly && !selected.manual" class="rounded-2xl border border-gray-200 bg-white p-4">
        <h4 class="mb-2 text-[15px] font-bold text-gray-900">3. Aviso al cliente</h4>
        <pre class="whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-sm text-gray-800">{{ notice || 'Cargando aviso…' }}</pre>
        <p class="mt-2 text-xs text-gray-500">Sin importe y sin código de solicitud. Si cambias los yuanes pagados, vuelve a enviarlo.</p>
        <UButton class="mt-3" color="neutral" variant="soft" :disabled="!receipt || !(yuanPaid && yuanPaid > 0) || saving" @click="sendNotice">
          {{ noticeReady ? 'Aviso enviado' : 'Enviar aviso al cliente' }}
        </UButton>
      </section>
      <section v-else-if="selected && !readOnly" class="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Solicitud de otro socio. No se avisa a Ventas ni al cliente.
      </section>
      <section v-if="selected?.can_observe && !readOnly" class="rounded-2xl border border-red-100 bg-white p-4">
        <h4 class="mb-2 text-[15px] font-bold text-gray-900">Observar</h4>
        <select v-model="reason" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm">
          <option value="">Sin observación</option>
          <option v-for="item in reasons" :key="item.code" :value="item.code">{{ item.label }}</option>
          <option value="other">Otro motivo</option>
        </select>
        <input v-if="reason === 'other'" v-model="newReason" placeholder="Nuevo motivo" class="mt-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm" />
        <input v-if="reason" v-model="detail" placeholder="Detalle opcional" class="mt-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm" />
      </section>
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
        <label class="text-gray-500">Socio<input v-model="manual.partner" placeholder="Genuino - BOG" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Cliente<input v-model="manual.client_name" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Consolidado<input v-model="manual.consolidation" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Producto<input v-model="manual.product" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Código proveedor<input v-model="manual.supplier_code" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Nombre proveedor<input v-model="manual.supplier_name" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Vendedor<input v-model="manual.seller_name" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">WeChat<input v-model="manual.wechat" placeholder="Solo dígitos" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">USD<input v-model.number="manual.usd_amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">RMB<input v-model.number="manual.yuan_amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-orange-600" /></label>
        <p class="text-gray-600 sm:col-span-2">Tipo de cambio {{ manualRate }}</p>
        <label class="text-gray-500 sm:col-span-2">Proforma (opcional)<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" class="mt-1 block text-gray-800" @change="onProforma" /></label>
      </form>
      <template #footer>
        <UButton type="submit" form="yuan-manual" color="primary" :loading="saving">{{ editingId ? 'Guardar' : 'Crear' }}</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { useSupplierPaymentYuan } from '~/composables/pago-proveedor/useSupplierPaymentYuan'
import { UBadge } from '#components'

const {
  bucket, search, partner, partners, rows, reasons, loading, saving, opened, readOnly, manualOpen, editingId, startManual, manual,
  selected, rate, yuanPaid, reason, newReason, detail, notice, noticeReady, tabs, cards, manualRate,
  obtained, differenceYuan, differenceUsd, differenceText, canSave, money, tabCount, statusColor,
  changeBucket, load, open, onFile, onProforma, copy, sendNotice, save, observe, createManual, lift, remove
} = useSupplierPaymentYuan()
</script>
