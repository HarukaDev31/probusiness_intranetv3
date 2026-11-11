<template>
  <div class="mx-auto max-w-5xl p-6">
    <PageHeader
      :title="titulo"
      :subtitle="subtitulo"
      icon="i-heroicons-banknotes"
      :hide-back-button="false"
      @back="navigateTo('/pago-proveedor/cotizaciones')"
    >
      <template v-if="cotizacion?.vigencia_texto" #actions>
        <p class="text-sm" :class="cotizacion.vencida ? 'font-semibold text-error' : 'text-muted'">{{ cotizacion.vigencia_texto }}</p>
      </template>
    </PageHeader>

    <div v-if="cargando" class="mt-4 space-y-4">
      <UCard>
        <USkeleton class="h-5 w-40" />
        <USkeleton class="mt-3 h-4 w-2/3" />
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-16 w-full" />
        </div>
      </UCard>
      <UCard>
        <USkeleton class="h-5 w-32" />
        <USkeleton class="mt-3 h-4 w-1/2" />
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-16 w-full" />
        </div>
        <USkeleton class="mt-4 h-28 w-full rounded-xl" />
      </UCard>
    </div>

    <form v-else-if="cotizacion" class="mt-4 space-y-4" @submit.prevent="guardar">
      <p v-if="cotizacion.solicitud_id" class="text-sm">
        <NuxtLink :to="`/pago-proveedor/solicitudes/${cotizacion.solicitud_id}`" class="font-semibold text-primary">Ver solicitud</NuxtLink>
      </p>

      <UCard>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold">Datos del cliente</h2>
          <UBadge v-if="cotizacion.cod_cotizacion_cc" color="success" variant="subtle">
            Cotización de C. Consolidada: {{ cotizacion.cod_cotizacion_cc }}
          </UBadge>
        </div>
        <p class="mt-1 text-sm text-muted">Datos tomados de la cotización de C. Consolidada. Para cambiar de cliente, vuelve y crea otra cotización.</p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <UFormField label="N.° de consolidado" required>
            <UInput :model-value="soloConsolidado(cotizacion.consolidado)" disabled class="w-full" />
          </UFormField>
          <UFormField label="Nombre y apellido" required>
            <UInput :model-value="cotizacion.cliente_nombre || '—'" disabled class="w-full" />
          </UFormField>
          <UFormField label="WhatsApp">
            <template #hint><UBadge color="neutral" variant="soft" size="sm">Autocompletado</UBadge></template>
            <UInput :model-value="cotizacion.cliente_whatsapp || '—'" disabled class="w-full" />
          </UFormField>
          <UFormField label="Correo electrónico">
            <template #hint><UBadge color="neutral" variant="soft" size="sm">Autocompletado</UBadge></template>
            <UInput :model-value="cotizacion.cliente_correo || '—'" disabled class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <h2 class="text-lg font-semibold">Proveedores</h2>
        <p class="mt-1 text-sm text-muted">Agrega uno o más proveedores. Cada uno puede tener distinto tipo de pago y modalidad.</p>

        <UCard v-for="(proveedor, indice) in proveedores" :key="proveedor.id || `nuevo-${indice}`" class="mt-4 border-l-4 border-l-primary-500" variant="subtle">
          <div class="mb-4 flex items-center justify-between gap-2">
            <h3 class="font-semibold">Proveedor {{ indice + 1 }}</h3>
            <div class="flex items-center gap-2">
              <UBadge v-if="proveedor.moneda" :color="proveedor.moneda === 'RMB' ? 'warning' : 'success'" variant="soft">{{ proveedor.moneda }}</UBadge>
              <UButton v-if="editable && proveedores.length > 1" type="button" color="error" variant="ghost" icon="i-lucide-trash-2" size="sm" @click="quitar(indice)" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <UFormField label="Código de proveedor" required help="Ventas elige el código que el intranet tiene para este cliente." :ui="{ help: 'text-[11px] text-muted' }">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></template>
              <USelect
                v-model="proveedor.code_supplier"
                :items="opcionesCodigo(proveedor.code_supplier)"
                value-key="value"
                label-key="label"
                :disabled="!editable"
                placeholder="Selecciona"
                class="w-full"
                @update:model-value="(codigo) => alElegirCodigo(proveedor, codigo)"
              />
            </UFormField>
            <UFormField label="Nombre del proveedor">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Opcional</UBadge></template>
              <UInput v-model="proveedor.nombre_proveedor" :disabled="!editable" placeholder="Ej: Foshan Light Industry Co." class="w-full" />
            </UFormField>
            <UFormField label="Nombre del producto" help="Información registrada por Ventas en Por embarcar." :ui="{ help: 'text-[11px] text-muted' }">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Autocompletado</UBadge></template>
              <UInput :model-value="proveedor.producto || '—'" disabled class="w-full" />
            </UFormField>
            <UFormField label="Moneda" required>
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></template>
              <USelect v-model="proveedor.moneda" :items="monedas" :disabled="!editable" class="w-full" @update:model-value="alCambiarMoneda(proveedor)" />
            </UFormField>
            <UFormField label="Tipo de pago">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Auto / según moneda</UBadge></template>
              <USelect v-model="proveedor.tipo_pago" :items="opcionesTipoPago(proveedor)" :disabled="proveedor.moneda !== 'USD' || !editable" class="w-full" />
            </UFormField>
            <UFormField :label="proveedor.moneda === 'RMB' ? 'Valor de carga (¥)' : 'Valor de carga (USD)'" required>
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></template>
              <UInput
                :model-value="valorNativo(indice)"
                :disabled="!editable"
                type="number"
                min="0"
                step="0.01"
                :placeholder="proveedor.moneda === 'RMB' ? '¥ 0.00' : '0.00'"
                class="w-full"
                @update:model-value="(v) => alValorNativo(indice, v)"
              />
              <p v-if="proveedor.moneda === 'RMB' && Number(tipoCambio) > 0 && Number(proveedor.valor_carga_usd) > 0" class="mt-1 text-xs text-muted">
                ¥{{ dinero(Number(valorNativo(indice))) }} ÷ {{ tipoCambio }} = ${{ dinero(proveedor.valor_carga_usd) }}
              </p>
              <p v-else-if="proveedor.moneda === 'RMB' && !(Number(tipoCambio) > 0) && Number(proveedor.valor_carga_usd) > 0" class="mt-1 text-xs text-muted">
                Quedó guardado en ${{ dinero(proveedor.valor_carga_usd) }}. Ingresa el tipo de cambio para verlo en yuanes.
              </p>
            </UFormField>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <UCard variant="subtle" class="bg-green-50 ring-green-200 dark:bg-green-950/30 dark:ring-green-900">
              <div class="mb-2.5 flex items-center gap-2.5">
                <UAvatar icon="i-lucide-user" size="sm" color="success" variant="soft" />
                <div>
                  <p class="text-sm font-bold">
                    Modalidad de abono del cliente
                    <span class="ml-1 cursor-help text-xs font-normal text-muted" title="Cuántas veces abona el cliente a Pro Business.">ⓘ</span>
                  </p>
                  <p class="text-xs text-muted">Define cómo el cliente abonará a Pro Business.</p>
                </div>
              </div>
              <URadioGroup
                v-model="proveedor.modalidad_abono"
                :items="opcionesAbono"
                :disabled="!editable"
                orientation="horizontal"
                variant="list"
                color="primary"
                class="mt-1"
                @update:model-value="alCambiarAbono(proveedor)"
              />
              <p v-if="notaAbono(proveedor)" class="mt-2 text-[11px] leading-snug text-muted">{{ notaAbono(proveedor) }}</p>
            </UCard>
            <UCard variant="subtle" class="bg-blue-50 ring-blue-200 dark:bg-blue-950/30 dark:ring-blue-900">
              <div class="mb-2.5 flex items-center gap-2.5">
                <UAvatar icon="i-lucide-credit-card" size="sm" color="info" variant="soft" />
                <div>
                  <p class="text-sm font-bold">
                    Modalidad de pago al proveedor
                    <span class="ml-1 cursor-help text-xs font-normal text-muted" title="Cuántas veces le paga Pro Business al proveedor.">ⓘ</span>
                  </p>
                  <p class="text-xs text-muted">Define cómo Pro Business pagará al proveedor.</p>
                </div>
              </div>
              <URadioGroup
                v-model="proveedor.modalidad_pago"
                :items="opcionesPago"
                :disabled="!editable || proveedor.moneda === 'USD'"
                orientation="horizontal"
                variant="list"
                color="primary"
                class="mt-1"
                @update:model-value="alCambiarPago(proveedor)"
              />
              <p v-if="notaPago(proveedor)" class="mt-2 text-xs leading-snug text-muted">{{ notaPago(proveedor) }}</p>
            </UCard>
          </div>

          <UCard v-if="fraccionado(proveedor)" class="mt-4" variant="subtle">
            <p class="font-semibold">
              Forma de fraccionamiento
              <span
                class="ml-1 cursor-help text-xs font-normal text-muted"
                title="Una sola distribución para el abono del cliente y el pago al proveedor. Operaciones China ejecuta ambos pagos al proveedor. Administración valida el/los ingreso(s) del cliente correspondientes."
              >ⓘ</span>
            </p>
            <p class="text-sm text-muted">Define cómo se dividirán los importes en ambas modalidades.</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <UButton v-for="preset in presets" :key="preset.a" type="button" size="sm" :color="esPreset(proveedor, preset.a) ? 'primary' : 'neutral'" :variant="esPreset(proveedor, preset.a) ? 'solid' : 'outline'" :disabled="!editable" @click="elegirPreset(proveedor, indice, preset.a, preset.b)">{{ preset.label }}</UButton>
              <UButton type="button" size="sm" :color="esOtro(proveedor, indice) ? 'primary' : 'neutral'" :variant="esOtro(proveedor, indice) ? 'solid' : 'outline'" :disabled="!editable" @click="activarOtro(indice)">{{ etiquetaOtro(proveedor, indice) }}</UButton>
            </div>
            <UFormField v-if="esOtro(proveedor, indice)" label="Monto de la 1.ª parte" class="mt-3 max-w-xs">
              <UInput :model-value="montoPrimera(proveedor)" :disabled="!editable" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" @update:model-value="alMontoOtro(proveedor, $event)" />
            </UFormField>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <UCard>
                <p class="text-xs font-bold uppercase text-muted">1.ª parte</p>
                <p class="mt-1 text-lg font-bold">{{ partes(proveedor).texto1 }}</p>
                <p class="text-sm text-muted">{{ textoCombo(proveedor)?.cap1 }}</p>
                <p v-if="proveedor.modalidad_abono === 'fraccionado'" class="mt-2 text-xs text-muted">Fecha del abono: al registrar el abono</p>
              </UCard>
              <UCard>
                <p class="text-xs font-bold uppercase text-muted">2.ª parte</p>
                <p class="mt-1 text-lg font-bold">{{ partes(proveedor).texto2 }}</p>
                <p class="text-sm text-muted">{{ textoCombo(proveedor)?.cap2 }}</p>
                <div v-if="proveedor.modalidad_abono === 'fraccionado'" class="mt-2">
                  <p class="text-xs font-semibold text-highlighted">
                    {{ textoCombo(proveedor)?.fecha }}
                    <span class="text-muted">(opcional en la cotización)</span>
                    <span
                      class="ml-1 cursor-help font-normal text-muted"
                      title="Es una fecha aproximada: en el PDF se muestra como «fecha aprox.». Aparece en Mis pendientes, con aviso 2 días antes."
                    >ⓘ</span>
                  </p>
                  <UInput v-model="proveedor.fecha_cuota_2" :disabled="!editable" type="date" :min="hoy" class="mt-1 w-full" />
                  <p class="mt-1 text-xs" :class="proveedor.fecha_cuota_2 ? 'text-highlighted' : 'text-muted'">{{ textoFecha(proveedor.fecha_cuota_2) }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span class="text-xs text-muted">Atajo:</span>
                    <UButton v-for="dias in [15, 20, 30]" :key="dias" type="button" size="xs" color="neutral" variant="outline" :disabled="!editable" @click="() => { proveedor.fecha_cuota_2 = sumarDias(dias) }">En {{ dias }} días</UButton>
                  </div>
                </div>
              </UCard>
            </div>
            <p class="mt-3 text-sm" :class="partes(proveedor).ok ? 'font-semibold text-success' : 'text-muted'">{{ partes(proveedor).total }}</p>
            <p v-if="textoCombo(proveedor)" class="mt-1 text-sm text-muted">{{ textoCombo(proveedor)?.res }} <UBadge color="neutral" variant="soft" size="sm">{{ textoCombo(proveedor)?.com }}</UBadge></p>
          </UCard>

          <div class="mt-4">
            <p class="text-sm font-semibold">Comisiones a aplicar sobre este proveedor</p>
            <div class="mt-2 flex flex-col gap-2">
              <UCheckbox v-model="proveedor.comision_bancaria" :disabled="!editable"><template #label>Comisión bancaria / plataforma <span class="text-[11px] font-normal text-muted">(tarifa fija configurada)</span></template></UCheckbox>
              <UCheckbox v-model="proveedor.comision_administrativa" :disabled="!editable"><template #label>Comisión administrativa <span class="text-[11px] font-normal text-muted">(tarifa fija configurada)</span></template></UCheckbox>
            </div>
          </div>

          <div class="mt-4 border-t border-default pt-4">
            <p class="text-sm font-medium">Proforma de la carga <UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></p>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <label class="inline-flex" :class="editable ? 'cursor-pointer' : 'pointer-events-none opacity-60'">
                <UButton as="span" color="neutral" variant="outline" size="sm">Seleccionar archivo</UButton>
                <input type="file" class="sr-only" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" :disabled="!editable" @change="elegirProforma(indice, $event)" />
              </label>
              <span class="text-xs text-muted">{{ nombreProforma(proveedor, indice) }}</span>
              <a v-if="proveedor.proforma_url && !proformasPendientes[indice]" :href="proveedor.proforma_url" target="_blank" class="text-sm font-semibold text-primary">Ver</a>
              <UButton
                v-if="editable && (proformasPendientes[indice] || proveedor.proforma_nombre)"
                type="button"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-x"
                @click="quitarProforma(indice)"
              />
            </div>
            <p class="mt-1 text-xs text-muted">PDF, JPG, PNG, Word o Excel.</p>
          </div>
        </UCard>

        <UButton v-if="editable && puedeAgregarProveedor" type="button" color="primary" variant="outline" class="mt-4 w-full justify-center border-2 border-dashed border-primary-500" icon="i-lucide-plus" @click="agregar">Agregar proveedor</UButton>
      </UCard>

      <UCard v-if="mostrarResumen">
        <h2 class="font-semibold">Resumen de pago por proveedor</h2>
        <p class="mt-1 text-sm text-muted">Se genera automáticamente al completar los datos y marcar las comisiones a aplicar.</p>

        <div v-if="hayYuanes" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <p>
              USD — Consultar con el Banco de China
              <a href="https://www.bankofchina.com/sourcedb/whpj/enindex_1619.html" target="_blank" rel="noopener" class="font-semibold text-blue-600 dark:text-blue-400">Ver tipo de cambio ↗</a>
            </p>
            <div class="flex items-center gap-2">
              <label for="tipo-cambio-resumen">1 USD =</label>
              <UInput id="tipo-cambio-resumen" v-model.number="tipoCambio" :disabled="!editable" type="number" min="0" step="0.01" placeholder="6.70" class="w-24" @update:model-value="alCambiarTc" />
              <span>RMB (CNY)</span>
            </div>
            <UButton
              v-if="pideConfirmacionTc && !tcConfirmadoSesion"
              type="button"
              color="primary"
              size="sm"
              class="ml-auto"
              :disabled="!(Number(tipoCambio) > 0)"
              @click="confirmarTc"
            >
              ✓ Confirmar tipo de cambio
            </UButton>
          </div>
          <div v-if="pideConfirmacionTc" class="mt-3 rounded-lg border px-3 py-2 text-sm" :class="tcConfirmadoSesion ? 'border-success/40 bg-success/10 text-success' : 'border-warning/40 bg-warning/10 text-warning'">
            <p class="text-xs text-muted">
              Tipo de cambio de la cotización{{ fechaTcCotizacion ? ` (${fechaTcCotizacion})` : '' }}:
              1 USD = {{ cotizacion.tipo_cambio || '—' }} RMB
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <p v-if="tcConfirmadoSesion" class="font-semibold">✓ Tipo de cambio confirmado</p>

            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-default pb-2">
          <h3 class="flex items-center gap-2 font-bold uppercase tracking-wide">
            <UIcon name="i-lucide-package" class="size-5" />
            Detalle por proveedor
          </h3>
          <p class="flex items-center gap-1.5 text-xs text-muted"><span class="inline-block size-2.5 rounded-sm bg-orange-500" />Los importes en naranja suman el total a pagar ahora.</p>
        </div>

        <div class="mt-3 space-y-3">
          <div v-for="(proveedor, indice) in proveedoresConValor" :key="`resumen-${proveedor.id || indice}`" class="rounded-xl border border-default p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-3">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-inverted text-sm font-bold text-inverted">{{ indice + 1 }}</span>
                <div class="min-w-0">
                  <p class="font-bold">Proveedor {{ indice + 1 }}: {{ proveedor.code_supplier || 'Sin código' }}</p>
                  <p class="text-xs text-muted">{{ [proveedor.nombre_proveedor, proveedor.producto, etiquetaPago(proveedor), etiquetaModalidad(proveedor)].filter(Boolean).join(' · ') }}</p>
                </div>
              </div>
              <div v-if="calculoVista(proveedor)" class="ml-auto rounded-lg border border-default bg-elevated px-4 py-2 text-right">
                <p class="text-xs text-muted">{{ calculoVista(proveedor)!.cuotas.length > 1 ? 'Total del proveedor (2 cuotas)' : 'Total del proveedor' }}</p>
                <p class="text-xl font-bold">${{ dinero(calculoVista(proveedor)!.total) }}</p>
              </div>
            </div>

            <p v-if="calculoVista(proveedor) && (proveedor.moneda === 'RMB' || calculoVista(proveedor)!.cuotas.length > 1)" class="mt-3 text-xs">
              <span class="mr-2 text-muted">Valor de carga total:</span>
              <span class="font-semibold">{{ etiquetaValorCarga(proveedor, calculoVista(proveedor)!.valor_carga_usd) }}</span>
            </p>

            <div v-if="(calculoVista(proveedor)?.cuotas.length || 0) > 1" class="mt-3 grid gap-4 md:grid-cols-2">
              <div v-for="cuota in calculoVista(proveedor)!.cuotas" :key="cuota.numero" class="text-sm" :class="{ 'md:border-l md:border-default md:pl-4': cuota.numero === 2 }">
                <p class="flex flex-wrap items-center gap-2 font-bold">
                  Cobro {{ cuota.numero }} ({{ cuota.porcentaje }}%)
                  <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="cuota.numero === 1 ? 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400' : 'bg-elevated text-muted'">
                    {{ cuota.numero === 1 ? 'Ahora' : (proveedor.fecha_cuota_2 ? `Fecha aprox. ${fechaCorta(proveedor.fecha_cuota_2)}` : 'Fecha por definir') }}
                  </span>
                </p>
                <div class="mt-2 divide-y divide-default">
                  <p class="flex justify-between gap-3 py-1.5"><span>Valor de carga</span><span class="text-right">${{ dinero(cuota.carga) }}</span></p>
                  <p v-if="proveedor.comision_bancaria" class="flex justify-between gap-3 py-1.5">
                    <span>Comisión bancaria / plataforma</span>
                    <span v-if="calculoVista(proveedor)!.etiqueta_bancaria && !cuota.bancaria" class="text-right italic text-muted">{{ calculoVista(proveedor)!.etiqueta_bancaria }}</span>
                    <span v-else class="text-right">${{ dinero(cuota.bancaria) }}</span>
                  </p>
                  <p v-if="proveedor.comision_administrativa" class="flex justify-between gap-3 py-1.5"><span>Comisión administrativa</span><span class="text-right">${{ dinero(cuota.administrativa) }}</span></p>
                </div>
                <p class="mt-2 flex items-center justify-between gap-3 rounded-lg px-3.5 py-3 font-bold" :class="cuota.numero === 1 ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' : 'bg-elevated'">
                  <span>Total cobro {{ cuota.numero }}</span>
                  <span class="text-base">${{ dinero(cuota.total) }}</span>
                </p>
              </div>
            </div>
            <div v-else-if="calculoVista(proveedor)" class="mt-3 text-sm">
              <p class="flex items-center gap-2 font-bold">
                Cobro único
                <span class="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950 dark:text-orange-400">Ahora</span>
              </p>
              <div class="mt-2 divide-y divide-default">
                <p class="flex justify-between gap-3 py-1.5"><span>Valor de carga</span><span class="text-right">${{ dinero(calculoVista(proveedor)!.valor_carga_usd) }}</span></p>
                <p v-if="proveedor.comision_bancaria" class="flex justify-between gap-3 py-1.5">
                  <span>Comisión bancaria / plataforma</span>
                  <span v-if="calculoVista(proveedor)!.etiqueta_bancaria" class="text-right italic text-muted">{{ calculoVista(proveedor)!.etiqueta_bancaria }}</span>
                  <span v-else class="text-right">${{ dinero(calculoVista(proveedor)!.bancaria) }}</span>
                </p>
                <p v-if="proveedor.comision_administrativa" class="flex justify-between gap-3 py-1.5"><span>Comisión administrativa</span><span class="text-right">${{ dinero(calculoVista(proveedor)!.administrativa) }}</span></p>
              </div>
              <p class="mt-2 flex items-center justify-between gap-3 rounded-lg bg-orange-50 px-3.5 py-3 font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <span>Total a pagar ahora</span>
                <span class="text-lg">${{ dinero(calculoVista(proveedor)!.total_ahora) }}</span>
              </p>
            </div>
            <p v-if="notaResumen(proveedor)" class="mt-3 rounded-lg border border-dashed border-default bg-elevated px-3 py-2 text-xs text-muted">{{ notaResumen(proveedor) }}</p>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3 rounded-lg bg-orange-500 px-4 py-3.5 text-white">
          <span class="text-sm">Total a pagar ahora</span>
          <span class="text-xl font-bold">${{ dinero(totalAhoraVista) }}</span>
        </div>
        <p v-if="totalCotizacionVista !== totalAhoraVista" class="mt-2 text-right text-sm text-muted">Total de la cotización con la cuota 2: ${{ dinero(totalCotizacionVista) }}</p>

        <div class="mt-3 flex flex-col gap-2 sm:flex-row">
          <UButton type="button" color="neutral" variant="outline" size="lg" icon="i-mdi-whatsapp" class="flex-1 justify-center" :ui="{ leadingIcon: 'text-green-500' }" :loading="enviando" :disabled="!editable && !cotizacion.puede_enviar" @click="prepararWhatsapp">Enviar resumen al cliente (WhatsApp)</UButton>
          <UButton type="button" color="neutral" variant="outline" size="lg" icon="i-lucide-file-text" class="justify-center" :loading="generandoPdf" :disabled="!editable && !(cotizacion.puede_descargar_pdf || cotizacion.puede_enviar)" @click="descargarPdf">Descargar PDF</UButton>
        </div>

      </UCard>

      <div v-if="editable" class="flex flex-col gap-2 sm:flex-row">
        <UButton type="submit" color="neutral" variant="outline" size="lg" class="flex-1 justify-center" :loading="guardando" :disabled="!puedeGuardarCotizacion">{{ etiquetaGuardarCotizacion }}</UButton>
        <UButton v-if="cotizacion.puede_renovar" type="button" color="warning" variant="soft" size="lg" class="flex-1 justify-center" @click="renovar">Renovar cotización</UButton>
        <UButton
          v-if="!cotizacion.puede_renovar"
          type="button"
          color="primary"
          size="lg"
          class="flex-1 justify-center"
          :loading="creandoSolicitud"
          :disabled="!!faltantesSolicitud.length || !puedeGuardarCotizacion"
          @click="crearSolicitud"
        >
          {{ etiquetaCrearSolicitud }}
        </UButton>
      </div>
      <p v-if="editable && motivoAccion" class="text-sm text-error">{{ motivoAccion }}</p>
      <p v-if="editable && esNueva" class="text-sm text-muted"><strong>Toda solicitud nace de una cotización.</strong> Usa Guardar cotización si el cliente solo quiere saber el costo. Si ya confirmó, Guardar y crear solicitud registra la cotización y crea la solicitud en un solo paso.</p>
      <p v-else-if="editable && cotizacion.puede_renovar" class="text-sm text-muted"><strong>Renovar la cotización:</strong> confirma el tipo de cambio de hoy y guárdala. La vigencia vuelve a empezar y tendrás que reenviarla al cliente.</p>
      <p v-if="editable && faltantesSolicitud.length" class="text-sm text-error">{{ esNueva ? 'Para guardar y crear la solicitud falta' : 'Para crear la solicitud falta' }}: {{ faltantesSolicitud.map(falta => falta.replace(/\.$/, '').replace(/: falta (la |el )?/, ': ')).join(' · ') }}.</p>
    </form>

    <SupplierPaymentWindow
      :open="!!guardadaResumen"
      title="Cotización guardada"
      :subtitle="guardadaResumen ? `${guardadaResumen.cliente} · Consolidado ${guardadaResumen.consolidado}` : ''"
      :code="guardadaResumen?.codigo"
      @close="irAlListado"
    >
      <div v-if="guardadaResumen" class="divide-y divide-default overflow-hidden rounded-xl border border-default text-sm">
        <div class="flex justify-between gap-4 px-4 py-3"><span class="text-muted">Proveedores</span><strong>{{ guardadaResumen.proveedores }}</strong></div>
        <div class="flex justify-between gap-4 px-4 py-3"><span class="text-muted">Vigente hasta</span><strong>{{ guardadaResumen.vigencia }}</strong></div>
        <div class="flex justify-between gap-4 bg-primary-50 px-4 py-3"><span class="text-muted">Total a pagar</span><strong class="text-lg text-primary-700">${{ dinero(guardadaResumen.total) }}</strong></div>
      </div>
      <template #footer>
        <UButton type="button" color="primary" @click="irAlListado">Ir al listado</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="!!vistaPrevia"
      title="Enviar resumen al cliente"
      :subtitle="vistaPrevia?.destinatario ? `Destino: ${vistaPrevia.destinatario}` : 'Vista previa del mensaje'"
      @close="vistaPrevia = null"
    >
      <UCard variant="subtle">
        <pre class="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm text-highlighted">{{ vistaPrevia?.texto }}</pre>
      </UCard>
      <p v-if="vistaPrevia?.nota" class="text-sm text-muted">{{ vistaPrevia.nota }}</p>
      <template #footer>
        <UButton type="button" color="neutral" variant="outline" @click="vistaPrevia = null">Cerrar</UButton>
        <UButton type="button" color="neutral" variant="outline" icon="i-lucide-file-text" :loading="generandoPdf" @click="descargarPdf">Descargar PDF</UButton>
        <UButton type="button" color="success" icon="i-lucide-send" :loading="enviandoReal" :disabled="!vistaPrevia?.puede_enviar" @click="enviarWhatsapp">Enviar por WhatsApp</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { PagoProveedorBusquedaCc, PagoProveedorCalculoLinea, PagoProveedorCotizacion, PagoProveedorDocumentoEmitido, PagoProveedorProveedor } from '~/types/pago-proveedor'
import PageHeader from '~/components/PageHeader.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { useSupplierPaymentQuotes } from '~/composables/pago-proveedor/useSupplierPaymentQuotes'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'

const props = defineProps<{ quoteId?: number; codigoCc?: string }>()
const { showSuccess, showError, showWarning } = useModal()
const { withSpinner } = useSpinner()
const {
  getConfig: fetchConfig,
  get: fetchQuote,
  findByCc: fetchByCode,
  create: createQuote,
  save: saveQuote,
  previewWhatsapp: previewWhatsappMessage,
  previewDraft: previewDraftSummary,
  sendDraft: sendDraftMessage,
  downloadPdf: downloadQuotePdf,
  downloadDraft: downloadDraftPdf,
  renew: renewQuote,
  createRequest: createRequestFromQuote
} = useSupplierPaymentQuotes()
const cargando = ref(true)
const guardando = ref(false)
const generandoPdf = ref(false)
const enviando = ref(false)
const enviandoReal = ref(false)
const creandoSolicitud = ref(false)
const proformasPendientes = ref<Record<number, File>>({})
const tarifa = ref({
  medio: 3000,
  alto: 9000,
  usd: [100, 120, 150],
  rmb: [50, 90, 120],
  admin: 30
})
const cotizacion = ref<PagoProveedorCotizacion | null>(null)
const proveedores = ref<PagoProveedorProveedor[]>([])
const tipoCambio = ref<number | null>(null)
const tcConfirmadoSesion = ref(false)
const valoresNativos = ref<Record<number, number>>({})
const guardadaResumen = ref<{ codigo: string; cliente: string; consolidado: string; proveedores: string; vigencia: string; total: number } | null>(null)
async function irAlListado() {
  guardadaResumen.value = null
  await navigateTo('/pago-proveedor/cotizaciones', { replace: esNueva.value })
}
const vistaPrevia = ref<{ texto: string; nota: string; destinatario?: string | null; puede_enviar?: boolean } | null>(null)
const esNueva = computed(() => !props.quoteId)
// La vista previa deja de valer si cambian los datos del formulario.
watch([proveedores, tipoCambio], () => { vistaPrevia.value = null }, { deep: true })

const fraccionOtro = ref<Record<number, boolean>>({})
const monedas = [
  { label: 'RMB — Yuan chino', value: 'RMB' },
  { label: 'USD — Dólar americano', value: 'USD' }
]
const opcionesAbono = [
  { label: 'Total (1 abono)', value: 'total' },
  { label: 'Fraccionado (máx. 2 abonos)', value: 'fraccionado' }
]
const opcionesPago = [
  { label: 'Total (1 pago)', value: 'total' },
  { label: 'Fraccionado (máx. 2 pagos)', value: 'fraccionado' }
]
const presets = [
  { a: 50, b: 50, label: '50% – 50%' },
  { a: 30, b: 70, label: '30% – 70%' },
  { a: 40, b: 60, label: '40% – 60%' }
]

const editable = computed(() => !!cotizacion.value?.puede_editar)
/** PDF ya emitido: se reutiliza mientras el paso y los datos no cambien. */
const documentoPdf = computed(() => cotizacion.value?.documento ?? null)
const fechaDocumento = (valor: string) => new Date(valor).toLocaleString('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
const titulo = computed(() => {
  if (cargando.value && props.quoteId) return 'Cotización'
  if (!cotizacion.value?.id) return 'Nueva cotización'
  return cotizacion.value.codigo || 'Nueva cotización'
})
const subtitulo = computed(() => {
  if (!cotizacion.value) return 'Pago a proveedor'
  const cliente = cotizacion.value.cliente_nombre || 'sin identificar'
  const codigo = cotizacion.value.codigo ? ` · ${cotizacion.value.codigo}` : ''
  return `Cliente: ${cliente}${codigo} · ${cotizacion.value.cod_cotizacion_cc}. El N.° de orden y el código se generan al crear la solicitud y registrar el comprobante.`
})
const hoy = computed(() => new Date().toISOString().slice(0, 10))
const mostrarResumen = computed(() => proveedores.value.some((proveedor, indice) => {
  if (!proveedor.moneda) return false
  return Number(proveedor.valor_carga_usd) > 0 || Number(valoresNativos.value[indice]) > 0
}))
const hayYuanes = computed(() => proveedores.value.some((proveedor, indice) => {
  if (proveedor.moneda !== 'RMB') return false
  return Number(proveedor.valor_carga_usd) > 0 || Number(valoresNativos.value[indice]) > 0
}))
const proveedoresConValor = computed(() => proveedores.value.filter((proveedor, indice) => {
  if (!proveedor.moneda) return false
  return Number(proveedor.valor_carga_usd) > 0 || Number(valoresNativos.value[indice]) > 0
}))
const etiquetaGuardarCotizacion = computed(() => cotizacion.value?.puede_renovar ? 'Renovar cotización' : 'Guardar cotización')
const etiquetaCrearSolicitud = computed(() => esNueva.value ? 'Guardar y crear solicitud' : 'Crear solicitud')
const pideConfirmacionTc = computed(() => !esNueva.value && editable.value && hayYuanes.value && cotizacion.value?.estado === 'pendiente' && !cotizacion.value?.puede_renovar)
const fechaTcCotizacion = computed(() => {
  const fin = cotizacion.value?.creado_en
  if (!fin) return ''
  return new Date(fin).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
})
const puedeAgregarProveedor = computed(() => (cotizacion.value?.codigos_disponibles?.length || 0) > proveedores.value.length)
const faltantesProforma = computed(() => proveedores.value
  .map((proveedor, indice) => (proformasPendientes.value[indice] || proveedor.proforma_nombre || proveedor.proforma_url) ? null : `Proveedor ${indice + 1}: proforma de la carga`)
  .filter((falta): falta is string => !!falta))
const faltantesSolicitud = computed(() => {
  // El aviso del servidor sobre el tipo de cambio lo cubre el botón Confirmar de esta pantalla.
  const base = (cotizacion.value?.faltantes || []).filter(falta => !(pideConfirmacionTc.value && falta === 'Confirma el tipo de cambio.'))
  if (pideConfirmacionTc.value && !tcConfirmadoSesion.value) {
    base.push('confirmar el tipo de cambio del día')
  }
  for (const falta of faltantesProforma.value) {
    if (!base.some(item => /proforma/i.test(item) && item.includes(falta.split(':')[0]!))) base.push(falta)
  }
  return base
})
const puedeGuardarCotizacion = computed(() => {
  if (!proveedores.value.length) return false
  return proveedores.value.every((proveedor) => {
    if (!proveedor.moneda || !textoCodigo(proveedor.code_supplier)) return false
    const nativo = Number(valoresNativos.value[proveedores.value.indexOf(proveedor)] ?? 0)
    if (!(nativo > 0 || Number(proveedor.valor_carga_usd) > 0)) return false
    if (proveedor.moneda === 'RMB' && !(Number(tipoCambio.value) > 0)) return false
    return true
  })
})
const motivoAccion = computed(() => {
  if (!editable.value) return ''
  if (!puedeGuardarCotizacion.value) {
    const sinCodigo = proveedores.value.some((p) => !textoCodigo(p.code_supplier))
    if (sinCodigo) return 'Falta: código de proveedor en al menos una fila.'
    const sinValor = proveedores.value.some((p, i) => !(Number(valoresNativos.value[i]) > 0 || Number(p.valor_carga_usd) > 0))
    if (sinValor) return 'Falta: valor de carga mayor a 0.'
    if (hayYuanes.value && !(Number(tipoCambio.value) > 0)) return 'Falta: tipo de cambio del día (1 USD = RMB).'
    return 'Completa los datos del proveedor para guardar.'
  }
  return ''
})
function soloConsolidado(valor: string | null | undefined) {
  return String(valor || '').split(/\s*[-–]\s*/)[0]?.trim() || '—'
}

const dinero = (valor: number) => Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const redondear = (valor: number) => Math.round((Number(valor) + Number.EPSILON) * 100) / 100

function valorNativo(indice: number) {
  const guardado = valoresNativos.value[indice]
  if (guardado !== undefined && guardado !== null) return guardado
  const proveedor = proveedores.value[indice]
  if (!proveedor) return ''
  if (proveedor.moneda === 'RMB') {
    const tc = Number(tipoCambio.value) || 0
    if (!(tc > 0)) return ''
    return redondear(Number(proveedor.valor_carga_usd || 0) * tc)
  }
  return Number(proveedor.valor_carga_usd || 0)
}

function sincronizarUsdDesdeNativo(indice: number) {
  const proveedor = proveedores.value[indice]
  if (!proveedor) return
  const nativo = Number(valoresNativos.value[indice] || 0)
  if (proveedor.moneda === 'RMB') {
    const tc = Number(tipoCambio.value) || 0
    if (!(tc > 0)) return
    proveedor.valor_carga_usd = nativo > 0 ? redondear(nativo / tc) : 0
  } else {
    proveedor.valor_carga_usd = redondear(nativo)
  }
}

function alValorNativo(indice: number, raw: string | number) {
  valoresNativos.value = { ...valoresNativos.value, [indice]: Number(raw) || 0 }
  sincronizarUsdDesdeNativo(indice)
}

function etiquetaValorCarga(proveedor: PagoProveedorProveedor, cargaUsd: number) {
  if (proveedor.moneda !== 'RMB') return `$${dinero(cargaUsd)}`
  const tc = Number(tipoCambio.value) || 0
  const indice = proveedores.value.indexOf(proveedor)
  const yuan = Number(valoresNativos.value[indice] ?? (tc > 0 ? Number(proveedor.valor_carga_usd || 0) * tc : 0))
  if (!(tc > 0) || !(yuan > 0)) return `$${dinero(cargaUsd)}`
  return `¥${dinero(yuan)} ÷ ${tc} = $${dinero(cargaUsd)}`
}

function bancariaTarifa(moneda: string, monto: number) {
  if (monto <= 0) return 0
  const tramos = moneda === 'USD' ? tarifa.value.usd : tarifa.value.rmb
  if (monto > tarifa.value.alto) return Number(tramos[2] || 0)
  if (monto >= tarifa.value.medio) return Number(tramos[1] || 0)
  return Number(tramos[0] || 0)
}

function calculoLocal(proveedor: PagoProveedorProveedor): PagoProveedorCalculoLinea | null {
  const valor = redondear(Number(proveedor.valor_carga_usd) || 0)
  if (valor <= 0) return null
  const moneda = proveedor.moneda === 'USD' ? 'USD' : 'RMB'
  const abono = proveedor.modalidad_abono === 'fraccionado' ? 'fraccionado' : 'total'
  const pago = moneda === 'USD'
    ? abono
    : (proveedor.modalidad_pago === 'fraccionado' ? 'fraccionado' : 'total')
  const pct1 = abono === 'fraccionado' || pago === 'fraccionado'
    ? Math.min(99, Math.max(1, Number(proveedor.porcentaje_1) || 50))
    : 100
  const pct2 = 100 - pct1
  const cuotasN = abono === 'fraccionado' ? 2 : 1
  const bancariaPorCuota = abono === 'fraccionado' && pago === 'fraccionado'
  const adminDoble = moneda === 'RMB' && abono === 'total' && pago === 'fraccionado' && proveedor.comision_administrativa
  const cuotas = Array.from({ length: cuotasN }, (_, index) => {
    const porcentaje = cuotasN === 1 ? 100 : (index === 0 ? pct1 : pct2)
    const carga = cuotasN === 1 ? valor : redondear(valor * porcentaje / 100)
    return { numero: index + 1, porcentaje, carga, bancaria: 0, administrativa: 0, total: carga }
  })
  let bancaria = 0
  if (proveedor.comision_bancaria) {
    if (bancariaPorCuota) {
      cuotas.forEach((cuota, index) => {
        cuotas[index].bancaria = bancariaTarifa(moneda, cuota.carga)
        bancaria += cuotas[index].bancaria
      })
    } else {
      bancaria = bancariaTarifa(moneda, valor)
      cuotas[0].bancaria = bancaria
    }
  }
  let administrativa = 0
  if (proveedor.comision_administrativa) {
    if (adminDoble) {
      administrativa = redondear(tarifa.value.admin * 2)
      cuotas[0].administrativa = administrativa
    } else if (bancariaPorCuota) {
      cuotas.forEach((cuota, index) => {
        cuotas[index].administrativa = tarifa.value.admin
        administrativa += tarifa.value.admin
      })
    } else {
      administrativa = tarifa.value.admin
      cuotas[0].administrativa = administrativa
    }
  }
  cuotas.forEach((cuota, index) => {
    cuotas[index].bancaria = redondear(cuota.bancaria)
    cuotas[index].administrativa = redondear(cuota.administrativa)
    cuotas[index].total = redondear(cuota.carga + cuotas[index].bancaria + cuotas[index].administrativa)
  })
  const pagosN = pago === 'fraccionado' ? 2 : 1
  const pagos_proveedor = Array.from({ length: pagosN }, (_, index) => {
    const porcentaje = pagosN === 1 ? 100 : (index === 0 ? pct1 : pct2)
    return {
      numero: index + 1,
      porcentaje,
      carga: pagosN === 1 ? valor : redondear(valor * porcentaje / 100)
    }
  })
  const total = redondear(cuotas.reduce((suma, cuota) => suma + cuota.total, 0))
  return {
    orden: proveedor.orden,
    moneda,
    modalidad_abono: abono,
    modalidad_pago: pago,
    valor_carga_usd: valor,
    bancaria: redondear(bancaria),
    administrativa: redondear(administrativa),
    total,
    total_ahora: cuotas[0].total,
    etiqueta_bancaria: null,
    comision_bancaria: !!proveedor.comision_bancaria,
    bancaria_por_cuota: bancariaPorCuota,
    cuotas,
    pagos_proveedor
  }
}

function agruparBancariaRmb(lineas: PagoProveedorCalculoLinea[]) {
  const indices = lineas
    .map((linea, index) => (linea.moneda === 'RMB' && linea.comision_bancaria && linea.valor_carga_usd > 0 ? index : -1))
    .filter((index) => index >= 0)
  if (indices.length < 2) return lineas
  const modo = !!lineas[indices[0]].bancaria_por_cuota
  if (indices.some((index) => !!lineas[index].bancaria_por_cuota !== modo)) return lineas
  const carrier = indices[0]
  const ordenCarrier = lineas[carrier].orden
  if (modo) {
    const nCuotas = lineas[carrier].cuotas.length
    for (let cuota = 0; cuota < nCuotas; cuota += 1) {
      const base = indices.reduce((suma, index) => suma + Number(lineas[index].cuotas[cuota]?.carga || 0), 0)
      const fee = bancariaTarifa('RMB', base)
      indices.forEach((index) => {
        lineas[index].cuotas[cuota].bancaria = index === carrier ? redondear(fee) : 0
        const actual = lineas[index].cuotas[cuota]
        actual.total = redondear(actual.carga + actual.bancaria + actual.administrativa)
      })
    }
  } else {
    const base = indices.reduce((suma, index) => suma + Number(lineas[index].valor_carga_usd || 0), 0)
    const fee = bancariaTarifa('RMB', base)
    indices.forEach((index) => {
      lineas[index].cuotas[0].bancaria = index === carrier ? redondear(fee) : 0
      if (lineas[index].cuotas[1]) lineas[index].cuotas[1].bancaria = 0
      lineas[index].cuotas.forEach((cuota) => {
        cuota.total = redondear(cuota.carga + cuota.bancaria + cuota.administrativa)
      })
    })
  }
  indices.forEach((index) => {
    const bancaria = lineas[index].cuotas.reduce((suma, cuota) => suma + cuota.bancaria, 0)
    const total = lineas[index].cuotas.reduce((suma, cuota) => suma + cuota.total, 0)
    lineas[index].bancaria = redondear(bancaria)
    lineas[index].total = redondear(total)
    lineas[index].total_ahora = redondear(lineas[index].cuotas[0].total)
    lineas[index].etiqueta_bancaria = index === carrier ? null : `Incluida en el Proveedor ${ordenCarrier}`
  })
  return lineas
}

const calculosVista = computed(() => agruparBancariaRmb(
  proveedores.value
    .map((proveedor) => calculoLocal(proveedor))
    .filter((linea): linea is PagoProveedorCalculoLinea => !!linea)
))

function calculoVista(proveedor: PagoProveedorProveedor) {
  if (editable.value || !proveedor.calculo) {
    return calculosVista.value.find((linea) => linea.orden === proveedor.orden) || calculoLocal(proveedor)
  }
  return proveedor.calculo
}

const totalAhoraVista = computed(() => redondear(
  proveedoresConValor.value.reduce((suma, proveedor) => suma + (calculoVista(proveedor)?.total_ahora || 0), 0)
))
const totalCotizacionVista = computed(() => redondear(
  proveedoresConValor.value.reduce((suma, proveedor) => suma + (calculoVista(proveedor)?.total || 0), 0)
))

function fraccionado(proveedor: PagoProveedorProveedor) {
  return proveedor.modalidad_abono === 'fraccionado' || (proveedor.moneda === 'RMB' && proveedor.modalidad_pago === 'fraccionado')
}

function textoCodigo(valor: unknown): string {
  if (typeof valor === 'string' || typeof valor === 'number') return String(valor).trim()
  if (valor && typeof valor === 'object' && 'value' in valor) {
    return textoCodigo((valor as { value: unknown }).value)
  }
  return ''
}

function opcionesCodigo(actual: string | null) {
  const actualCodigo = textoCodigo(actual)
  const usados = new Set(proveedores.value.map(item => textoCodigo(item.code_supplier)).filter(Boolean))
  return (cotizacion.value?.codigos_disponibles || [])
    .filter(codigo => codigo.code_supplier === actualCodigo || !usados.has(codigo.code_supplier))
    .map(codigo => ({
      label: codigo.code_supplier,
      value: codigo.code_supplier,
      producto: codigo.producto || '',
      nombre: codigo.nombre || ''
    }))
}

function opcionesTipoPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') {
    return [
      { label: 'USD / T-T', value: 'tt' },
      { label: 'USD / Tarjeta · Próximamente', value: 'tarjeta', disabled: true }
    ]
  }
  return [{ label: 'RMB / Transferencia', value: 'transferencia' }]
}

