<template>
  <div v-if="progress" class="mt-4 space-y-3">
    <UCard v-if="!readonly && progress.confirmation.exchange_rate_pending" variant="subtle" class="bg-primary/5 ring-primary/25">
      <p class="mb-2 text-sm font-semibold text-highlighted">Cuota 2: confirma el tipo de cambio del día para cobrarla.</p>
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="saveRate">
        <UFormField label="Tipo de cambio del día">
          <UInput v-model.number="rate" type="number" min="0" step="0.0001" class="w-32" />
        </UFormField>
        <UButton type="submit" size="sm" color="primary" :loading="saving">Confirmar tipo de cambio</UButton>
      </form>
    </UCard>

    <!-- Paso 2 · Validación de pago: refleja lo que hizo Administración (VW-12) -->
    <div v-if="muestraValidacion" class="grid gap-3 lg:grid-cols-3">
      <UCard :ui="bloque" :class="abonosPendientes ? 'bg-warning/10 ring-warning/30' : ''">
        <div class="mb-3 flex items-center gap-3">
          <UAvatar icon="i-lucide-file-text" size="md" color="primary" variant="soft" />
          <h3 class="text-[15px] font-bold text-highlighted">Abonos del cliente</h3>
        </div>
        <p class="text-xs text-muted">Importe cobrado · <strong class="text-highlighted">${{ money(proveedor.importe_requerido) }}</strong></p>
        <p v-if="!progress.verification.deposits.length" class="mt-2 text-sm text-muted">Sin abonos registrados.</p>
        <div v-for="deposit in progress.verification.deposits" :key="deposit.id" class="mt-2 text-sm">
          <div class="flex items-start justify-between gap-2">
            <div>
              <strong class="text-highlighted">Abono {{ deposit.number ?? deposit.id }} · ${{ money(deposit.shared ? deposit.amount : deposit.applied_amount) }}</strong>
              <p class="text-muted">{{ fechaCorta(deposit.paid_on) }} · {{ deposit.bank_label }}</p>
              <p class="text-muted">N.° de operación {{ deposit.operation_number || '—' }}<template v-if="deposit.shared"> · voucher compartido</template></p>
            </div>
            <div class="flex shrink-0 gap-1">
              <UButton v-if="deposit.voucher_url" size="xs" color="neutral" variant="outline" icon="i-lucide-receipt-text" title="Ver voucher" @click="emit('view-voucher', deposit.id)" />
              <UButton v-if="!readonly && deposit.can_edit" size="xs" color="neutral" variant="outline" icon="i-lucide-pencil" title="Editar voucher" @click="emit('edit-deposit', deposit.id)" />
            </div>
          </div>
          <p v-if="deposit.recorded_amount != null" class="text-xs text-muted">Registraste ${{ money(deposit.recorded_amount) }}: se ajustó al importe del banco.</p>
        </div>
        <UButton v-if="!readonly && aprobacion.state === 'waiting_shared'" class="mt-3" size="sm" color="primary" @click="emit('choose-providers')">Elegir proveedores</UButton>
      </UCard>

      <UCard :ui="bloque" :class="depositosObservados.length ? 'bg-warning/10 ring-warning/30' : ''">
        <div class="mb-3 flex items-center gap-3">
          <UAvatar icon="i-lucide-shield-check" size="md" color="primary" variant="soft" />
          <h3 class="text-[15px] font-bold text-highlighted">Verificación del pago</h3>
        </div>
        <template v-if="depositosObservados.length">
          <UBadge color="error" variant="soft" :label="`Observado${depositosObservados[0].observation?.reason ? ` · ${depositosObservados[0].observation?.reason}` : ''}`" />
          <p class="mt-2 text-sm text-muted">Administración no pudo confirmar el ingreso del dinero.</p>
          <p v-if="depositosObservados[0].observation?.detail" class="mt-1 text-sm text-highlighted">{{ depositosObservados[0].observation?.detail }}</p>
          <p v-if="depositosObservados[0].observation?.deadline_text" class="mt-1 text-xs text-muted">Plazo: {{ depositosObservados[0].observation?.deadline_text }}</p>
        </template>
        <template v-else-if="depositosPorValidar.length">
          <UBadge :color="depositosPorValidar[0].deadline_overdue ? 'error' : 'warning'" variant="soft" :label="`Por validar${depositosPorValidar[0].deadline_text ? ` · ${depositosPorValidar[0].deadline_text}` : ''}`" />
          <p class="mt-2 text-sm text-muted">Administración comprueba que el dinero ingresó al banco.</p>
        </template>
        <template v-else-if="progress.verification.deposits.length">
          <div class="flex flex-wrap gap-1.5">
            <UBadge color="success" variant="soft" label="✓ Validado" />
            <UBadge v-if="progress.verification.deposits.some(deposit => deposit.modified)" color="info" variant="soft" label="✎ Modificado" />
          </div>
          <div v-for="deposit in progress.verification.deposits" :key="`check-${deposit.id}`" class="mt-2 text-sm text-muted">
            <strong v-if="progress.verification.deposits.length > 1" class="block text-highlighted">Abono {{ deposit.number ?? deposit.id }}</strong>
            Importe ingresado (Banco): <strong class="text-highlighted">${{ money(deposit.amount) }}</strong>
            <em v-if="deposit.recorded_amount != null" class="block">Importe: ${{ money(deposit.recorded_amount) }} → ${{ money(deposit.amount) }}</em>
            <em v-for="change in deposit.corrections" :key="`${deposit.id}-${change.field}-${change.to}`" class="block">{{ change.field }}: {{ change.from }} → {{ change.to }}</em>
            <span v-if="deposit.verified_at" class="block text-xs">{{ fechaHora(deposit.verified_at) }}<template v-if="deposit.verified_by"> · {{ deposit.verified_by }}</template></span>
          </div>
        </template>
        <p v-else class="text-sm text-muted">Sin depósitos.</p>
      </UCard>

      <UCard :ui="bloque" :class="aprobacion.state === 'to_collect' || aprobacion.state === 'registration_error' || aprobacion.state === 'waiting_shared' ? 'bg-warning/10 ring-warning/30' : ''">
        <div class="mb-3 flex items-center gap-3">
          <UAvatar icon="i-lucide-circle-check" size="md" color="primary" variant="soft" />
          <h3 class="text-[15px] font-bold text-highlighted">Aprobación de pago</h3>
        </div>
        <UBadge :color="aprobacionVista.color" variant="soft" :label="aprobacionVista.label" />
        <p v-if="aprobacionVista.text" class="mt-2 text-sm text-muted">{{ aprobacionVista.text }}</p>
        <p v-if="aprobacion.state === 'registration_error' && aprobacion.note" class="mt-1 text-sm text-highlighted">{{ aprobacion.note }}</p>
        <p v-if="aprobacion.state === 'approved' && aprobacion.decided_at" class="mt-1 text-xs text-muted">{{ fechaHora(aprobacion.decided_at) }}<template v-if="!aprobacion.automatic && aprobacion.decided_by"> · {{ aprobacion.decided_by }}</template></p>
        <UButton v-if="!readonly && proveedor.puede_registrar_diferencia" class="mt-2" size="sm" color="primary" @click="emit('register-difference')">Registrar voucher de la diferencia</UButton>
        <UButton v-if="!readonly && proveedor.puede_levantar" class="mt-2" size="sm" color="neutral" variant="outline" @click="emit('lift')">Levantar observación</UButton>
        <UButton v-if="!readonly && aprobacion.state === 'missing_data'" class="mt-2" size="sm" color="neutral" variant="outline" @click="emit('complete-data')">Completar datos</UButton>

        <div v-for="row in progress.verification.surpluses" :key="row.deposit_id" class="mt-3 border-t border-default pt-2 text-sm">
          <template v-if="row.refund_status === REFUND_STATUS.REQUESTED">
            <UBadge color="info" variant="soft" :label="`Reembolso solicitado $${money(row.amount)}`" />
            <p class="mt-1 text-muted">Pendiente de aprobación de Administración. El cierre en Confirmación espera el reembolso.</p>
          </template>
          <template v-else-if="row.refund_status === REFUND_STATUS.APPROVED">
            <UBadge color="success" variant="soft" :label="`Reembolso aprobado $${money(row.amount)}`" />
            <UButton v-if="row.voucher_url" class="mt-1 block px-0" size="xs" color="primary" variant="link" :to="row.voucher_url" target="_blank">Ver comprobante</UButton>
          </template>
          <template v-else-if="row.refund_status === REFUND_STATUS.CONSULT || row.decision === SURPLUS_DECISION.CONSULT">
            <p class="text-muted">Excedente de <strong class="text-highlighted">${{ money(row.amount) }}</strong>: {{ row.can_apply_installment ? 'se consultará al cliente si prefiere el reembolso o aplicarlo a la siguiente cuota.' : 'se consultará al cliente si prefiere el reembolso o aplicarlo al servicio de Carga Consolidada.' }}</p>
            <p v-if="row.rejection" class="mt-1 text-muted"><em>Reembolso rechazado por Administración: {{ row.rejection }}</em></p>
            <div v-if="!readonly" class="mt-2 flex flex-wrap gap-2">
              <UButton size="sm" color="primary" :loading="saving" @click="row.refund_status ? requestRefund() : emit('decide-surplus', row.deposit_id, SURPLUS_DECISION.REFUND)">Solicitar reembolso</UButton>
              <UButton v-if="row.can_apply_installment && !row.refund_status" size="sm" color="primary" variant="outline" :loading="saving" @click="emit('decide-surplus', row.deposit_id, SURPLUS_DECISION.APPLY)">Aplicar a siguiente cuota</UButton>
            </div>
          </template>
          <!-- Reembolso directo (sin cuotas): queda solicitado desde que se registra el abono (#1664). -->
          <template v-else-if="row.decision === SURPLUS_DECISION.REFUND && !row.refund_status">
            <UBadge color="info" variant="soft" :label="`Reembolso solicitado $${money(row.amount)}`" />
            <p class="mt-1 text-muted">Pendiente de aprobación de Administración. El cierre en Confirmación espera el reembolso.</p>
          </template>
          <p v-else-if="row.decision === SURPLUS_DECISION.APPLY" class="text-muted">Excedente de ${{ money(row.amount) }}: se aplica a la cuota 2.</p>
        </div>
      </UCard>
    </div>

    <!-- Paso 3 · Ejecución de pago (VW-13) -->
    <div v-if="muestraEjecucion" class="grid gap-3 lg:grid-cols-3">
      <UCard :ui="bloque" :class="needsProviderData || proveedor.observacion_china ? 'bg-warning/10 ring-warning/30' : ''">
        <div class="mb-3 flex items-center gap-3">
          <UAvatar icon="i-lucide-user" size="md" color="primary" variant="soft" />
          <h3 class="text-[15px] font-bold text-highlighted">Datos del proveedor</h3>
        </div>
        <template v-if="proveedor.observacion_china">
          <UBadge color="error" variant="soft" label="Observado por Operaciones China" />
          <p class="mt-2 text-sm text-muted"><strong class="text-highlighted">Motivo:</strong> {{ proveedor.observacion_china.label }}<template v-if="proveedor.observacion_china.detail"> · {{ proveedor.observacion_china.detail }}</template></p>
          <p v-if="proveedor.observacion_china.until_text" class="text-sm text-muted">Plazo: <strong class="text-highlighted">{{ proveedor.observacion_china.until_text }}</strong></p>
          <div v-if="!readonly" class="mt-2 flex flex-wrap gap-2">
            <UButton size="sm" color="primary" @click="emit('complete-data')">Corregir datos</UButton>
            <UButton size="sm" color="neutral" variant="outline" @click="emit('lift-china')">Levantar observación</UButton>
          </div>
        </template>
        <UBadge v-else :color="needsProviderData ? 'warning' : 'success'" variant="soft" :label="needsProviderData ? '! Pendientes' : '✓ Completos'" />
        <dl v-if="proveedor.moneda === 'RMB' && !needsProviderData" class="mt-2 space-y-1 text-sm">
          <div class="flex justify-between gap-2"><dt class="text-muted">Nombre del vendedor</dt><dd class="font-semibold">{{ proveedor.datos?.vendedor_nombre || '—' }}</dd></div>
          <div class="flex justify-between gap-2"><dt class="text-muted">N.° de WeChat</dt><dd class="font-semibold">{{ proveedor.datos?.wechat || '—' }}</dd></div>
        </dl>
        <div v-else-if="!needsProviderData" class="mt-2 flex items-center justify-between gap-2 text-sm">
          <span class="text-muted">Datos bancarios (T-T)</span>
          <UButton size="xs" color="neutral" variant="outline" @click="emit('view-data')">Ver formulario</UButton>
        </div>
        <p v-else class="mt-2 text-sm text-muted">{{ proveedor.moneda === 'RMB' ? 'Faltan el nombre del vendedor y su N.° de WeChat' : 'Faltan los datos bancarios del proveedor' }}: {{ responsablePago }} los necesita para ejecutar el pago.</p>
        <UButton v-if="!readonly && needsProviderData" class="mt-2" size="sm" color="neutral" variant="outline" @click="emit('complete-data')">Completar datos</UButton>
        <UButton v-if="proveedor.proforma_url" class="mt-2 px-0" size="sm" color="primary" variant="link" icon="i-lucide-external-link" :to="proveedor.proforma_url" target="_blank">Ver proforma</UButton>
      </UCard>

      <UCard :ui="bloque">
        <div class="mb-3 flex items-center gap-3">
          <UAvatar icon="i-lucide-circle-dollar-sign" size="md" color="primary" variant="soft" />
          <h3 class="text-[15px] font-bold text-highlighted">{{ hasPaidExecution ? 'Importe pagado' : 'Importe a pagar' }}</h3>
        </div>
        <p class="text-3xl font-bold text-highlighted">{{ importePagoTexto }}</p>
        <UBadge class="mt-2" color="info" variant="soft" :label="proveedor.moneda" />
        <p class="mt-2 text-sm text-muted">{{ textoImporte }}</p>
      </UCard>

      <UCard :ui="bloque">
        <div class="mb-3 flex items-center gap-3">
          <UAvatar icon="i-lucide-receipt-text" size="md" color="primary" variant="soft" />
          <h3 class="text-[15px] font-bold text-highlighted">Registro de pago</h3>
        </div>
        <template v-if="hasPaidExecution">
          <UBadge color="success" variant="soft" :label="`✓ Registrado ${fechaCorta(progress.executions[0]?.executed_on)}`" />
          <div v-for="execution in progress.executions" :key="execution.id" class="mt-2 text-sm">
            <UButton v-if="execution.receipt_url" class="px-0" size="xs" color="primary" variant="link" icon="i-lucide-receipt-text" :to="execution.receipt_url" target="_blank">Ver constancia</UButton>
            <p v-else class="text-muted">Constancia pendiente</p>
            <p class="text-xs text-muted">{{ execution.registered_by || responsablePago }}<template v-if="execution.registered_at"> · {{ fechaHora(execution.registered_at) }}</template></p>
          </div>
          <p class="mt-1 text-sm text-muted">{{ proveedor.moneda === 'RMB' ? 'La constancia queda en el sistema; no se envía al cliente.' : 'Constancia enviada al cliente por WhatsApp.' }}</p>
        </template>
        <template v-else>
          <div class="flex items-start justify-between gap-2 border-b border-default py-2 text-sm first:pt-0">
            <strong class="text-highlighted">Comprobante de pago</strong>
            <span class="text-right text-xs text-muted">{{ proveedor.observacion_china ? 'En espera hasta que se corrija el dato' : `Pendiente · lo sube ${responsablePago}` }}</span>
          </div>
          <div v-if="proveedor.moneda === 'RMB'" class="flex items-start justify-between gap-2 py-2 text-sm">
            <strong class="text-highlighted">Balance de cambio (PDF)</strong>
            <span class="text-right text-xs text-muted">Se genera cuando Operaciones China registre el pago</span>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Paso 4 · Confirmación (VW-14) -->
    <template v-if="muestraConfirmacion">
      <div class="grid gap-3 lg:grid-cols-3">
        <UCard :ui="bloque">
          <div class="mb-3 flex items-center gap-3">
            <UAvatar icon="i-lucide-chart-no-axes-column" size="md" color="primary" variant="soft" />
            <h3 class="text-[15px] font-bold text-highlighted">Resumen de la operación</h3>
          </div>
          <dl class="divide-y divide-default text-sm">
            <div class="flex items-start justify-between gap-2 py-2">
              <dt>{{ conCuotas ? `Monto de la cuota ${proveedor.cuota_actual || 1} de 2` : 'Monto total del proveedor' }}<small class="block text-xs text-muted">{{ conCuotas ? 'Cuota' : 'Carga' }} ${{ money(cargaResumen) }} + comisiones ${{ money(totalResumen - cargaResumen) }}</small></dt>
              <dd class="whitespace-nowrap"><span class="text-xs text-muted">USD</span> <strong class="text-base">${{ money(totalResumen) }}</strong></dd>
            </div>
            <div class="flex items-start justify-between gap-2 py-2">
              <dt>Abono del cliente<small v-if="excedenteAbono > 0" class="block text-xs text-muted">Incluye excedente de ${{ money(excedenteAbono) }}</small></dt>
              <dd class="whitespace-nowrap"><span class="text-xs text-muted">USD</span> <strong class="text-base">${{ money(proveedor.importe_abonado + excedenteAbono) }}</strong></dd>
            </div>
            <div class="flex items-start justify-between gap-2 py-2">
              <dt>Pago al proveedor<UBadge v-if="dosPagos" class="ml-1 align-middle" color="neutral" variant="soft" size="sm" :label="`${progress.executions.length} de 2 pagos`" /></dt>
              <dd class="whitespace-nowrap text-right"><span class="text-xs text-muted">USD</span> <strong class="text-base">${{ money(pagadoUsd) }}</strong><small v-if="pagadoYuan > 0" class="block text-xs text-muted">¥{{ money(pagadoYuan) }}</small></dd>
            </div>
          </dl>
          <p class="mt-3 flex items-center gap-2 text-sm font-bold text-highlighted"><UIcon name="i-lucide-file-text" class="size-4 text-primary" />Documentos</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton v-if="proveedor.datos?.wechat || proveedor.datos?.beneficiario_nombre" size="sm" color="info" variant="soft" icon="i-lucide-eye" @click="emit('view-data')">Ver formulario</UButton>
            <UButton v-if="proveedor.proforma_url" size="sm" color="info" variant="soft" icon="i-lucide-eye" :to="proveedor.proforma_url" target="_blank">Ver proforma</UButton>
            <UButton
              v-for="deposit in depositosValidados"
              :key="`doc-${deposit.id}`"
              size="sm"
              color="info"
              variant="soft"
              icon="i-lucide-eye"
              :to="deposit.voucher_url || undefined"
              target="_blank"
            >
              Ver depósito validado por Administración{{ depositosValidados.length > 1 ? ` (#${deposit.id})` : '' }}
            </UButton>
          </div>
        </UCard>

        <UCard :ui="bloque" :class="infoPendiente ? 'bg-warning/10 ring-warning/30' : ''">
          <div class="mb-3 flex items-center gap-3">
            <UAvatar icon="i-lucide-send" size="md" color="primary" variant="soft" />
            <h3 class="text-[15px] font-bold text-highlighted">Información al cliente</h3>
          </div>
          <div v-for="(execution, index) in progress.executions" :key="`receipt-${execution.id}`" :class="fila">
            <div>
              <strong>{{ dosPagos ? `Constancia · pago ${index + 1}` : 'Constancia de pago' }}</strong>
              <p class="text-xs text-muted">{{ execution.registered_by || responsablePago }}<template v-if="execution.registered_at"> · {{ fechaHora(execution.registered_at) }}</template></p>
            </div>
            <UButton v-if="execution.receipt_url" class="shrink-0 whitespace-nowrap" size="xs" color="success" variant="soft" :to="execution.receipt_url" target="_blank">{{ proveedor.moneda === 'RMB' ? '✓ Registrada' : '✓ Enviada' }}</UButton>
            <UBadge v-else color="warning" variant="soft" :label="proveedor.moneda === 'RMB' ? 'Falta registrarla' : 'Falta enviarla'" />
          </div>
          <template v-if="proveedor.moneda === 'RMB' && progress.executions.length">
            <template v-if="pago1Interino">
              <div :class="fila">
                <div><strong>Balance del pago 1</strong><p class="text-xs text-muted">Solo de consulta · no se envía al cliente</p></div>
                <div class="flex items-center gap-1.5">
                  <UBadge color="info" variant="soft" label="Consulta" />
                  <UButton v-if="!readonly" size="xs" color="neutral" variant="outline" icon="i-lucide-download" title="Descargar balance del pago 1" :loading="saving" @click="downloadBalance" />
                </div>
              </div>
              <div :class="fila">
                <div><strong>Balance de cambio general</strong><p class="text-xs text-muted">Se genera al terminar los pagos</p></div>
                <UBadge color="warning" variant="soft" label="Pendiente" />
              </div>
            </template>
            <div v-else :class="fila">
              <div>
                <strong>{{ dosPagos ? 'Balance de cambio general' : 'Balance de cambio' }}</strong>
                <p class="text-xs text-muted">{{ textoBalance }}</p>
                <UBadge v-if="!readonly && balanceDocumento" class="mt-1" :color="balanceDocumento.desactualizado ? 'warning' : 'neutral'" variant="soft" size="sm">
                  {{ balanceDocumento.desactualizado ? 'Se regenerará' : `Paso ${balanceDocumento.paso} · al día` }}
                </UBadge>
              </div>
              <div class="flex flex-wrap items-center justify-end gap-1.5">
                <UBadge :color="progress.confirmation.balance_sent ? 'success' : (sinDiferencia ? 'success' : 'warning')" variant="soft" :label="progress.confirmation.balance_sent ? '✓ Enviado' : (sinDiferencia ? 'No aplica' : 'Por enviar')" />
                <UButton v-if="!readonly && progress.confirmation.can_download_balance" size="xs" color="neutral" variant="outline" icon="i-lucide-download" title="Descargar balance" :loading="saving" @click="downloadBalance" />
                <UButton v-if="!readonly && progress.confirmation.can_send_balance" size="xs" color="primary" icon="i-mdi-whatsapp" :loading="saving" @click="openBalancePreview">Enviar por WhatsApp</UButton>
              </div>
            </div>
          </template>
          <p v-if="!progress.executions.length" class="text-sm text-muted">Sin avisos pendientes.</p>
        </UCard>

        <UCard :ui="bloque" :class="pendingItems.length ? 'bg-warning/10 ring-warning/30' : ''">
          <div class="mb-3 flex items-center gap-3">
            <UAvatar icon="i-lucide-circle-check" size="md" color="primary" variant="soft" />
            <h3 class="text-[15px] font-bold text-highlighted">Por resolver</h3>
          </div>
          <UBadge class="mb-1" :color="pendingItems.length ? 'warning' : 'success'" variant="soft" :label="pendingItems.length ? `${pendingItems.length} pendiente${pendingItems.length > 1 ? 's' : ''}` : '✓ Nada pendiente'" />
          <div v-for="item in pendingSimpleItems" :key="item.key" :class="fila"><strong>{{ item.label }}</strong></div>

          <!-- Diferencia de cambio -->
          <div v-if="diferenciaVista" :class="filaDecision">
            <div class="flex items-start justify-between gap-2">
              <div><strong>Diferencia de cambio</strong><p class="text-xs text-muted">{{ diferenciaVista.text }}</p></div>
              <UBadge :color="diferenciaVista.color" variant="soft" :label="diferenciaVista.label" />
            </div>
            <form v-if="!readonly && progress.confirmation.can_register_exchange" class="mt-2 space-y-2" @submit.prevent="saveDifference">
              <UFormField label="Importe"><UInput v-model.number="difference.importe" type="number" min="0" step="0.01" class="w-full" /></UFormField>
              <UFormField label="Fecha"><UInput v-model="difference.fecha" type="date" class="w-full" /></UFormField>
              <UFormField label="Banco"><USelect v-model="difference.banco" :items="[{ label: 'BCP', value: 'bcp' }, { label: 'Interbank', value: 'interbank' }]" class="w-full" /></UFormField>
              <UFormField label="N.° de operación"><UInput v-model="difference.operacion" class="w-full" /></UFormField>
              <UFormField label="Comprobante">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm text-highlighted" @change="onDifferenceFile" />
              </UFormField>
              <UButton type="submit" size="sm" color="primary" :loading="saving">Registrar voucher de la diferencia</UButton>
            </form>
          </div>

          <!-- Reembolso -->
          <div v-if="pendingRefund" :class="filaDecision">
            <div class="flex items-start justify-between gap-2">
              <div>
                <strong>Reembolso</strong>
                <p class="text-xs text-muted">{{ textoReembolso }}</p>
              </div>
              <UBadge :color="pendingRefund.status === REFUND_STATUS.CONSULT ? 'warning' : 'info'" variant="soft" :label="`${pendingRefund.status === REFUND_STATUS.CONSULT ? 'Por consultar' : 'Solicitado'} $${money(pendingRefund.amount)}`" />
            </div>
            <div v-if="!readonly" class="mt-2 flex flex-wrap gap-2">
              <UButton v-if="progress.confirmation.can_request_refund" size="sm" color="primary" :loading="saving" @click="requestRefund">Solicitar reembolso</UButton>
              <UButton v-else size="sm" color="neutral" variant="outline" @click="emit('go-step', 2)">Ver en el paso 2</UButton>
            </div>
          </div>
          <div v-for="row in reembolsosAprobados" :key="`refund-ok-${row.deposit_id}`" :class="fila">
            <div><strong>Reembolso</strong><p class="text-xs text-muted">Aprobado por Administración</p></div>
            <UButton v-if="row.voucher_url" size="xs" color="success" variant="soft" :to="row.voucher_url" target="_blank">✓ Aprobado ${{ money(row.amount) }}</UButton>
            <UBadge v-else color="success" variant="soft" :label="`✓ Aprobado $${money(row.amount)}`" />
          </div>

          <!-- Cuota 2 -->
          <div v-if="progress.confirmation.can_decide_installment || progress.confirmation.second_installment_choice" :class="filaDecision">
            <div class="flex items-start justify-between gap-2">
              <div>
                <strong>Cuota 2</strong>
                <p class="text-xs" :class="progress.confirmation.decision_overdue && progress.confirmation.can_decide_installment ? 'font-semibold text-error' : 'text-muted'">
                  <template v-if="progress.confirmation.can_decide_installment">¿Se va a realizar? · {{ deadlineText }}</template>
                  <template v-else-if="(proveedor.cuota_actual || 1) >= 2 && proveedor.etapa >= 4">Ya se cobró</template>
                  <template v-else-if="progress.confirmation.second_installment_choice === INSTALLMENT_CHOICE.PROCEED">La cuota 2 se va a realizar.</template>
                  <template v-else>La cuota 2 no se realizará. No se cobra su comisión ni el segundo abono.</template>
                </p>
              </div>
              <UBadge :color="progress.confirmation.can_decide_installment ? 'warning' : 'success'" variant="soft" :label="progress.confirmation.can_decide_installment ? 'Por decidir' : ((proveedor.cuota_actual || 1) >= 2 && proveedor.etapa >= 4 ? '✓ Cobrada' : '✓ Decidida')" />
            </div>
            <template v-if="!readonly && progress.confirmation.can_decide_installment">
              <div class="mt-2 grid grid-cols-2 gap-2">
                <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="choose(INSTALLMENT_CHOICE.PROCEED)">Se realizará</UButton>
                <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="choose(INSTALLMENT_CHOICE.CANCEL)">No se realizará</UButton>
              </div>
              <p class="mt-2 text-xs text-muted">Si se realiza, se registra el abono de la cuota 2. Si no, el proveedor se cierra sin cobrarla.</p>
            </template>
          </div>

          <!-- Pago 2 -->
          <div v-if="progress.confirmation.can_decide_payment" :class="filaDecision">
            <div class="flex items-start justify-between gap-2">
              <div>
                <strong>Pago 2 de 2</strong>
                <p class="text-xs" :class="progress.confirmation.decision_overdue ? 'font-semibold text-error' : 'text-muted'">¿Se va a realizar?<template v-if="segundoPago"> · {{ segundoPago }}</template><template v-if="deadlineText"> · {{ deadlineText }}</template></p>
              </div>
              <UBadge :color="progress.confirmation.decision_overdue ? 'error' : 'warning'" variant="soft" :label="progress.confirmation.decision_overdue ? 'Vencido' : 'Por decidir'" />
            </div>
            <template v-if="!readonly">
              <div class="mt-2 grid grid-cols-2 gap-2">
                <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.PROCEED)">Se realizará</UButton>
                <UButton size="sm" color="neutral" variant="outline" class="justify-center" :loading="saving" @click="abrirCancelacionPago">No se realizará</UButton>
              </div>
              <p v-if="progress.confirmation.payment_two_refund" class="mt-2 text-xs text-muted">Si no se realiza, se devuelve la carga de ese pago y su administrativa (${{ money(progress.confirmation.payment_two_refund.total) }}). La comisión bancaria no se devuelve: el envío a China ya se hizo.</p>
              <template v-if="showCancelPayment">
                <UInput v-model="paymentReason" placeholder="Motivo" class="mt-2 w-full" />
                <div class="mt-2 flex flex-wrap gap-2">
                  <UButton size="sm" color="neutral" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.CANCEL)">Solo anular</UButton>
                  <UButton size="sm" color="error" variant="soft" :loading="saving" @click="choosePayment(PAYMENT_CHOICE.REFUND)">Anular y solicitar reembolso</UButton>
                </div>
              </template>
            </template>
          </div>
          <p v-else-if="progress.confirmation.second_payment_choice === PAYMENT_CHOICE.PROCEED" class="mt-2 text-xs text-muted">El pago 2 vuelve a ejecución.</p>
        </UCard>
      </div>

      <UCard :ui="bloque">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-56 flex-1">
            <UProgress :model-value="avanceConfirmacion" color="success" size="sm" class="max-w-sm" />
            <p class="mt-1.5 text-sm font-semibold text-highlighted">
              {{ progress.confirmation.done_count }} de {{ progress.confirmation.total }} ·
              <template v-if="progress.confirmation.completed">✓ Completado: no queda nada pendiente.</template>
              <template v-else-if="progress.confirmation.missing.length">Falta: {{ progress.confirmation.missing.join(' · ') }}</template>
              <template v-else>✓ Todo resuelto: la etapa se completa automáticamente.</template>
            </p>
            <p v-if="!progress.confirmation.completed" class="mt-1 text-xs text-muted">Esta etapa se completa sola cuando no queda nada pendiente: no hace falta cerrarla.</p>
          </div>
          <UButton v-if="!readonly && progress.confirmation.can_complete" size="sm" color="primary" :loading="saving" @click="markComplete">{{ progress.confirmation.complete_label || 'Marcar como Completado' }}</UButton>
        </div>
      </UCard>
    </template>

    <SupplierPaymentWindow
      :open="!!balancePreview"
      title="Balance por WhatsApp"
      subtitle="Revisa el mensaje antes de enviarlo."
      @close="balancePreview = null"
    >
      <template v-if="balancePreview">
        <UCard variant="subtle">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <pre class="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm text-highlighted" v-html="whatsappHtml(balancePreview.texto)" />
        </UCard>
        <p class="text-sm text-muted">Adjunto: {{ balancePreview.archivo }}</p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="soft" @click="balancePreview = null">Cancelar</UButton>
        <UButton color="primary" :loading="saving" @click="sendBalance">Enviar balance</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { INSTALLMENT_CHOICE, PAYMENT_CHOICE, REFUND_STATUS, SURPLUS_DECISION } from '~/constants/supplierPayment'
