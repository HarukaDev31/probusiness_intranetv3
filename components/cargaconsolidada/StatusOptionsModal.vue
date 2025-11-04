<template>
    <UModal  @close="$emit('close')" class="sm:max-w-6xl max-h-[85vh]">
        <slot name="trigger" />
        <template #header>
            <div class="flex items-center justify-between">
                <UButton 
                v-if="showContenedoresOpttons"
                color="primary" variant="ghost"
                icon="i-heroicons-arrow-left"
                @click="showContenedoresOpttons=false"
                ></UButton>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Seleccionar estado
                </h3>
                
            </div>
        </template>
        <template #body>
            <div class="space-y-3" v-if="!showContenedoresOpttons">
                <USelect  class="w-full"
                @update:model-value="handleStatusChange"
                v-model="selectedStatus" :items="statusOptions" />
            </div>
            <div class="space-y-3 mt-4" v-if="!showContenedoresOpttons">
                <!--UCheckbox-->
                <UCheckboxGroup v-model="selectedProveedor" :items="proveedores" />
                <UButton color="primary" variant="outline" @click="handleContinue"
                v-if="isInMoveStatus"
                >Continuar</UButton>

            </div>
            <div class="space-y-3 mt-4" v-if="showContenedoresOpttons">
                <!--button atras-->
               
                <div class="flex gap-2 flex-col">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contenedor destino
                    </label>
                    <USelect  class="w-full" v-model="contenedorDestino" :items="contenedores" />
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contenedor pago destino
                    </label>
                    <USelect class="w-full" v-model="contenedorPagoDestino" :items="contenedoresPago" />
                </div>
            </div>

        </template>
        <template #footer>
            <div class="flex items-center justify-end gap-2">
                <!--improve this button-->
                <UButton color="primary" variant="outline" @click="handleSave"
                v-if="showSaveButton"
                >Procesar</UButton>
                <UButton color="error" variant="outline" @click="$emit('close')">Cerrar</UButton>
            </div>
        </template>
    </UModal>
</template>
<script setup lang="ts">
import { useSpinner } from '~/composables/commons/useSpinner'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import { useModal } from '~/composables/commons/useModal'
import { useCommons } from '~/composables/cargaconsolidada/commons/useCommons'
const { getContenedoresDisponibles } = useConsolidado()
const { getProveedoresByCotizacion } = useCotizacionProveedor()
const proveedores = ref([])
const selectedProveedor = ref([])
const { withSpinner } = useSpinner()
const { showError, showSuccess } = useModal()
const { forceSendInspection, forceSendRotulado, forceSendCobranza ,forceSendMove, forceSendRecordatorioDatosProveedor} = useCommons()
const emit = defineEmits<{
    (e: 'success'): void
}>()
const props = defineProps<{
    idCotizacion: number
    idContainer: number
}>()
const contenedorDestino = ref('TODOS')
const contenedorPagoDestino = ref('TODOS')
const selectedStatus = ref('TODOS')
const showContenedoresOpttons = ref(false)
const statusOptions = ref([
    { label: 'Todos', value: 'TODOS' ,disabled: true },
    { label: 'Inspeccion', value: 'INSPECCION',disabled: false },
    { label: 'Rotulado', value: 'ROTULADO',disabled: false },
    { label: 'Cobrando', value: 'COBRANDO',disabled: false },
    { label: 'Recordatorio datos de Proveedor', value: 'RECORDATORIO_DATOS_PROVEEDOR',disabled: false },
    { label: 'Mover',value: 'MOVER',disabled: false },
])
const contenedores = ref([])
const contenedoresPago = ref([])