function combo(proveedor: PagoProveedorProveedor) {
  const pagoFraccionado = proveedor.modalidad_pago === 'fraccionado'
  const abonoFraccionado = proveedor.modalidad_abono === 'fraccionado'
  if (pagoFraccionado && abonoFraccionado) return 'b'
  if (pagoFraccionado) return 'a'
  if (abonoFraccionado) return 'c'
  return 't'
}

function textoCombo(proveedor: PagoProveedorProveedor) {
  const tipo = combo(proveedor)
  if (tipo === 'a') return { cap1: '1.er pago al proveedor', cap2: '2.º pago al proveedor', res: 'El cliente realiza un solo abono y Pro Business paga al proveedor en 2 partes.', com: 'Bancaria: 1 vez · Administrativa: 2 veces', fecha: '' }
  if (tipo === 'b') return { cap1: 'Cuota 1', cap2: 'Cuota 2', res: 'El cliente realiza 2 abonos (cuotas) y cada cuota se paga al proveedor.', com: 'Comisiones: en cada cuota.', fecha: 'Fecha en que el cliente se compromete a pagar la 2.ª cuota' }
  if (tipo === 'c') return { cap1: '1.er abono', cap2: '2.º abono', res: 'El cliente realiza 2 abonos y Pro Business paga al proveedor una sola vez, cuando el cliente haya abonado el total.', com: 'Comisiones: una sola vez.', fecha: 'Fecha en que el cliente se compromete a hacer el 2.º abono' }
  return null
}

