<template>
    <UModal class="max-w-md">
        <template #header>
            <div class="text-center">
                <h3 class="text-lg font-semibold">
                    Detalle del Adelanto
                </h3>
            </div>
        </template>
        
        <template #body>
            <div class="space-y-4">
                <!-- Monto -->
                <div class="flex justify-between items-center">
                    <span class="font-medium">Monto:</span>
                    <span class="text-lg font-semibold"> {{ formatCurrency(parseFloat(pagoDetails.monto),props.currency) }}</span>
                </div>

                <!-- Fecha -->
                <div class="flex justify-between items-center">
                    <span class="font-medium">Fecha:</span>
                    <span>{{ formatDate(pagoDetails.payment_date) }}</span>
                </div>

                <!-- Banco -->
                <div class="flex justify-between items-center">
                    <span class="font-medium">Banco:</span>
                    <div class="flex items-center gap-2">
                        <img 
                            :src="getBancoLogo(pagoDetails.banco)" 
                            :alt="pagoDetails.concepto"
                            class="w-8 h-8 object-contain"
                        />
                        <span>{{ getBancoName(pagoDetails.banco) }}</span>
                    </div>
                </div>

                <!-- Archivo -->
                <div v-if="pagoDetails.voucher_url" class="flex justify-between items-center">
                    <span class="font-medium">Archivo:</span>
                    <div class="flex items-center gap-2">
 
                        <FileIcon :file="{  
                            file_name: pagoDetails.voucher_url.split('/').pop(),
                            file_url: pagoDetails.voucher_url,
                            file_ext: 'pdf',
                            size: 0,
                            type: 'pdf',
                            lastModified: 0,
                            id: 0,
                            
                        }" 
                        @click="handleDownload(pagoDetails.voucher_url)"
                        />
                        <span class="">{{ pagoDetails.voucher_url.split('/').pop() }}</span>
                    </div>
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end">
                <UButton 
                    icon="i-heroicons-trash"
                    color="error"
                    variant="solid"
                    @click="handleDelete"
                />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { PagosDetails } from '~/types/cargaconsolidada/clientes/pagos'
import FileIcon from './FileIcon.vue'
interface Props {
    pagoDetails : PagosDetails
    currency:string
}

const props = withDefaults(defineProps<Props>(), {
    currency: 'PEN'
})

const emit = defineEmits<{
    'delete': [pagoId: number]
    'close': []
}>()

// Métodos para formatear y obtener datos
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

const getBancoLogo = (concepto: string) => {
    const bancos = {
        'BCP': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_credito.gif',
        'INTERBANK': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Interbank_logo.svg',
        'YAPE': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Icono_de_la_aplicaci%C3%B3n_Yape.png'
    }
    return bancos[concepto as keyof typeof bancos] || ''
}

const getBancoName = (concepto: string) => {
    const bancos = {
        'BCP': 'Banco de Crédito BCP',
        'INTERBANK': 'Interbank',
        'YAPE': 'YAPE'
    }
    return bancos[concepto as keyof typeof bancos] || concepto
}

const handleDownload = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = 'voucher.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}


const handleDelete = () => {
    emit('delete', props.pagoDetails.id_pago)
}
</script>