import type { PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { whatsappHtml } from '~/utils/whatsappFormat'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useSupplierPaymentProgress } from '~/composables/pago-proveedor/useSupplierPaymentProgress'

const props = withDefaults(defineProps<{
  solicitudId: number
  proveedor: PagoProveedorSolicitudProveedor
  readonly?: boolean
  viewing?: number | null
  tipoCambio?: number | null
}>(), { readonly: false, viewing: null, tipoCambio: null })
const emit = defineEmits<{
  saved: []
  'complete-data': []
  'view-data': []
  lift: []
  'lift-china': []
  'edit-deposit': [depositId: number]
  'view-voucher': [depositId: number]
  'register-difference': []
  'choose-providers': []
  'go-step': [step: number]
  'decide-surplus': [depositId: number, decision: string]
}>()
const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()
const api = useSupplierPaymentProgress()
const saving = ref(false)
const showCancelPayment = ref(false)
const rate = ref<number | null>(null)
const paymentReason = ref('')
const differenceFile = ref<File | null>(null)
const difference = reactive({ importe: null as number | null, fecha: new Date().toLocaleDateString('en-CA'), banco: 'bcp', operacion: '' })
// The voucher form proposes the amount still owed (VW-16).
watch(() => props.proveedor.progreso?.confirmation?.exchange_due_usd, (due) => {
  if (due && !difference.importe) difference.importe = due
}, { immediate: true })
const progress = computed(() => props.proveedor.progreso)
/** Balance ya emitido: se reutiliza mientras el paso y los montos no cambien. */
const balanceDocumento = computed(() => props.proveedor.documento_balance ?? null)
const balancePreview = ref<{ texto: string; archivo: string } | null>(null)
const etapaVista = computed(() => props.viewing ?? props.proveedor.etapa)
const revisandoOtra = computed(() => etapaVista.value !== props.proveedor.etapa)
const muestraValidacion = computed(() => props.proveedor.etapa >= 2 && etapaVista.value === 2)
const muestraEjecucion = computed(() => props.proveedor.etapa >= 3 && etapaVista.value === 3)
const muestraConfirmacion = computed(() => !!progress.value?.confirmation.visible && etapaVista.value === 4)
const pendingRefund = computed(() => progress.value?.confirmation.pending_refund || null)
const hasPaidExecution = computed(() => (progress.value?.executions || []).some((item) => !!item.executed_on))
const needsProviderData = computed(() => {
  if (props.proveedor.etapa < 2) return false
  const deposits = progress.value?.verification.deposits || []
  const depositsOk = deposits.length > 0 && deposits.every((deposit) => deposit.status !== 'en_validacion' && deposit.status !== 'observado')
  if (!depositsOk) return false
  if (props.proveedor.moneda === 'RMB') {
    return !props.proveedor.datos?.wechat || !props.proveedor.datos?.vendedor_nombre
  }
  return props.proveedor.datos?.estado !== 'recibido'
})

