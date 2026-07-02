<template>
  <UModal :open="abierto" @update:open="onUpdateOpen">
    <template #header>
      <div class="flex w-full items-center justify-between">
        <h2 class="text-base font-semibold text-highlighted">Nueva solicitud</h2>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark"
          size="sm"
          :disabled="loading"
          @click="cerrar"
        />
      </div>
    </template>
    <template #body>
      <div
        class="max-h-[70vh] space-y-4 overflow-y-auto px-1 transition-opacity"
        :class="loading ? 'pointer-events-none opacity-60' : ''"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wider text-muted">Tipo de solicitud</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="rounded-xl border-2 p-3 text-left transition-colors"
            :class="claseTipoCard('A')"
            :disabled="loading"
            @click="tipo = 'A'"
          >
            <div class="text-sm font-semibold text-highlighted">Tipo A</div>
            <div class="mt-0.5 text-[10px] text-muted">Proyecto del mes</div>
          </button>
          <button
            type="button"
            class="rounded-xl border-2 p-3 text-left transition-colors"
            :class="claseTipoCard('B')"
            :disabled="loading"
            @click="tipo = 'B'"
          >
            <div class="text-sm font-semibold text-highlighted">Tipo B</div>
            <div class="mt-0.5 text-[10px] text-muted">Requerimiento TI</div>
          </button>
        </div>

        <UFormField v-if="tipo === 'B'" label="Subtipo">
          <USelect
            v-model="subtipoB"
            :items="itemsSubtipo"
            value-key="value"
            label-key="label"
            size="sm"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <USeparator />

        <UFormField label="Área solicitante" hint="Preseleccionada según tu perfil">
          <USelect
            v-model="area"
            :items="itemsArea"
            value-key="value"
            label-key="label"
            size="sm"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField
          label="URL"
          required
          hint="Pega la URL de la página donde ocurre el caso"
          :error="errors.seccionRuta"
        >
          <UInput
            v-model="seccionRuta"
            size="sm"
            class="w-full"
            :disabled="loading"
            placeholder="https://..."
            @update:model-value="limpiarError('seccionRuta')"
          />
        </UFormField>

        <UFormField label="Título" required :error="errors.titulo">
          <UInput
            v-model="titulo"
            size="sm"
            class="w-full"
            :disabled="loading"
            placeholder="Describe brevemente..."
            @update:model-value="limpiarError('titulo')"
          />
        </UFormField>

        <UFormField
          :label="tipo === 'A' ? 'Objetivo / alcance' : 'Descripción del problema'"
          required
          :error="errors.descripcion"
        >
          <UTextarea
            v-model="descripcion"
            :rows="3"
            class="w-full"
            :disabled="loading"
            :placeholder="tipo === 'A' ? '¿Qué busca lograr?' : '¿Qué falla o necesitas?'"
            @update:model-value="limpiarError('descripcion')"
          />
        </UFormField>

        <USeparator />

        <UFormField
          label="Evidencias (pantallazos)"
          required
          :hint="`Al menos 1 imagen. Máx. ${SOPORTE_TI_MAX_IMAGENES_CHAT} (${SOPORTE_TI_MAX_IMAGEN_MB} MB c/u)`"
          :error="errors.pantallazos"
        >
          <div :class="errors.pantallazos ? 'rounded-lg ring-2 ring-error' : ''">
            <FileUploader
              :model-files="pantallazos"
              multiple
              :max-file-size="SOPORTE_TI_MAX_IMAGEN_MB * 1024 * 1024"
              :accepted-types="['.jpg', '.jpeg', '.png', '.gif', '.webp']"
              custom-message="Arrastra capturas o usa «Subir archivo»"
              @files-selected="onPantallazosAgregados"
              @file-removed="onPantallazoEliminado"
            />
          </div>
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="loading" @click="cerrar">
          Cancelar
        </UButton>
        <UButton :loading="loading" :disabled="loading" @click="guardar">Crear solicitud</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  SOPORTE_TI_AREAS,
  SOPORTE_TI_AREA_DEFAULT,
  SOPORTE_TI_MAX_IMAGENES_CHAT,
  SOPORTE_TI_MAX_IMAGEN_MB
} from '~/constants/soporteTi'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { SoporteTiCreatePayload, SoporteTiSubtipoB, SoporteTiTipo } from '~/types/soporteTi'

