<template>
  <!-- Mismo formato que el formulario que ve el cliente (maqueta): tres bloques numerados. -->
  <div class="flex flex-col gap-4">
    <section class="rounded-xl border border-default bg-default p-4">
      <div class="mb-3 flex items-start gap-3">
        <span class="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">1</span>
        <div><h3 class="font-bold text-highlighted">Datos del beneficiario (proveedor)</h3><p class="text-xs text-muted">Quien recibe el dinero</p></div>
      </div>
      <div class="grid gap-3">
        <UFormField label="Nombre del beneficiario" required help="Razón social de tu proveedor.">
          <UInput v-model="modelo.beneficiario_nombre" :disabled="bloqueado" placeholder="Tal como figura en la cuenta" class="w-full" />
        </UFormField>
        <UFormField label="Número de cuenta" required>
          <UInput v-model="modelo.beneficiario_cuenta" :disabled="bloqueado" placeholder="Número de cuenta o IBAN" class="w-full" />
        </UFormField>
        <UFormField label="Dirección del beneficiario" required>
          <UInput v-model="modelo.beneficiario_direccion" :disabled="bloqueado" class="w-full" />
        </UFormField>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="País" required><USelect v-model="modelo.beneficiario_pais" :items="paisesDe(modelo.beneficiario_pais)" :disabled="bloqueado" placeholder="Selecciona" class="w-full" /></UFormField>
          <UFormField label="Ciudad" required><UInput v-model="modelo.beneficiario_ciudad" :disabled="bloqueado" class="w-full" /></UFormField>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-default bg-default p-4">
      <div class="mb-3 flex items-start gap-3">
        <span class="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">2</span>
        <div><h3 class="font-bold text-highlighted">Datos del banco de destino</h3><p class="text-xs text-muted">Banco donde tu proveedor tiene la cuenta</p></div>
      </div>
      <div class="grid gap-3">
        <UFormField label="Tipo de código de banco" required>
          <USelect v-model="modelo.banco_tipo_codigo" :items="tiposCodigo" :disabled="bloqueado" class="w-full" />
        </UFormField>
        <UFormField label="Código de banco pagador" required>
          <UInput v-model="modelo.banco_codigo" :disabled="bloqueado" :placeholder="modelo.banco_tipo_codigo ? 'Código del banco' : 'Elige primero el tipo de código'" class="w-full" />
        </UFormField>
        <UFormField label="Nombre del Banco" required>
          <UInput v-model="modelo.banco_nombre" :disabled="bloqueado" placeholder="Ej.: Bank of China" class="w-full" />
        </UFormField>
        <UFormField label="Dirección de banco pagador" required>
          <UInput v-model="modelo.banco_direccion" :disabled="bloqueado" class="w-full" />
        </UFormField>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="País" required><USelect v-model="modelo.banco_pais" :items="paisesDe(modelo.banco_pais)" :disabled="bloqueado" placeholder="Selecciona" class="w-full" /></UFormField>
          <UFormField label="Ciudad" required><UInput v-model="modelo.banco_ciudad" :disabled="bloqueado" class="w-full" /></UFormField>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-default bg-default p-4">
      <div class="mb-3 flex items-start gap-3">
        <span class="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">3</span>
        <div><h3 class="font-bold text-highlighted">Datos del banco intermediario (opcional)</h3><p class="text-xs text-muted">Solo si tu proveedor lo indica: no todos lo usan</p></div>
      </div>
      <div class="rounded-lg bg-elevated/60 px-3 py-2.5">
        <UCheckbox v-model="modelo.usa_intermediario" :disabled="bloqueado" label="Mi proveedor indica un banco intermediario" description="Márcalo solo si en los datos de tu proveedor aparece un banco intermediario o de correspondencia." />
      </div>
      <div v-if="modelo.usa_intermediario" class="mt-3 grid gap-3">
        <UFormField label="Tipo de código de banco" required>
          <USelect v-model="modelo.inter_tipo_codigo" :items="tiposCodigo" :disabled="bloqueado" class="w-full" />
        </UFormField>
        <UFormField label="Código" required><UInput v-model="modelo.inter_codigo" :disabled="bloqueado" class="w-full" /></UFormField>
        <UFormField label="Nombre del banco intermediario" required><UInput v-model="modelo.inter_nombre" :disabled="bloqueado" class="w-full" /></UFormField>
        <UFormField label="Dirección" required><UInput v-model="modelo.inter_direccion" :disabled="bloqueado" class="w-full" /></UFormField>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="País" required><USelect v-model="modelo.inter_pais" :items="paisesDe(modelo.inter_pais)" :disabled="bloqueado" placeholder="Selecciona" class="w-full" /></UFormField>
          <UFormField label="Ciudad" required><UInput v-model="modelo.inter_ciudad" :disabled="bloqueado" class="w-full" /></UFormField>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const modelo = defineModel<Record<string, any>>({ required: true })
const props = defineProps<{ bloqueado?: boolean }>()

// #2254: misma lista de países que el formulario del cliente (clientes-front, formulario-tt).
const PAISES = ['China', 'Hong Kong', 'Taiwán', 'Singapur', 'Malasia', 'Tailandia', 'Vietnam', 'India', 'Japón', 'Corea del Sur', 'Indonesia', 'Filipinas', 'Emiratos Árabes Unidos', 'Turquía', 'Estados Unidos', 'Canadá', 'México', 'Panamá', 'Colombia', 'Chile', 'Brasil', 'Argentina', 'Perú', 'España', 'Alemania', 'Italia', 'Francia', 'Reino Unido', 'Países Bajos', 'Portugal', 'Otro país']
/** Si el dato guardado no está en la lista (datos antiguos), se agrega para que se siga viendo. */
function paisesDe(valor: unknown) {
  const actual = String(valor || '').trim()
  return actual && !PAISES.includes(actual) ? [actual, ...PAISES] : PAISES
}

const tiposCodigo = ['SWIFT', 'ABA', 'CHIPS', 'Sort Code', 'Otro'].map((value) => ({ label: value, value }))

// A new form starts on SWIFT, the code most suppliers use.
watch(modelo, (value) => {
  if (props.bloqueado || !value) return
  if (!value.banco_tipo_codigo) value.banco_tipo_codigo = 'SWIFT'
  if (value.usa_intermediario && !value.inter_tipo_codigo) value.inter_tipo_codigo = 'SWIFT'
}, { immediate: true, deep: true })
</script>