const handleStatusChange = async (value: string) => {
    selectedStatus.value = value
    await withSpinner(async () => {
        proveedores.value = []
        const response = await getProveedoresByCotizacion(props.idCotizacion)
        if(response.success){
            if(selectedStatus.value === 'MOVER' && response.data.length < 2)return
            proveedores.value = (response.data).map((proveedor: any) => ({
                label: proveedor.code_supplier,
                value: proveedor.id,
                supplier: proveedor.supplier,
                supplier_phone: proveedor.supplier_phone
            }))
            if(selectedStatus.value === 'RECORDATORIO_DATOS_PROVEEDOR'){
                proveedores.value = proveedores.value.filter((proveedor: any) => !(proveedor.supplier && proveedor.supplier_phone))
            }
        }
    }, 'Cargando proveedores...')
}
const getContenedores = async () => {
    await withSpinner(async () => {
        try{
        const response = await getContenedoresDisponibles()
        if(response){
          
            contenedores.value = [
                { label: 'Todos', value: 'TODOS' ,disabled: true},
                ...response.map((contenedor: any) => ({
                    label: `Contenedor #${contenedor.carga}`,
                    value: contenedor.id
                }))
            ]
            contenedoresPago.value = [
                { label: 'Todos', value: 'TODOS' ,disabled: true},
                ...response.map((contenedor: any) => ({
                label: `Contenedor pago #${contenedor.carga}`,
                value: contenedor.id
            }))]
           
        }
        } catch (error) {
            console.error('Error en getContenedores:', error)
        }
    }, 'Cargando contenedores...')
    
}

const showSaveButton = computed(() => {
    return !['TODOS'].includes(selectedStatus.value) && ((selectedProveedor.value.length > 0 && isAbleToMove.value) || selectedStatus.value === 'COBRANDO')
})
const isInMoveStatus = computed(() => {
    return selectedStatus.value === 'MOVER' && selectedProveedor.value.length > 0
})
const isAbleToMove = computed(() => {
    return (selectedStatus.value === 'MOVER' && contenedorDestino.value !== 'TODOS' && contenedorPagoDestino.value !== 'TODOS') || selectedStatus.value !== 'MOVER'
})
const handleContinue = async () => {
    //if selectedProveedor.value.length == proveedores.value.length then show alert cannot move
    if(selectedProveedor.value.length == proveedores.value.length){
       showError('No se puede mover todos los proveedores', 'Usa la opcion de mover todos los proveedores')
       return
    }
    await withSpinner(async () => {
    showContenedoresOpttons.value = true
        await getContenedores()
    }, 'Cargando contenedores...')
}
const handleSave = async () => {
    await withSpinner(async () => {
        let response = null
        switch(selectedStatus.value){
            case 'INSPECCION':
                response = await forceSendInspection({
                    idCotizacion: props.idCotizacion,
                    idContainer: props.idContainer,
                    proveedores: selectedProveedor.value,
                })
                break
            case 'ROTULADO':
                response = await forceSendRotulado({
                    idCotizacion: props.idCotizacion,
                    idContainer: props.idContainer,
                    proveedores: selectedProveedor.value,
                })
                break
            case 'COBRANDO':
                response = await forceSendCobranza({
                    idCotizacion: props.idCotizacion,
                    idContainer: props.idContainer,
                })
                break
            case 'MOVER':
                response = await forceSendMove({
                    idCotizacion: props.idCotizacion,
                    idContainer: props.idContainer,
                    proveedores: selectedProveedor.value,
                    idContainerDestino: Number(contenedorDestino.value),
                    idContainerPagoDestino: Number(contenedorPagoDestino.value),
                })
                break
            case 'RECORDATORIO_DATOS_PROVEEDOR':
                response = await forceSendRecordatorioDatosProveedor({
                    idCotizacion: props.idCotizacion,
                    idContainer: props.idContainer,
                    proveedores: selectedProveedor.value,
                })
                break
        }
        if(response){
            showSuccess('Guardado exitosamente', 'El estado se ha guardado correctamente')
            emit('success') //emit success to parent
        }else{
            showError('Error al guardar', 'Error al guardar el estado')
        }
    }, 'Guardando...')
}
</script>