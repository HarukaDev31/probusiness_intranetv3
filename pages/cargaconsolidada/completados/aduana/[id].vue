<template>
    <div class="mx-6 p-6 ">
        <PageHeader title="" subtitle="" icon="" :hide-back-button="false" @back="
            navigateTo(`/cargaconsolidada/completados/pasos/${id}`)
            " />

        <!-- Form -->
        <UCard class="p-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-lg flex items-center gap-3">
                        Aduana
                        <UIcon name="i-heroicons-cube-transparent" class="text-gray-700" />
                    </h1>
                </div>
            </div>
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <div class="grid md:grid-cols-3 gap-x-12 gap-y-6">
                    <!-- Naviera -->
                    <div>
                        <UFormField label="Naviera">
                            <USelect class="w-full" v-model="formData.naviera" :items="navieras"
                                placeholder="Selecciona una naviera" />
                        </UFormField>
                    </div>

                    <!-- Multa -->
                    <div>
                        <UFormField label="Multa">
                            <UInput class="w-full" v-model="formData.multa" type="number" step="0.01"
                                placeholder="0.00">
                                <template #leading>
                                    <span class="text-gray-500">$</span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>

                    <!-- Observaciones (3 rows) -->
                    <div class="row-span-3">
                        <UFormField label="Observaciones">
                            <UTextarea class="w-full" v-model="formData.observaciones" rows="3" />
                        </UFormField>
                    </div>

                    <!-- Toneladas contenedor -->
                    <div>
                        <UFormField label="Toneladas contenedor">
                            <USelect class="w-full" v-model="formData.tipo_contenedor" :items="tiposContenedor"
                                placeholder="Seleccione tipo" />
                        </UFormField>
                    </div>

                    <!-- Fecha levante -->
                    <div>
                        <UFormField label="Fecha levante">
                            <UInput class="w-full" v-model="formData.fecha_levante" type="date" />
                        </UFormField>
                    </div>

                    <!-- Fecha zarpe -->
                    <div>
                        <UFormField label="Fecha zarpe">
                            <UInput class="w-full" v-model="formData.fecha_zarpe" type="date" />
                        </UFormField>
                    </div>

                    <!-- Número Dua -->
                    <div>
                        <UFormField label="Número Dua">
                            <UInput class="w-full" v-model="formData.numero_dua" />
                        </UFormField>
                    </div>

                    <!-- Fecha arribo -->
                    <div>
                        <UFormField label="Fecha arribo">
                            <UInput class="w-full" v-model="formData.fecha_arribo" type="date" />
                        </UFormField>
                    </div>

                    <!-- Valor FOB -->
                    <div>
                        <UFormField label="Valor FOB">
                            <UInput class="w-full" v-model="formData.valor_fob" type="number" step="0.01">
                                <template #leading>
                                    <span class="text-gray-500">$</span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>

                    <!-- Doc Tributos (2 rows) -->
                    <div class="row-span-2">
                        <UFormField label="DOC. TRIBUTOS Y AJUSTES">
                            <FileUploader :multiple="true"
                            :key="aduanaFiles.length"
                                :accepted-types="['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm']"
                                custom-message="Selecciona o arrastra tu archivo aquí"
                                :initial-files="aduanaFiles"
                                :show-remove-button="true"
                                @file-removed="handleFileRemoved"
                                @files-selected="handleTributosFiles" />
                        </UFormField>
                    </div>

                    <!-- Fecha declaración -->
                    <div>
                        <UFormField label="Fecha declaración">
                            <UInput class="w-full" v-model="formData.fecha_declaracion" type="date" />
                        </UFormField>
                    </div>

                    <!-- Valor flete -->
                    <div>
                        <UFormField label="Valor flete">
                            <UInput class="w-full" v-model="formData.valor_flete" type="number" step="0.01">
                                <template #leading>
                                    <span class="text-gray-500">$</span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>

                    <!-- Canal de Control -->
                    <div>
                        <UFormField label="Canal de Control">
                            <USelect class="w-full" v-model="formData.canal_control" :items="canalesControl"
                                placeholder="Seleccione canal"
                                :class="[STATUS_BG_CLASSES[formData.canal_control as keyof typeof STATUS_BG_CLASSES]]" />
                        </UFormField>
                    </div>

                    <!-- Costo destino -->
                    <div>
                        <UFormField label="Costo destino">
                            <UInput class="w-full" v-model="formData.costo_destino" type="number" step="0.01">
                                <template #leading>
                                    <span class="text-gray-500">$</span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>

                    <!-- Resumen Impuestos (2 rows) -->
                    <div class="row-span-2">
                        <UFormField label="RESUMEN DE IMPUESTOS PAGADOS">
                            <FileUploader :multiple="true"
                                :key="aduanaImpuestosPagados.length"
                                :accepted-types="['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm']"
                                custom-message="Selecciona o arrastra tu archivo aquí"
                                :initial-files="aduanaImpuestosPagados"
                                :show-remove-button="true"
                                @file-removed="handleFileRemoved"
                                @files-selected="handleImpuestosFiles" />
                        </UFormField>
                    </div>

                    <!-- Ajuste de valor -->
                    <div>
                        <UFormField label="Ajuste de valor">
                            <UInput class="w-full" v-model="formData.ajuste_valor" type="number" step="0.01">
                                <template #leading>
                                    <span class="text-gray-500">$</span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>
                </div>

                <!-- Buttons -->
                <div class="flex justify-between pt-6 border-t mt-6">
                    <div v-if="aduanaData" class="text-sm text-gray-600 dark:text-gray-400">
                    </div>
                    <div class="flex gap-3">

                        <UButton type="submit" color="primary" variant="solid" :loading="loading">
                            {{ aduanaData ? 'Actualizar' : 'Guardar' }}
                        </UButton>
                    </div>
                </div>
            </form>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useOverlay } from '#imports'