function notaAbono(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'RMB' && proveedor.modalidad_abono !== 'fraccionado') return 'Si el cliente envía 2 vouchers que sumen el total, se cuenta como un solo abono: la comisión se cobra una sola vez.'
  return ''
}

function notaPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') return 'Bloqueado en dólares: sigue la modalidad de abono del cliente.'
  if (proveedor.moneda === 'RMB' && proveedor.modalidad_pago !== 'fraccionado' && proveedor.modalidad_abono === 'fraccionado') return 'Con pago total, el proveedor solo se paga cuando el cliente haya abonado el total.'
  return ''
}

function partes(proveedor: PagoProveedorProveedor) {
  const indice = proveedores.value.indexOf(proveedor)
  const valor = Number(valoresNativos.value[indice] ?? (proveedor.moneda === 'RMB' ? 0 : proveedor.valor_carga_usd)) || 0
  const primero = Number(proveedor.porcentaje_1) || 0
  const segundo = Number(proveedor.porcentaje_2 ?? (100 - primero)) || 0
  const simbolo = proveedor.moneda === 'RMB' ? '¥' : '$'
  const ok = primero > 0 && segundo > 0 && Math.abs(primero + segundo - 100) < 0.05 && valor > 0 && !!proveedor.moneda
  const monto1 = Math.round(valor * primero) / 100
  const monto2 = +(valor - monto1).toFixed(2)
  const monto = (numero: number) => `${simbolo}${dinero(numero)}`
  if (!ok) {
    return { ok: false, texto1: '—', texto2: '—', total: proveedor.moneda && valor > 0 ? 'Elige cómo se reparte el pago.' : 'Ingresa la moneda y el valor de carga para ver los montos.' }
  }
  return { ok: true, texto1: `${primero}% · ${monto(monto1)}`, texto2: `${segundo}% · ${monto(monto2)}`, total: `Total ${monto(valor)} — Correcto` }
}

