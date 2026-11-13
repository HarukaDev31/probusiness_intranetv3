<template>
  <div class="mx-auto max-w-5xl space-y-4 p-6">
    <PageHeader :hide-back-button="false" @back="volverAlListado" />

    <div v-if="cargando" class="space-y-4">
      <USkeleton class="h-8 w-72" />
      <USkeleton class="h-36 w-full rounded-lg" />
      <div class="grid gap-3 sm:grid-cols-3">
        <USkeleton class="h-24 rounded-lg" />
        <USkeleton class="h-24 rounded-lg" />
        <USkeleton class="h-24 rounded-lg" />
      </div>
    </div>

    <template v-else-if="solicitud">
      <header class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight text-highlighted">Orden N.° {{ solicitud.numero_orden }} — {{ solicitud.cliente_nombre }}</h1>
          <UBadge v-if="solicitud.cod_cotizacion_cc" color="neutral" variant="subtle">Cotización C.C N.° {{ solicitud.cod_cotizacion_cc }}</UBadge>
        </div>

        <UCard>
          <div class="mb-4 flex items-center gap-3">
            <UAvatar icon="i-lucide-user" size="md" class="bg-primary/10" :ui="{ icon: 'text-primary' }" />
            <h2 class="text-base font-bold text-highlighted">Datos del cliente</h2>
          </div>
          <dl class="grid gap-3 sm:grid-cols-2">
            <div><dt class="text-sm text-muted">N.° de consolidado</dt><dd class="font-bold text-highlighted">{{ solicitud.consolidado ? `Consolidado ${soloConsolidado(solicitud.consolidado)}` : '—' }}</dd></div>
            <div><dt class="text-sm text-muted">Nombre y apellido</dt><dd class="font-bold text-highlighted">{{ solicitud.cliente_nombre || '—' }}</dd></div>
            <div><dt class="text-sm text-muted">WhatsApp</dt><dd class="font-bold text-highlighted">{{ solicitud.cliente_whatsapp || '—' }}</dd></div>
            <div><dt class="text-sm text-muted">Correo electrónico</dt><dd class="font-bold text-highlighted">{{ solicitud.cliente_correo || '—' }}</dd></div>
          </dl>
        </UCard>

        <UAlert
          v-if="solicitud.cotizacion_codigo"
          color="info"
          variant="subtle"
          :description="`Creada desde la cotización ${solicitud.cotizacion_codigo}.`"
        />

        <UCard>
          <div class="mb-4 flex items-center gap-3">
            <UAvatar icon="i-lucide-chart-no-axes-column" size="md" class="bg-primary/10" :ui="{ icon: 'text-primary' }" />
            <h2 class="text-base font-bold text-highlighted">Resumen financiero</h2>
          </div>
          <dl class="grid gap-3" :class="(solicitud.excedente || 0) > 0.004 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'">
            <UCard variant="subtle" :ui="{ body: 'p-4 sm:p-4' }">
              <dt class="text-sm text-muted">Total cotizado</dt>
              <dd class="mt-1 text-3xl font-bold text-highlighted">${{ dinero(solicitud.total_cotizado || 0) }}</dd>
            </UCard>
            <UCard variant="subtle" :ui="{ body: 'p-4 sm:p-4' }">
              <dt class="text-sm text-muted">Total abonado</dt>
              <dd class="mt-1 text-3xl font-bold text-highlighted">${{ dinero(solicitud.total_abonado || 0) }}</dd>
            </UCard>
            <UCard
              variant="subtle"
              :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'bg-primary/10 ring-primary/40' : 'bg-success/10 ring-success/30'"
              :ui="{ body: 'p-4 sm:p-4' }"
            >
              <!-- Naranja de la maqueta (primario), no el ámbar de warning. -->
              <dt class="text-sm" :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'text-primary' : 'text-success'">Saldo pendiente</dt>
              <dd class="mt-1 text-3xl font-bold" :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'text-primary' : 'text-success'">${{ dinero(solicitud.saldo_pendiente || 0) }}</dd>
              <em class="mt-1 block text-sm font-semibold not-italic" :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'text-primary-800' : 'text-success'">{{ (solicitud.saldo_pendiente || 0) > 0.004 ? 'Falta abonar' : '✓ Cubierto' }}</em>
            </UCard>
            <UCard v-if="(solicitud.excedente || 0) > 0.004" variant="subtle" class="bg-info/10 ring-info/30" :ui="{ body: 'p-4 sm:p-4' }">
              <dt class="text-sm text-info">Excedente</dt>
              <dd class="mt-1 text-3xl font-bold text-info">${{ dinero(solicitud.excedente || 0) }}</dd>
              <em v-if="reembolsoSolicitado > 0.004" class="mt-1 block text-sm not-italic text-muted">Reembolso solicitado de ${{ dinero(reembolsoSolicitado) }}: pendiente de aprobación de Administración.</em>
              <em v-else class="mt-1 block text-sm not-italic text-muted">El cliente decidirá si se realiza el reembolso o su aplicación {{ destinoExcedente }}.</em>
            </UCard>
          </dl>
        </UCard>

        <UAlert
          v-if="esAdmin"
          color="info"
          variant="subtle"
          title="Solo lectura para Administración"
          description="Las decisiones de Admin se hacen en Aprobación de pagos y Pagos en dólares. Aquí revisas el expediente sin acciones de Ventas."
        />

        <div v-if="!soloLectura && hayProveedoresActivos" class="flex flex-wrap items-center gap-2.5">
          <UButton
            v-if="solicitud.cotizacion_id"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            :disabled="!hayAccionEtapa1"
            :to="hayAccionEtapa1 ? `/pago-proveedor/cotizaciones/${solicitud.cotizacion_id}?desde=solicitud` : undefined"
          >
            Formulario de la solicitud
          </UButton>
          <UButton
            v-if="solicitud.cotizacion_id"
            :color="ctaPrincipal === 'resumen' ? 'primary' : 'neutral'"
            :variant="ctaPrincipal === 'resumen' ? 'solid' : 'outline'"
            icon="i-lucide-send"
            title="Si cambias algo en la solicitud, reenvía el resumen actualizado."
            :loading="guardandoAviso"
            :disabled="!hayAccionEtapa1"
            @click="enviarResumen"
          >
            Enviar resumen al cliente
          </UButton>
          <UButton v-if="solicitud.cotizacion_id" color="neutral" variant="outline" icon="i-lucide-download" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
          <UButton
            :color="ctaPrincipal === 'datos' ? 'primary' : 'neutral'"
            :variant="ctaPrincipal === 'datos' ? 'solid' : 'outline'"
            icon="i-lucide-users"
            :disabled="!proveedoresSinDatos"
            :title="proveedoresSinDatos ? undefined : 'Todos los proveedores ya tienen sus datos completos.'"
            @click="abrirPedirDatos"
          >
            Pedir datos del proveedor
            <UBadge v-if="proveedoresSinDatos" color="primary" variant="solid" size="sm" class="ml-1" :class="ctaPrincipal === 'datos' ? 'bg-white text-primary' : ''">{{ proveedoresSinDatos }}</UBadge>
          </UButton>
          <UButton
            :color="ctaPrincipal === 'cuentas' ? 'primary' : 'neutral'"
            :variant="ctaPrincipal === 'cuentas' ? 'solid' : 'outline'"
            icon="i-lucide-landmark"
            :disabled="!hayAccionEtapa1 || (solicitud.saldo_pendiente || 0) <= 0.004"
            @click="enviarCuentas"
          >
            Enviar cuentas bancarias
          </UButton>
        </div>
        <div v-else-if="esAdmin" class="flex flex-wrap items-center gap-2">
          <UButton v-if="solicitud.cotizacion_id" color="neutral" variant="outline" icon="i-lucide-download" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-check-badge" to="/pago-proveedor/aprobacion-pagos">Ir a Aprobación de pagos</UButton>
        </div>

      </header>

      <h2 class="text-xl font-bold text-highlighted">Seguimiento por proveedor</h2>

      <UCard v-for="proveedor in solicitud.proveedores || []" :key="proveedor.id" :ui="{ body: 'p-0 sm:p-0' }">
        <button type="button" class="flex w-full items-center gap-4 p-5 text-left" @click="toggleProveedor(proveedor.id)">
          <UAvatar icon="i-lucide-store" size="lg" class="bg-primary/10" :ui="{ icon: 'text-primary' }" />
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2">
              <strong class="text-lg text-highlighted">{{ proveedor.code_supplier || proveedor.titulo }}</strong>
              <UBadge color="neutral" variant="soft">Proveedor {{ proveedor.orden }}</UBadge>
            </p>
            <p class="text-sm text-muted">
              {{ [proveedor.nombre_proveedor, proveedor.producto, proveedor.moneda === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T', etiquetaModalidad(proveedor)].filter(Boolean).join(' · ') }}
              <strong v-if="proveedor.codigo_solicitud" class="text-highlighted"> · {{ proveedor.codigo_solicitud }}</strong>
            </p>
          </div>
          <UBadge :color="colorEstado(proveedor.estado)" variant="soft" size="md" :label="proveedor.estado_nombre" />
          <UIcon :name="proveedorAbierto[proveedor.id] === false ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'" class="size-4 text-muted" />
        </button>

        <div v-show="proveedorAbierto[proveedor.id] !== false" class="border-t border-default p-5">
          <ol class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <li v-for="paso in pasos" :key="paso.n" class="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                class="flex items-center gap-2.5 whitespace-nowrap text-sm disabled:cursor-default"
                :disabled="paso.n > proveedor.etapa"
                :title="paso.n < proveedor.etapa ? 'Revisar este paso' : (paso.n === proveedor.etapa ? 'Paso actual' : undefined)"
                @click="irAPaso(proveedor, paso.n)"
              >
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  :class="pasoHecho(proveedor, paso.n)
                    ? 'bg-success text-inverted'
                    : paso.n === proveedor.etapa
                      ? 'bg-primary text-inverted ring-4 ring-primary/20'
                      : 'bg-elevated text-muted'"
                >
                  <UIcon v-if="pasoHecho(proveedor, paso.n)" name="i-lucide-check" class="size-4" />
                  <template v-else>{{ paso.n }}</template>
                </span>
                <span :class="[paso.n === proveedor.etapa && !pasoHecho(proveedor, paso.n) ? 'font-semibold text-primary' : 'text-muted', (vistaEtapa[proveedor.id] ?? proveedor.etapa) === paso.n ? 'underline underline-offset-4' : '']">{{ paso.nombre }}</span>
              </button>
              <span v-if="paso.n < 4" class="hidden h-px min-w-6 flex-1 lg:block" :class="pasoHecho(proveedor, paso.n) ? 'bg-success' : 'bg-accented'" />
            </li>
          </ol>
          <UButton v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) !== proveedor.etapa" class="mt-2" size="xs" color="neutral" variant="outline" @click="verPasoActual(proveedor)">Volver al paso actual</UButton>

          <UAlert v-if="proveedor.estado === 'anulado'" class="mt-4" color="neutral" variant="subtle" :description="proveedor.motivo_anulacion ? `Anulado — ${proveedor.motivo_anulacion}.` : 'Anulado.'" />
          <UAlert v-else-if="proveedor.estado === 'completado'" class="mt-4" color="success" variant="subtle" description="✓ Completado. El pago se ejecutó y no quedó nada pendiente." />
          <UAlert v-if="proveedor.observacion_ventas" class="mt-4" color="error" variant="subtle" :title="`Observado — ${proveedor.observacion_ventas.motivo}`">
            <template #actions>
              <UButton v-if="!soloLectura" size="xs" color="error" variant="soft" @click="abrirMotivo(proveedor, 'levantar')">Levantar observación</UButton>
            </template>
          </UAlert>

          <div v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) === 1 && proveedor.estado !== 'anulado'" class="mt-4 grid gap-3 lg:grid-cols-3">
            <UCard :ui="bloque" :class="datosPendientes(proveedor) ? 'bg-warning/10 ring-warning/30' : ''">
              <div class="mb-3 flex items-start gap-3">
                <UAvatar icon="i-lucide-user" size="md" class="bg-primary/10" :ui="{ icon: 'text-primary' }" />
                <div>
                  <h3 class="font-bold text-highlighted">{{ proveedor.moneda === 'RMB' ? 'Datos del proveedor' : 'Datos bancarios (T-T)' }}</h3>
                  <UBadge class="mt-1" :color="datosPendientes(proveedor) ? 'warning' : 'success'" variant="soft" :label="datosPendientes(proveedor) ? '! Pendientes' : '✓ Completos'" />
                </div>
              </div>

              <template v-if="proveedor.moneda === 'RMB'">
                <UAlert v-if="proveedor.observacion_china" class="mb-2" color="error" variant="subtle" :title="`Observación de China: ${proveedor.observacion_china.label}`" :description="proveedor.observacion_china.detail || undefined" />
                <dl v-if="proveedor.datos.wechat" class="mb-3 space-y-1 text-sm">
                  <div class="flex justify-between gap-2"><dt class="text-muted">Nombre del vendedor</dt><dd class="font-semibold text-highlighted">{{ proveedor.datos.vendedor_nombre || '—' }}</dd></div>
                  <div class="flex justify-between gap-2"><dt class="text-muted">N.° de WeChat</dt><dd class="font-semibold text-highlighted">{{ proveedor.datos.wechat }}</dd></div>
                </dl>
                <p v-else class="mb-3 text-sm text-muted">Faltan el nombre del vendedor y su N.° de WeChat.</p>
                <UButton color="neutral" variant="outline" size="sm" :icon="datosEditables(proveedor) ? 'i-lucide-pencil' : undefined" @click="abrirDatos(proveedor, !datosEditables(proveedor))">
                  {{ !datosEditables(proveedor) ? 'Ver' : proveedor.datos.wechat ? 'Editar' : 'Completar' }}
                </UButton>
              </template>

              <template v-else>
                <UBadge
                  :color="proveedor.datos.estado === 'recibido' ? 'success' : 'neutral'"
                  variant="soft"
                  :label="`${etiquetaDatos(proveedor.datos.estado)}${proveedor.datos.correccion_solicitada ? ' · corrección pedida' : ''}`"
                />
                <p v-if="proveedor.datos.beneficiario_nombre" class="mt-2 text-sm text-muted">
                  <strong class="text-highlighted">{{ proveedor.datos.beneficiario_nombre }}</strong> · cuenta {{ cuentaOculta(proveedor.datos.beneficiario_cuenta) }}<br>
                  {{ proveedor.datos.banco_nombre }} · {{ proveedor.datos.banco_codigo }}
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <template v-if="datosEditables(proveedor)">
                    <template v-if="proveedor.datos.estado === 'recibido'">
                      <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-eye" @click="abrirDatos(proveedor, true)">Ver datos</UButton>
                      <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-copy" @click="copiarDatos(proveedor)">Copiar datos</UButton>
                      <UButton size="sm" color="neutral" variant="outline" icon="i-mdi-whatsapp" @click="pedirValidacion(proveedor)">Solicitar validación de datos</UButton>
                    </template>
                    <template v-else-if="proveedor.datos.estado === 'por_autorizar'">
                      <UButton size="sm" color="primary" icon="i-mdi-whatsapp" @click="pedirValidacion(proveedor)">Enviar al cliente para autorización</UButton>
                      <UButton size="sm" color="neutral" variant="outline" @click="abrirDatos(proveedor, false)">Editar borrador</UButton>
                    </template>
                    <template v-else>
                      <UButton size="sm" color="primary" icon="i-mdi-whatsapp" @click="enviarFormulario(proveedor)">{{ proveedor.datos.estado === 'enviado' ? 'Reenviar formulario' : 'Enviar formulario' }}</UButton>
                      <UButton size="sm" color="neutral" variant="outline" title="Solo en casos excepcionales: el cliente debe revisar y autorizar los datos" @click="abrirDatos(proveedor, false)">Llenar por el cliente</UButton>
                    </template>
                  </template>
                  <UButton v-else-if="proveedor.datos.beneficiario_nombre" size="sm" color="neutral" variant="outline" icon="i-lucide-eye" @click="abrirDatos(proveedor, true)">Ver</UButton>
                </div>
              </template>
            </UCard>

            <UCard :ui="bloque" :class="proveedor.saldo > 0.004 && proveedor.importe_abonado > 0 ? 'bg-warning/10 ring-warning/30' : ''">
              <div class="mb-3 flex items-center gap-3">
                <UAvatar icon="i-lucide-file-text" size="md" class="bg-primary/10" :ui="{ icon: 'text-primary' }" />
                <h3 class="font-bold text-highlighted">Comprobante de pago</h3>
              </div>
              <UAlert v-if="proveedor.puede_registrar_diferencia" class="mb-2" color="warning" variant="subtle" description="Administración dejó este pago por cobrar. Registra el comprobante de la diferencia." />
              <div v-for="item in abonosProveedor(proveedor.id)" :key="item.id" class="mb-2 flex items-start justify-between gap-2 text-sm">
                <div>
                  <strong class="text-highlighted">Abono {{ numeroAbono(item) }} · ${{ dinero(montoAplicado(item, proveedor.id)) }}</strong>
                  <span v-if="item.aplicaciones.length > 1 || item.excedente > 0.004" class="text-xs text-muted"> (de un abono de ${{ dinero(item.importe) }}<template v-if="item.excedente > 0.004"> · excedente ${{ dinero(item.excedente) }}</template>)</span>
                  <p class="text-muted">{{ fechaCorta(item.fecha_pago) }} · {{ item.banco.toUpperCase() }}</p>
                  <p class="text-muted">N.° de operación {{ item.numero_operacion || '—' }}<template v-if="item.aplicaciones.length > 1"> · voucher compartido</template></p>
                  <UBadge
                    v-if="item.estado === 'en_validacion'"
                    class="mt-1"
                    :color="slaOverdue(item.validacion_sla) ? 'error' : 'warning'"
                    variant="soft"
                    size="sm"
                    :label="slaText(item.validacion_sla) ? `Pendiente · ${slaText(item.validacion_sla)}` : 'Pendiente de validación'"
                  />
                </div>
                <div class="flex shrink-0 gap-1">
                  <UButton v-if="item.voucher_url" size="xs" color="neutral" variant="outline" icon="i-lucide-receipt-text" title="Ver voucher" @click="() => { voucherAbierto = item }" />
                  <template v-if="!soloLectura">
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-pencil" title="Editar abono" :disabled="!item.puede_editar" @click="editarAbono(item)" />
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-trash-2" title="Anular abono" :disabled="!item.puede_anular" @click="anularAbono(item)" />
                  </template>
                </div>
              </div>
              <p v-if="!abonosProveedor(proveedor.id).length" class="mb-3 text-sm text-muted">Sin abonos registrados.</p>
              <UButton v-if="!soloLectura && (proveedor.puede_editar_etapa1 || proveedor.puede_registrar_diferencia) && proveedor.saldo > 0.004" size="sm" color="primary" @click="abrirAbono()">
                {{ proveedor.importe_abonado > 0 ? 'Registrar otro abono' : 'Registrar comprobante' }}
              </UButton>
            </UCard>

            <UCard :ui="bloque">
              <div class="mb-3 flex items-center gap-3">
                <UAvatar icon="i-lucide-circle-dollar-sign" size="md" class="bg-primary/10" :ui="{ icon: 'text-primary' }" />
                <h3 class="font-bold text-highlighted">{{ proveedor.etapa > 1 ? 'Total abonado' : 'Total pendiente de abono' }}</h3>
              </div>
              <p class="text-3xl font-bold" :class="proveedor.saldo > 0.004 && proveedor.etapa === 1 ? 'text-warning' : 'text-highlighted'">${{ dinero(proveedor.etapa > 1 ? proveedor.importe_abonado : proveedor.saldo) }}</p>
              <UBadge
                class="my-2"
                :color="proveedor.saldo > 0.004 ? 'warning' : 'success'"
                variant="soft"
                :label="proveedor.saldo > 0.004 ? (proveedor.importe_abonado > 0 ? `Falta abonar $${dinero(proveedor.saldo)}` : 'Sin abonar') : '✓ Cubierto'"
              />
              <p class="text-sm text-muted">Cotizado ${{ dinero(proveedor.importe_requerido) }} · Abonado ${{ dinero(proveedor.importe_abonado) }}</p>
              <p v-if="proveedor.etiqueta_bancaria" class="text-sm text-muted">Bancaria {{ proveedor.etiqueta_bancaria.toLowerCase() }}</p>
              <UButton class="mt-1 px-0" size="sm" color="primary" variant="link" @click="abrirDesglose(proveedor)">Ver desglose del cobro</UButton>
            </UCard>
          </div>

          <p v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) !== proveedor.etapa" class="mt-3 text-sm text-muted">
            Estás revisando este paso en solo lectura. El paso actual del proveedor es {{ proveedor.etapa }}.
          </p>

          <SupplierPaymentProgress
            v-if="solicitud.id && proveedor.estado !== 'anulado'"
            :solicitud-id="solicitud.id"
            :proveedor="proveedor"
            :tipo-cambio="solicitud.tipo_cambio"
            :readonly="soloLectura"
            :viewing="vistaEtapa[proveedor.id] ?? proveedor.etapa"
            @saved="cargar"
            @complete-data="irACompletarDatos(proveedor)"
            @view-data="abrirDatos(proveedor, true)"
            @go-step="(paso) => irAPaso(proveedor, paso)"
            @lift="abrirMotivo(proveedor, 'levantar')"
            @lift-china="levantarChina(proveedor)"
            @edit-deposit="(id) => editarAbonoPorId(id)"
            @view-voucher="(id) => verVoucherPorId(id)"
            @register-difference="abrirAbono()"
            @choose-providers="abrirContinuacion(proveedor)"
            @decide-surplus="(id, decision) => decidir(id, decision)"
          />

          <!-- Debajo de las tarjetas del paso, como la franja «Por realizar». -->
          <UAlert v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) === proveedor.etapa && enManos(proveedor)" class="mt-3" color="info" variant="subtle" :description="enManos(proveedor)" />

          <UAlert
            v-if="!soloLectura && (vistaEtapa[proveedor.id] ?? proveedor.etapa) === proveedor.etapa && porRealizar(proveedor)"
            class="mt-3"
            color="info"
            variant="subtle"
            :ui="{ root: 'px-4 py-2.5 items-center', description: 'mt-0 text-sm' }"
          >
            <template #description>
              <strong class="text-highlighted">Por realizar: </strong>{{ porRealizar(proveedor) }}
            </template>
            <template #actions>
              <UButton v-if="abonoObservado(proveedor)" size="xs" color="warning" @click="editarAbono(abonoObservado(proveedor)!)">Corregir comprobante</UButton>
            </template>
          </UAlert>

          <div v-if="!soloLectura && proveedor.estado === 'en_proceso' && (proveedor.etapa !== 2 || proveedor.puede_editar_etapa1)" class="mt-4 flex flex-wrap gap-2">
            <UButton color="neutral" variant="outline" icon="i-lucide-eye" @click="abrirMotivo(proveedor, 'observar')">Observar</UButton>
            <UButton v-if="proveedor.puede_editar_etapa1" color="error" variant="outline" icon="i-lucide-trash-2" @click="abrirMotivo(proveedor, 'anular')">Anular</UButton>
          </div>
          <div v-else-if="!soloLectura && proveedor.observacion_ventas && proveedor.puede_editar_etapa1" class="mt-4">
            <UButton color="error" variant="outline" icon="i-lucide-trash-2" @click="abrirMotivo(proveedor, 'anular')">Anular</UButton>
          </div>
        </div>
      </UCard>

      <UCard v-if="(solicitud.abonos || []).length">
        <h2 class="font-bold text-highlighted">Abonos registrados</h2>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-muted">
                <th class="pb-2 pr-3 font-semibold">#</th>
                <th class="pb-2 pr-3 font-semibold">Fecha</th>
                <th class="pb-2 pr-3 font-semibold">Banco</th>
                <th class="pb-2 pr-3 font-semibold">Importe</th>
                <th class="pb-2 pr-3 font-semibold">Aplicado a</th>
                <th class="pb-2 pr-3 font-semibold">Excedente</th>
                <th class="pb-2 pr-3 font-semibold">Estado</th>
                <th class="pb-2 font-semibold">Voucher</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="abono in solicitud.abonos" :key="abono.id">
                <tr class="border-t border-default" :class="{ 'opacity-50': abono.estado === 'anulado' }">
                  <td class="py-2 pr-3">{{ abono.numero ?? abono.id }}</td>
                  <td class="whitespace-nowrap py-2 pr-3">{{ fechaCorta(abono.fecha_pago) }}</td>
                  <td class="py-2 pr-3">{{ abono.banco.toUpperCase() }}</td>
                  <td class="py-2 pr-3">${{ dinero(abono.importe) }}</td>
                  <td class="py-2 pr-3">{{ abono.aplicaciones.map(item => `${nombreProveedor(item.solicitud_proveedor_id)} $${dinero(item.monto)}`).join(', ') }}</td>
                  <td class="py-2 pr-3">
                    <template v-if="abono.excedente > 0">
                      ${{ dinero(abono.excedente) }} <span class="text-xs text-muted">{{ textoExcedente(abono) }}</span>
                      <span v-if="abono.excedente_decide_text" class="block text-xs" :class="abono.excedente_decide_overdue ? 'font-semibold text-error' : 'text-warning'">{{ abono.excedente_decide_text }}</span>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="py-2 pr-3">{{ abono.estado === 'en_validacion' ? 'Pendiente de validación' : abono.estado_nombre }}</td>
                  <td class="py-2"><UButton v-if="abono.voucher_url" size="xs" color="neutral" variant="outline" icon="i-lucide-receipt-text" title="Ver voucher" @click="voucherAbierto = abono" /></td>
                </tr>
                <tr v-if="abonoConDetalle(abono)">
                  <td colspan="8" class="pb-3">
                    <UAlert v-if="abono.observacion" color="error" variant="subtle" :title="`Observado: ${abono.observacion.motivo}`" :description="[abono.observacion.detalle, abono.observacion.plazo].filter(Boolean).join(' · ') || undefined" />
                    <p v-if="abono.operacion_repetida" class="mt-1 text-sm text-warning">El número de operación ya estaba registrado.</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard v-if="(solicitud.historial || []).length">
        <UCollapsible v-model:open="historialAbierto" :unmount-on-hide="false">
          <UButton color="neutral" variant="ghost" icon="i-lucide-history" trailing-icon="i-lucide-chevron-down" class="px-0" block>Historial de la solicitud</UButton>
          <template #content>
            <div class="mt-3 overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase tracking-wide text-muted">
                    <th class="pb-2 pr-3 font-semibold">Fecha</th>
                    <th class="pb-2 pr-3 font-semibold">Usuario</th>
                    <th class="pb-2 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(evento, index) in solicitud.historial" :key="`${evento.fecha}-${index}`" class="border-t border-default">
                    <td class="whitespace-nowrap py-2 pr-3 text-muted">{{ evento.fecha ? new Date(evento.fecha).toLocaleString('es-PE') : '—' }}</td>
                    <td class="py-2 pr-3">{{ evento.usuario || '—' }}</td>
                    <td class="py-2">{{ textoHistorial(evento).accion }}<span v-if="textoHistorial(evento).detalle" class="text-muted"> · {{ textoHistorial(evento).detalle }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </UCollapsible>
      </UCard>

      <div class="border-t border-default pt-4">
        <UAlert v-if="todosPasaronEtapa1" class="mb-3" color="success" variant="subtle" description="✓ Todos los proveedores ya pasaron a Validación de pago. Administración continúa con el proceso." />
        <div class="flex flex-wrap items-center gap-3">
          <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" @click="volverAlListado">Volver al listado</UButton>
          <span class="text-xs text-muted">✓ Los cambios se guardan automáticamente.</span>
        </div>
      </div>

      <SupplierPaymentWindow
        :open="datosAbiertoId !== null"
        :title="datosProveedor ? `${datosProveedor.moneda === 'RMB' ? 'Datos del proveedor' : 'Datos bancarios del proveedor (T-T)'} — ${datosProveedor.code_supplier}` : ''"
        :subtitle="datosProveedor?.moneda !== 'RMB' && !ttSoloLectura ? 'Solo en casos excepcionales: quedan como borrador y el cliente debe autorizarlos antes de usarlos para el pago.' : ''"
        :hint="datosProveedor && !ttSoloLectura ? '¿Falta algún dato? Usa «Pedir datos del proveedor» en la barra de acciones de arriba.' : ''"
        @close="cerrarDatos"
      >
        <template v-if="datosProveedor">
          <div v-if="datosProveedor.moneda === 'RMB'" class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Nombre del vendedor"><UInput v-model="rmb[datosProveedor.id].vendedor" :disabled="ttSoloLectura" placeholder="Ej: Li Wei" class="w-full" /></UFormField>
            <UFormField label="N.° de WeChat"><UInput v-model="rmb[datosProveedor.id].wechat" :disabled="ttSoloLectura" inputmode="numeric" placeholder="Ej: 13812345678" class="w-full" /></UFormField>
          </div>
          <FormularioBancario v-else v-model="formularioTt" :bloqueado="ttSoloLectura" />
        </template>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="cerrarDatos">{{ ttSoloLectura ? 'Cerrar' : 'Cancelar' }}</UButton>
          <UButton v-if="datosProveedor && !ttSoloLectura" color="primary" @click="guardarDatos(datosProveedor)">{{ datosProveedor.moneda === 'RMB' ? 'Guardar datos' : 'Guardar como por autorizar' }}</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow :open="!!motivo" :title="motivo ? textosMotivo[motivo.tipo].titulo : ''" :subtitle="motivo ? textosMotivo[motivo.tipo].detalle : ''" @close="cerrarMotivo">
        <UFormField label="Motivo" required>
          <UTextarea v-if="motivo" v-model="motivo.texto" :rows="3" autofocus placeholder="Describe el motivo (obligatorio)" class="w-full" />
        </UFormField>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="cerrarMotivo">Cancelar</UButton>
          <UButton color="primary" :disabled="!motivo?.texto.trim()" :loading="guardandoMotivo" @click="confirmarMotivo">Confirmar</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow :open="!!desglose" title="Desglose del cobro" :subtitle="desglose ? [desglose.code_supplier, desglose.producto].filter(Boolean).join(' · ') : ''" @close="cerrarDesglose">
        <dl v-if="desglose" class="space-y-1 text-sm">
          <div class="flex items-center gap-3 px-3 py-2"><UIcon name="i-lucide-package" class="size-5 shrink-0 text-muted" /><dt class="flex-1 text-highlighted">Valor de carga</dt><dd>{{ detalleValorCarga(desglose) }}</dd></div>
          <div class="flex items-center gap-3 px-3 py-2"><UIcon name="i-lucide-landmark" class="size-5 shrink-0 text-muted" /><dt class="flex-1 text-highlighted">Comisión bancaria / plataforma</dt><dd>{{ desglose.etiqueta_bancaria || `$${dinero(desglose.bancaria_monto)}` }}</dd></div>
          <div class="flex items-center gap-3 px-3 py-2"><UIcon name="i-lucide-shield-check" class="size-5 shrink-0 text-muted" /><dt class="flex-1 text-highlighted">Comisión administrativa</dt><dd>${{ dinero(desglose.administrativa_monto) }}</dd></div>
          <div class="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-3 text-base font-bold text-highlighted"><UIcon name="i-lucide-calculator" class="size-5 shrink-0 text-primary" /><dt class="flex-1">Total a abonar</dt><dd>${{ dinero(desglose.importe_requerido) }}</dd></div>
          <div class="flex items-center gap-3 px-3 py-2"><UIcon name="i-lucide-wallet" class="size-5 shrink-0 text-muted" /><dt class="flex-1 text-highlighted">Abonado</dt><dd>${{ dinero(desglose.importe_abonado) }}</dd></div>
          <div class="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-3 text-base font-bold text-primary"><UIcon :name="desglose.saldo > 0.004 ? 'i-lucide-circle-alert' : 'i-lucide-circle-check'" class="size-5 shrink-0" /><dt class="flex-1">Saldo</dt><dd>${{ dinero(desglose.saldo) }}</dd></div>
        </dl>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="cerrarDesglose">Cerrar</UButton>
        </template>
      </SupplierPaymentWindow>


      <SupplierPaymentWindow
        :open="!!abonoContinuacion"
        title="Elegir proveedores"
        subtitle="Selecciona los proveedores que continúan con el pago."
        @close="abonoContinuacion = null"
      >
        <template v-if="abonoContinuacion">
          <p class="text-sm text-highlighted"><strong>Abono #{{ numeroAbono(abonoContinuacion) }}: ${{ dinero(abonoContinuacion.importe) }}</strong> · N.° de operación {{ abonoContinuacion.numero_operacion || '—' }}</p>
          <UCard v-for="aplicacion in abonoContinuacion.aplicaciones" :key="aplicacion.solicitud_proveedor_id" variant="subtle" :ui="{ body: 'p-3 sm:p-3' }">
            <div class="flex items-center justify-between gap-3 text-sm">
              <UCheckbox
                :model-value="(continuacion[abonoContinuacion.id] || []).includes(aplicacion.solicitud_proveedor_id)"
                :label="nombreProveedor(aplicacion.solicitud_proveedor_id)"
                @update:model-value="(checked) => alternarContinuacion(abonoContinuacion!.id, aplicacion.solicitud_proveedor_id, !!checked)"
              />
              <span class="text-muted">Monto asignado <strong class="text-highlighted">${{ dinero(aplicacion.monto) }}</strong></span>
            </div>
          </UCard>
          <UAlert color="warning" variant="subtle" :description="`Falta: $${dinero(abonoContinuacion.aplicaciones.reduce((suma, item) => suma + Number(item.monto), 0) - abonoContinuacion.importe)}. Consulta con el cliente y marca qué proveedor(es) continúan con el proceso; los demás quedan pendientes.`" />
        </template>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="abonoContinuacion = null">Cancelar</UButton>
          <UButton color="primary" :disabled="!(continuacion[abonoContinuacion?.id || 0] || []).length" @click="guardarContinuacion(abonoContinuacion!.id)">Confirmar selección</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow
        :open="pedirDatosAbierto"
        title="Pedir datos del proveedor"
        :subtitle="solicitud.cliente_whatsapp ? `Destino: ${solicitud.cliente_whatsapp}` : 'Elige a quién le pides los datos.'"
        width-class="max-w-xl sm:max-w-xl"
        @close="cerrarPedirDatos"
      >
        <p v-if="!candidatosDatos.length" class="text-sm text-muted">Todos los proveedores ya tienen sus datos.</p>
        <template v-else>
          <!-- Una sola ventana: arriba se eligen los proveedores y abajo se ve el mensaje que se enviará. -->
          <p class="text-sm font-semibold text-highlighted">¿De qué proveedores pides los datos?</p>
          <UCheckboxGroup
            v-model="candidatosElegidos"
            :items="candidatosDatos.map(candidato => ({ label: `${candidato.titulo} · ${candidato.moneda}`, value: String(candidato.id) }))"
          />
          <UCard variant="subtle">
            <p v-if="!candidatosElegidos.length" class="text-sm text-muted">Elige al menos un proveedor para ver el mensaje.</p>
            <p v-else-if="pedidoDatos.cargando && !pedidoDatos.texto" class="text-sm text-muted">Preparando mensaje…</p>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <pre v-else class="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm text-highlighted" :class="pedidoDatos.cargando ? 'opacity-60' : ''" v-html="whatsappHtml(pedidoDatos.texto)" />
          </UCard>
          <p v-if="pedidoDatos.nota && candidatosElegidos.length" class="text-sm text-muted">{{ pedidoDatos.nota }}</p>
        </template>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="cerrarPedirDatos">Cerrar</UButton>
          <UButton
            v-if="candidatosDatos.length"
            color="success"
            icon="i-heroicons-paper-airplane"
            :loading="guardandoAviso"
            :disabled="!candidatosElegidos.length || pedidoDatos.cargando || !pedidoDatos.puedeEnviar"
            @click="enviarPedirDatos"
          >
            Enviar mensaje al cliente
          </UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow
        :open="abonoAbierto"
        :title="abonoEditandoId ? 'Editar comprobante de pago' : 'Registrar comprobante de pago'"
        @close="cerrarAbono"
      >
        <form id="abono-form" class="space-y-3.5" @submit.prevent="guardarAbono">
          <p class="text-sm text-muted">Registra el abono y elige a qué proveedores lo aplicas. Un abono puede cubrir varios proveedores y un proveedor puede cubrirse con varios abonos.</p>

          <UCard :ui="{ body: 'grid gap-3 sm:grid-cols-2 p-4 sm:p-4' }">
            <UFormField label="Importe recibido (USD)" required>
              <UInput v-model.number="abono.importe" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" />
            </UFormField>
            <UFormField label="Fecha de pago" required>
              <UInput v-model="abono.fecha" type="date" class="w-full" />
            </UFormField>
            <UFormField label="N.° de operación" required>
              <UInput v-model="abono.operacion" placeholder="El que figura en el voucher" class="w-full" />
            </UFormField>
            <UFormField label="Banco receptor" required>
              <USelect v-model="abono.banco" :items="bancos" placeholder="Selecciona" class="w-full" />
            </UFormField>
            <UFormField label="Comprobante (voucher)" :required="!abonoEditandoId" class="sm:col-span-2">
              <div class="flex flex-wrap items-center gap-3">
                <label class="inline-flex cursor-pointer">
                  <UButton as="span" color="neutral" variant="outline" size="sm">Seleccionar archivo</UButton>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="sr-only" @change="elegirVoucher">
                </label>
                <span class="min-w-0 truncate text-xs text-muted">{{ voucher ? voucher.name : 'Sin archivos seleccionados' }}</span>
              </div>
              <p v-if="!voucher && abonoEditandoId" class="mt-1 text-xs text-muted">Deja el archivo vacío para conservar el voucher actual.</p>
            </UFormField>
          </UCard>

          <UCheckbox
            v-model="abono.interbancaria"
            label="Transferencia interbancaria o depósito en cajero"
            description="Revisar si el banco aplicó comisiones o cargos bancarios."
          />

          <UCard :ui="{ body: 'space-y-2 p-4 sm:p-4' }" class="bg-elevated/50">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-bold text-highlighted">Aplicar el abono a</h3>
              <UButton type="button" size="xs" color="primary" variant="link" @click="distribuir">Distribuir automáticamente</UButton>
            </div>
            <div v-for="proveedor in proveedoresConSaldo" :key="proveedor.id" class="rounded-lg border border-default bg-default px-3 py-2.5 text-sm">
              <div class="flex items-start justify-between gap-3">
                <UCheckbox
                  :model-value="(abono.montos[proveedor.id] || 0) > 0"
                  @update:model-value="(checked) => alternarProveedor(proveedor, !!checked)"
                >
                  <template #label>
                    <span class="block">
                      <strong class="text-highlighted">{{ proveedor.code_supplier }}</strong>
                      <span class="text-highlighted">{{ [proveedor.nombre_proveedor, proveedor.producto].filter(Boolean).map(texto => ` · ${texto}`).join('') }}</span>
                    </span>
                    <span class="block text-xs text-muted">Cotizado ${{ dinero(proveedor.importe_requerido) }}<template v-if="abonadoOtros(proveedor) > 0"> · Abonado ${{ dinero(abonadoOtros(proveedor)) }}</template> · Saldo ${{ dinero(saldoParaAbono(proveedor)) }}</span>
                  </template>
                </UCheckbox>
                <div class="flex shrink-0 flex-col items-end gap-1">
                  <UInput
                    :model-value="abono.montos[proveedor.id] || undefined"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Aplicar"
                    class="w-28"
                    :ui="{ base: 'text-right' }"
                    @update:model-value="(valor) => aplicarMonto(proveedor, Number(valor))"
                  />
                  <p v-if="(abono.montos[proveedor.id] || 0) > 0" class="text-xs" :class="(abono.montos[proveedor.id] || 0) >= saldoParaAbono(proveedor) - 0.005 ? 'font-semibold text-success' : 'text-warning'">
                    {{ (abono.montos[proveedor.id] || 0) >= saldoParaAbono(proveedor) - 0.005 ? 'Cubre completo ✓' : `Quedará saldo $${dinero(saldoParaAbono(proveedor) - (abono.montos[proveedor.id] || 0))}` }}
                  </p>
                </div>
              </div>
            </div>
            <p v-if="!proveedoresConSaldo.length" class="text-sm text-muted">Ningún proveedor tiene saldo pendiente.</p>
            <p class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-default pt-2 text-sm text-muted">
              <span>Recibido <strong class="text-highlighted">${{ dinero(abono.importe || 0) }}</strong></span>
              <span>Aplicado <strong class="text-highlighted">${{ dinero(aplicado) }}</strong></span>
              <span :class="Math.abs(sinAsignar) > 0.005 ? 'text-warning' : ''">Sin asignar <strong>${{ dinero(sinAsignar) }}</strong></span>
            </p>
            <p v-if="sinAsignar > 0.005" class="text-xs font-medium text-warning">Excedente de ${{ dinero(sinAsignar) }}: El cliente decidirá si se realiza el reembolso o su aplicación {{ destinoExcedente }}.</p>
            <p v-else-if="sinAsignar < -0.005" class="text-xs font-semibold text-error">Estás aplicando ${{ dinero(Math.abs(sinAsignar)) }} más de lo recibido.</p>
          </UCard>
        </form>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="cerrarAbono">Cancelar</UButton>
          <UButton type="submit" form="abono-form" color="primary" :disabled="!abonoCompleto || aplicado <= 0 || sinAsignar < -0.005" :loading="guardandoAbono">
            {{ abonoEditandoId ? 'Guardar cambios' : 'Registrar comprobante' }}
          </UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow
        :open="!!voucherAbierto"
        :title="voucherAbierto ? `Voucher · Abono ${numeroAbono(voucherAbierto)}` : ''"
        @close="voucherAbierto = null"
      >
        <template v-if="voucherAbierto">
          <dl class="divide-y divide-default text-sm">
            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Importe recibido</dt><dd class="font-semibold text-highlighted">${{ dinero(voucherAbierto.importe) }}</dd></div>
            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Aplicado a</dt><dd class="text-right text-highlighted">{{ voucherAbierto.aplicaciones.map(item => `${nombreProveedor(item.solicitud_proveedor_id)} $${dinero(item.monto)}`).join(', ') || '—' }}</dd></div>
            <div v-if="voucherAbierto.excedente > 0.004" class="py-2">
              <div class="flex justify-between gap-3"><dt class="text-muted">Excedente</dt><dd class="text-highlighted">${{ dinero(voucherAbierto.excedente) }}</dd></div>
              <p v-if="notaExcedente(voucherAbierto)" class="text-xs text-muted">{{ notaExcedente(voucherAbierto) }}</p>
            </div>
            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Fecha | Banco</dt><dd class="text-highlighted">{{ fechaCorta(voucherAbierto.fecha_pago) }} | {{ voucherAbierto.banco.toUpperCase() }}</dd></div>
          </dl>
          <VoucherViewer :url="voucherAbierto.voucher_url" :name="voucherAbierto.voucher_nombre" />
        </template>
        <template #footer>
          <UButton v-if="voucherAbierto?.voucher_url" color="neutral" variant="outline" icon="i-lucide-download" :to="voucherAbierto.voucher_url" target="_blank">Descargar</UButton>
          <UButton color="neutral" variant="soft" @click="voucherAbierto = null">Cerrar</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow
        :open="!!vistaPrevia"
        :width-class="vistaPrevia?.tipo === 'cuentas' ? 'max-w-md sm:max-w-md' : ''"
        :title="vistaPrevia?.tipo === 'resumen' && solicitud.cotizacion_codigo ? `WhatsApp · ${solicitud.cotizacion_codigo}` : 'Vista previa de WhatsApp'"
        :subtitle="solicitud.cliente_whatsapp ? `Destino: ${solicitud.cliente_whatsapp}` : ''"
        @close="cerrarVistaPrevia"
      >
        <template v-if="vistaPrevia">
          <UButton v-if="vistaPrevia.enlace" class="px-0 break-all" size="xs" color="primary" variant="link" :to="vistaPrevia.enlace" target="_blank">{{ vistaPrevia.enlace }}</UButton>
          <img
            v-if="vistaPrevia.imagen"
            :src="vistaPrevia.imagen"
            alt="Cuentas bancarias oficiales"
            class="max-h-80 w-full rounded-lg border border-default bg-elevated object-contain"
          >
          <UCard variant="subtle">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <pre class="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm text-highlighted" v-html="whatsappHtml(vistaPrevia.texto)" />
          </UCard>
          <p v-if="vistaPrevia.nota" class="text-sm text-muted">{{ vistaPrevia.nota }}</p>
        </template>
        <template #footer>
          <template v-if="vistaPrevia?.tipo === 'resumen'">
            <UButton color="neutral" variant="outline" @click="cerrarVistaPrevia">Cerrar</UButton>
            <UButton color="neutral" variant="outline" icon="i-heroicons-document-arrow-down" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
            <UButton color="success" icon="i-heroicons-paper-airplane" :loading="enviandoResumen" :disabled="!vistaPrevia.puede_enviar" @click="enviarResumenWhatsapp">
              Enviar por WhatsApp
            </UButton>
          </template>
          <UButton v-else color="neutral" variant="soft" @click="cerrarVistaPrevia">Cerrar</UButton>
        </template>
      </SupplierPaymentWindow>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { PagoProveedorAbono, PagoProveedorSolicitud, PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import { PROVIDER_STATUS, SUPPLIER_PAYMENT_PROFILE } from '~/constants/supplierPayment'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useSupplierPaymentProfile } from '~/composables/pago-proveedor/useSupplierPaymentProfile'
import { useSupplierPaymentRequest } from '~/composables/pago-proveedor/useSupplierPaymentRequest'
import { whatsappHtml } from '~/utils/whatsappFormat'
import FormularioBancario from '~/components/pago-proveedor/FormularioBancario.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import SupplierPaymentProgress from '~/components/pago-proveedor/SupplierPaymentProgress.vue'
import VoucherViewer from '~/components/pago-proveedor/VoucherViewer.vue'
import { useSlaCountdown } from '~/composables/pago-proveedor/useSlaCountdown'

type TipoMotivo = 'observar' | 'anular' | 'levantar'

interface VistaPrevia {
  enlace?: string
  texto: string
  nota?: string
  imagen?: string
  tipo?: string
  puede_enviar?: boolean
}

const route = useRoute()
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const { profile } = useSupplierPaymentProfile()
const api = useSupplierPaymentRequest()
const esAdmin = computed(() => profile.value === SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION)
const esChina = computed(() => profile.value === SUPPLIER_PAYMENT_PROFILE.WAREHOUSE)
/** Administración y Operaciones China consultan la solicitud; las acciones son de Ventas. */
const soloLectura = computed(() => esAdmin.value || esChina.value)
const abonoContinuacion = ref<PagoProveedorAbono | null>(null)
const cargando = ref(true)
const guardandoAbono = ref(false)
const guardandoAviso = ref(false)
const solicitud = ref<PagoProveedorSolicitud | null>(null)
const rmb = reactive<Record<number, { vendedor: string; wechat: string }>>({})
const datosAbiertoId = ref<number | null>(null)
const desglose = ref<PagoProveedorSolicitudProveedor | null>(null)
const motivo = ref<{ proveedor: PagoProveedorSolicitudProveedor; tipo: TipoMotivo; texto: string } | null>(null)
const guardandoMotivo = ref(false)
const historialAbierto = ref(false)
const textosMotivo = {
  observar: { titulo: 'Observar proveedor', detalle: 'Indica qué incidencia o información falta. Queda registrado quién, cuándo y por qué.' },
  anular: { titulo: 'Anular proveedor', detalle: 'La solicitud deja de continuar (por ejemplo, el cliente no respondió ni pagó). El código y el registro se conservan.' },
  levantar: { titulo: 'Levantar observación', detalle: 'Indica cómo se resolvió la observación. El proveedor vuelve a En proceso en la misma etapa.' }
}
const ttSoloLectura = ref(false)
const formularioTt = ref<Record<string, unknown>>({})
const abonoAbierto = ref(false)
const abonoEditandoId = ref<number | null>(null)
const pedirDatosAbierto = ref(false)
const candidatosDatos = ref<Array<{ id: number; titulo: string; moneda: string; incompleto: boolean }>>([])
const candidatosElegidos = ref<string[]>([])
const pedidoDatos = reactive({ texto: '', nota: '', puedeEnviar: false, cargando: false })
let pedidoDatosTurno = 0
const enviandoResumen = ref(false)
const voucher = ref<File | null>(null)
const voucherAbierto = ref<PagoProveedorAbono | null>(null)
const { slaText, slaOverdue } = useSlaCountdown()
const vistaPrevia = ref<VistaPrevia | null>(null)
const continuacion = reactive<Record<number, number[]>>({})
const abono = reactive({
  importe: 0,
  fecha: '',
  operacion: '',
  banco: 'bcp',
  interbancaria: false,
  montos: {} as Record<number, number>
})

// Tarjetas internas del seguimiento: cuerpo compacto, como en la maqueta.
const bloque = { body: 'p-4 sm:p-4' }
const bancos = [{ label: 'BCP', value: 'bcp' }, { label: 'Interbank', value: 'interbank' }]

const dinero = (valor: number) => Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const abonoEnEdicion = computed(() => (solicitud.value?.abonos || []).find(item => item.id === abonoEditandoId.value) || null)
const proveedoresConSaldo = computed(() => (solicitud.value?.proveedores || []).filter((item) => {
  if (abonoEnEdicion.value?.aplicaciones?.some(aplicacion => aplicacion.solicitud_proveedor_id === item.id)) return true
  return (item.puede_editar_etapa1 || item.puede_registrar_diferencia) && item.saldo > 0
}))
const hayAccionEtapa1 = computed(() => (solicitud.value?.proveedores || []).some(item => item.puede_editar_etapa1 || item.puede_registrar_diferencia || item.observacion_china))
const ctaPrincipal = computed<'datos' | 'resumen' | 'cuentas' | ''>(() => {
  const proveedores = solicitud.value?.proveedores || []
  const faltanDatos = proveedores.some((item) => {
    if (!item.puede_editar_etapa1) return false
    if (item.moneda === 'RMB') return !item.datos?.wechat
    return item.datos?.estado !== 'recibido' && item.datos?.estado !== 'por_autorizar'
  })
  if (!hayAccionEtapa1.value) return ''
  if (faltanDatos) return 'datos'
  if ((solicitud.value?.saldo_pendiente || 0) > 0.004) return 'cuentas'
  return 'resumen'
})
const pasos = [
  { n: 1, nombre: 'Solicitud y datos de pago' },
  { n: 2, nombre: 'Validación de pago' },
  { n: 3, nombre: 'Ejecución de pago' },
  { n: 4, nombre: 'Confirmación' }
]
const datosProveedor = computed(() => (solicitud.value?.proveedores || []).find(item => item.id === datosAbiertoId.value) || null)
const proveedoresSinDatos = computed(() => (solicitud.value?.proveedores || []).filter(item => item.puede_editar_etapa1 && !item.observacion_ventas && datosPendientes(item)).length)
const hayProveedoresActivos = computed(() => (solicitud.value?.proveedores || []).some(item => item.etapa <= 2 && !['completado', 'anulado'].includes(item.estado)))
const todosPasaronEtapa1 = computed(() => {
  const proveedores = solicitud.value?.proveedores || []
  return proveedores.some(item => item.etapa >= 2) && !proveedores.some(item => item.etapa === 1 && !['completado', 'anulado'].includes(item.estado))
})
const proveedorAbierto = reactive<Record<number, boolean>>({})
const vistaEtapa = reactive<Record<number, number>>({})
const aplicado = computed(() => Object.values(abono.montos).reduce((suma, monto) => suma + (Number(monto) || 0), 0))
/** Campos obligatorios del comprobante: sin ellos no se registra. */
const abonoCompleto = computed(() => Number(abono.importe) > 0
  && !!abono.fecha
  && !!String(abono.operacion || '').trim()
  && !!abono.banco
  && (!!voucher.value || !!abonoEditandoId.value))
/** Si Ventas no tocó los montos, el importe recibido se aplica solo a los proveedores (como en la maqueta). */
const montosManuales = ref(false)
const sinAsignar = computed(() => Math.round(((abono.importe || 0) - aplicado.value) * 100) / 100)

function toggleProveedor(id: number) {
  proveedorAbierto[id] = proveedorAbierto[id] === false
}

function verPasoActual(proveedor: PagoProveedorSolicitudProveedor) {
  vistaEtapa[proveedor.id] = proveedor.etapa
}

function irAPaso(proveedor: PagoProveedorSolicitudProveedor, paso: number) {
  vistaEtapa[proveedor.id] = paso
}

/** Pago en yuanes: «¥20,000.00 ÷ 7 = $2,857.14» con el valor en yuanes guardado (o USD × TC en solicitudes antiguas). */
function detalleValorCarga(proveedor: PagoProveedorSolicitudProveedor) {
  const usd = `$${dinero(proveedor.valor_carga_usd)}`
  const tc = Number(solicitud.value?.tipo_cambio || 0)
  if (proveedor.moneda !== 'RMB' || tc <= 0) return usd
  const yuanes = proveedor.valor_carga_rmb ?? Number(proveedor.valor_carga_usd || 0) * tc
  return `¥${dinero(yuanes)} ÷ ${tc.toLocaleString('en-US', { maximumFractionDigits: 4 })} = ${usd}`
}

function abrirDesglose(proveedor: PagoProveedorSolicitudProveedor) {
  desglose.value = proveedor
}

function cerrarPedirDatos() {
  if (guardandoAviso.value) return
  pedirDatosAbierto.value = false
}

/** Vista previa sin registrar nada: se rehace cada vez que cambia la elección de proveedores. */
async function cargarPedidoDatos() {
  const turno = ++pedidoDatosTurno
  if (!pedirDatosAbierto.value || !candidatosElegidos.value.length) {
    pedidoDatos.texto = ''
    pedidoDatos.nota = ''
    pedidoDatos.puedeEnviar = false
    pedidoDatos.cargando = false
    return
  }
  pedidoDatos.cargando = true
  try {
    const respuesta = await api.previewProviderData(solicitud.value!.id, candidatosElegidos.value.map(Number))
    if (turno !== pedidoDatosTurno) return
    pedidoDatos.texto = respuesta.data.texto || ''
    pedidoDatos.nota = respuesta.data.nota || ''
    pedidoDatos.puedeEnviar = respuesta.data.puede_enviar !== false
  } catch (error: any) {
    if (turno !== pedidoDatosTurno) return
    pedidoDatos.texto = ''
    pedidoDatos.nota = error?.data?.message || error.message || 'No se pudo preparar el mensaje.'
    pedidoDatos.puedeEnviar = false
  } finally {
    if (turno === pedidoDatosTurno) pedidoDatos.cargando = false
  }
}

watch(candidatosElegidos, () => { void cargarPedidoDatos() })

function cerrarAbono() {
  abonoAbierto.value = false
}

function cerrarDatos() {
  datosAbiertoId.value = null
}

function cerrarMotivo() {
  motivo.value = null
}

function cerrarDesglose() {
  desglose.value = null
}

function cerrarVistaPrevia() {
  if (enviandoResumen.value) return
  vistaPrevia.value = null
}

function volverAlListado() {
  if (profile.value === SUPPLIER_PAYMENT_PROFILE.WAREHOUSE) {
    navigateTo('/pago-proveedor/pagos-yuanes')
    return
  }
  navigateTo(esAdmin.value ? '/pago-proveedor/aprobacion-pagos' : '/pago-proveedor/solicitudes')
}

function aplicar(datos: PagoProveedorSolicitud) {
  solicitud.value = datos
  for (const proveedor of datos.proveedores || []) {
    rmb[proveedor.id] = {
      vendedor: proveedor.datos?.vendedor_nombre || '',
      wechat: proveedor.datos?.wechat || ''
    }
  }
}

function colorEstado(estado: string) {
  if (estado === PROVIDER_STATUS.OBSERVED) return 'error'
  if (estado === PROVIDER_STATUS.COMPLETED) return 'success'
  if (estado === PROVIDER_STATUS.CANCELLED) return 'neutral'
  return 'warning'
}

function pasoHecho(proveedor: PagoProveedorSolicitudProveedor, paso: number) {
  return proveedor.estado === PROVIDER_STATUS.COMPLETED || proveedor.etapa > paso
}

function datosEditables(proveedor: PagoProveedorSolicitudProveedor) {
  return !soloLectura.value && (proveedor.puede_editar_etapa1 || !!proveedor.observacion_china)
}

function soloConsolidado(valor: string) {
  return String(valor || '').split(/\s*[-–]\s*/)[0]?.trim() || valor
}

/** Modalidad como en la cotización: Total, 2 abonos, 2 pagos al proveedor o 2 cuotas. */
function etiquetaModalidad(proveedor: PagoProveedorSolicitudProveedor) {
  const pago = proveedor.modalidad_pago === 'fraccionado'
  const abonoFraccionado = proveedor.modalidad_abono === 'fraccionado'
  if (pago && abonoFraccionado) return '2 cuotas'
  if (pago) return '2 pagos al proveedor'
  if (abonoFraccionado) return '2 abonos'
  return 'Total'
}

/** Registros antiguos de creación («Creada · Proveedores en etapa 1.») con el texto de la maqueta. */
function textoHistorial(evento: { accion: string; detalle?: string | null }) {
  if (evento.accion === 'Creada' && solicitud.value?.cotizacion_codigo) {
    return { accion: `Solicitud creada desde la cotización ${solicitud.value.cotizacion_codigo}`, detalle: '' }
  }
  if (evento.accion === 'Datos del proveedor' && evento.detalle) {
    return { accion: `Datos del proveedor ${evento.detalle} registrados`, detalle: '' }
  }
  if ((evento.accion === 'Abono registrado' || evento.accion === 'Abono editado') && evento.detalle) {
    // El back guarda «N.° op · $importe…: código $monto…»; en eventos antiguos solo el N.° de operación.
    const [operacion = '', ...resto] = evento.detalle.split(' · ')
    const abonoItem = (solicitud.value?.abonos || []).find(item => item.numero_operacion === operacion)
    const verbo = evento.accion === 'Abono editado' ? 'editado' : 'registrado'
    const accion = `Abono${abonoItem ? ` #${numeroAbono(abonoItem)}` : ''} ${verbo} · N.° op. ${operacion}`
    if (resto.length || !abonoItem) return { accion, detalle: resto.join(' · ') }
    const aplicado = abonoItem.aplicaciones.map(item => `${nombreProveedor(item.solicitud_proveedor_id)} $${dinero(item.monto)}`).join(', ')
    const detalle = `$${dinero(abonoItem.importe)}${abonoItem.interbancaria ? ' (interbancaria)' : ''}${aplicado ? `: ${aplicado}` : ''}${abonoItem.excedente > 0.004 ? ` · excedente $${dinero(abonoItem.excedente)}` : ''}`
    return { accion, detalle }
  }
  if (evento.accion === 'Pedido de datos' && evento.detalle) {
    return { accion: `Pedido de datos de ${evento.detalle}`, detalle: '' }
  }
  return { accion: evento.accion, detalle: evento.detalle || '' }
}

function cuentaOculta(cuenta?: string | null) {
  return cuenta ? `•••• ${cuenta.replace(/\s/g, '').slice(-4)}` : '—'
}

function fechaCorta(fecha?: string | null) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || '')
  return partes ? `${Number(partes[3])}/${Number(partes[2])}/${partes[1]}` : (fecha || '—')
}