const depositosPorValidar = computed(() => (progress.value?.verification.deposits || []).filter((deposit) => deposit.status === 'en_validacion'))
const depositosObservados = computed(() => (progress.value?.verification.deposits || []).filter((deposit) => deposit.status === 'observado'))
const aprobacion = computed(() => progress.value!.verification.approval)
const abonosPendientes = computed(() => depositosObservados.value.length > 0 || aprobacion.value.state === 'waiting_shared' || aprobacion.value.state === 'registration_error')
/** Tarjeta «Aprobación de pago»: los mismos estados y textos que la maqueta (VW-12). */
const aprobacionVista = computed<{ color: 'success' | 'warning' | 'error'; label: string; text: string }>(() => {
  const data = aprobacion.value
  const usd = (value: number | null) => `$${money(Number(value || 0))}`
  switch (data.state) {
    case 'approved': {
      let text = 'Sin diferencias ni devoluciones.'
      if (data.assumed_amount) {
        text = data.automatic
          ? `Diferencia de ${usd(data.assumed_amount)}, dentro de la tolerancia (${usd(data.tolerance)}): la asume Pro Business.`
          : `Asumió una diferencia de ${usd(data.assumed_amount)}${data.assumed_reason ? ` (${data.assumed_reason})` : ''}.`
      } else if (data.surplus > 0.004) {
        text = `Sobrante de ${usd(data.surplus)}${data.surplus_applied ? ': se aplica a la cuota 2' : ''}.`
      }
      return { color: 'success', label: data.automatic ? '✓ Aprobado automáticamente' : '✓ Aprobado por Administración', text }
    }
    case 'to_collect':
      return { color: 'error', label: `Observado · Por cobrar${data.collect_amount ? ` ${usd(data.collect_amount)}` : ''}`, text: `Plazo para cobrar: ${data.deadline_text || '7 días'}. Si vence, Administración decide.` }
    case 'registration_error':
      return { color: 'error', label: 'Observado · Error de registro', text: 'Error de registro: corrige tu voucher o tus datos.' }
    case 'waiting_money':
      return { color: 'warning', label: 'En espera', text: 'No se evalúa hasta que el dinero ingrese.' }
    case 'waiting_shared':
      return { color: 'warning', label: 'Espera tu decisión', text: 'Ningún pago se aprueba hasta que indiques, en «Abonos del cliente», qué proveedores continúan con el dinero.' }
    case 'missing_data':
      return { color: 'warning', label: 'Pendiente', text: 'Depósitos validados. Falta completar los datos del proveedor: sin ellos el pago no puede pasar a Ejecución de pago.' }
    case 'difference':
      return { color: 'warning', label: 'Pendiente', text: `Hay una diferencia de ${usd(Math.abs(data.difference))}: Administración decide si la aprueba o la cobra al cliente.` }
    case 'waiting_verification':
      return { color: 'warning', label: 'Pendiente', text: 'Se evalúa cuando el depósito esté validado.' }
    default:
      return { color: 'warning', label: 'Pendiente', text: 'Administración lo está evaluando.' }
  }
})
const responsablePago = computed(() => props.proveedor.moneda === 'RMB' ? 'Operaciones China' : 'Administración')
const importePagoTexto = computed(() => {
  const executions = progress.value?.executions || []
  const paidYuan = executions.reduce((suma, execution) => suma + Number(execution.paid_yuan || 0), 0)
  if (props.proveedor.moneda === 'RMB' && paidYuan > 0) return `¥${money(paidYuan)}`
  const usd = executions.length ? executions.reduce((suma, execution) => suma + Number(execution.cargo_amount || 0), 0) : Number(props.proveedor.valor_carga_usd || 0)
  return importeEnMoneda(usd)
})
const textoImporte = computed(() => {
  if (hasPaidExecution.value) return props.proveedor.moneda === 'RMB' ? 'Yuanes pagados al proveedor.' : 'Valor de la carga transferido al proveedor.'
  return props.proveedor.moneda === 'RMB' ? 'Valor de la carga en yuanes.' : 'Valor de la carga que se transfiere al proveedor.'
})
const avanceConfirmacion = computed(() => {
  const confirmation = progress.value?.confirmation
  if (!confirmation) return 0
  if (confirmation.completed) return 100
  return confirmation.total ? Math.round(confirmation.done_count * 100 / confirmation.total) : 0
})
const pendingItems = computed(() => (progress.value?.confirmation.items || []).filter((item) => !item.done && item.blocks))
// Cuota 2 y pago 2 ya tienen su propia fila con botones.
const pendingSimpleItems = computed(() => pendingItems.value.filter((item) => !['installment', 'supplier_payment', 'exchange', 'refund', 'payment_refund'].includes(item.key)))
const conCuotas = computed(() => props.proveedor.modalidad_abono === 'fraccionado')
const dosPagos = computed(() => props.proveedor.modalidad_pago === 'fraccionado' && props.proveedor.moneda === 'RMB')
const totalResumen = computed(() => conCuotas.value ? Number(props.proveedor.importe_requerido || 0) : Number(props.proveedor.total_monto || 0))
const cargaResumen = computed(() => conCuotas.value ? Number(props.proveedor.cuota_carga ?? props.proveedor.valor_carga_usd ?? 0) : Number(props.proveedor.valor_carga_usd || 0))
const pagadoUsd = computed(() => (progress.value?.executions || []).reduce((suma, execution) => suma + Number(execution.cargo_amount || 0), 0))
const pagadoYuan = computed(() => (progress.value?.executions || []).reduce((suma, execution) => suma + Number(execution.paid_yuan || 0), 0))
const depositosValidados = computed(() => (progress.value?.verification.deposits || []).filter((deposit) => deposit.status === 'validado' && deposit.voucher_url))
const excedenteAbono = computed(() => (progress.value?.verification.surpluses || [])
  .filter((row) => row.refund_status === REFUND_STATUS.CONSULT || row.refund_status === REFUND_STATUS.REQUESTED || row.refund_status === REFUND_STATUS.APPROVED)
  .reduce((suma, row) => suma + Number(row.amount || 0), 0))