function esPreset(proveedor: PagoProveedorProveedor, porcentaje: number) {
  return !fraccionOtro.value[proveedores.value.indexOf(proveedor)] && Number(proveedor.porcentaje_1) === porcentaje
}

function esOtro(proveedor: PagoProveedorProveedor, indice: number) {
  if (fraccionOtro.value[indice]) return true
  const porcentaje = Number(proveedor.porcentaje_1)
  return porcentaje > 0 && porcentaje < 100 && porcentaje !== 50 && porcentaje !== 30 && porcentaje !== 40
}

function etiquetaOtro(proveedor: PagoProveedorProveedor, indice: number) {
  if (!esOtro(proveedor, indice)) return 'Otro'
  const primero = Number(proveedor.porcentaje_1) || 0
  const segundo = Number(proveedor.porcentaje_2 ?? (100 - primero)) || 0
  if (!(primero > 0)) return 'Otro'
  return `Otro: ${primero}% – ${segundo}%`
}

function elegirPreset(proveedor: PagoProveedorProveedor, indice: number, primero: number, segundo: number) {
  fraccionOtro.value[indice] = false
  proveedor.porcentaje_1 = primero
  proveedor.porcentaje_2 = segundo
}

function activarOtro(indice: number) {
  fraccionOtro.value[indice] = true
}