type CampoError = 'seccionRuta' | 'titulo' | 'descripcion' | 'pantallazos'

const abierto = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    loading?: boolean
  }>(),
  { loading: false }
)

const emit = defineEmits<{
  saved: [payload: SoporteTiCreatePayload]
}>()

const tipo = ref<SoporteTiTipo>('B')
const subtipoB = ref<SoporteTiSubtipoB>('B1')
const area = ref<(typeof SOPORTE_TI_AREAS)[number]>(
  SOPORTE_TI_AREA_DEFAULT as (typeof SOPORTE_TI_AREAS)[number]
)
const seccionRuta = ref('')
const titulo = ref('')
const descripcion = ref('')
const pantallazos = ref<File[]>([])

const errors = reactive<Partial<Record<CampoError, string>>>({})

const itemsSubtipo = [
  { label: 'B1 — Incidencia (fallo / error)', value: 'B1' as const },
  { label: 'B2 — Configuración (ajuste / acceso)', value: 'B2' as const }
]

const itemsArea = computed(() =>
  SOPORTE_TI_AREAS.map((a) => ({ label: a, value: a }))
)

const loading = computed(() => props.loading)

function claseTipoCard(valor: SoporteTiTipo) {
  const base = loading.value ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
  if (tipo.value === valor) {
    return `${base} border-primary ring-1 ring-primary`
  }
  return `${base} border-default hover:border-primary/40`
}

watch(abierto, (v) => {
  if (v) {
    tipo.value = 'B'
    subtipoB.value = 'B1'
    area.value = SOPORTE_TI_AREA_DEFAULT
    seccionRuta.value = ''
    titulo.value = ''
    descripcion.value = ''
    pantallazos.value = []
    limpiarErrores()
  }
})

function limpiarErrores() {
  for (const k of Object.keys(errors) as CampoError[]) {
    delete errors[k]
  }
}

function limpiarError(campo: CampoError) {
  delete errors[campo]
}

function validar(): boolean {
  limpiarErrores()
  let ok = true

  if (!seccionRuta.value.trim()) {
    errors.seccionRuta = 'Indica la URL donde ocurre el caso.'
    ok = false
  }

  if (!titulo.value.trim()) {
    errors.titulo = 'El título es obligatorio.'
    ok = false
  } else if (titulo.value.trim().length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres.'
    ok = false
  }

  if (!descripcion.value.trim()) {
    errors.descripcion =
      tipo.value === 'A'
        ? 'Describe el objetivo o alcance del proyecto.'
        : 'Describe el problema o lo que necesitas.'
    ok = false
  } else if (descripcion.value.trim().length < 10) {
    errors.descripcion = 'La descripción debe tener al menos 10 caracteres.'
    ok = false
  }

  if (pantallazos.value.length === 0) {
    errors.pantallazos = 'Debes adjuntar al menos una evidencia (pantallazo).'
    ok = false
  }

  return ok
}

function onUpdateOpen(value: boolean) {
  if (!value && props.loading) {
    return
  }
  abierto.value = value
}

function cerrar() {
  if (props.loading) {
    return
  }
  abierto.value = false
}

function onPantallazosAgregados(nuevos: File[]) {
  const merged = [...pantallazos.value, ...nuevos].slice(0, SOPORTE_TI_MAX_IMAGENES_CHAT)
  pantallazos.value = merged
  if (merged.length > 0) {
    limpiarError('pantallazos')
  }
}

function onPantallazoEliminado(idx: number) {
  pantallazos.value = pantallazos.value.filter((_, i) => i !== idx)
}

function guardar() {
  if (props.loading) {
    return
  }
  if (!validar()) {
    return
  }

  const payload: SoporteTiCreatePayload = {
    tipo: tipo.value,
    subtipoB: tipo.value === 'B' ? subtipoB.value : null,
    titulo: titulo.value.trim(),
    area: area.value,
    seccionRuta: seccionRuta.value.trim(),
    descripcion: descripcion.value.trim(),
    imagenes: [...pantallazos.value]
  }

  emit('saved', payload)
}
</script>