const reembolsosAprobados = computed(() => (progress.value?.verification.surpluses || []).filter((row) => row.refund_status === REFUND_STATUS.APPROVED))
const pago1Interino = computed(() => !!progress.value?.confirmation.can_decide_payment)
const sinDiferencia = computed(() => progress.value?.confirmation.exchange_result === 'within_tolerance' && !progress.value?.confirmation.balance_sent)
const textoBalance = computed(() => {
  if (progress.value?.confirmation.balance_sent) return 'Enviado al cliente'
  if (sinDiferencia.value) return 'Sin diferencia: no se envía al cliente'
  return dosPagos.value ? 'Suma de los 2 pagos' : 'PDF'
})
const infoPendiente = computed(() => !!progress.value?.confirmation.can_send_balance)
const segundoPago = computed(() => {
  const refund = progress.value?.confirmation.payment_two_refund
  if (!refund) return ''
  return Number(props.tipoCambio) > 0 ? `¥${money(refund.cargo * Number(props.tipoCambio))} ($${money(refund.cargo)})` : `$${money(refund.cargo)}`
})
/** Fila «Diferencia de cambio» de Por resolver (ES-61). */
const diferenciaVista = computed<{ color: 'success' | 'warning' | 'info'; label: string; text: string } | null>(() => {
  const confirmation = progress.value?.confirmation
  if (!confirmation || props.proveedor.moneda !== 'RMB' || !confirmation.exchange_result || pago1Interino.value) return null
  const amount = `$${money(confirmation.exchange_amount_usd)}`
  if (confirmation.exchange_result === 'within_tolerance') return { color: 'success', label: 'En tolerancia', text: 'La asume Pro Business' }
  if (confirmation.exchange_result === 'to_refund') return { color: 'info', label: `A favor ${amount}`, text: 'Se resuelve como reembolso' }
  if (confirmation.exchange_covered) return { color: 'success', label: '✓ Cobrada', text: `Se cobró ${amount} al cliente` }
  if (confirmation.exchange_validating) return { color: 'warning', label: 'Voucher por validar', text: 'Lo valida Administración' }
  return { color: 'warning', label: `Por cobrar $${money(confirmation.exchange_due_usd || confirmation.exchange_amount_usd)}`, text: 'El cliente debe pagarla' }
})
const textoReembolso = computed(() => {
  const refund = pendingRefund.value
  if (!refund) return ''
  if (refund.status === REFUND_STATUS.CONSULT) return refund.rejection ? `Rechazado por Administración: ${refund.rejection}` : (conCuotas.value ? 'El cliente decide qué hacer con el excedente' : 'Se reembolsa al cliente')
  return `Lo aprueba Administración · frena el cierre · ${refund.origin_label}`
})

