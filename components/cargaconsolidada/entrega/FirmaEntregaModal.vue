<template>
  <UModal class="w-full sm:max-w-md" @close="handleClose">
    <template #header>
      <h3 class="text-lg font-semibold text-primary-500">Firmar Entrega</h3>
    </template>
    <template #body>
      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
          <UInput
            v-model="nombre"
            placeholder="Ingrese su nombre"
            size="md"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI</label>
          <UInput
            v-model="dni"
            placeholder="Solo números (ej. 8 dígitos)"
            size="md"
            class="w-full"
            maxlength="8"
            inputmode="numeric"
            @update:model-value="onDniInput"
          />
        </div>
        <div>
          <p class="text-gray-600 dark:text-gray-400 mb-2">Dibuja tu firma en el área de abajo:</p>
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <canvas
              ref="signatureCanvas"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              @touchstart="startDrawingTouch"
              @touchmove="drawTouch"
              @touchend="stopDrawing"
              class="w-full h-40 border border-gray-200 dark:border-gray-600 rounded cursor-crosshair bg-white dark:bg-gray-900"
              style="touch-action: none;"
            />
          </div>
          <div class="flex justify-between items-center mt-2">
            <UButton
              @click="clearSignature"
              color="neutral"
              variant="outline"
              size="sm"
              :disabled="!hasSignature"
            >
              Limpiar
            </UButton>
            <p class="text-sm text-gray-500">
              {{ hasSignature ? 'Firma creada ✓' : 'Dibuja tu firma arriba' }}
            </p>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton @click="() => handleClose()" color="neutral" variant="outline">
          Cancelar
        </UButton>
        <UButton
          @click="confirmSignature"
          color="primary"
          :disabled="!canConfirm"
        >
          Firmar
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

interface Props {
  onConfirm?: (data: { nombre: string; dni: string; signatureData: string }) => void | Promise<void>
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  onConfirm: undefined,
  onClose: undefined
})

const emit = defineEmits<{ (e: 'close'): void }>()

const handleClose = () => {
  props.onClose?.()
  emit('close')
}

const onDniInput = (value: string) => {
  dni.value = (value || '').replace(/\D/g, '')
}

const nombre = ref('')
const dni = ref('')
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const hasSignature = ref(false)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

const canConfirm = computed(() =>
  nombre.value.trim() !== '' &&
  dni.value.trim() !== '' &&
  hasSignature.value
)

onMounted(() => {
  nextTick(() => setupCanvas())
})

const setupCanvas = () => {
  if (!signatureCanvas.value) return
  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
}

const startDrawing = (event: MouseEvent) => {
  if (!signatureCanvas.value) return
  event.preventDefault()
  event.stopPropagation()
  isDrawing.value = true
  const rect = signatureCanvas.value.getBoundingClientRect()
  lastX.value = event.clientX - rect.left
  lastY.value = event.clientY - rect.top
}

const draw = (event: MouseEvent) => {
  if (!isDrawing.value || !signatureCanvas.value) return
  event.preventDefault()
  event.stopPropagation()
  const ctx = signatureCanvas.value.getContext('2d')
  if (!ctx) return
  const rect = signatureCanvas.value.getBoundingClientRect()
  const currentX = event.clientX - rect.left
  const currentY = event.clientY - rect.top
  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()
  lastX.value = currentX
  lastY.value = currentY
  hasSignature.value = true
}

const startDrawingTouch = (event: TouchEvent) => {
  if (!signatureCanvas.value) return
  event.preventDefault()
  event.stopPropagation()
  isDrawing.value = true
  const rect = signatureCanvas.value.getBoundingClientRect()
  const touch = event.touches[0]
  lastX.value = touch.clientX - rect.left
  lastY.value = touch.clientY - rect.top
}

const drawTouch = (event: TouchEvent) => {
  if (!isDrawing.value || !signatureCanvas.value) return
  event.preventDefault()
  event.stopPropagation()
  const ctx = signatureCanvas.value.getContext('2d')
  if (!ctx) return
  const rect = signatureCanvas.value.getBoundingClientRect()
  const touch = event.touches[0]
  const currentX = touch.clientX - rect.left
  const currentY = touch.clientY - rect.top
  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()
  lastX.value = currentX
  lastY.value = currentY
  hasSignature.value = true
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearSignature = () => {
  hasSignature.value = false
  if (signatureCanvas.value) {
    const ctx = signatureCanvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height)
    }
  }
}

const confirmSignature = async () => {
  if (!canConfirm.value || !signatureCanvas.value) return
  const data = {
    nombre: nombre.value.trim(),
    dni: dni.value.trim(),
    signatureData: signatureCanvas.value.toDataURL('image/png')
  }
  if (props.onConfirm) {
    await props.onConfirm(data)
  }
  emit('close')
}
</script>
