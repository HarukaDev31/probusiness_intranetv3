<template>
    <UModal class="max-w-lg">
        <template #header>
            <div class="text-center align-middle flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Registrar Pago de Cliente
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    <span class="font-medium">{{ props.clienteNombre }}</span>
                </p>
            </div>
        </template>
        <template #body>
            <div class="space-y-6 flex flex-col gap-4 items-center">
                <!-- Monto Field -->
                <div class="w-1/2">
                    <UFormField label="Monto" name="monto">
                        <UInput v-model="formData.monto" type="number" placeholder="0.00" step="0.01" min="0"
                            class="w-full">
                            <template #leading>
                                <span class="text-gray-500">{{ props.currency=='USD'?'$':'S/' }}</span>
                            </template>
                        </UInput>
                    </UFormField>
                </div>

                <!-- Banco Field -->
                <div class="w-1/2">
                    <UFormField label="Banco" name="banco">
                        <URadioGroup v-model="formData.banco" :items="bancoOptions" :multiple="false" variant="list"
                            orientation="horizontal" class="flex flex-col items-center"
                            :ui="{item: 'flex flex-col-reverse items-center gap-2 p-1'}">
                            <template #label="{ item }">
                                <div class="">
                                    <img :src="item.icon" alt="Banco" class="w-15 h-15 rounded-md">
                                </div>
                            </template>
                        </URadioGroup>
                    </UFormField>
                </div>

                <UFormField label="Fecha Cierre" required class="w-1/2">
                    <UPopover>
                        <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full">
                            {{ fecha ? df.format(fecha.toDate(getLocalTimeZone())) : 'Seleccione una fecha'
                            }}
                        </UButton>

                        <template #content>
                            <UCalendar v-model="fecha" class="p-2 w-full" />
                        </template>
                    </UPopover>
                </UFormField>
              

                <!-- Voucher: si viene initialVoucher se muestra el nombre; si no, FileUploader -->
                <div class="col-span-2 w-full">
                    <UFormField label="Voucher" name="voucher">
                        <div v-if="initialVoucher" class="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <UIcon name="i-heroicons-document" class="w-5 h-5 text-gray-500" />
                            <span class="text-sm truncate flex-1">{{ initialVoucher.name }}</span>
                        </div>
                        <FileUploader v-else ref="fileUploaderRef"
                            :show-remove-button="true"
                            :accepted-types="['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar']"
                            :multiple="false"
                            @file-added="handleFileAdded"
                            @file-removed="handleFileRemoved"
                            :show-save-button="false" />
                    </UFormField>
                </div>
            </div>
        </template>

        <!-- Footer Actions -->
        <template #footer="{ close }">
            <div class="flex justify-end space-x-3">
                <UButton label="Cancelar" size="xl" color="neutral" variant="ghost" @click="close" />
                <UButton label="Guardar" size="xl" color="primary" @click="() => {
                    handleSave()
                }" />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FileUploader from './FileUploader.vue'
import { CalendarDate } from '@internationalized/date'
import { getLocalTimeZone, DateFormatter, } from '@internationalized/date'
interface Props {
    clienteNombre: string
    currency: string
    /** Si se abre desde un FileUploader (p. ej. sección Pago servicio), el archivo ya viene seleccionado */
    initialVoucher?: File | null
}
const props = withDefaults(defineProps<Props>(), {
    currency: 'USD'
})
const selectedFile = ref<File | null>(null)

watch(() => props.initialVoucher, (f) => {
    selectedFile.value = f ?? null
}, { immediate: true })

const handleFileAdded = (file: File) => {
    selectedFile.value = file
}
const df = new DateFormatter('en-US', {
    dateStyle: 'medium'
})
const hoy = new Date();

const fecha = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))

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
    fecha: null,
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
    if (!formData.value.monto || formData.value.banco.length === 0 || !fecha.value) {
        // Aquí podrías mostrar un mensaje de error
        return
    }

    const pagoData = {
        ...formData.value,
        voucher: selectedFile.value,
        fecha:fecha.value
    }

    emit('save', pagoData)
    emit('close')
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