// Tarjetas internas del seguimiento: mismo cuerpo compacto que la maqueta.
const bloque = { body: 'p-4 sm:p-4' }
const fila = 'mt-2 flex items-start justify-between gap-2 rounded-lg border border-default bg-default px-3 py-2.5 text-sm'
// Las decisiones van a todo el ancho: en fila, sus botones se montan uno sobre otro.
const filaDecision = 'mt-2 rounded-lg border border-default bg-default px-3 py-2.5 text-sm'

const deadlineText = computed(() => {
  const confirmation = progress.value?.confirmation
  if (!confirmation) return ''
  if (confirmation.decision_due_text) return confirmation.decision_due_text
  if (!confirmation.decision_due_at) return 'Plazo de 72 h para decidir.'
  return confirmation.decision_overdue ? 'El plazo ya venció. Igual puedes elegir.' : 'Tienes plazo para decidir.'
})

function fechaCorta(fecha?: string | null) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || '')
  return partes ? `${Number(partes[3])}/${Number(partes[2])}/${partes[1]}` : (fecha || 'Sin fecha')
}

function importeEnMoneda(usd: number) {
  if (props.proveedor.moneda === 'RMB' && Number(props.tipoCambio) > 0) return `¥${money(usd * Number(props.tipoCambio))}`
  return `$${money(usd)}`
}