function montoPrimera(proveedor: PagoProveedorProveedor) {
  const indice = proveedores.value.indexOf(proveedor)
  const valor = Number(valoresNativos.value[indice] ?? (proveedor.moneda === 'RMB' ? 0 : proveedor.valor_carga_usd)) || 0
  const porcentaje = Number(proveedor.porcentaje_1) || 0
  if (!(valor > 0) || !(porcentaje > 0) || porcentaje >= 100) return ''
  return (Math.round(valor * porcentaje) / 100).toFixed(2)
}

function alMontoOtro(proveedor: PagoProveedorProveedor, raw: string | number) {
  const indice = proveedores.value.indexOf(proveedor)
  const valor = Number(valoresNativos.value[indice] ?? (proveedor.moneda === 'RMB' ? 0 : proveedor.valor_carga_usd)) || 0
  const monto = Number(raw) || 0
  if (valor > 0 && monto > 0 && monto < valor) {
    const primero = Math.round((monto / valor) * 10000) / 100
    proveedor.porcentaje_1 = primero
    proveedor.porcentaje_2 = Math.round((100 - primero) * 100) / 100
  }
}

function sumarDias(dias: number) {
  const fecha = new Date()
  fecha.setHours(12, 0, 0, 0)
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function textoFecha(iso: string | null) {
  if (!iso) return 'Aún no hay fecha elegida.'
  const fecha = new Date(`${iso}T12:00:00`)
  const hoyFecha = new Date()
  hoyFecha.setHours(12, 0, 0, 0)
  const dias = Math.round((fecha.getTime() - hoyFecha.getTime()) / 86400000)
  const larga = fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cuando = dias === 0 ? 'hoy' : dias > 0 ? `en ${dias} día${dias > 1 ? 's' : ''}` : `hace ${-dias} día${-dias > 1 ? 's' : ''}`
  return `${larga} · ${cuando} (fecha aproximada)`
}

function fechaCorta(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

function etiquetaPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') return proveedor.tipo_pago === 'tarjeta' ? 'USD / Tarjeta' : 'USD / T-T'
  return 'RMB / Transferencia'
}

function etiquetaModalidad(proveedor: PagoProveedorProveedor) {
  const tipo = combo(proveedor)
  if (tipo === 'b') return '2 cuotas'
  if (tipo === 'a') return '2 pagos al proveedor'
  if (tipo === 'c') return '2 abonos'
  return 'Total'
}

function notaResumen(proveedor: PagoProveedorProveedor) {
  const primero = Number(proveedor.porcentaje_1) || 0
  const tipo = combo(proveedor)
  if (tipo === 'a') {
    const simbolo = proveedor.moneda === 'RMB' ? '¥' : '$'
    const valor = Number(valoresNativos.value[proveedores.value.indexOf(proveedor)]) || 0
    const parte1 = Math.round(valor * primero) / 100
    return `Pago al proveedor en 2 partes: 1.ª ${simbolo}${dinero(parte1)} · 2.ª ${simbolo}${dinero(redondear(valor - parte1))}. No afecta el cobro al cliente.`
  }
  const cuotas = calculoVista(proveedor)?.cuotas
  if (tipo === 'c' && cuotas?.length === 2) {
    const fecha = proveedor.fecha_cuota_2 ? `fecha aprox. ${fechaCorta(proveedor.fecha_cuota_2)}` : 'fecha por definir'
    return `El cliente realiza 2 abonos: 1.ª parte (${cuotas[0].porcentaje}%) $${dinero(cuotas[0].total)} · 2.ª parte (${cuotas[1].porcentaje}%) $${dinero(cuotas[1].total)} — ${fecha}.`
  }
  return ''
}

function aplicar(datos: PagoProveedorCotizacion) {
  cotizacion.value = datos
  proveedores.value = datos.proveedores.map(proveedor => ({ ...proveedor, code_supplier: textoCodigo(proveedor.code_supplier) }))
  tipoCambio.value = datos.tipo_cambio
  const nativos: Record<number, number> = {}
  proveedores.value.forEach((proveedor, indice) => {
    if (proveedor.code_supplier && !proveedor.producto) {
      alElegirCodigo(proveedor, proveedor.code_supplier)
    }
    const usd = Number(proveedor.valor_carga_usd) || 0
    const tc = Number(datos.tipo_cambio) || 0
    if (proveedor.moneda === 'RMB') {
      if (tc > 0) nativos[indice] = redondear(usd * tc)
    } else {
      nativos[indice] = usd
    }
  })
  valoresNativos.value = nativos
}

function alCambiarTc() {
  tcConfirmadoSesion.value = false
  const tc = Number(tipoCambio.value) || 0
  proveedores.value.forEach((proveedor, indice) => {
    const nativo = Number(valoresNativos.value[indice] || 0)
    if (proveedor.moneda === 'RMB' && !(nativo > 0) && tc > 0 && Number(proveedor.valor_carga_usd) > 0) {
      valoresNativos.value = { ...valoresNativos.value, [indice]: redondear(Number(proveedor.valor_carga_usd) * tc) }
      return
    }
    sincronizarUsdDesdeNativo(indice)
  })
}

async function confirmarTc() {
  if (!(Number(tipoCambio.value) > 0)) {
    showError('Tipo de cambio', 'Ingresa el tipo de cambio del día.')
    return
  }
  if (!puedeGuardarCotizacion.value) {
    showWarning('Faltan datos', motivoAccion.value)
    return
  }
  tcConfirmadoSesion.value = true
  try {
    await withSpinner(() => persistir(), 'Confirmando tipo de cambio…')
  } catch (error: any) {
    tcConfirmadoSesion.value = false
    showError('Tipo de cambio', error.message || 'No se pudo confirmar el tipo de cambio.')
  }
}

function payload() {
  const tc = Number(tipoCambio.value) || 0
  const confirmado = !hayYuanes.value
    || (esNueva.value ? tc > 0 : tcConfirmadoSesion.value)
  return {
    tipo_cambio: hayYuanes.value ? (tc > 0 ? tc : null) : tipoCambio.value,
    tipo_cambio_confirmado: confirmado,
    proveedores: proveedores.value.map((proveedor) => ({
      id: proveedor.id,
      code_supplier: proveedor.code_supplier || null,
      nombre_proveedor: proveedor.nombre_proveedor,
      producto: proveedor.producto,
      moneda: proveedor.moneda,
      tipo_pago: proveedor.moneda === 'USD' ? 'tt' : 'transferencia',
      valor_carga_usd: proveedor.valor_carga_usd || 0,
      modalidad_abono: proveedor.modalidad_abono,
      modalidad_pago: proveedor.moneda === 'USD' ? proveedor.modalidad_abono : proveedor.modalidad_pago,
      porcentaje_1: Number(proveedor.porcentaje_1 || 50),
      porcentaje_2: 100 - Number(proveedor.porcentaje_1 || 50),
      fecha_cuota_2: proveedor.fecha_cuota_2,
      comision_bancaria: proveedor.comision_bancaria,
      comision_administrativa: proveedor.comision_administrativa
    }))
  }
}

function alElegirCodigo(proveedor: PagoProveedorProveedor, elegido?: unknown) {
  const codigo = textoCodigo(elegido) || textoCodigo(proveedor.code_supplier)
  proveedor.code_supplier = codigo
  const opcion = opcionesCodigo(codigo).find(item => item.value === codigo)
  const catalogo = (cotizacion.value?.codigos_disponibles || []).find(item => item.code_supplier === codigo)
  const producto = (opcion?.producto || catalogo?.producto || '').trim()
  const nombre = (opcion?.nombre || catalogo?.nombre || '').trim()
  proveedor.producto = producto
  if (!proveedor.nombre_proveedor && nombre) {
    proveedor.nombre_proveedor = nombre
  }
}

function alCambiarMoneda(proveedor: PagoProveedorProveedor) {
  const indice = proveedores.value.indexOf(proveedor)
  const nativoActual = Number(valoresNativos.value[indice] || 0)
  const tc = Number(tipoCambio.value) || 0
  proveedor.tipo_pago = proveedor.moneda === 'USD' ? 'tt' : 'transferencia'
  if (proveedor.moneda === 'USD') {
    proveedor.modalidad_pago = proveedor.modalidad_abono
    if (nativoActual > 0 && tc > 0) {
      valoresNativos.value = { ...valoresNativos.value, [indice]: redondear(nativoActual / tc) }
    }
  } else if (nativoActual > 0 && tc > 0) {
    valoresNativos.value = { ...valoresNativos.value, [indice]: redondear(nativoActual * tc) }
  }
  sincronizarUsdDesdeNativo(indice)
}

function asegurarReparto(proveedor: PagoProveedorProveedor) {
  if (!fraccionado(proveedor)) return
  const porcentaje = Number(proveedor.porcentaje_1)
  if (porcentaje > 0 && porcentaje < 100) return
  proveedor.porcentaje_1 = 50
  proveedor.porcentaje_2 = 50
}

function alCambiarAbono(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') proveedor.modalidad_pago = proveedor.modalidad_abono
  else if (proveedor.modalidad_abono === 'fraccionado') proveedor.modalidad_pago = 'fraccionado'
  asegurarReparto(proveedor)
}

function alCambiarPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') proveedor.modalidad_pago = proveedor.modalidad_abono
  asegurarReparto(proveedor)
}

