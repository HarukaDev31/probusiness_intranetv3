<template>
  <div class="grid gap-3 md:grid-cols-2">
    <UFormField label="Nombre del beneficiario" class="md:col-span-2">
      <UInput v-model="modelo.beneficiario_nombre" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Número de cuenta o IBAN" class="md:col-span-2">
      <UInput v-model="modelo.beneficiario_cuenta" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Dirección" class="md:col-span-2">
      <UInput v-model="modelo.beneficiario_direccion" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="País">
      <UInput v-model="modelo.beneficiario_pais" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Ciudad">
      <UInput v-model="modelo.beneficiario_ciudad" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Tipo de código">
      <USelect v-model="modelo.banco_tipo_codigo" :items="tiposCodigo" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Código de banco">
      <UInput v-model="modelo.banco_codigo" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Nombre del banco" class="md:col-span-2">
      <UInput v-model="modelo.banco_nombre" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Dirección del banco" class="md:col-span-2">
      <UInput v-model="modelo.banco_direccion" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="País del banco">
      <UInput v-model="modelo.banco_pais" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UFormField label="Ciudad del banco">
      <UInput v-model="modelo.banco_ciudad" :disabled="bloqueado" class="w-full" />
    </UFormField>
    <UCheckbox v-model="modelo.usa_intermediario" :disabled="bloqueado" label="Usar banco intermediario" class="md:col-span-2" />
    <template v-if="modelo.usa_intermediario">
      <UFormField label="Tipo de código">
        <USelect v-model="modelo.inter_tipo_codigo" :items="tiposCodigo" :disabled="bloqueado" class="w-full" />
      </UFormField>
      <UFormField label="Código">
        <UInput v-model="modelo.inter_codigo" :disabled="bloqueado" class="w-full" />
      </UFormField>
      <UFormField label="Nombre del banco intermediario" class="md:col-span-2">
        <UInput v-model="modelo.inter_nombre" :disabled="bloqueado" class="w-full" />
      </UFormField>
      <UFormField label="Dirección" class="md:col-span-2">
        <UInput v-model="modelo.inter_direccion" :disabled="bloqueado" class="w-full" />
      </UFormField>
      <UFormField label="País">
        <UInput v-model="modelo.inter_pais" :disabled="bloqueado" class="w-full" />
      </UFormField>
      <UFormField label="Ciudad">
        <UInput v-model="modelo.inter_ciudad" :disabled="bloqueado" class="w-full" />
      </UFormField>
    </template>
  </div>
</template>

<script setup lang="ts">
const modelo = defineModel<Record<string, any>>({ required: true })
const props = defineProps<{ bloqueado?: boolean }>()

const tiposCodigo = ['SWIFT', 'ABA', 'CHIPS', 'Sort Code', 'Otro'].map((value) => ({ label: value, value }))

// A new form starts on SWIFT, the code most suppliers use.
watch(modelo, (value) => {
  if (props.bloqueado || !value) return
  if (!value.banco_tipo_codigo) value.banco_tipo_codigo = 'SWIFT'
  if (value.usa_intermediario && !value.inter_tipo_codigo) value.inter_tipo_codigo = 'SWIFT'
}, { immediate: true, deep: true })
</script>