/** N.° de abono dentro de la solicitud (1, 2…), no el id interno. */
function numeroAbono(item: PagoProveedorAbono) {
  if (item.numero) return item.numero
  const ids = (solicitud.value?.abonos || []).map(abonoItem => abonoItem.id).sort((a, b) => a - b)
  return ids.indexOf(item.id) + 1 || item.id
}

function montoAplicado(item: PagoProveedorAbono, proveedorId: number) {
  return item.aplicaciones.find(aplicacion => aplicacion.solicitud_proveedor_id === proveedorId)?.monto ?? item.importe
}

function abonoConDetalle(item: PagoProveedorAbono) {
  return !!item.observacion || item.operacion_repetida || item.excedente_decision === 'reembolso_solicitado' || item.excedente_decision === 'por_consultar' || !!item.puede_elegir_continuacion
}

function etiquetaDatos(estado: string) {
  return { pendiente: 'Sin enviar', enviado: 'Formulario enviado · esperando al cliente', por_autorizar: 'Por autorizar', recibido: 'Recibido ✓' }[estado] || estado
}

function textoExcedente(abonoItem: PagoProveedorAbono) {
  const fila = (solicitud.value?.proveedores || [])
    .flatMap(proveedor => proveedor.progreso?.verification.surpluses || [])
    .find(item => item.deposit_id === abonoItem.id)
  const reembolso = { por_consultar: 'por consultar al cliente', solicitado: 'reembolso solicitado', aprobado: 'reembolso aprobado' }[fila?.refund_status || '']
  if (reembolso) return reembolso
  return {
    aplicado_cuota: 'se aplica a la cuota 2',
    no_devuelve: 'no se devuelve (dentro de la tolerancia)',
    por_consultar: 'por consultar al cliente',
    reembolso_solicitado: 'reembolso solicitado'
  }[abonoItem.excedente_decision || ''] || abonoItem.excedente_decision
}

