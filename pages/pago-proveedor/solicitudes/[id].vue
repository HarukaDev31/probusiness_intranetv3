<template>
  <div class="mx-auto max-w-5xl space-y-4 p-6">
    <UButton color="primary" variant="soft" size="xs" icon="i-lucide-arrow-left" @click="navigateTo('/pago-proveedor/solicitudes')">Regresar al listado</UButton>
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
      <header class="space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight text-highlighted">{{ solicitud.cliente_nombre }}</h1>
          <UBadge color="info" variant="subtle">Orden N.° {{ solicitud.numero_orden }}</UBadge>
        </div>

        <UCard>
          <h2 class="mb-3 text-base font-bold">Datos del cliente</h2>
          <dl class="grid gap-4 sm:grid-cols-2">
            <div><dt class="text-xs text-muted">N.° de consolidado</dt><dd class="text-[15px] font-bold">{{ solicitud.consolidado ? `Consolidado ${solicitud.consolidado}` : '—' }}</dd></div>
            <div><dt class="text-xs text-muted">Nombre y apellido</dt><dd class="text-[15px] font-bold">{{ solicitud.cliente_nombre || '—' }}</dd></div>
            <div><dt class="text-xs text-muted">WhatsApp</dt><dd class="text-[15px] font-bold">{{ solicitud.cliente_whatsapp || '—' }}</dd></div>
            <div><dt class="text-xs text-muted">Correo electrónico</dt><dd class="text-[15px] font-bold">{{ solicitud.cliente_correo || '—' }}</dd></div>
          </dl>
          <p v-if="solicitud.cotizacion_codigo" class="mt-3 text-sm text-muted">Cotización {{ solicitud.cotizacion_codigo }}<span v-if="solicitud.tipo_cambio"> · T.C. {{ solicitud.tipo_cambio }}</span></p>
        </UCard>

        <UCard>
          <h2 class="mb-3 text-base font-bold">Resumen financiero</h2>
          <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <UCard variant="subtle"><dt class="text-sm text-muted">Total cotizado</dt><dd class="mt-1 text-[28px] font-bold leading-none">${{ dinero(solicitud.total_cotizado || 0) }}</dd></UCard>
            <UCard variant="subtle"><dt class="text-sm text-muted">Total abonado</dt><dd class="mt-1 text-[28px] font-bold leading-none">${{ dinero(solicitud.total_abonado || 0) }}</dd></UCard>
            <UCard
              variant="subtle"
              :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'border-primary/30 bg-primary/10' : 'border-success/30 bg-success/10'"
            >
              <dt class="text-sm font-medium" :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'text-primary' : 'text-success'">Saldo pendiente</dt>
              <dd class="mt-1 text-[28px] font-bold leading-none" :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'text-primary' : 'text-success'">
                ${{ dinero(solicitud.saldo_pendiente || 0) }}
              </dd>
              <em class="mt-1 block text-xs not-italic" :class="(solicitud.saldo_pendiente || 0) > 0.004 ? 'text-primary' : 'text-success'">
                {{ (solicitud.saldo_pendiente || 0) > 0.004 ? 'Falta abonar' : 'Cubierto' }}
              </em>
            </UCard>
            <UCard variant="subtle" class="border-info/30 bg-info/10">
              <dt class="text-sm text-info">Excedente</dt>
              <dd class="mt-1 text-[28px] font-bold leading-none text-info">${{ dinero(solicitud.excedente || 0) }}</dd>
              <em v-if="(solicitud.excedente || 0) > 0.004" class="mt-1 block text-xs not-italic text-info">
                Revisa los comprobantes para consultar / devolver / aplicar a cuota.
              </em>
            </UCard>
          </dl>
        </UCard>

        <UAlert
          v-if="esAdmin"
          class="mb-1"
          color="info"
          variant="subtle"
          title="Solo lectura para Administración"
          description="Las decisiones de Admin se hacen en Aprobación de pagos y Pagos en dólares. Aquí revisas el expediente sin acciones de Ventas."
        />

        <UCard v-if="!esAdmin && (solicitud.saldo_pendiente || 0) > 0 && hayAccionEtapa1" color="warning" variant="subtle">
          <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-warning">Por realizar · hay saldo por cobrar</p>
            <p class="text-sm text-muted">${{ dinero(solicitud.saldo_pendiente || 0) }} · {{ proveedoresConSaldo.length }} proveedor{{ proveedoresConSaldo.length === 1 ? '' : 'es' }}</p>
          </div>
          <UButton color="warning" @click="abrirAbono()">Registrar comprobante</UButton>
          </div>
        </UCard>

        <div v-if="!esAdmin" class="flex flex-wrap items-center gap-2">
          <UButton
            v-if="solicitud.cotizacion_id"
            size="sm"
            color="neutral"
            variant="soft"
            :disabled="!hayAccionEtapa1"
            :to="hayAccionEtapa1 ? `/pago-proveedor/cotizaciones/${solicitud.cotizacion_id}` : undefined"
          >
            Formulario de la solicitud
          </UButton>
          <UButton
            v-if="solicitud.cotizacion_id"
            size="sm"
            :color="ctaPrincipal === 'resumen' ? 'warning' : 'neutral'"
            :variant="ctaPrincipal === 'resumen' ? 'solid' : 'soft'"
            :loading="guardandoAviso"
            :disabled="!hayAccionEtapa1"
            @click="enviarResumen"
          >
            Enviar resumen
          </UButton>
          <UButton v-if="solicitud.cotizacion_id" size="sm" color="neutral" variant="ghost" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
          <UButton
            size="sm"
            :color="ctaPrincipal === 'datos' ? 'warning' : 'neutral'"
            :variant="ctaPrincipal === 'datos' ? 'solid' : 'soft'"
            :disabled="!hayAccionEtapa1"
            @click="abrirPedirDatos"
          >
            Pedir datos del proveedor
          </UButton>
          <UButton
            size="sm"
            :color="ctaPrincipal === 'cuentas' ? 'warning' : 'neutral'"
            :variant="ctaPrincipal === 'cuentas' ? 'solid' : 'ghost'"
            :disabled="!hayAccionEtapa1"
            @click="enviarCuentas"
          >
            Cuentas bancarias
          </UButton>
        </div>
        <div v-else class="flex flex-wrap items-center gap-2">
          <UButton v-if="solicitud.cotizacion_id" size="sm" color="neutral" variant="ghost" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
          <UButton size="sm" color="primary" variant="soft" to="/pago-proveedor/solicitudes">Ir a Aprobación / Pagos</UButton>
        </div>
      </header>

      <UCard v-for="proveedor in solicitud.proveedores || []" :key="proveedor.id">
        <button
          type="button"
          class="flex w-full items-start justify-between gap-3 text-left"
          @click="toggleProveedor(proveedor.id)"
        >
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-muted">Proveedor {{ proveedor.orden }}</p>
            <h2 class="text-lg font-semibold">{{ proveedor.titulo }}</h2>
            <p class="text-sm text-muted">{{ proveedor.producto }} · {{ proveedor.moneda === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T' }}</p>
            <p v-if="proveedor.codigo_solicitud" class="mt-1 text-xs text-muted">Código interno {{ proveedor.codigo_solicitud }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <UBadge :color="colorEstado(proveedor.estado)" variant="soft" :label="`${proveedor.etapa_nombre} · ${proveedor.estado_nombre}`" />
            <UIcon
              :name="proveedorAbierto[proveedor.id] === false ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
              class="size-5 text-muted"
            />
          </div>
        </button>

        <div v-show="proveedorAbierto[proveedor.id] !== false" class="mt-4">
        <SupplierPaymentSteps
          labeled
          navigable
          :current="proveedor.etapa"
          :viewing="vistaEtapa[proveedor.id] ?? proveedor.etapa"
          @select="(paso) => { vistaEtapa[proveedor.id] = paso }"
        />

        <UCard v-if="siguientePaso(proveedor) && (vistaEtapa[proveedor.id] ?? proveedor.etapa) === proveedor.etapa" class="mt-4" color="warning" variant="subtle">
          <p class="text-[11px] font-bold uppercase tracking-wide text-warning">Por realizar</p>
          <p class="mt-1 text-sm font-semibold text-highlighted">{{ siguientePaso(proveedor) }}</p>
          <UButton
            v-if="!esAdmin && abonoObservado(proveedor)"
            class="mt-2"
            size="xs"
            color="warning"
            @click="editarAbono(abonoObservado(proveedor)!)"
          >
            Corregir comprobante
          </UButton>
          <UButton
            v-if="!esAdmin && proveedor.puede_registrar_diferencia && !abonoObservado(proveedor)"
            class="mt-2"
            size="xs"
            color="warning"
            @click="abrirAbono()"
          >
            Registrar voucher de la diferencia
          </UButton>
          <UButton
            v-if="!esAdmin && proveedor.saldo > 0 && proveedor.etapa <= 1 && !proveedor.observacion_china && !datosPendientes(proveedor)"
            class="mt-2"
            size="xs"
            color="warning"
            @click="abrirAbono()"
          >
            Registrar comprobante
          </UButton>
        </UCard>
        <p
          v-else-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) !== proveedor.etapa"
          class="mt-4 text-sm text-muted"
        >
          Estás revisando la etapa {{ vistaEtapa[proveedor.id] }} en solo lectura. El paso actual del proveedor es {{ proveedor.etapa }}.
        </p>

        <div
          v-if="(vistaEtapa[proveedor.id] ?? proveedor.etapa) === 1"
          class="mt-4 grid gap-3 lg:grid-cols-3"
        >
          <UCard
            variant="subtle"
            :class="datosPendientes(proveedor) ? 'border-warning/40' : ''"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="text-sm font-bold">Datos del proveedor</h3>
              <UBadge
                :color="datosPendientes(proveedor) ? 'warning' : 'success'"
                variant="soft"
                size="sm"
              >
                {{ datosPendientes(proveedor) ? 'Pendientes' : 'Completos' }}
              </UBadge>
            </div>

            <template v-if="proveedor.moneda === 'RMB'">
              <UCard v-if="!esAdmin && proveedor.puede_editar_etapa1" class="border-0 bg-transparent p-0 shadow-none" :ui="{ body: 'p-0' }">
                <div class="grid gap-3">
                  <UFormField label="Vendedor"><UInput v-model="rmb[proveedor.id].vendedor" class="w-full" /></UFormField>
                  <UFormField label="WeChat"><UInput v-model="rmb[proveedor.id].wechat" inputmode="numeric" class="w-full" /></UFormField>
                </div>
                <UButton class="mt-3" size="sm" color="primary" @click="guardarRmb(proveedor)">Completar</UButton>
              </UCard>
              <div v-else-if="!esAdmin && proveedor.observacion_china" class="space-y-2 text-sm">
                <p class="font-semibold text-error">Observación de China</p>
                <p>{{ proveedor.observacion_china.label }}<span v-if="proveedor.observacion_china.detail"> · {{ proveedor.observacion_china.detail }}</span></p>
                <div class="grid gap-3">
                  <UFormField label="Vendedor"><UInput v-model="rmb[proveedor.id].vendedor" class="w-full" /></UFormField>
                  <UFormField label="WeChat"><UInput v-model="rmb[proveedor.id].wechat" inputmode="numeric" class="w-full" /></UFormField>
                </div>
                <UButton size="sm" color="primary" @click="levantarChina(proveedor)">Levantar observación</UButton>
              </div>
              <p v-else class="text-sm text-muted">Vendedor {{ proveedor.datos.vendedor_nombre || '—' }} · WeChat {{ proveedor.datos.wechat || '—' }}</p>
            </template>

            <template v-else>
              <p class="text-sm">Estado: {{ etiquetaDatos(proveedor.datos.estado) }}<span v-if="proveedor.datos.correccion_solicitada"> · corrección pedida</span></p>
              <p v-if="proveedor.datos.beneficiario_nombre" class="mt-1 text-sm text-muted">{{ proveedor.datos.beneficiario_nombre }} · {{ proveedor.datos.banco_nombre }} {{ proveedor.datos.banco_codigo }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <template v-if="!esAdmin && proveedor.puede_editar_etapa1">
                  <UButton size="sm" color="primary" @click="enviarFormulario(proveedor)">Enviar formulario</UButton>
                  <UButton size="sm" color="neutral" variant="soft" @click="abrirTt(proveedor.id, false)">Llenar por el cliente</UButton>
                  <UButton v-if="proveedor.datos.estado === 'recibido'" size="sm" color="neutral" variant="soft" @click="pedirValidacion(proveedor)">Solicitar validación</UButton>
                </template>
                <UButton
                  v-if="proveedor.datos.beneficiario_nombre || proveedor.datos.estado === 'recibido' || proveedor.datos.estado === 'por_autorizar'"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  @click="abrirTt(proveedor.id, true)"
                >
                  Ver
                </UButton>
              </div>
              <form v-if="ttAbierto === proveedor.id" class="mt-4 space-y-3" @submit.prevent="llenarTt(proveedor)">
                <FormularioBancario v-model="formularioTt" :bloqueado="ttSoloLectura" />
                <div v-if="!ttSoloLectura" class="flex gap-2">
                  <UButton type="submit" size="sm" color="primary">Guardar como por autorizar</UButton>
                  <UButton type="button" size="sm" color="neutral" variant="ghost" @click="ttAbierto = null">Cancelar</UButton>
                </div>
                <UButton v-else type="button" size="sm" color="neutral" variant="ghost" @click="ttAbierto = null">Cerrar</UButton>
              </form>
            </template>
          </UCard>

          <UCard variant="subtle" :class="proveedor.saldo > 0.004 ? 'border-warning/40' : ''">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="text-sm font-bold">Comprobante de pago</h3>
              <UBadge :color="proveedor.saldo > 0.004 ? 'warning' : 'success'" variant="soft" size="sm">
                {{ proveedor.saldo > 0.004 ? (proveedor.importe_abonado > 0 ? 'Parcial' : 'Pendiente') : 'Cubierto' }}
              </UBadge>
            </div>
            <UAlert v-if="proveedor.puede_registrar_diferencia" class="mb-2" color="warning" variant="subtle" description="Administración dejó este pago por cobrar. Registra el comprobante de la diferencia." />
            <ul v-if="abonosProveedor(proveedor.id).length" class="space-y-2 text-sm">
              <li v-for="abono in abonosProveedor(proveedor.id)" :key="abono.id" class="rounded-lg border border-default px-2.5 py-2">
                ${{ dinero(abono.importe) }} · {{ abono.banco.toUpperCase() }} · {{ abono.estado_nombre }}
              </li>
            </ul>
            <p v-else class="text-sm text-muted">Aún no hay comprobantes aplicados a este proveedor.</p>
            <UButton
              v-if="!esAdmin && (proveedor.puede_editar_etapa1 || proveedor.puede_registrar_diferencia) && proveedor.saldo > 0"
              class="mt-3"
              size="sm"
              color="warning"
              @click="abrirAbono()"
            >
              Registrar comprobante
            </UButton>
            <details class="mt-3 text-sm">
              <summary class="cursor-pointer font-semibold text-primary">Ver desglose del cobro</summary>
              <dl class="mt-2 space-y-1 text-muted">
                <div class="flex justify-between gap-2"><dt>Valor / a abonar</dt><dd class="font-semibold text-highlighted">${{ dinero(proveedor.importe_requerido) }}</dd></div>
                <div class="flex justify-between gap-2"><dt>Abonado</dt><dd class="font-semibold text-highlighted">${{ dinero(proveedor.importe_abonado) }}</dd></div>
                <div class="flex justify-between gap-2"><dt>Saldo</dt><dd class="font-semibold text-highlighted">${{ dinero(proveedor.saldo) }}</dd></div>
              </dl>
            </details>
          </UCard>

          <UCard variant="subtle" :class="proveedor.saldo > 0.004 ? 'border-primary/30 bg-primary/5' : 'border-success/30 bg-success/5'">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3 class="text-sm font-bold">Pendiente de abono</h3>
              <UBadge :color="proveedor.saldo > 0.004 ? 'primary' : 'success'" variant="soft" size="sm">
                {{ proveedor.saldo > 0.004 ? 'Falta abonar' : 'Cubierto' }}
              </UBadge>
            </div>
            <p class="text-3xl font-bold" :class="proveedor.saldo > 0.004 ? 'text-primary' : 'text-success'">
              ${{ dinero(proveedor.saldo) }}
            </p>
            <p class="mt-2 text-xs text-muted">A abonar ${{ dinero(proveedor.importe_requerido) }} · abonado ${{ dinero(proveedor.importe_abonado) }}</p>
          </UCard>
        </div>

        <template v-else>
          <dl class="mt-4 grid grid-cols-3 gap-2 text-sm">
            <UCard variant="subtle"><dt class="text-xs text-muted">A abonar</dt><dd class="font-bold">${{ dinero(proveedor.importe_requerido) }}</dd></UCard>
            <UCard variant="subtle"><dt class="text-xs text-muted">Abonado</dt><dd class="font-bold">${{ dinero(proveedor.importe_abonado) }}</dd></UCard>
            <UCard variant="subtle" :class="proveedor.saldo > 0.004 ? 'bg-primary/10' : 'bg-success/10'">
              <dt class="text-xs" :class="proveedor.saldo > 0.004 ? 'text-primary' : 'text-success'">{{ proveedor.saldo > 0.004 ? 'Pendiente' : 'Cubierto' }}</dt>
              <dd class="font-bold" :class="proveedor.saldo > 0.004 ? 'text-primary' : 'text-success'">${{ dinero(proveedor.saldo) }}</dd>
            </UCard>
          </dl>
        </template>

        <SupplierPaymentProgress
          v-if="solicitud.id"
          :solicitud-id="solicitud.id"
          :proveedor="proveedor"
          :readonly="esAdmin"
          :viewing="vistaEtapa[proveedor.id] ?? proveedor.etapa"
          @saved="cargar"
          @complete-data="irACompletarDatos(proveedor)"
        />

        <div v-if="!esAdmin && proveedor.puede_editar_etapa1" class="mt-4 flex flex-wrap gap-3">
          <button type="button" class="text-sm text-error" @click="anularProveedor(proveedor)">Anular proveedor</button>
        </div>
        </div>
      </UCard>

      <UCard v-if="(solicitud.abonos || []).length">
        <h2 class="font-semibold">Comprobantes</h2>
        <ul class="mt-3 space-y-3">
          <li v-for="abono in solicitud.abonos" :key="abono.id" class="rounded-lg border border-default p-3 text-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p>{{ abono.voucher_nombre }} · ${{ dinero(abono.importe) }} · {{ abono.banco.toUpperCase() }} · {{ abono.numero_operacion }}</p>
              <UBadge color="neutral" variant="subtle" size="sm">{{ abono.estado_nombre }}</UBadge>
            </div>
            <UAlert
              v-if="abono.observacion"
              class="mt-2"
              color="error"
              variant="subtle"
              :title="`Observado: ${abono.observacion.motivo}`"
              :description="[abono.observacion.detalle, abono.observacion.plazo].filter(Boolean).join(' · ') || undefined"
            />
            <p v-if="abono.excedente > 0" class="mt-1 text-warning">
              Excedente ${{ dinero(abono.excedente) }} · {{ textoExcedente(abono.excedente_decision) }}
              <span v-if="abono.excedente_decide_text" :class="abono.excedente_decide_overdue ? 'font-semibold text-error' : 'text-warning'">
                · {{ abono.excedente_decide_text }}
              </span>
            </p>
            <p v-if="abono.excedente_decision === 'reembolso_solicitado'" class="mt-1 text-sm text-info">
              Administración ya puede registrar el voucher del reembolso. Pide las cuentas bancarias al cliente.
            </p>
            <p v-if="abono.operacion_repetida" class="text-warning">El número de operación ya estaba registrado.</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <a v-if="abono.voucher_url" :href="abono.voucher_url" target="_blank" class="font-semibold text-primary">Ver voucher</a>
              <template v-if="!esAdmin">
                <UButton v-if="abono.puede_editar" size="xs" color="primary" variant="link" @click="editarAbono(abono)">Editar</UButton>
                <UButton v-if="abono.puede_anular" size="xs" color="error" variant="link" @click="anularAbono(abono)">Anular</UButton>
                <template v-if="abono.excedente_decision === 'por_consultar'">
                  <button
                    v-if="hayCuotas"
                    type="button"
                    class="font-semibold text-primary"
                    @click="decidir(abono.id, 'aplicado_cuota')"
                  >
                    Aplicar a la siguiente cuota
                  </button>
                  <button type="button" class="font-semibold text-primary" @click="decidir(abono.id, 'reembolso_solicitado')">
                    Solicitar reembolso del excedente
                  </button>
                </template>
                <template v-if="abono.puede_elegir_continuacion">
                  <label v-for="aplicacion in abono.aplicaciones" :key="aplicacion.solicitud_proveedor_id" class="flex items-center gap-1">
                    <input v-model="continuacion[abono.id]" type="checkbox" :value="aplicacion.solicitud_proveedor_id" />
                    {{ nombreProveedor(aplicacion.solicitud_proveedor_id) }}
                  </label>
                  <button type="button" class="font-semibold text-primary" @click="guardarContinuacion(abono.id)">Estos continúan</button>
                </template>
              </template>
            </div>
          </li>
        </ul>
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
        <h2 class="font-semibold">Historial</h2>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-muted">
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
      </UCard>

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
import SupplierPaymentSteps from '~/components/pago-proveedor/SupplierPaymentSteps.vue'

const route = useRoute()
const { showSuccess, showError, showConfirmation } = useModal()
const { profile } = useSupplierPaymentProfile()
const esAdmin = computed(() => profile.value === SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION)
const cargando = ref(true)
const guardandoAbono = ref(false)
const guardandoAviso = ref(false)
const solicitud = ref<PagoProveedorSolicitud | null>(null)
const rmb = reactive<Record<number, { vendedor: string; wechat: string }>>({})
const ttAbierto = ref<number | null>(null)
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
  return 'primary'
}

function etiquetaDatos(estado: string) {
  return { pendiente: 'Pendiente', enviado: 'Enviado', por_autorizar: 'Por autorizar', recibido: 'Recibido' }[estado] || estado
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
    solicitud.value = respuesta.data
    showSuccess('Observación', 'China ya puede continuar el pago.')
  } catch (error: any) {
    showError('Observación', error?.data?.message || error?.message || 'No se pudo levantar la observación.')
  }
}

async function guardarRmb(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.guardarDatosRmb(solicitud.value!.id, proveedor.id, rmb[proveedor.id].vendedor, rmb[proveedor.id].wechat)
    aplicar(respuesta.data)
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
    ttAbierto.value = null
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
  if (proveedor.moneda === 'USD') {
    abrirTt(proveedor.id, false)
  }
}

function abrirTt(proveedorId: number, soloLectura = false) {
  const proveedor = solicitud.value?.proveedores.find(item => item.id === proveedorId)
  const datos = proveedor?.datos
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
  ttAbierto.value = proveedorId
}

function anularProveedor(proveedor: PagoProveedorSolicitudProveedor) {
  showConfirmation('Anular proveedor', `Se anula ${proveedor.code_supplier}. No sigue en el pago.`, async () => {
    try {
      const respuesta = await PagoProveedorService.anularProveedor(solicitud.value!.id, proveedor.id)
      aplicar(respuesta.data)
    } catch (error: any) {
      showError('Anular', error.message || 'No se pudo anular.')
    }
  })
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
  if (observado) return `Administración observó el comprobante: ${observado.observacion?.motivo}. Corrígelo o cambia el voucher.`
  if (proveedor.observacion_china) return 'Corrige el vendedor o el WeChat y levanta la observación.'
  if (proveedor.puede_registrar_diferencia) return 'Administración dejó una diferencia por cobrar. Registra ese comprobante.'
  if (proveedor.puede_editar_etapa1 && proveedor.moneda === 'RMB' && !proveedor.datos.wechat) return 'Completa el vendedor y el WeChat del proveedor.'
  if (proveedor.puede_editar_etapa1 && proveedor.moneda === 'USD' && !['recibido', 'por_autorizar'].includes(proveedor.datos.estado)) return 'Faltan los datos bancarios. Envía el formulario o llénalo aquí; el cliente tiene que autorizarlos.'
  if (proveedor.saldo > 0 && proveedor.etapa <= 1) return 'Registra el comprobante del cliente. Administración lo valida después.'
  if (proveedor.etapa === 2) return 'El depósito está con Administración. Aquí no hay nada que hacer hasta que lo aprueben o lo observen.'
  if (proveedor.etapa === 3) return proveedor.moneda === 'RMB' ? 'China registra el pago en yuanes.' : 'Administración transfiere al proveedor.'
  if (proveedor.etapa === 4 && proveedor.estado !== 'completado') return 'Revisa la confirmación: lo que falta está marcado abajo.'
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
.campo {
  margin-top: 0.25rem;
  display: block;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background: white;
  padding: 0.5rem 0.75rem;
}
</style>
