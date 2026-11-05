<template>
  <div class="mx-auto max-w-5xl space-y-4 p-6">
    <PageHeader :hide-back-button="false" @back="navigateTo('/pago-proveedor/solicitudes')" />
    <div v-if="cargando" class="space-y-4">
      <USkeleton class="h-8 w-72" />
      <USkeleton class="h-36 w-full rounded-2xl" />
      <div class="grid gap-3 sm:grid-cols-3">
        <USkeleton class="h-24 rounded-2xl" />
        <USkeleton class="h-24 rounded-2xl" />
        <USkeleton class="h-24 rounded-2xl" />
      </div>
    </div>

    <template v-else-if="solicitud">
      <header class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight text-highlighted">Orden N.° {{ solicitud.numero_orden }} — {{ solicitud.cliente_nombre }}</h1>
          <span v-if="solicitud.cod_cotizacion_cc" class="rounded-full border border-default px-3 py-0.5 text-xs text-muted">Cotización C.C N.° {{ solicitud.cod_cotizacion_cc }}</span>
        </div>

        <UCard>
          <div class="mb-4 flex items-center gap-3">
            <span class="icono"><UIcon name="i-lucide-user" class="size-5" /></span>
            <h2 class="text-base font-bold">Datos del cliente</h2>
          </div>
          <dl class="grid gap-3 sm:grid-cols-2">
            <div><dt class="text-sm text-muted">N.° de consolidado</dt><dd class="font-bold">{{ solicitud.consolidado ? `Consolidado ${solicitud.consolidado}` : '—' }}</dd></div>
            <div><dt class="text-sm text-muted">Nombre y apellido</dt><dd class="font-bold">{{ solicitud.cliente_nombre || '—' }}</dd></div>
            <div><dt class="text-sm text-muted">WhatsApp</dt><dd class="font-bold">{{ solicitud.cliente_whatsapp || '—' }}</dd></div>
            <div><dt class="text-sm text-muted">Correo electrónico</dt><dd class="font-bold">{{ solicitud.cliente_correo || '—' }}</dd></div>
          </dl>
        </UCard>

        <p v-if="solicitud.cotizacion_codigo" class="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Creada desde la cotización {{ solicitud.cotizacion_codigo }}.</p>

        <UCard>
          <div class="mb-4 flex items-center gap-3">
            <span class="icono"><UIcon name="i-lucide-chart-no-axes-column" class="size-5" /></span>
            <h2 class="text-base font-bold">Resumen financiero</h2>
          </div>
          <dl class="grid gap-3" :class="(solicitud.excedente || 0) > 0.004 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'">
            <div class="rounded-xl border border-default p-4"><dt class="text-sm text-muted">Total cotizado</dt><dd class="mt-1 text-3xl font-bold">${{ dinero(solicitud.total_cotizado || 0) }}</dd></div>
            <div class="rounded-xl border border-default p-4"><dt class="text-sm text-muted">Total abonado</dt><dd class="mt-1 text-3xl font-bold">${{ dinero(solicitud.total_abonado || 0) }}</dd></div>
            <div
              class="rounded-xl border p-4"
              :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400'"
            >
              <dt class="text-sm">Saldo pendiente</dt>
              <dd class="mt-1 text-3xl font-bold">${{ dinero(solicitud.saldo_pendiente || 0) }}</dd>
              <em class="mt-1 block text-sm font-semibold not-italic">{{ (solicitud.saldo_pendiente || 0) > 0.004 ? 'Falta abonar' : '✓ Cubierto' }}</em>
            </div>
            <div v-if="(solicitud.excedente || 0) > 0.004" class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <dt class="text-sm">Excedente</dt>
              <dd class="mt-1 text-3xl font-bold">${{ dinero(solicitud.excedente || 0) }}</dd>
              <em class="mt-1 block text-sm not-italic">Revisa los abonos para consultar, devolver o aplicar a la cuota.</em>
            </div>
          </dl>
        </UCard>

        <UAlert
          v-if="esAdmin"
          color="info"
          variant="subtle"
          title="Solo lectura para Administración"
          description="Las decisiones de Admin se hacen en Aprobación de pagos y Pagos en dólares. Aquí revisas el expediente sin acciones de Ventas."
        />

        <div v-if="!esAdmin && hayProveedoresActivos" class="flex flex-wrap items-center gap-2.5">
          <UButton v-if="solicitud.cotizacion_id" class="boton-barra" color="neutral" variant="outline" icon="i-lucide-pencil" :disabled="!hayAccionEtapa1" :to="hayAccionEtapa1 ? `/pago-proveedor/cotizaciones/${solicitud.cotizacion_id}` : undefined">Formulario de la solicitud</UButton>
          <UButton v-if="solicitud.cotizacion_id" class="boton-barra" :class="{ 'boton-activo': ctaPrincipal === 'resumen' }" color="neutral" variant="outline" icon="i-lucide-send" title="Si cambias algo en la solicitud, reenvía el resumen actualizado." :loading="guardandoAviso" :disabled="!hayAccionEtapa1" @click="enviarResumen">Enviar resumen al cliente</UButton>
          <UButton v-if="solicitud.cotizacion_id" class="boton-barra" color="neutral" variant="outline" icon="i-lucide-download" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
          <UButton class="boton-barra" :class="{ 'boton-activo': ctaPrincipal === 'datos' }" color="neutral" variant="outline" icon="i-lucide-users" :disabled="!proveedoresSinDatos" :title="proveedoresSinDatos ? undefined : 'Todos los proveedores ya tienen sus datos completos.'" @click="abrirPedirDatos">
            Pedir datos del proveedor
            <span v-if="proveedoresSinDatos" class="ml-1 rounded-full bg-white px-1.5 text-xs font-bold text-orange-600">{{ proveedoresSinDatos }}</span>
          </UButton>
          <UButton class="boton-barra" :class="{ 'boton-activo': ctaPrincipal === 'cuentas' }" color="neutral" variant="outline" icon="i-lucide-landmark" :disabled="!hayAccionEtapa1 || (solicitud.saldo_pendiente || 0) <= 0.004" @click="enviarCuentas">Enviar cuentas bancarias</UButton>
        </div>
        <div v-else-if="esAdmin" class="flex flex-wrap items-center gap-2">
          <UButton v-if="solicitud.cotizacion_id" class="boton-barra" color="neutral" variant="outline" icon="i-lucide-download" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
          <UButton class="boton-barra" color="neutral" variant="outline" to="/pago-proveedor/solicitudes">Ir a Aprobación / Pagos</UButton>
        </div>
      </header>

      <h2 class="text-xl font-bold">Seguimiento por proveedor</h2>

      <UCard v-for="proveedor in solicitud.proveedores || []" :key="proveedor.id" :ui="{ body: 'p-0 sm:p-0' }">
        <button type="button" class="flex w-full items-center gap-4 p-5 text-left" @click="toggleProveedor(proveedor.id)">
          <span class="icono icono-grande"><UIcon name="i-lucide-store" class="size-6" /></span>
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2">
              <strong class="text-lg">{{ proveedor.code_supplier || proveedor.titulo }}</strong>
              <span class="rounded-full bg-elevated px-2.5 py-0.5 text-xs font-semibold text-muted">Proveedor {{ proveedor.orden }}</span>
            </p>
            <p class="text-sm text-muted">
              {{ [proveedor.nombre_proveedor, proveedor.producto, proveedor.moneda === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T'].filter(Boolean).join(' · ') }}
              <strong v-if="proveedor.codigo_solicitud" class="text-highlighted"> · {{ proveedor.codigo_solicitud }}</strong>
            </p>
          </div>
          <UBadge :color="colorEstado(proveedor.estado)" variant="soft" class="rounded-full px-3 py-1" :label="proveedor.estado_nombre" />
          <UIcon :name="proveedorAbierto[proveedor.id] === false ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'" class="size-4 text-muted" />
        </button>

        <div v-show="proveedorAbierto[proveedor.id] !== false" class="border-t border-default p-5">
          <ol class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <li v-for="paso in pasos" :key="paso.n" class="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                class="flex items-center gap-2.5 whitespace-nowrap text-sm disabled:cursor-default"
                :disabled="paso.n > proveedor.etapa"
                :title="paso.n < proveedor.etapa ? 'Revisar este paso' : undefined"
                @click="vistaEtapa[proveedor.id] = paso.n"
              >
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  :class="pasoHecho(proveedor, paso.n) ? 'bg-green-700 text-white' : paso.n === proveedor.etapa ? 'bg-orange-500 text-white ring-4 ring-orange-100 dark:ring-orange-950' : 'bg-elevated text-muted'"
                >
                  <UIcon v-if="pasoHecho(proveedor, paso.n)" name="i-lucide-check" class="size-4" />
                  <template v-else>{{ paso.n }}</template>
                </span>
                <span :class="[paso.n === proveedor.etapa && !pasoHecho(proveedor, paso.n) ? 'font-semibold text-orange-600' : 'text-muted', (vistaEtapa[proveedor.id] ?? proveedor.etapa) === paso.n ? 'underline underline-offset-4' : '']">{{ paso.nombre }}</span>
              </button>
              <span v-if="paso.n < 4" class="hidden h-px min-w-6 flex-1 lg:block" :class="pasoHecho(proveedor, paso.n) ? 'bg-green-700' : 'bg-accented'" />
            </li>
          </ol>
          <UButton v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) !== proveedor.etapa" class="mt-2" size="xs" color="neutral" variant="outline" @click="vistaEtapa[proveedor.id] = proveedor.etapa">Volver al paso actual</UButton>

          <p v-if="proveedor.estado === 'anulado'" class="mt-4 rounded-lg bg-elevated px-4 py-2.5 text-sm text-muted">Anulado<template v-if="proveedor.motivo_anulacion"> — {{ proveedor.motivo_anulacion }}</template>.</p>
          <p v-else-if="proveedor.estado === 'completado'" class="mt-4 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">✓ Completado. El pago se ejecutó y no quedó nada pendiente.</p>
          <div v-if="proveedor.observacion_ventas" class="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
            <strong>Observado</strong> — {{ proveedor.observacion_ventas.motivo }}.
            <button v-if="!esAdmin" type="button" class="ml-1 font-bold underline" @click="abrirMotivo(proveedor, 'levantar')">Levantar observación</button>
          </div>

          <div v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) === 1 && proveedor.estado !== 'anulado'" class="mt-4 grid gap-3 lg:grid-cols-3">
            <div class="bloque" :class="{ 'bloque-pendiente': datosPendientes(proveedor) }">
              <div class="mb-3 flex items-start gap-3">
                <span class="icono"><UIcon name="i-lucide-user" class="size-5" /></span>
                <div>
                  <h3 class="font-bold">{{ proveedor.moneda === 'RMB' ? 'Datos del proveedor' : 'Datos bancarios (T-T)' }}</h3>
                  <span class="pastilla mt-1" :class="datosPendientes(proveedor) ? 'pastilla-pendiente' : 'pastilla-ok'">{{ datosPendientes(proveedor) ? '! Pendientes' : '✓ Completos' }}</span>
                </div>
              </div>

              <template v-if="proveedor.moneda === 'RMB'">
                <p v-if="proveedor.observacion_china" class="mb-2 text-sm text-error">Observación de China: {{ proveedor.observacion_china.label }}<span v-if="proveedor.observacion_china.detail"> · {{ proveedor.observacion_china.detail }}</span></p>
                <dl v-if="proveedor.datos.wechat" class="mb-3 space-y-1 text-sm">
                  <div class="flex justify-between gap-2"><dt class="text-muted">Nombre del vendedor</dt><dd class="font-semibold">{{ proveedor.datos.vendedor_nombre || '—' }}</dd></div>
                  <div class="flex justify-between gap-2"><dt class="text-muted">N.° de WeChat</dt><dd class="font-semibold">{{ proveedor.datos.wechat }}</dd></div>
                </dl>
                <p v-else class="mb-3 text-sm text-muted">Faltan el nombre del vendedor y su N.° de WeChat.</p>
                <UButton color="neutral" variant="outline" size="sm" :icon="datosEditables(proveedor) ? 'i-lucide-pencil' : undefined" @click="abrirDatos(proveedor, !datosEditables(proveedor))">
                  {{ !datosEditables(proveedor) ? 'Ver' : proveedor.datos.wechat ? 'Editar' : 'Completar' }}
                </UButton>
              </template>

              <template v-else>
                <span class="pastilla" :class="proveedor.datos.estado === 'recibido' ? 'pastilla-ok' : 'bg-elevated text-muted'">{{ etiquetaDatos(proveedor.datos.estado) }}<template v-if="proveedor.datos.correccion_solicitada"> · corrección pedida</template></span>
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
                      <UButton size="sm" class="boton-activo" icon="i-mdi-whatsapp" @click="pedirValidacion(proveedor)">Enviar al cliente para autorización</UButton>
                      <UButton size="sm" color="neutral" variant="outline" @click="abrirDatos(proveedor, false)">Editar borrador</UButton>
                    </template>
                    <template v-else>
                      <UButton size="sm" class="boton-activo" icon="i-mdi-whatsapp" @click="enviarFormulario(proveedor)">{{ proveedor.datos.estado === 'enviado' ? 'Reenviar formulario' : 'Enviar formulario' }}</UButton>
                      <UButton size="sm" color="neutral" variant="outline" title="Solo en casos excepcionales: el cliente debe revisar y autorizar los datos" @click="abrirDatos(proveedor, false)">Llenar por el cliente</UButton>
                    </template>
                  </template>
                  <UButton v-else-if="proveedor.datos.beneficiario_nombre" size="sm" color="neutral" variant="outline" icon="i-lucide-eye" @click="abrirDatos(proveedor, true)">Ver</UButton>
                </div>
              </template>
            </div>

            <div class="bloque" :class="{ 'bloque-pendiente': proveedor.saldo > 0.004 && proveedor.importe_abonado > 0 }">
              <div class="mb-3 flex items-center gap-3">
                <span class="icono"><UIcon name="i-lucide-file-text" class="size-5" /></span>
                <h3 class="font-bold">Comprobante de pago</h3>
              </div>
              <UAlert v-if="proveedor.puede_registrar_diferencia" class="mb-2" color="warning" variant="subtle" description="Administración dejó este pago por cobrar. Registra el comprobante de la diferencia." />
              <div v-for="item in abonosProveedor(proveedor.id)" :key="item.id" class="mb-2 flex items-start justify-between gap-2 text-sm">
                <div>
                  <strong>Abono #{{ item.id }} · ${{ dinero(montoAplicado(item, proveedor.id)) }}</strong>
                  <p class="text-muted">{{ fechaCorta(item.fecha_pago) }} · {{ item.banco.toUpperCase() }}</p>
                  <p class="text-muted">N.° de operación {{ item.numero_operacion || '—' }}<template v-if="item.aplicaciones.length > 1"> · voucher compartido</template></p>
                </div>
                <div class="flex shrink-0 gap-1">
                  <UButton v-if="item.voucher_url" size="xs" color="neutral" variant="outline" icon="i-lucide-receipt-text" title="Ver voucher" :to="item.voucher_url" target="_blank" />
                  <template v-if="!esAdmin">
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-pencil" title="Editar abono" :disabled="!item.puede_editar" @click="editarAbono(item)" />
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-trash-2" title="Anular abono" :disabled="!item.puede_anular" @click="anularAbono(item)" />
                  </template>
                </div>
              </div>
              <p v-if="!abonosProveedor(proveedor.id).length" class="mb-3 text-sm text-muted">Sin abonos registrados.</p>
              <UButton v-if="!esAdmin && (proveedor.puede_editar_etapa1 || proveedor.puede_registrar_diferencia) && proveedor.saldo > 0.004" class="boton-activo" size="sm" @click="abrirAbono()">
                {{ proveedor.importe_abonado > 0 ? 'Registrar otro abono' : 'Registrar comprobante' }}
              </UButton>
            </div>

            <div class="bloque">
              <div class="mb-3 flex items-center gap-3">
                <span class="icono"><UIcon name="i-lucide-circle-dollar-sign" class="size-5" /></span>
                <h3 class="font-bold">{{ proveedor.etapa > 1 ? 'Total abonado' : 'Total pendiente de abono' }}</h3>
              </div>
              <p class="text-3xl font-bold" :class="proveedor.saldo > 0.004 && proveedor.etapa === 1 ? 'text-orange-600' : ''">${{ dinero(proveedor.etapa > 1 ? proveedor.importe_abonado : proveedor.saldo) }}</p>
              <span class="pastilla my-2" :class="proveedor.saldo > 0.004 ? 'pastilla-pendiente' : 'pastilla-ok'">
                {{ proveedor.saldo > 0.004 ? (proveedor.importe_abonado > 0 ? `Falta abonar $${dinero(proveedor.saldo)}` : 'Sin abonar') : '✓ Cubierto' }}
              </span>
              <p class="text-sm text-muted">Cotizado ${{ dinero(proveedor.importe_requerido) }} · Abonado ${{ dinero(proveedor.importe_abonado) }}</p>
              <p v-if="proveedor.etiqueta_bancaria" class="text-sm text-muted">Bancaria {{ proveedor.etiqueta_bancaria.toLowerCase() }}</p>
              <button type="button" class="mt-1 text-sm font-semibold text-orange-600 underline" @click="desglose = proveedor">Ver desglose del cobro</button>
            </div>
          </div>

          <template v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) === proveedor.etapa && siguientePaso(proveedor)">
            <div class="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              <strong v-if="proveedor.etapa === 1">Por realizar: </strong>{{ siguientePaso(proveedor) }}
              <UButton v-if="!esAdmin && abonoObservado(proveedor)" class="ml-2" size="xs" color="warning" @click="editarAbono(abonoObservado(proveedor)!)">Corregir comprobante</UButton>
              <UButton v-if="!esAdmin && proveedor.puede_registrar_diferencia && !abonoObservado(proveedor)" class="ml-2" size="xs" color="warning" @click="abrirAbono()">Registrar voucher de la diferencia</UButton>
            </div>
          </template>
          <p v-else-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) !== proveedor.etapa" class="mt-3 text-sm text-muted">
            Estás revisando este paso en solo lectura. El paso actual del proveedor es {{ proveedor.etapa }}.
          </p>

          <SupplierPaymentProgress
            v-if="solicitud.id && proveedor.estado !== 'anulado'"
            :solicitud-id="solicitud.id"
            :proveedor="proveedor"
            :tipo-cambio="solicitud.tipo_cambio"
            :readonly="esAdmin"
            :viewing="vistaEtapa[proveedor.id] ?? proveedor.etapa"
            @saved="cargar"
            @complete-data="irACompletarDatos(proveedor)"
          />

          <div v-if="!esAdmin && proveedor.estado === 'en_proceso' && (proveedor.etapa !== 2 || proveedor.puede_editar_etapa1)" class="mt-4 flex flex-wrap gap-2">
            <UButton color="neutral" variant="outline" icon="i-lucide-eye" @click="abrirMotivo(proveedor, 'observar')">Observar</UButton>
            <UButton v-if="proveedor.puede_editar_etapa1" color="error" variant="outline" icon="i-lucide-trash-2" @click="abrirMotivo(proveedor, 'anular')">Anular</UButton>
          </div>
          <div v-else-if="!esAdmin && proveedor.observacion_ventas && proveedor.puede_editar_etapa1" class="mt-4">
            <UButton color="error" variant="outline" icon="i-lucide-trash-2" @click="abrirMotivo(proveedor, 'anular')">Anular</UButton>
          </div>
        </div>
      </UCard>

      <UCard v-if="(solicitud.abonos || []).length">
        <h2 class="font-bold">Abonos registrados</h2>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-muted">
                <th class="pb-2 pr-3">#</th>
                <th class="pb-2 pr-3">Fecha</th>
                <th class="pb-2 pr-3">Banco</th>
                <th class="pb-2 pr-3">Importe</th>
                <th class="pb-2 pr-3">Aplicado a</th>
                <th class="pb-2 pr-3">Excedente</th>
                <th class="pb-2 pr-3">Estado</th>
                <th class="pb-2">Voucher</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="abono in solicitud.abonos" :key="abono.id">
                <tr class="border-t border-default" :class="{ 'opacity-50': abono.estado === 'anulado' }">
                  <td class="py-2 pr-3">{{ abono.id }}</td>
                  <td class="py-2 pr-3 whitespace-nowrap">{{ fechaCorta(abono.fecha_pago) }}</td>
                  <td class="py-2 pr-3">{{ abono.banco.toUpperCase() }}</td>
                  <td class="py-2 pr-3">${{ dinero(abono.importe) }}</td>
                  <td class="py-2 pr-3">{{ abono.aplicaciones.map(item => `${nombreProveedor(item.solicitud_proveedor_id)} $${dinero(item.monto)}`).join(', ') }}</td>
                  <td class="py-2 pr-3">
                    <template v-if="abono.excedente > 0">
                      ${{ dinero(abono.excedente) }} <span class="text-xs text-muted">{{ textoExcedente(abono.excedente_decision) }}</span>
                      <span v-if="abono.excedente_decide_text" class="block text-xs" :class="abono.excedente_decide_overdue ? 'font-semibold text-error' : 'text-warning'">{{ abono.excedente_decide_text }}</span>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="py-2 pr-3">{{ abono.estado_nombre }}</td>
                  <td class="py-2"><UButton v-if="abono.voucher_url" size="xs" color="neutral" variant="outline" icon="i-lucide-receipt-text" title="Ver voucher" :to="abono.voucher_url" target="_blank" /></td>
                </tr>
                <tr v-if="abonoConDetalle(abono)">
                  <td colspan="8" class="pb-3">
                    <UAlert v-if="abono.observacion" color="error" variant="subtle" :title="`Observado: ${abono.observacion.motivo}`" :description="[abono.observacion.detalle, abono.observacion.plazo].filter(Boolean).join(' · ') || undefined" />
                    <p v-if="abono.excedente_decision === 'reembolso_solicitado'" class="mt-1 text-info">Administración ya puede registrar el voucher del reembolso. Pide las cuentas bancarias al cliente.</p>
                    <p v-if="abono.operacion_repetida" class="mt-1 text-warning">El número de operación ya estaba registrado.</p>
                    <div v-if="!esAdmin" class="mt-1 flex flex-wrap items-center gap-3">
                      <template v-if="abono.excedente_decision === 'por_consultar'">
                        <button v-if="hayCuotas" type="button" class="font-semibold text-primary" @click="decidir(abono.id, 'aplicado_cuota')">Aplicar a la siguiente cuota</button>
                        <button type="button" class="font-semibold text-primary" @click="decidir(abono.id, 'reembolso_solicitado')">Solicitar reembolso del excedente</button>
                      </template>
                      <template v-if="abono.puede_elegir_continuacion">
                        <label v-for="aplicacion in abono.aplicaciones" :key="aplicacion.solicitud_proveedor_id" class="flex items-center gap-1">
                          <input v-model="continuacion[abono.id]" type="checkbox" :value="aplicacion.solicitud_proveedor_id" />
                          {{ nombreProveedor(aplicacion.solicitud_proveedor_id) }}
                        </label>
                        <button type="button" class="font-semibold text-primary" @click="guardarContinuacion(abono.id)">Estos continúan</button>
                      </template>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>

      <SupplierPaymentWindow
        :open="!!vistaPrevia"
        title="Vista previa de WhatsApp"
        :subtitle="solicitud.cliente_whatsapp ? `Destino: ${solicitud.cliente_whatsapp}` : ''"
        @close="vistaPrevia = null"
      >
        <template v-if="vistaPrevia">
          <p v-if="vistaPrevia.enlace" class="break-all text-sm text-primary">{{ vistaPrevia.enlace }}</p>
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
          <UButton color="neutral" variant="soft" @click="vistaPrevia = null">Cerrar</UButton>
        </template>
      </SupplierPaymentWindow>

      <UCard v-if="(solicitud.historial || []).length">
        <details>
          <summary class="cursor-pointer font-bold">Historial de la solicitud</summary>
          <div class="mt-3 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted">
                  <th class="pb-2 pr-3">Fecha</th>
                  <th class="pb-2 pr-3">Usuario</th>
                  <th class="pb-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(evento, index) in solicitud.historial" :key="`${evento.fecha}-${index}`" class="border-t border-default">
                  <td class="py-2 pr-3 whitespace-nowrap text-muted">{{ evento.fecha ? new Date(evento.fecha).toLocaleString('es-PE') : '—' }}</td>
                  <td class="py-2 pr-3">{{ evento.usuario || '—' }}</td>
                  <td class="py-2">{{ evento.accion }}<span v-if="evento.detalle" class="text-muted"> · {{ evento.detalle }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </UCard>

      <div class="border-t border-default pt-4">
        <p v-if="todosPasaronEtapa1" class="mb-3 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">✓ Todos los proveedores ya pasaron a Validación de pago. Administración continúa con el proceso.</p>
        <div class="flex flex-wrap items-center gap-3">
          <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" @click="navigateTo('/pago-proveedor/solicitudes')">Volver al listado</UButton>
          <span class="text-xs text-muted">✓ Los cambios se guardan automáticamente.</span>
        </div>
      </div>

      <SupplierPaymentWindow
        :open="datosAbiertoId !== null"
        :title="datosProveedor ? `${datosProveedor.moneda === 'RMB' ? 'Datos del proveedor' : 'Datos bancarios del proveedor (T-T)'} — ${datosProveedor.code_supplier}` : ''"
        :subtitle="datosProveedor?.moneda !== 'RMB' && !ttSoloLectura ? 'Solo en casos excepcionales: quedan como borrador y el cliente debe autorizarlos antes de usarlos para el pago.' : ''"
        @close="datosAbiertoId = null"
      >
        <template v-if="datosProveedor">
          <div v-if="datosProveedor.moneda === 'RMB'" class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Nombre del vendedor"><UInput v-model="rmb[datosProveedor.id].vendedor" :disabled="ttSoloLectura" placeholder="Ej: Li Wei" class="w-full" /></UFormField>
            <UFormField label="N.° de WeChat"><UInput v-model="rmb[datosProveedor.id].wechat" :disabled="ttSoloLectura" inputmode="numeric" placeholder="Ej: 13812345678" class="w-full" /></UFormField>
          </div>
          <FormularioBancario v-else v-model="formularioTt" :bloqueado="ttSoloLectura" />
        </template>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="datosAbiertoId = null">{{ ttSoloLectura ? 'Cerrar' : 'Cancelar' }}</UButton>
          <UButton v-if="datosProveedor && !ttSoloLectura" class="boton-activo" @click="guardarDatos(datosProveedor)">{{ datosProveedor.moneda === 'RMB' ? 'Guardar datos' : 'Guardar como por autorizar' }}</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow :open="!!motivo" :title="motivo ? textosMotivo[motivo.tipo].titulo : ''" :subtitle="motivo ? textosMotivo[motivo.tipo].detalle : ''" @close="motivo = null">
        <UTextarea v-if="motivo" v-model="motivo.texto" :rows="3" autofocus placeholder="Describe el motivo (obligatorio)" class="w-full" />
        <template #footer>
          <UButton color="neutral" variant="outline" @click="motivo = null">Cancelar</UButton>
          <UButton class="boton-activo" :disabled="!motivo?.texto.trim()" :loading="guardandoMotivo" @click="confirmarMotivo">Confirmar</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow :open="!!desglose" title="Desglose del cobro" :subtitle="desglose?.code_supplier || ''" @close="desglose = null">
        <dl v-if="desglose" class="divide-y divide-default text-sm">
          <div class="flex justify-between gap-3 py-2"><dt>Valor de carga</dt><dd>${{ dinero(desglose.valor_carga_usd) }}</dd></div>
          <div class="flex justify-between gap-3 py-2"><dt>Comisión bancaria / plataforma</dt><dd>{{ desglose.etiqueta_bancaria || `$${dinero(desglose.bancaria_monto)}` }}</dd></div>
          <div class="flex justify-between gap-3 py-2"><dt>Comisión administrativa</dt><dd>${{ dinero(desglose.administrativa_monto) }}</dd></div>
          <div class="flex justify-between gap-3 py-2 font-bold"><dt>Total a abonar</dt><dd>${{ dinero(desglose.importe_requerido) }}</dd></div>
          <div class="flex justify-between gap-3 py-2"><dt>Abonado</dt><dd>${{ dinero(desglose.importe_abonado) }}</dd></div>
          <div class="flex justify-between gap-3 py-2 font-bold text-orange-600"><dt>Saldo</dt><dd>${{ dinero(desglose.saldo) }}</dd></div>
        </dl>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="desglose = null">Cerrar</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow
        :open="pedirDatosAbierto"
        title="Pedir datos del proveedor"
        subtitle="Elige a quién le pides los datos."
        @close="pedirDatosAbierto = false"
      >
        <p v-if="!candidatosDatos.length" class="text-sm text-muted">Todos los proveedores ya tienen sus datos.</p>
        <div v-else class="space-y-2">
          <UCheckboxGroup
            v-model="candidatosElegidos"
            :items="candidatosDatos.map(candidato => ({ label: `${candidato.titulo} · ${candidato.moneda}`, value: String(candidato.id) }))"
          />
        </div>
        <template #footer>
          <UButton color="primary" :disabled="!candidatosElegidos.length" :loading="guardandoAviso" @click="confirmarPedirDatos">Preparar aviso</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow
        :open="abonoAbierto"
        :title="abonoEditandoId ? 'Editar comprobante de pago' : 'Registrar comprobante de pago'"
        subtitle="El abono se aplica a los proveedores con saldo."
        @close="abonoAbierto = false"
      >
        <form id="abono-form" class="space-y-4" @submit.prevent="guardarAbono">
          <UCard variant="subtle" :ui="{ body: 'grid gap-3 md:grid-cols-2' }">
            <UFormField label="Importe recibido (USD)" required><UInput v-model.number="abono.importe" type="number" min="0" step="0.01" class="w-full" /></UFormField>
            <UFormField label="Fecha de pago" required><UInput v-model="abono.fecha" type="date" class="w-full" /></UFormField>
            <UFormField label="N.° de operación" required><UInput v-model="abono.operacion" class="w-full" /></UFormField>
            <UFormField label="Banco receptor" required><USelect v-model="abono.banco" :items="[{ label: 'BCP', value: 'bcp' }, { label: 'Interbank', value: 'interbank' }]" class="w-full" /></UFormField>
            <UFormField label="Comprobante" required class="md:col-span-2">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="block text-sm text-highlighted" @change="elegirVoucher" />
            </UFormField>
            <UCheckbox
              v-model="abono.interbancaria"
              class="md:col-span-2"
              label="Transferencia interbancaria o depósito en cajero"
              description="Revisar si el banco aplicó comisiones o cargos bancarios."
            />
          </UCard>
          <UCard variant="subtle" :ui="{ body: 'space-y-2' }">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold">Aplicar el abono a</h3>
              <UButton type="button" size="xs" color="primary" variant="link" @click="distribuir">Distribuir automáticamente</UButton>
            </div>
            <div v-for="proveedor in proveedoresConSaldo" :key="proveedor.id" class="flex items-center justify-between gap-3 text-sm">
              <span>{{ proveedor.code_supplier }} · pendiente ${{ dinero(proveedor.saldo) }}</span>
              <UInput v-model.number="abono.montos[proveedor.id]" type="number" min="0" step="0.01" class="w-32" />
            </div>
            <p class="text-sm">Recibido ${{ dinero(abono.importe || 0) }} · Aplicado ${{ dinero(aplicado) }} · Sin asignar ${{ dinero(sinAsignar) }}</p>
          </UCard>
        </form>
        <template #footer>
          <UButton type="submit" form="abono-form" color="primary" :disabled="aplicado <= 0" :loading="guardandoAbono">
            {{ abonoEditandoId ? 'Guardar cambios' : 'Registrar comprobante' }}
          </UButton>
        </template>
      </SupplierPaymentWindow>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { PagoProveedorAbono, PagoProveedorSolicitud, PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import { PROVIDER_STATUS, SUPPLIER_PAYMENT_PROFILE } from '~/constants/supplierPayment'
import { useModal } from '~/composables/commons/useModal'
import { useSupplierPaymentProfile } from '~/composables/pago-proveedor/useSupplierPaymentProfile'
import FormularioBancario from '~/components/pago-proveedor/FormularioBancario.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import SupplierPaymentProgress from '~/components/pago-proveedor/SupplierPaymentProgress.vue'

type TipoMotivo = 'observar' | 'anular' | 'levantar'

const route = useRoute()
const { showSuccess, showError, showConfirmation } = useModal()
const { profile } = useSupplierPaymentProfile()
const esAdmin = computed(() => profile.value === SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION)
const cargando = ref(true)
const guardandoAbono = ref(false)
const guardandoAviso = ref(false)
const solicitud = ref<PagoProveedorSolicitud | null>(null)
const rmb = reactive<Record<number, { vendedor: string; wechat: string }>>({})
const datosAbiertoId = ref<number | null>(null)
const desglose = ref<PagoProveedorSolicitudProveedor | null>(null)
const motivo = ref<{ proveedor: PagoProveedorSolicitudProveedor; tipo: TipoMotivo; texto: string } | null>(null)
const guardandoMotivo = ref(false)
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
const voucher = ref<File | null>(null)
const vistaPrevia = ref<{ enlace?: string; texto: string; nota?: string; imagen?: string; tipo?: string } | null>(null)
const continuacion = reactive<Record<number, number[]>>({})
const abono = reactive({
  importe: 0,
  fecha: '',
  operacion: '',
  banco: 'bcp',
  interbancaria: false,
  montos: {} as Record<number, number>
})

const dinero = (valor: number) => Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const abonoEnEdicion = computed(() => (solicitud.value?.abonos || []).find(item => item.id === abonoEditandoId.value) || null)
const proveedoresConSaldo = computed(() => (solicitud.value?.proveedores || []).filter((item) => {
  if (abonoEnEdicion.value?.aplicaciones?.some(aplicacion => aplicacion.solicitud_proveedor_id === item.id)) return true
  return (item.puede_editar_etapa1 || item.puede_registrar_diferencia) && item.saldo > 0
}))
const hayCuotas = computed(() => (solicitud.value?.proveedores || []).some(item => item.modalidad_abono === 'fraccionado'))
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
const proveedoresSinDatos = computed(() => (solicitud.value?.proveedores || []).filter(item => item.puede_editar_etapa1 && datosPendientes(item)).length)
const hayProveedoresActivos = computed(() => (solicitud.value?.proveedores || []).some(item => item.etapa <= 2 && !['completado', 'anulado'].includes(item.estado)))
const todosPasaronEtapa1 = computed(() => {
  const proveedores = solicitud.value?.proveedores || []
  return proveedores.some(item => item.etapa >= 2) && !proveedores.some(item => item.etapa === 1 && !['completado', 'anulado'].includes(item.estado))
})
const proveedorAbierto = reactive<Record<number, boolean>>({})
const vistaEtapa = reactive<Record<number, number>>({})
const aplicado = computed(() => Object.values(abono.montos).reduce((suma, monto) => suma + (Number(monto) || 0), 0))
const sinAsignar = computed(() => Math.round(((abono.importe || 0) - aplicado.value) * 100) / 100)

function toggleProveedor(id: number) {
  proveedorAbierto[id] = proveedorAbierto[id] === false
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
  return !esAdmin.value && (proveedor.puede_editar_etapa1 || !!proveedor.observacion_china)
}

function cuentaOculta(cuenta?: string | null) {
  return cuenta ? `•••• ${cuenta.replace(/\s/g, '').slice(-4)}` : '—'
}

function fechaCorta(fecha?: string | null) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || '')
  return partes ? `${Number(partes[3])}/${Number(partes[2])}/${partes[1]}` : (fecha || '—')
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

function textoExcedente(decision: string | null) {
  return {
    aplicado_cuota: 'se aplica a la cuota 2',
    no_devuelve: 'no se devuelve (dentro de la tolerancia)',
    por_consultar: 'por consultar al cliente',
    reembolso_solicitado: 'reembolso solicitado'
  }[decision || ''] || decision
}

async function cargar() {
  const respuesta = await PagoProveedorService.obtenerSolicitud(Number(route.params.id))
  aplicar(respuesta.data)
}

async function abrirPedirDatos() {
  try {
    const respuesta = await PagoProveedorService.candidatosPedirDatos(solicitud.value!.id)
    candidatosDatos.value = respuesta.data || []
    candidatosElegidos.value = candidatosDatos.value.map(item => String(item.id))
    pedirDatosAbierto.value = true
  } catch (error: any) {
    showError('Pedir datos', error?.data?.message || error.message || 'No se pudo cargar los proveedores.')
  }
}

async function confirmarPedirDatos() {
  if (!candidatosElegidos.value.length) return
  guardandoAviso.value = true
  try {
    const respuesta = await PagoProveedorService.pedirDatos(solicitud.value!.id, candidatosElegidos.value.map(Number))
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
    pedirDatosAbierto.value = false
  } catch (error: any) {
    showError('Pedir datos', error?.data?.message || error.message || 'No se pudo preparar el mensaje.')
  } finally {
    guardandoAviso.value = false
  }
}

async function enviarResumen() {
  if (!solicitud.value?.cotizacion_id) return
  guardandoAviso.value = true
  try {
    const respuesta = await PagoProveedorService.vistaPreviaWhatsapp(solicitud.value.cotizacion_id)
    vistaPrevia.value = { texto: respuesta.data.texto, nota: respuesta.data.nota }
  } catch (error: any) {
    showError('Resumen', error?.data?.message || error.message || 'No se pudo preparar el resumen.')
  } finally {
    guardandoAviso.value = false
  }
}

async function descargarResumen() {
  if (!solicitud.value?.cotizacion_id) return
  guardandoAviso.value = true
  try {
    const respuesta = await PagoProveedorService.descargarPdf(solicitud.value.cotizacion_id)
    const pdf = respuesta.data
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdf.base64}`
    link.download = pdf.filename || 'Resumen.pdf'
    link.click()
    showSuccess('PDF', 'Resumen descargado.')
  } catch (error: any) {
    showError('PDF', error?.data?.message || error.message || 'No se pudo descargar el PDF.')
  } finally {
    guardandoAviso.value = false
  }
}

async function enviarCuentas() {
  try {
    const respuesta = await PagoProveedorService.cuentas(solicitud.value!.id)
    vistaPrevia.value = {
      ...respuesta.data,
      imagen: respuesta.data.imagen || '/images/pago-proveedor/cuentas-bancarias.jpg'
    }
  } catch (error: any) {
    showError('Cuentas', error?.data?.message || error.message || 'No se pudo preparar el mensaje.')
  }
}

async function levantarChina(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.levantarChina(solicitud.value!.id, proveedor.id, rmb[proveedor.id].vendedor, rmb[proveedor.id].wechat)
    aplicar(respuesta.data)
    datosAbiertoId.value = null
    showSuccess('Observación', 'China ya puede continuar el pago.')
  } catch (error: any) {
    showError('Observación', error?.data?.message || error?.message || 'No se pudo levantar la observación.')
  }
}

async function guardarRmb(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.guardarDatosRmb(solicitud.value!.id, proveedor.id, rmb[proveedor.id].vendedor, rmb[proveedor.id].wechat)
    aplicar(respuesta.data)
    datosAbiertoId.value = null
    showSuccess('Datos guardados', proveedor.code_supplier)
  } catch (error: any) {
    showError('Datos del proveedor', error.message || 'No se pudo guardar.')
  }
}

async function enviarFormulario(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.enviarFormulario(solicitud.value!.id, proveedor.id)
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
  } catch (error: any) {
    showError('Formulario T-T', error.message || 'No se pudo preparar el enlace.')
  }
}

async function llenarTt(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.llenarTt(solicitud.value!.id, proveedor.id, formularioTt.value)
    aplicar(respuesta.data)
    datosAbiertoId.value = null
    showSuccess('Por autorizar', 'El cliente debe autorizar estos datos antes de ejecutar el pago.')
  } catch (error: any) {
    showError('Formulario T-T', error.message || 'Revisa los datos bancarios.')
  }
}

async function pedirValidacion(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.solicitarValidacion(solicitud.value!.id, proveedor.id)
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
    const acciones = {
      observar: PagoProveedorService.observarProveedor,
      anular: PagoProveedorService.anularProveedor,
      levantar: PagoProveedorService.levantarObservacion
    }
    const respuesta = await acciones[tipo].call(PagoProveedorService, solicitud.value.id, proveedor.id, texto)
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

function siguientePaso(proveedor: PagoProveedorSolicitudProveedor) {
  const observado = abonoObservado(proveedor)
  if (proveedor.observacion_ventas) return ''
  if (observado) return `Administración observó el comprobante: ${observado.observacion?.motivo}. Corrígelo o cambia el voucher.`
  if (proveedor.observacion_china) return 'Corrige el vendedor o el WeChat y levanta la observación.'
  if (proveedor.puede_registrar_diferencia) return 'Administración dejó una diferencia por cobrar. Registra ese comprobante.'
  if (proveedor.etapa === 1 && proveedor.estado === 'en_proceso') {
    const tareas: string[] = []
    if (datosPendientes(proveedor)) tareas.push(proveedor.moneda === 'RMB' ? 'completar los datos del proveedor' : 'completar los datos bancarios del proveedor')
    if (proveedor.saldo > 0.004) tareas.push(proveedor.importe_abonado > 0 ? `registrar el abono faltante (${dinero(proveedor.saldo)})` : 'registrar el abono del cliente')
    return tareas.length ? `${tareas.join(' · ')}.` : ''
  }
  if (proveedor.etapa === 2) return 'En manos de Administración: verifica el depósito y aprueba el pago. Te avisamos cuando lo aprueben.'
  if (proveedor.etapa === 3) return `En manos de ${proveedor.moneda === 'RMB' ? 'Operaciones China' : 'Administración'}: pago en ejecución. Te avisamos cuando suban la constancia.`
  return ''
}

function abrirAbono() {
  abonoEditandoId.value = null
  abono.importe = 0
  abono.fecha = ''
  abono.operacion = ''
  abono.banco = 'bcp'
  abono.interbancaria = false
  voucher.value = null
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

function distribuir() {
  let resto = Number(abono.importe) || 0
  for (const proveedor of proveedoresConSaldo.value) {
    const aplicadoProveedor = Math.min(proveedor.saldo, Math.max(0, resto))
    abono.montos[proveedor.id] = Math.round(aplicadoProveedor * 100) / 100
    resto = Math.round((resto - aplicadoProveedor) * 100) / 100
  }
}

function elegirVoucher(evento: Event) {
  voucher.value = (evento.target as HTMLInputElement).files?.[0] || null
}

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
    const respuesta = await PagoProveedorService.registrarAbono(solicitud.value.id, form, abonoEditandoId.value || undefined)
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
      const respuesta = await PagoProveedorService.anularAbono(solicitud.value!.id, abonoItem.id)
      aplicar(respuesta.data)
    } catch (error: any) {
      showError('Abono', error.message || 'No se pudo anular.')
    }
  })
}

function nombreProveedor(id: number) {
  const proveedor = solicitud.value?.proveedores?.find(item => item.id === id)
  return proveedor?.code_supplier || proveedor?.supplier_name || `Proveedor ${id}`
}

async function guardarContinuacion(abonoId: number) {
  const elegidos = continuacion[abonoId] || []
  if (!elegidos.length || !solicitud.value) return
  try {
    const respuesta = await PagoProveedorService.elegirContinuacion(solicitud.value.id, abonoId, elegidos)
    aplicar(respuesta.data)
    showSuccess('Voucher compartido', 'Los proveedores elegidos continúan con el pago.')
  } catch (error: any) {
    showError('Voucher compartido', error?.data?.message || error.message || 'No se pudo guardar.')
  }
}

async function decidir(abonoId: number, decision: string) {
  try {
    const respuesta = await PagoProveedorService.decidirExcedente(solicitud.value!.id, abonoId, decision)
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

<style scoped>
.icono {
  display: flex;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgb(249 115 22 / 0.12);
  color: #ea580c;
}
.icono-grande {
  width: 3rem;
  height: 3rem;
}
.bloque {
  border: 1px solid var(--ui-border);
  border-radius: 0.875rem;
  padding: 1rem;
}
.bloque-pendiente {
  border-color: rgb(245 158 11 / 0.45);
  background: rgb(245 158 11 / 0.07);
}
.pastilla {
  display: inline-block;
  border-radius: 9999px;
  padding: 0.1rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
}
.pastilla-pendiente {
  background: rgb(245 158 11 / 0.18);
  color: #b45309;
}
.pastilla-ok {
  background: rgb(34 197 94 / 0.15);
  color: #15803d;
}
.boton-barra {
  border-radius: 0.625rem;
  padding: 0.6rem 1rem;
  font-weight: 500;
}
.boton-activo {
  background: #f97316 !important;
  color: #fff !important;
  box-shadow: 0 0 0 1px #f97316 !important;
}
</style>