/** Con cuotas el excedente puede ir a la siguiente cuota; sin cuotas, al servicio de Carga Consolidada (como el back: algún proveedor en 2 cuotas). */
const excedenteConCuotas = computed(() => (solicitud.value?.proveedores || []).some(proveedor => proveedor.modalidad_abono === 'fraccionado'))
/** Excedente cuyo reembolso ya se solicitó y espera a Administración (un abono puede repetirse en varios proveedores). */
const reembolsoSolicitado = computed(() => {
  const porAbono = new Map<number, number>()
  for (const proveedor of solicitud.value?.proveedores || []) {
    for (const fila of proveedor.progreso?.verification.surpluses || []) {
      if (fila.refund_status === 'solicitado') porAbono.set(fila.deposit_id, Number(fila.amount) || 0)
    }
  }
  return [...porAbono.values()].reduce((suma, monto) => suma + monto, 0)
})
const destinoExcedente = computed(() => excedenteConCuotas.value ? 'a la siguiente cuota' : 'al servicio de Carga Consolidada')

/** Nota del excedente en la ventana del voucher, según lo decidido para ese abono. */
function notaExcedente(abonoItem: PagoProveedorAbono) {
  const fila = (solicitud.value?.proveedores || [])
    .flatMap(proveedor => proveedor.progreso?.verification.surpluses || [])
    .find(item => item.deposit_id === abonoItem.id)
  if (fila?.refund_status === 'solicitado') return 'reembolso solicitado: lo aprueba Administración.'
  if (fila?.refund_status === 'aprobado') return 'reembolso aprobado por Administración.'
  const consulta = `se consultará al cliente si prefiere el reembolso o aplicarlo ${(fila ? fila.can_apply_installment : excedenteConCuotas.value) ? 'a la siguiente cuota' : 'al servicio de Carga Consolidada'}.`
  return {
    por_consultar: consulta,
    reembolso_solicitado: consulta,
    aplicado_cuota: 'se aplica a la cuota 2.',
    no_devuelve: 'no se devuelve (dentro de la tolerancia).'
  }[abonoItem.excedente_decision || ''] || ''
}