import FileUploader from '~/components/commons/FileUploader.vue'
import { useAduana } from '~/composables/cargaconsolidada/useAduana'
import { STATUS_BG_CLASSES } from '~/constants/ui'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
const {showSuccess, showError, showConfirmation} = useModal()
import type { FileItem } from '~/types/commons/file'
const route = useRoute()
const id = route.params.id
const { withSpinner } = useSpinner()
// Usar el composable
const {
    loading,
    formData,
    isFormValid,
    aduanaData,
    loadAduanaData,
    saveAduana,
    handleTributosFiles,
    handleImpuestosFiles,
    deleteFileAduana,
    resetForm,
    aduanaImpuestosPagados,
    aduanaFiles
} = useAduana()

// Configurar overlay para el modal




// Options for selects
const navieras = [
    { label: 'MAERSK', value: 'MAERSK' },
    { label: 'ONE', value: 'ONE' },
    { label: 'EVERGREEN', value: 'EVERGREEN' },
    { label: 'MSC', value: 'MSC' },
    { label: 'HAPAG LLOYD', value: 'HAPAG LLOYD' },
    { label: 'CMA CGM', value: 'CMA CGM' },
    { label: 'YANG MING', value: 'YANG MING' },
    { label: 'ZIM', value: 'ZIM' },
    { label: 'COSCO', value: 'COSCO' },
    { label: 'WAN HAI', value: 'WAN HAI' }
]

const tiposContenedor = [
    { label: 'LCL', value: 'LCL' },
    { label: '20 GP', value: '20 GP' },
    { label: '40 NOR', value: '40 NOR' },
    { label: '40 GP', value: '40 GP' },
    { label: '40 HQ', value: '40 HQ' }
]

const canalesControl = [
    { label: 'Verde', value: 'Verde' },
    { label: 'Naranja', value: 'Naranja' },
    { label: 'Rojo', value: 'Rojo' }
]

const handleFileRemoved = async (id: number) => {
    
    showConfirmation('Eliminar archivo', '¿Estás seguro de querer eliminar este archivo?', async () => {
    await withSpinner(async () => {
        const result = await deleteFileAduana(id.toString())
        if (result.success) {
            showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
            await loadAduanaData()
            } else {
            showError('Error', result.error || 'Error al eliminar el archivo')
            }
        }, 'Eliminando archivo...')
        }, () => {
        
    })
}
// Form submit
const handleSubmit = async () => {
    await withSpinner(async () => {
        const success = await saveAduana()
        if (success) {
            await loadAduanaData()
            // El formulario se resetea automáticamente en el composable
        }
    }, 'Guardando datos de aduana...')

}

// Cargar datos al montar el componente
onMounted(() => {
    
    loadAduanaData()
})

// Watcher para debuggear cambios en el formulario
watch(formData, (newValue) => {
    
}, { deep: true })

// Watcher para debuggear cuando se cargan los datos
watch(aduanaData, (newValue) => {
    
}, { deep: true })
</script>
