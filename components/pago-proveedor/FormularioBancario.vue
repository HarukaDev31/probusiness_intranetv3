<template>
  <div class="grid gap-3 md:grid-cols-2">
    <label class="text-sm md:col-span-2">Nombre del beneficiario
      <input v-model="modelo.beneficiario_nombre" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm md:col-span-2">Número de cuenta o IBAN
      <input v-model="modelo.beneficiario_cuenta" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm md:col-span-2">Dirección
      <input v-model="modelo.beneficiario_direccion" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm">País
      <input v-model="modelo.beneficiario_pais" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm">Ciudad
      <input v-model="modelo.beneficiario_ciudad" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm">Tipo de código
      <select v-model="modelo.banco_tipo_codigo" class="campo" :disabled="bloqueado">
        <option value="SWIFT">SWIFT</option>
        <option value="ABA">ABA</option>
        <option value="CHIPS">CHIPS</option>
        <option value="Sort Code">Sort Code</option>
        <option value="Otro">Otro</option>
      </select>
    </label>
    <label class="text-sm">Código de banco
      <input v-model="modelo.banco_codigo" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm md:col-span-2">Nombre del banco
      <input v-model="modelo.banco_nombre" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm md:col-span-2">Dirección del banco
      <input v-model="modelo.banco_direccion" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm">País del banco
      <input v-model="modelo.banco_pais" class="campo" :disabled="bloqueado" />
    </label>
    <label class="text-sm">Ciudad del banco
      <input v-model="modelo.banco_ciudad" class="campo" :disabled="bloqueado" />
    </label>
    <label class="flex items-center gap-2 text-sm md:col-span-2">
      <input v-model="modelo.usa_intermediario" type="checkbox" :disabled="bloqueado" />
      Usar banco intermediario
    </label>
    <template v-if="modelo.usa_intermediario">
      <label class="text-sm">Tipo de código
        <select v-model="modelo.inter_tipo_codigo" class="campo" :disabled="bloqueado">
          <option value="SWIFT">SWIFT</option>
          <option value="ABA">ABA</option>
          <option value="CHIPS">CHIPS</option>
          <option value="Sort Code">Sort Code</option>
          <option value="Otro">Otro</option>
        </select>
      </label>
      <label class="text-sm">Código
        <input v-model="modelo.inter_codigo" class="campo" :disabled="bloqueado" />
      </label>
      <label class="text-sm md:col-span-2">Nombre del banco intermediario
        <input v-model="modelo.inter_nombre" class="campo" :disabled="bloqueado" />
      </label>
      <label class="text-sm md:col-span-2">Dirección
        <input v-model="modelo.inter_direccion" class="campo" :disabled="bloqueado" />
      </label>
      <label class="text-sm">País
        <input v-model="modelo.inter_pais" class="campo" :disabled="bloqueado" />
      </label>
      <label class="text-sm">Ciudad
        <input v-model="modelo.inter_ciudad" class="campo" :disabled="bloqueado" />
      </label>
    </template>
  </div>
</template>

<script setup lang="ts">
const modelo = defineModel<Record<string, any>>({ required: true })
defineProps<{ bloqueado?: boolean }>()
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