function agregar() {
  const indice = proveedores.value.length
  proveedores.value.push({
    orden: indice + 1,
    code_supplier: '',
    nombre_proveedor: '',
    producto: '',
    moneda: '' as unknown as 'RMB',
    tipo_pago: 'transferencia',
    valor_carga_usd: 0,
    modalidad_abono: 'total',
    modalidad_pago: 'total',
    porcentaje_1: 100,
    porcentaje_2: null,
    fecha_cuota_2: null,
    comision_bancaria: true,
    comision_administrativa: false
  })
  valoresNativos.value = { ...valoresNativos.value, [indice]: 0 }
}

function quitar(indice: number) {
  proveedores.value.splice(indice, 1)
  const reindex = <T,>(mapa: Record<number, T>) => {
    const siguientes: Record<number, T> = {}
    Object.entries(mapa).forEach(([clave, valor]) => {
      const actual = Number(clave)
      if (actual === indice) return
      siguientes[actual > indice ? actual - 1 : actual] = valor
    })
    return siguientes
  }
  proformasPendientes.value = reindex(proformasPendientes.value)
  valoresNativos.value = reindex(valoresNativos.value)
}

function nombreProforma(proveedor: PagoProveedorProveedor, indice: number) {
  return proformasPendientes.value[indice]?.name || proveedor.proforma_nombre || 'Sin archivos seleccionados'
}