function fechaHora(fecha?: string | null) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function choose(choice: string) {
  saving.value = true
  try {
    await withSpinner(() => api.decideInstallment(props.solicitudId, props.proveedor.id, choice), 'Guardando…')
    showSuccess('Cuota 2', choice === INSTALLMENT_CHOICE.PROCEED ? 'La cuota 2 vuelve a etapa 1.' : 'La cuota 2 no se cobrará.')
    emit('saved')
  } catch (error: any) {
    showError('Cuota 2', error?.data?.message || error?.message || 'No se pudo guardar la decisión.')
  } finally {
    saving.value = false
  }
}

async function choosePayment(choice: string) {
  if (choice !== PAYMENT_CHOICE.PROCEED && !paymentReason.value.trim()) return
  saving.value = true
  try {
    await withSpinner(() => api.decidePayment(props.solicitudId, props.proveedor.id, choice, paymentReason.value), 'Guardando…')
    showCancelPayment.value = false
    showSuccess('Pago 2', choice === PAYMENT_CHOICE.PROCEED ? 'China puede registrar el segundo pago.' : 'El pago 2 no se realizará.')
    emit('saved')
  } catch (error: any) {
    showError('Pago 2', error?.data?.message || error?.message || 'No se pudo guardar la decisión.')
  } finally {
    saving.value = false
  }
}

