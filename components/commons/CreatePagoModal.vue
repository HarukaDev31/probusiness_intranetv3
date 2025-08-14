<template>
    <UModal v-model="isOpen" class="max-w-2xl">
        <template #header>
            <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Registrar Pago de Cliente - {{ clienteNombre }}
                </h3>
            </div>
        </template>
        <template #body>
            <div class="space-y-6">
                <!-- Monto Field -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monto
                    </label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            S/
                        </span>
                        <UInput v-model="formData.monto" type="number" placeholder="0.00" class="pl-8" step="0.01"
                            min="0" />
                    </div>
                </div>

                <!-- Banco Field -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Banco
                    </label>
                    <div class="flex space-x-6">
                        <label v-for="banco in bancos" :key="banco.id"
                            class="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" :value="banco.id" v-model="formData.banco"
                                class="text-primary focus:ring-primary" />
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                                    :class="banco.colorClass">
                                    {{ banco.logo }}
                                </div>
                                <span class="text-sm text-gray-700 dark:text-gray-300">
                                    {{ banco.nombre }}
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Fecha Field -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha
                    </label>
                    <div class="relative">
                        <UInput v-model="formData.fecha" type="date" class="pr-10" />
                        <UIcon name="i-heroicons-calendar-days"
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <!-- Voucher Upload Section -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Voucher
                    </label>
                    <FileUploader :multiple="false" :max-file-size="10 * 1024 * 1024"
                        :accepted-types="acceptedFileTypes" :initial-files="formData.voucher ? [formData.voucher] : []"
                        @files-selected="handleFilesSelected" @file-removed="handleFileRemoved" />
                </div>
            </div>
        </template>
        <!-- Footer Actions -->
        <template #footer>
            <div class="flex justify-end space-x-3">
                <UButton label="Cancelar" color="neutral" variant="ghost" @click="closeModal" />
                <UButton label="Guardar" color="warning" @click="handleSave" />
            </div>
        </template>

    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
    modelValue: boolean
    clienteNombre: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'save': [data: any]
}>()

// Computed
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Form data
const formData = ref({
    monto: '',
    banco: '',
    fecha: new Date().toISOString().split('T')[0], // Today's date as default
    voucher: null as File | null
})

// Bank options
const bancos = [
    {
        id: 'bcp',
        nombre: 'Banco de Crédito BCP',
        logo: 'BCP',
        colorClass: 'bg-blue-600'
    },
    {
        id: 'interbank',
        nombre: 'Interbank',
        logo: 'I',
        colorClass: 'bg-blue-500'
    },
    {
        id: 'otro',
        nombre: 'Otro Banco',
        logo: 'OB',
        colorClass: 'bg-purple-500'
    }
]

// Accepted file types
const acceptedFileTypes = '.pdf,.docx,.xlsx,.xls,.xlsm,.csv,.xlsb,.xltx,.xlt,.png,.jpg,.jpeg'

// Methods
const closeModal = () => {
    emit('update:modelValue', false)
    resetForm()
}

const resetForm = () => {
    formData.value = {
        monto: '',
        banco: '',
        fecha: new Date().toISOString().split('T')[0],
        voucher: null
    }
}

const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
        formData.value.voucher = files[0]
    }
}

const handleFileRemoved = (index: number) => {
    formData.value.voucher = null
}

const handleSave = () => {
    // Validación básica
    if (!formData.value.monto || !formData.value.banco || !formData.value.fecha) {
        // Aquí podrías mostrar un mensaje de error
        return
    }

    emit('save', { ...formData.value })
    closeModal()
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