function elegirProforma(indice: number, evento: Event) {
  const input = evento.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo || !editable.value) return
  proformasPendientes.value = { ...proformasPendientes.value, [indice]: archivo }
  const proveedor = proveedores.value[indice]
  if (proveedor) proveedor.proforma_nombre = archivo.name
  input.value = ''
}

function quitarProforma(indice: number) {
  const siguientes = { ...proformasPendientes.value }
  delete siguientes[indice]
  proformasPendientes.value = siguientes
  const proveedor = proveedores.value[indice]
  if (proveedor) {
    proveedor.proforma_nombre = null
    proveedor.proforma_url = null
  }
}

function formularioGuardado() {
  const form = new FormData()
  const campo = (clave: string, valor: unknown) => {
    if (valor === null || valor === undefined) return
    form.append(clave, typeof valor === 'boolean' ? (valor ? '1' : '0') : String(valor))
  }
  const { proveedores: filas, ...generales } = payload()
  Object.entries(generales).forEach(([clave, valor]) => campo(clave, valor))
  filas.forEach((fila, indice) => {
    Object.entries(fila).forEach(([clave, valor]) => campo(`proveedores[${indice}][${clave}]`, valor))
    const archivo = proformasPendientes.value[indice]
    if (archivo) form.append(`proveedores[${indice}][proforma]`, archivo)
  })
  return form
}