async function cargar() {
  const respuesta = await api.getRequest(Number(route.params.id))
  aplicar(respuesta.data)
}

async function abrirPedirDatos() {
  try {
    const respuesta = await api.getDataCandidates(solicitud.value!.id)
    candidatosDatos.value = respuesta.data || []
    pedidoDatos.texto = ''
    pedidoDatos.nota = ''
    pedirDatosAbierto.value = true
    // El watch de candidatosElegidos arma la vista previa.
    candidatosElegidos.value = candidatosDatos.value.map(item => String(item.id))
  } catch (error: any) {
    showError('Pedir datos', error?.data?.message || error.message || 'No se pudo cargar los proveedores.')
  }
}

async function enviarPedirDatos() {
  if (!candidatosElegidos.value.length || !pedidoDatos.puedeEnviar) return
  guardandoAviso.value = true
  try {
    const respuesta = await withSpinner(
      () => api.sendProviderData(solicitud.value!.id, candidatosElegidos.value.map(Number)),
      'Enviando WhatsApp…'
    )
    aplicar(respuesta.data.solicitud)
    pedirDatosAbierto.value = false
    showSuccess('WhatsApp enviado', respuesta.data.nota || 'Pedido de datos enviado al cliente.')
  } catch (error: any) {
    showError('Pedir datos', error?.data?.message || error.message || 'No se pudo enviar el mensaje.')
  } finally {
    guardandoAviso.value = false
  }
}