function onDifferenceFile(event: Event) {
  const input = event.target as HTMLInputElement
  differenceFile.value = input.files?.[0] || null
}

function abrirCancelacionPago() {
  showCancelPayment.value = true
}

function savePdf(pdf?: { filename: string; base64: string } | null) {
  if (!pdf?.base64) return
  const link = document.createElement('a')
  link.href = `data:application/pdf;base64,${pdf.base64}`
  link.download = pdf.filename || 'Balance.pdf'
  link.click()
}

async function openBalancePreview() {
  saving.value = true
  try {
    const response = await withSpinner(() => api.previewBalance(props.solicitudId, props.proveedor.id), 'Preparando balance…')
    balancePreview.value = response.data
  } catch (error: any) {
    showError('Balance', error?.data?.message || error?.message || 'No se pudo preparar el balance.')
  } finally {
    saving.value = false
  }
}

async function sendBalance() {
  saving.value = true
  try {
    const response = await withSpinner(() => api.sendBalance(props.solicitudId, props.proveedor.id), 'Generando balance…')
    savePdf(response.pdf)
    balancePreview.value = null
    showSuccess('Balance', 'El mensaje y el PDF quedaron listos para el cliente.')
    emit('saved')
  } catch (error: any) {
    showError('Balance', error?.data?.message || error?.message || 'No se pudo enviar el balance.')
  } finally {
    saving.value = false
  }
}

