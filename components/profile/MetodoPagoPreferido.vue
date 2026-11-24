<template>
  <UCard :ui="{ root: 'w-full', body: 'w-full' }" data-testid="metodo-pago-preferido">
    <div class="flex flex-row gap-2 items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-wallet" class="w-5 h-5 text-primary" />
        <h3>Método de pago preferido</h3>
      </div>
      <UButton
        v-if="!cargando"
        variant="ghost"
        :icon="editando ? 'i-heroicons-x-mark' : 'i-heroicons-pencil'"
        class="h-8 w-8"
        aria-label="Editar método de pago"
        @click="toggleEditar"
      />
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
      Aquí te pagaremos los reintegros (viáticos). Por ahora solo billeteras digitales.
    </p>

    <USkeleton v-if="cargando" class="h-10 w-full rounded" />
    <div v-else class="flex flex-col sm:flex-row gap-4">
      <div class="w-full sm:w-48">
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Billetera</label>
        <USelect v-model="form.metodo" :items="metodos" :disabled="!editando" class="w-full" />
      </div>
      <div class="w-full sm:flex-1">
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Número de celular</label>
        <UInput
          v-model="form.numero"
          :disabled="!editando"
          inputmode="numeric"
          maxlength="9"
          placeholder="9XXXXXXXX"
          class="w-full"
        />
      </div>
    </div>
    <p v-if="!cargando && !configurado && !editando" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
      Por defecto usamos Yape con el número de tu cuenta. Puedes cambiarlo.
    </p>
    <p v-if="errorNumero" class="text-xs text-red-500 mt-2">{{ errorNumero }}</p>

    <UButton
      v-if="editando"
      :loading="guardando"
      :disabled="!!errorNumero || !form.numero"
      class="w-full sm:w-80 mx-auto mt-4 py-3 flex items-center justify-center text-white"
      @click="guardar"
    >
      Guardar
    </UButton>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { MetodoPagoService, type MetodoPagoPreferido } from '~/services/commons/metodoPagoService'

const toast = useToast()
const cargando = ref(true)
const guardando = ref(false)
const editando = ref(false)
const configurado = ref(false)
const metodos = ref<{ value: string; label: string }[]>([
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' }
])
const form = ref({ metodo: 'yape', numero: '' })
let original: MetodoPagoPreferido | null = null

const errorNumero = computed(() => {
  if (!editando.value || !form.value.numero) return ''
  return /^9\d{8}$/.test(form.value.numero.trim()) ? '' : 'El número debe tener 9 dígitos y empezar con 9.'
})

function aplicar(data: MetodoPagoPreferido) {
  original = data
  configurado.value = data.configurado
  form.value = { metodo: data.metodo || 'yape', numero: data.numero ?? '' }
}

function toggleEditar() {
  if (editando.value && original) aplicar(original)
  editando.value = !editando.value
}

async function cargar() {
  cargando.value = true
  try {
    const res = await MetodoPagoService.get()
    if (res?.metodos?.length) metodos.value = res.metodos
    if (res?.data) aplicar(res.data)
  } catch (e: any) {
    toast.add({ title: 'No se pudo cargar tu método de pago', description: e?.message, color: 'error' })
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  if (errorNumero.value) return
  guardando.value = true
  try {
    const res = await MetodoPagoService.update(form.value.metodo, form.value.numero.trim())
    if (res?.data) aplicar(res.data)
    editando.value = false
    toast.add({ title: 'Método de pago guardado', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'No se pudo guardar', description: e?.message, color: 'error' })
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>