async function persistir() {
  if (!cotizacion.value) return
  const form = formularioGuardado()
  const respuesta = cotizacion.value.id
    ? await saveQuote(cotizacion.value.id, form)
    : await createQuote(cotizacion.value.cod_cotizacion_cc, form)
  proformasPendientes.value = {}
  aplicar(respuesta.data)
}

function datosResumen() {
  return {
    ...payload(),
    cotizacion_id: cotizacion.value?.id || null,
    cod_cotizacion_cc: cotizacion.value?.cod_cotizacion_cc
  }
}

async function guardar() {
  if (!cotizacion.value) return
  guardando.value = true
  try {
    await withSpinner(() => persistir(), 'Guardando…')
    const c = cotizacion.value
    guardadaResumen.value = {
      codigo: c?.codigo || 'Cotización',
      cliente: c?.cliente_nombre || '—',
      consolidado: soloConsolidado(c?.consolidado),
      proveedores: proveedores.value.map(p => p.code_supplier).filter(Boolean).join(' · ') || '—',
      vigencia: c?.vigencia_hasta || '—',
      total: Number(c?.total || 0)
    }
  } catch (error: any) {
    showError('No se pudo guardar', error.message || 'Revisa los datos.')
  } finally {
    guardando.value = false
  }
}

function bloqueoResumen() {
  if (!editable.value) return false
  const avisoTc = (titulo: string, mensaje: string) => {
    showWarning(titulo, mensaje)
    document.getElementById('tipo-cambio-resumen')?.focus()
    return true
  }
  if (hayYuanes.value && !(Number(tipoCambio.value) > 0)) {
    return avisoTc('Falta completar el tipo de cambio', 'Para generar el PDF o enviar el resumen, primero completa el tipo de cambio (1 USD = ? RMB) del Banco de China.')
  }
  if (!puedeGuardarCotizacion.value) {
    showWarning('Faltan datos', motivoAccion.value)
    return true
  }
  return false
}

async function descargarPdf() {
  if (!cotizacion.value || bloqueoResumen()) return
  generandoPdf.value = true
  try {
    const respuesta = editable.value
      ? await downloadDraftPdf(datosResumen())
      : await downloadQuotePdf(cotizacion.value.id)
    descargarBinario(respuesta.data)
    if (respuesta.data.generado) {
      showSuccess('PDF emitido', `Paso ${respuesta.data.paso}: ${respuesta.data.paso_nombre}. Se reutiliza si los datos y el paso no cambian.`)
    } else {
      showSuccess('PDF al día', `Se descargó el PDF ya emitido en el paso ${respuesta.data.paso}.`)
    }
    await refrescarDocumento()
  } catch (error: any) {
    showError('PDF', error.message || 'No se pudo generar el resumen.')
  } finally {
    generandoPdf.value = false
  }
}

function descargarBinario(documento: PagoProveedorDocumentoEmitido) {
  const binario = atob(documento.base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = documento.filename
  enlace.click()
  URL.revokeObjectURL(url)
}

/** Relee el estado del PDF sin volver a generarlo (no cuenta como descarga). */
async function refrescarDocumento() {
  const id = cotizacion.value?.id
  if (!id) return
  try {
    const respuesta = await fetchQuote(id)
    if (cotizacion.value) cotizacion.value.documento = respuesta.data.documento ?? null
  } catch {
    // Si falla, se conserva el estado que ya teníamos en pantalla.
  }
}

async function prepararWhatsapp() {
  if (!cotizacion.value || bloqueoResumen()) return
  enviando.value = true
  try {
    const respuesta = editable.value
      ? await previewDraftSummary(datosResumen())
      : await previewWhatsappMessage(cotizacion.value.id)
    vistaPrevia.value = respuesta.data
  } catch (error: any) {
    showError('WhatsApp', error.message || 'No se pudo armar el mensaje.')
  } finally {
    enviando.value = false
  }
}

async function enviarWhatsapp() {
  if (!cotizacion.value || !vistaPrevia.value?.puede_enviar) return
  enviandoReal.value = true
  try {
    const respuesta = await withSpinner(() => sendDraftMessage(datosResumen()), 'Enviando WhatsApp…')
    vistaPrevia.value = null
    showSuccess('WhatsApp enviado', respuesta.data.nota || 'Resumen enviado al cliente.')
  } catch (error: any) {
    showError('WhatsApp', error.message || 'No se pudo enviar el mensaje.')
  } finally {
    enviandoReal.value = false
  }
}

async function crearSolicitud() {
  if (!cotizacion.value) return
  if (faltantesSolicitud.value.length) {
    showError('Solicitud', faltantesSolicitud.value[0] || 'Faltan datos para crear la solicitud.')
    return
  }
  creandoSolicitud.value = true
  try {
    await withSpinner(async () => {
      await persistir()
      const respuesta = await createRequestFromQuote(cotizacion.value!.id)
      showSuccess('Solicitud creada', `N.° ${respuesta.data.numero_orden}`)
      await navigateTo(`/pago-proveedor/solicitudes/${respuesta.data.id}`)
    }, esNueva.value ? 'Guardando y creando solicitud…' : 'Creando solicitud…')
  } catch (error: any) {
    if (props.codigoCc && cotizacion.value?.id) await navigateTo(`/pago-proveedor/cotizaciones/${cotizacion.value.id}`, { replace: true })
    showError('Solicitud', error.message || 'Faltan datos para crear la solicitud.')
  } finally {
    creandoSolicitud.value = false
  }
}

async function renovar() {
  if (!cotizacion.value) return
  try {
    const respuesta = await renewQuote(cotizacion.value.id, tipoCambio.value)
    aplicar(respuesta.data)
    showSuccess('Cotización renovada', 'Confirma el tipo de cambio del día y reenvía el resumen.')
  } catch (error: any) {
    showError('Renovar', error.message || 'No se pudo renovar.')
  }
}

function armarBorrador(busqueda: PagoProveedorBusquedaCc) {
  cotizacion.value = {
    id: 0,
    codigo: '',
    estado: 'pendiente',
    cod_cotizacion_cc: busqueda.cod_cotizacion_cc,
    consolidado: busqueda.consolidado,
    cliente_nombre: busqueda.cliente.nombre,
    cliente_documento: busqueda.cliente.documento,
    cliente_whatsapp: busqueda.cliente.whatsapp,
    cliente_correo: busqueda.cliente.correo,
    tipo_cambio: null,
    tipo_cambio_confirmado: false,
    vigencia_fin: null,
    vigencia_texto: '',
    vencida: false,
    proveedores_cantidad: 0,
    total: 0,
    total_ahora: 0,
    comisiones: 0,
    puede_editar: true,
    puede_eliminar: false,
    puede_enviar: false,
    puede_descargar_pdf: false,
    puede_crear_solicitud: true,
    puede_renovar: false,
    faltantes_pdf: [],
    faltantes: [],
    codigos_disponibles: busqueda.proveedores,
    proveedores: [],
    creado_en: null,
    historial: []
  }
  proveedores.value = []
  agregar()
}

onMounted(async () => {
  try {
    try {
      const config = await fetchConfig()
      const data = config.data as Record<string, any>
      const usd = Array.isArray(data.tarifa_bancaria_usd) ? data.tarifa_bancaria_usd : [100, 120, 150]
      const rmb = Array.isArray(data.tarifa_bancaria_rmb) ? data.tarifa_bancaria_rmb : [50, 90, 120]
      tarifa.value = {
        medio: Number(data.tramo_medio || 3000),
        alto: Number(data.tramo_alto || 9000),
        usd: usd.map((n: number) => Number(n)),
        rmb: rmb.map((n: number) => Number(n)),
        admin: Number(data.comision_administrativa || 30)
      }
    } catch {
      // Tarifas por defecto del módulo.
    }
    if (props.quoteId) {
      const respuesta = await fetchQuote(props.quoteId)
      aplicar(respuesta.data)
    } else if (props.codigoCc && /^CO\d{8}$/i.test(props.codigoCc)) {
      const respuesta = await fetchByCode(props.codigoCc)
      armarBorrador(respuesta.data)
    } else {
      showError('Cotización', 'Elige una cotización de Consolidada para empezar.')
    }
  } catch (error: any) {
    showError('Cotización', error.message || 'No se pudo abrir la cotización.')
  } finally {
    cargando.value = false
  }
})
</script>