async function downloadBalance() {
  saving.value = true
  try {
    const response = await withSpinner(() => api.downloadBalance(props.solicitudId, props.proveedor.id), 'Descargando…')
    savePdf(response.data)
    showSuccess('Balance', response.data.generado
      ? `Balance emitido en el paso ${response.data.paso}: ${response.data.paso_nombre}.`
      : 'Balance descargado. Se reutiliza el PDF ya emitido.')
    emit('saved')
  } catch (error: any) {
    showError('Balance', error?.data?.message || error?.message || 'No se pudo descargar el balance.')
  } finally {
    saving.value = false
  }
}

async function saveDifference() {
  if (!difference.importe || !difference.fecha || !difference.operacion || !differenceFile.value) return
  const form = new FormData()
  form.append('importe', String(difference.importe))
  form.append('fecha', difference.fecha)
  form.append('banco', difference.banco)
  form.append('numero_operacion', difference.operacion)
  form.append('voucher', differenceFile.value)
  saving.value = true
  try {
    await withSpinner(() => api.registerDifference(props.solicitudId, props.proveedor.id, form), 'Registrando…')
    showSuccess('Diferencia de cambio', 'El voucher quedó para que Administración lo valide.')
    emit('saved')
  } catch (error: any) {
    showError('Diferencia de cambio', error?.data?.message || error?.message || 'No se pudo registrar el voucher.')
  } finally {
    saving.value = false
  }
}

async function requestRefund() {
  saving.value = true
  try {
    await withSpinner(() => api.requestRefund(props.solicitudId, props.proveedor.id), 'Solicitando…')
    showSuccess('Reembolso', 'Administración ya puede registrar el voucher.')
    emit('saved')
  } catch (error: any) {
    showError('Reembolso', error?.data?.message || error?.message || 'No se pudo solicitar el reembolso.')
  } finally {
    saving.value = false
  }
}

async function saveRate() {
  if (!rate.value || rate.value <= 0) return
  saving.value = true
  try {
    await withSpinner(() => api.confirmRate(props.solicitudId, rate.value!), 'Confirmando…')
    showSuccess('Tipo de cambio', 'Ya puedes registrar el abono de la cuota 2.')
    emit('saved')
  } catch (error: any) {
    showError('Tipo de cambio', error?.data?.message || error?.message || 'No se pudo confirmar el tipo de cambio.')
  } finally {
    saving.value = false
  }
}

async function markComplete() {
  saving.value = true
  try {
    await withSpinner(() => api.complete(props.solicitudId, props.proveedor.id), 'Cerrando…')
    showSuccess('Confirmación', 'Proveedor marcado como Completado.')
    emit('saved')
  } catch (error: any) {
    showError('Confirmación', error?.data?.message || error?.message || 'No se pudo completar el proveedor.')
  } finally {
    saving.value = false
  }
}
</script>