async function enviarResumen() {
  if (!solicitud.value?.cotizacion_id) return
  guardandoAviso.value = true
  try {
    const respuesta = await withSpinner(() => api.previewSummary(solicitud.value!.cotizacion_id), 'Preparando resumen…')
    vistaPrevia.value = {
      tipo: 'resumen',
      texto: respuesta.data.texto,
      nota: respuesta.data.nota,
      puede_enviar: respuesta.data.puede_enviar !== false && !!(respuesta.data.destinatario || solicitud.value?.cliente_whatsapp)
    }
  } catch (error: any) {
    showError('Resumen', error?.data?.message || error.message || 'No se pudo preparar el resumen.')
  } finally {
    guardandoAviso.value = false
  }
}

async function enviarResumenWhatsapp() {
  if (!solicitud.value?.cotizacion_id || !vistaPrevia.value?.puede_enviar) return
  enviandoResumen.value = true
  try {
    const respuesta = await withSpinner(() => api.sendSummary(solicitud.value!.cotizacion_id), 'Enviando WhatsApp…')
    vistaPrevia.value = null
    showSuccess('WhatsApp enviado', respuesta.data.nota || 'Resumen enviado al cliente.')
    await cargar()
  } catch (error: any) {
    showError('WhatsApp', error?.data?.message || error.message || 'No se pudo enviar el mensaje.')
  } finally {
    enviandoResumen.value = false
  }
}

