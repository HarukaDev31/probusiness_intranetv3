<template>
    <UModal class="max-w-2xl">
        <template #header>
            <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Registrar Pago de Cliente - {{ clienteNombre }}
                </h3>
            </div>
        </template>
        <template #body>
            <div class="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Monto Field -->
                <div>
                    <UFormField label="Monto" name="monto">
                        <UInput v-model="formData.monto" type="number" placeholder="0.00" step="0.01" min="0"
                            class="w-full">
                            <template #leading>
                                <span class="text-gray-500">S/</span>
                            </template>
                        </UInput>
                    </UFormField>
                </div>

                <!-- Banco Field -->
                <div>
                    <UFormField label="Banco" name="banco">
                        <URadioGroup v-model="formData.banco" :items="bancoOptions" :multiple="false" variant="list"
                            orientation="horizontal" class="flex flex-row align-middle">
                            <template #label="{ item }">
                                <div class="">
                                    <img :src="item.icon" alt="Banco" class="w-12 h-12 ">
                                </div>
                            </template>
                        </URadioGroup>
                    </UFormField>
                </div>

                <!-- Fecha Field -->
                <div>

                    <UFormField label="Fecha" name="fecha">
                        <UInput v-model="formData.fecha" type="date" class="w-full" />
                    </UFormField>
                </div>

                <!-- Voucher Upload Section -->
                <div class="col-span-2">
                    <UFormField label="Voucher" name="voucher">
                        <FileUploader ref="fileUploaderRef"
                        :show-remove-button="true"
                        :multiple="false" @file-added="handleFileAdded"
                            @file-removed="handleFileRemoved" :show-save-button="false"  />

                    </UFormField>
                </div>
            </div>
        </template>

        <!-- Footer Actions -->
        <template #footer="{ close }">
            <div class="flex justify-end space-x-3">
                <UButton label="Cancelar" color="neutral" variant="ghost" @click="close" />
                <UButton label="Guardar" color="warning" @click="() => {
                    handleSave()
                }" />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUploader from './FileUploader.vue'
// Props
interface Props {
    clienteNombre: string

}
const selectedFile = ref<File | null>(null)
const handleFileAdded = (file: File) => {
    selectedFile.value = file
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'save': [data: any]
    'close': []
}>()

// Computed


// Form data
const formData = ref({
    monto: '',
    banco: [] as string[],
    fecha: new Date().toISOString().split('T')[0], // Today's date as default
    voucher: null as File | null
})

// Bank options for UCheckboxGroup
const bancoOptions = [
    {
        label: 'BCP',
        value: 'BCP',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_credito.gif'
    },
    {
        label: 'INTERBANK',
        value: 'INTERBANK',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Interbank_logo.svg'
    },
    {
        label: 'YAPE',
        value: 'YAPE',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Icono_de_la_aplicaci%C3%B3n_Yape.png'
    }
]

// Accepted file types
const acceptedFileTypes = ['image/*', 'application/pdf', 'image/jpeg', 'image/png']

// Methods
const closeModal = () => {
    resetForm()
}

const resetForm = () => {
    formData.value = {
        monto: '',
        banco: [],
        fecha: new Date().toISOString().split('T')[0],
        voucher: null as File | null
    } as any
}



const handleFileRemoved = (index: number) => {
    formData.value.voucher = null as File | null
}

const handleSave = () => {
    // Validación básica
    if (!formData.value.monto || formData.value.banco.length === 0 || !formData.value.fecha) {
        // Aquí podrías mostrar un mensaje de error
        return
    }

    const pagoData = {
        ...formData.value,
        voucher: selectedFile.value
    }

    emit('save', pagoData)
    emit('close')
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