async function descargarResumen() {
  if (!solicitud.value?.cotizacion_id) return
  guardandoAviso.value = true
  try {
    const respuesta = await withSpinner(() => api.downloadSummary(solicitud.value!.cotizacion_id), 'Generando PDF…')
    const pdf = respuesta.data
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdf.base64}`
    link.download = pdf.filename || 'Resumen.pdf'
    link.click()
    showSuccess('PDF', pdf.generado
      ? `Resumen emitido en el paso ${pdf.paso}: ${pdf.paso_nombre}.`
      : 'Resumen descargado. Se reutiliza el PDF ya emitido.')
    await cargar()
  } catch (error: any) {
    showError('PDF', error?.data?.message || error.message || 'No se pudo descargar el PDF.')
  } finally {
    guardandoAviso.value = false
  }
}

async function enviarCuentas() {
  try {
    const respuesta = await withSpinner(() => api.getBankAccounts(solicitud.value!.id), 'Preparando mensaje…')
    const datos = respuesta.data as { texto: string; nota?: string; imagen?: string }
    vistaPrevia.value = {
      ...datos,
      imagen: datos.imagen || '/images/pago-proveedor/cuentas-bancarias.jpg'
    }
  } catch (error: any) {
    showError('Cuentas', error?.data?.message || error.message || 'No se pudo preparar el mensaje.')
  }
}

async function levantarChina(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await withSpinner(
      () => api.liftChina(solicitud.value!.id, proveedor.id, rmb[proveedor.id].vendedor, rmb[proveedor.id].wechat),
      'Guardando…'
    )
    aplicar(respuesta.data)
    datosAbiertoId.value = null
    showSuccess('Observación', 'China ya puede continuar el pago.')
  } catch (error: any) {
    showError('Observación', error?.data?.message || error?.message || 'No se pudo levantar la observación.')
  }
}

async function guardarRmb(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await withSpinner(
      () => api.saveRmb(solicitud.value!.id, proveedor.id, rmb[proveedor.id].vendedor, rmb[proveedor.id].wechat),
      'Guardando…'
    )
    aplicar(respuesta.data)
    datosAbiertoId.value = null
    showSuccess('Datos guardados', proveedor.code_supplier)
  } catch (error: any) {
    showError('Datos del proveedor', error.message || 'No se pudo guardar.')
  }
}

async function enviarFormulario(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await withSpinner(() => api.sendForm(solicitud.value!.id, proveedor.id), 'Preparando enlace…')
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
  } catch (error: any) {
    showError('Formulario T-T', error.message || 'No se pudo preparar el enlace.')
  }
}

async function llenarTt(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await withSpinner(
      () => api.fillForm(solicitud.value!.id, proveedor.id, formularioTt.value),
      'Guardando…'
    )
    aplicar(respuesta.data)
    datosAbiertoId.value = null
    showSuccess('Por autorizar', 'El cliente debe autorizar estos datos antes de ejecutar el pago.')
  } catch (error: any) {
    showError('Formulario T-T', error.message || 'Revisa los datos bancarios.')
  }
}

async function pedirValidacion(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await withSpinner(() => api.requestValidation(solicitud.value!.id, proveedor.id), 'Preparando mensaje…')
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
  } catch (error: any) {
    showError('Validación', error.message || 'No se pudo pedir la validación.')
  }
}

function irACompletarDatos(proveedor: PagoProveedorSolicitudProveedor) {
  vistaEtapa[proveedor.id] = 1
  abrirDatos(proveedor, false)
}

function guardarDatos(proveedor: PagoProveedorSolicitudProveedor) {
  if (proveedor.moneda !== 'RMB') return llenarTt(proveedor)
  return proveedor.observacion_china ? levantarChina(proveedor) : guardarRmb(proveedor)
}

async function copiarDatos(proveedor: PagoProveedorSolicitudProveedor) {
  const datos = proveedor.datos
  const banco = (titulo: string, filas: Array<[string, unknown]>) => [titulo, ...filas.filter(([, valor]) => valor).map(([etiqueta, valor]) => `${etiqueta}: ${valor}`)].join('\n')
  const secciones = [
    banco('Datos del beneficiario (proveedor)', [['Nombre del beneficiario', datos.beneficiario_nombre], ['Número de cuenta', datos.beneficiario_cuenta], ['Dirección del beneficiario', datos.beneficiario_direccion], ['País', datos.beneficiario_pais], ['Ciudad', datos.beneficiario_ciudad]]),
    banco('Datos del banco de destino', [['Tipo de código de banco', datos.banco_tipo_codigo], ['Código de banco pagador', datos.banco_codigo], ['Nombre del Banco', datos.banco_nombre], ['Dirección de banco pagador', datos.banco_direccion], ['País', datos.banco_pais], ['Ciudad', datos.banco_ciudad]])
  ]
  if (datos.usa_intermediario) {
    secciones.push(banco('Datos del banco intermediario', [['Tipo de código de banco', datos.inter_tipo_codigo], ['Código de banco pagador', datos.inter_codigo], ['Nombre del Banco', datos.inter_nombre], ['Dirección de banco pagador', datos.inter_direccion], ['País', datos.inter_pais], ['Ciudad', datos.inter_ciudad]]))
  }
  try {
    await navigator.clipboard.writeText(secciones.join('\n\n'))
    showSuccess('Datos copiados', proveedor.code_supplier)
  } catch {
    showError('Copiar datos', 'El navegador no permitió copiar los datos.')
  }
}

function abrirDatos(proveedor: PagoProveedorSolicitudProveedor, soloLectura = false) {
  const datos = proveedor.datos
  formularioTt.value = {
    beneficiario_nombre: datos?.beneficiario_nombre || '',
    beneficiario_cuenta: datos?.beneficiario_cuenta || '',
    beneficiario_direccion: datos?.beneficiario_direccion || '',
    beneficiario_pais: datos?.beneficiario_pais || '',
    beneficiario_ciudad: datos?.beneficiario_ciudad || '',
    banco_tipo_codigo: datos?.banco_tipo_codigo || 'SWIFT',
    banco_codigo: datos?.banco_codigo || '',
    banco_nombre: datos?.banco_nombre || '',
    banco_direccion: datos?.banco_direccion || '',
    banco_pais: datos?.banco_pais || '',
    banco_ciudad: datos?.banco_ciudad || '',
    usa_intermediario: Boolean(datos?.usa_intermediario),
    inter_tipo_codigo: datos?.inter_tipo_codigo || 'SWIFT',
    inter_codigo: datos?.inter_codigo || '',
    inter_nombre: datos?.inter_nombre || '',
    inter_direccion: datos?.inter_direccion || '',
    inter_pais: datos?.inter_pais || '',
    inter_ciudad: datos?.inter_ciudad || ''
  }
  ttSoloLectura.value = soloLectura
  datosAbiertoId.value = proveedor.id
}

function abrirMotivo(proveedor: PagoProveedorSolicitudProveedor, tipo: TipoMotivo) {
  motivo.value = { proveedor, tipo, texto: '' }
}

async function confirmarMotivo() {
  if (!motivo.value || !solicitud.value) return
  const { proveedor, tipo } = motivo.value
  const texto = motivo.value.texto.trim()
  if (!texto) return
  guardandoMotivo.value = true
  try {
    const respuesta = await withSpinner(
      () => {
        if (tipo === 'observar') return api.observeProvider(solicitud.value!.id, proveedor.id, texto)
        if (tipo === 'anular') return api.cancelProvider(solicitud.value!.id, proveedor.id, texto)
        return api.liftObservation(solicitud.value!.id, proveedor.id, texto)
      },
      'Guardando…'
    )
    aplicar(respuesta.data)
    motivo.value = null
  } catch (error: any) {
    showError(textosMotivo[tipo].titulo, error?.data?.message || error.message || 'No se pudo guardar.')
  } finally {
    guardandoMotivo.value = false
  }
}

function datosPendientes(proveedor: PagoProveedorSolicitudProveedor) {
  if (proveedor.observacion_china) return true
  if (proveedor.moneda === 'RMB') return !proveedor.datos?.wechat
  return !['recibido', 'por_autorizar'].includes(proveedor.datos?.estado || '')
}

function abonosProveedor(proveedorId: number) {
  return (solicitud.value?.abonos || []).filter((abono) =>
    (abono.aplicaciones || []).some((item) => item.solicitud_proveedor_id === proveedorId)
  )
}

function abonoObservado(proveedor: PagoProveedorSolicitudProveedor) {
  return (solicitud.value?.abonos || []).find(abono => abono.observacion && abono.aplicaciones?.some(aplicacion => aplicacion.solicitud_proveedor_id === proveedor.id)) || null
}

/** Franja «Por realizar»: solo cuando a Ventas le toca algo (VW-12). */
function porRealizar(proveedor: PagoProveedorSolicitudProveedor) {
  if (proveedor.observacion_ventas || proveedor.estado === 'anulado' || proveedor.estado === 'completado') return ''
  const aprobacion = proveedor.progreso?.verification.approval
  const tareas: string[] = []
  if (proveedor.observacion_china) tareas.push('corregir el dato del proveedor y levantar la observación')
  if (proveedor.etapa === 1 && proveedor.estado !== 'observado') {
    if (datosPendientes(proveedor)) {
      const datos = proveedor.moneda === 'RMB' ? 'completar los datos del proveedor' : 'completar los datos bancarios del proveedor'
      tareas.push(proveedor.saldo <= 0.004 && proveedor.importe_abonado > 0 ? `${datos} (con el importe completo, pasará solo a Validación de pago)` : datos)
    }
    if (proveedor.saldo > 0.004) tareas.push(proveedor.importe_abonado > 0 ? `registrar el abono faltante (${dinero(proveedor.saldo)})` : 'registrar el abono del cliente')
  }
  if (aprobacion?.state === 'to_collect') tareas.push(`avisar al cliente que debe abonar ${aprobacion.collect_amount ? `$${dinero(aprobacion.collect_amount)}` : 'la diferencia'} y registrar el voucher de la diferencia`)
  else if (abonoObservado(proveedor)) tareas.push('avisar al cliente que el depósito no ingresó y, si corresponde, corregir o registrar el abono correcto')
  else if (aprobacion?.state === 'registration_error') tareas.push('corregir tu voucher o tus datos y levantar la observación')
  if (aprobacion?.state === 'waiting_shared') tareas.push('consultar al cliente qué proveedores continúan con este dinero; los demás quedan pendientes con lo que sobre')
  if (proveedor.etapa >= 2 && proveedor.etapa < 4) {
    for (const fila of proveedor.progreso?.verification.surpluses || []) {
      if (fila.refund_status === 'solicitado') tareas.push(`esperar la aprobación del reembolso de $${dinero(fila.amount)} por Administración`)
      else if (fila.refund_status === 'por_consultar' || fila.decision === 'por_consultar' || (fila.decision === 'reembolso_solicitado' && !fila.refund_status)) {
        tareas.push(fila.can_apply_installment
          ? `consultar al cliente qué prefiere para el excedente de $${dinero(fila.amount)}: reembolso (pedirle sus cuentas bancarias) o aplicarlo a su siguiente cuota`
          : `consultar al cliente qué prefiere para el excedente de $${dinero(fila.amount)}: reembolso (pedirle sus cuentas bancarias) o aplicarlo al servicio de Carga Consolidada`)
      }
    }
  }
  if (aprobacion?.state === 'missing_data') tareas.push('completar los datos del proveedor')
  if (proveedor.etapa === 3 && !proveedor.observacion_china && datosPendientes(proveedor)) tareas.push('completar los datos del proveedor: sin ellos el pago no se puede ejecutar')
  return tareas.length ? `${tareas.join(' · ')}.` : ''
}

/** Franja «En manos de»: solo cuando Ventas no tiene nada que hacer. */
function enManos(proveedor: PagoProveedorSolicitudProveedor) {
  if (proveedor.estado !== 'en_proceso' || porRealizar(proveedor)) return ''
  if (proveedor.etapa === 2) return 'En manos de Administración: verifica el depósito y aprueba el pago. Te avisamos cuando lo aprueben.'
  if (proveedor.etapa !== 3) return ''
  const quien = proveedor.moneda === 'RMB' ? 'Operaciones China' : 'Administración'
  const aprobado = proveedor.progreso?.verification.approval.decided_at
  let desde = ''
  if (aprobado) {
    const dias = Math.floor((Date.now() - new Date(aprobado).getTime()) / 86400000)
    desde = ` desde el ${new Date(aprobado).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}${dias >= 1 ? ` (hace ${dias} día${dias > 1 ? 's' : ''})` : ''}`
  }
  return `En manos de ${quien}${desde}. Te avisamos cuando suban la constancia.`
}

function editarAbonoPorId(id: number) {
  const item = (solicitud.value?.abonos || []).find(abonoItem => abonoItem.id === id)
  if (item) editarAbono(item)
}

function verVoucherPorId(id: number) {
  voucherAbierto.value = (solicitud.value?.abonos || []).find(abonoItem => abonoItem.id === id) || null
}

function abrirContinuacion(proveedor: PagoProveedorSolicitudProveedor) {
  abonoContinuacion.value = abonosProveedor(proveedor.id).find(item => item.puede_elegir_continuacion) || null
}

function abrirAbono() {
  abonoEditandoId.value = null
  abono.importe = 0
  abono.fecha = ''
  abono.operacion = ''
  abono.banco = 'bcp'
  abono.interbancaria = false
  voucher.value = null
  montosManuales.value = false
  abono.montos = {}
  for (const proveedor of proveedoresConSaldo.value) abono.montos[proveedor.id] = 0
  abonoAbierto.value = true
}

function editarAbono(abonoItem: PagoProveedorAbono) {
  abonoEditandoId.value = abonoItem.id
  abono.importe = abonoItem.importe
  abono.fecha = abonoItem.fecha_pago
  abono.operacion = abonoItem.numero_operacion
  abono.banco = abonoItem.banco
  abono.interbancaria = abonoItem.interbancaria
  voucher.value = null
  abono.montos = {}
  for (const proveedor of solicitud.value?.proveedores || []) {
    const aplicacion = abonoItem.aplicaciones.find(item => item.solicitud_proveedor_id === proveedor.id)
    abono.montos[proveedor.id] = aplicacion ? Number(aplicacion.monto) : 0
  }
  abonoAbierto.value = true
}

// Marcar el proveedor sugiere aplicar lo que queda del importe recibido; desmarcarlo lo deja en cero.
function alternarProveedor(proveedor: PagoProveedorSolicitudProveedor, checked: boolean) {
  montosManuales.value = true
  if (!checked) {
    abono.montos[proveedor.id] = 0
    return
  }
  const otros = Object.entries(abono.montos)
    .filter(([id]) => Number(id) !== proveedor.id)
    .reduce((suma, [, monto]) => suma + (Number(monto) || 0), 0)
  const recibido = Number(abono.importe) || 0
  const disponible = Math.max(0, recibido - otros)
  const monto = Math.min(saldoParaAbono(proveedor), disponible) || saldoParaAbono(proveedor)
  abono.montos[proveedor.id] = Math.round(monto * 100) / 100
  if (!recibido) abono.importe = Math.round((otros + monto) * 100) / 100
}

function aplicarMonto(proveedor: PagoProveedorSolicitudProveedor, valor: number) {
  montosManuales.value = true
  const monto = Math.min(Math.max(Number(valor) || 0, 0), saldoParaAbono(proveedor))
  abono.montos[proveedor.id] = Math.round(monto * 100) / 100
}

function distribuir() {
  let resto = Number(abono.importe) || 0
  for (const proveedor of proveedoresConSaldo.value) {
    const aplicadoProveedor = Math.min(saldoParaAbono(proveedor), Math.max(0, resto))
    abono.montos[proveedor.id] = Math.round(aplicadoProveedor * 100) / 100
    resto = Math.round((resto - aplicadoProveedor) * 100) / 100
  }
}

function elegirVoucher(evento: Event) {
  const input = evento.target as HTMLInputElement
  voucher.value = input.files?.[0] || null
  input.value = ''
}

/** Lo que este abono le aplicó al proveedor antes de editarlo: vuelve a estar disponible para repartir. */
function aplicadoPorAbonoEnEdicion(proveedor: PagoProveedorSolicitudProveedor) {
  const aplicacion = abonoEnEdicion.value?.aplicaciones?.find(item => item.solicitud_proveedor_id === proveedor.id)
  return aplicacion ? Number(aplicacion.monto) || 0 : 0
}

function saldoParaAbono(proveedor: PagoProveedorSolicitudProveedor) {
  return Math.round((proveedor.saldo + aplicadoPorAbonoEnEdicion(proveedor)) * 100) / 100
}

function abonadoOtros(proveedor: PagoProveedorSolicitudProveedor) {
  return Math.max(0, Math.round((proveedor.importe_abonado - aplicadoPorAbonoEnEdicion(proveedor)) * 100) / 100)
}

watch(() => abono.importe, () => {
  if (!abonoAbierto.value || abonoEditandoId.value || montosManuales.value) return
  distribuir()
})

async function guardarAbono() {
  if (!solicitud.value) return
  if (!abonoEditandoId.value && !voucher.value) {
    showError('Comprobante', 'Adjunta el voucher.')
    return
  }
  guardandoAbono.value = true
  try {
    const form = new FormData()
    form.append('importe', String(abono.importe))
    form.append('fecha_pago', abono.fecha)
    form.append('numero_operacion', abono.operacion)
    form.append('banco', abono.banco)
    form.append('interbancaria', abono.interbancaria ? '1' : '0')
    if (voucher.value) form.append('voucher', voucher.value)
    form.append('aplicaciones', JSON.stringify(
      Object.entries(abono.montos)
        .filter(([, monto]) => Number(monto) > 0)
        .map(([id, monto]) => ({ solicitud_proveedor_id: Number(id), monto: Number(monto) }))
    ))
    const editando = Boolean(abonoEditandoId.value)
    const respuesta = await withSpinner(
      () => api.registerDeposit(solicitud.value!.id, form, abonoEditandoId.value || undefined),
      editando ? 'Guardando cambios…' : 'Registrando comprobante…'
    )
    aplicar(respuesta.data.solicitud)
    abonoAbierto.value = false
    abonoEditandoId.value = null
    showSuccess(editando ? 'Comprobante actualizado' : 'Comprobante registrado', respuesta.data.aviso_operacion_repetida || 'Quedó en validación.')
  } catch (error: any) {
    showError('Comprobante', error.message || 'No se pudo registrar.')
  } finally {
    guardandoAbono.value = false
  }
}

function anularAbono(abonoItem: { id: number }) {
  showConfirmation('Anular abono', 'El voucher se conserva, pero deja de aplicar a los proveedores.', async () => {
    try {
      const respuesta = await withSpinner(() => api.cancelDeposit(solicitud.value!.id, abonoItem.id), 'Anulando…')
      aplicar(respuesta.data)
      showSuccess('Abono', 'El abono quedó anulado.')
    } catch (error: any) {
      showError('Abono', error.message || 'No se pudo anular.')
    }
  })
}

function nombreProveedor(id: number) {
  const proveedor = solicitud.value?.proveedores?.find(item => item.id === id)
  return proveedor?.code_supplier || `Proveedor ${id}`
}

function alternarContinuacion(abonoId: number, proveedorId: number, checked: boolean) {
  const actuales = continuacion[abonoId] || []
  continuacion[abonoId] = checked
    ? [...new Set([...actuales, proveedorId])]
    : actuales.filter((id) => id !== proveedorId)
}

async function guardarContinuacion(abonoId: number) {
  const elegidos = continuacion[abonoId] || []
  if (!elegidos.length || !solicitud.value) return
  try {
    const respuesta = await withSpinner(
      () => api.chooseContinuation(solicitud.value!.id, abonoId, elegidos),
      'Guardando…'
    )
    aplicar(respuesta.data)
    abonoContinuacion.value = null
    showSuccess('Voucher compartido', 'Los proveedores elegidos continúan con el pago.')
  } catch (error: any) {
    showError('Voucher compartido', error?.data?.message || error.message || 'No se pudo guardar.')
  }
}

async function decidir(abonoId: number, decision: string) {
  try {
    const respuesta = await withSpinner(
      () => api.decideSurplus(solicitud.value!.id, abonoId, decision),
      'Guardando…'
    )
    aplicar(respuesta.data)
    showSuccess(
      'Excedente',
      decision === 'aplicado_cuota'
        ? 'El excedente se aplicará a la cuota 2.'
        : 'Reembolso solicitado. Administración registra el voucher.'
    )
  } catch (error: any) {
    showError('Excedente', error?.data?.message || error.message || 'No se pudo registrar la decisión.')
  }
}

onMounted(async () => {
  try {
    await cargar()
  } catch (error: any) {
    showError('Solicitud', error.message || 'No se pudo abrir la solicitud.')
  } finally {
    cargando.value = false
  }
})
</script>
