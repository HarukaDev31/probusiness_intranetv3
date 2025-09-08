<template>
    <UModal>

        <UButton color="primary" icon="i-heroicons-plus" label="Crear" class="h-11 w-24"/>
        <!-- Header -->
        <template #header>
            <div class="flex items-center justify-between w-full">
                <h3 class="">
                    {{ id ? `Editar Carga Consolidada #${carga}` : 'Crear Carga Consolidada' }}
                </h3>
            </div>
        </template>

        <template #body>
            <div class="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Carga -->
                <UFormField label="Carga" required :error="errors.carga">
                    <USelect class="w-full" v-model="carga" :items="validContainers"
                        placeholder="Seleccione un consolidado" />
                </UFormField>
                <UFormField label="Fecha Cierre" required :error="errors.fechaCierre">
                    <UPopover>
                        <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full">
                            {{ fechaCierre ? df.format(fechaCierre.toDate(getLocalTimeZone())) : 'Seleccione una fecha'
                            }}
                        </UButton>

                        <template #content>
                            <UCalendar v-model="fechaCierre" class="p-2" />
                        </template>
                    </UPopover>
                </UFormField>

                <UFormField label="Mes" required :error="errors.mes">
                    <USelect class="w-full" v-model="mes" :items="mesesOptions" placeholder="Seleccione un mes" />
                </UFormField>

                <UFormField label="Fecha Arribo" required :error="errors.fechaArribo">
                    <UPopover>
                        <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full">
                            {{ fechaArribo ? df.format(fechaArribo.toDate(getLocalTimeZone())) : 'Seleccione una fecha'
                            }}
                        </UButton>
                        <template #content>
                            <UCalendar v-model="fechaArribo" class="p-2" />
                        </template>
                    </UPopover>
                </UFormField>
                <UFormField label="País" required :error="errors.pais">
                    <USelect class="w-full" v-model="pais" :items="paises" @update:model-value="setEmpresa"
                        placeholder="Seleccione un país" />
                </UFormField>
                <UFormField label="Fecha Entrega" required :error="errors.fechaEntrega">
                    <UPopover>
                        <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full">
                            {{ fechaEntrega ? df.format(fechaEntrega.toDate(getLocalTimeZone())) : 'Seleccione una fecha' }}
                        </UButton>
                        <template #content>
                            <UCalendar v-model="fechaEntrega" class="p-2" />
                        </template>
                    </UPopover>
                </UFormField>
                <!-- Empresa -->
                <UFormField label="Empresa" required :error="errors.empresa">
                    <UInput v-model="empresa" placeholder="Ingresa el nombre de la empresa" class="w-full" />
                </UFormField>
            </div>
        </template>

        <!-- Footer -->
        <template #footer="{ close }">
            <div class="flex justify-end gap-3">
                <UButton color="neutral" variant="outline" @click="close">
                    Cancelar
                </UButton>
                <UButton color="primary" :loading="loading" @click="handleSubmit">
                    Guardar
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { getLocalTimeZone, DateFormatter, } from '@internationalized/date'
import { useConsolidado } from '../composables/cargaconsolidada/useConsolidado'
import { useOptions } from '../composables/commons/useOptions'
//const modelValue = shallowRef(new CalendarDate(2022, 1, 10))
const id = ref<number | null>(null)
const carga = ref<number>()
const mes = ref<string>()
const pais = ref<number>()
const empresa = ref<string>()
const hoy = new Date();
const fechaCierre = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))
const fechaArribo = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))
const fechaEntrega = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))
const { getValidContainers, validContainers, getConsolidadoById } = useConsolidado()
const { paises, getPaises } = useOptions()
const df = new DateFormatter('en-US', {
    dateStyle: 'medium'
})

const loading = ref(false)
const mesesOptions = [
    { label: 'Enero', value: 'ENERO' },
    { label: 'Febrero', value: 'FEBRERO' },
    { label: 'Marzo', value: 'MARZO' },
    { label: 'Abril', value: 'ABRIL' },
    { label: 'Mayo', value: 'MAYO' },
    { label: 'Junio', value: 'JUNIO' },
    { label: 'Julio', value: 'JULIO' },
    { label: 'Agosto', value: 'AGOSTO' },
    { label: 'Septiembre', value: 'SEPTIEMBRE' },
    { label: 'Octubre', value: 'OCTUBRE' },
    { label: 'Noviembre', value: 'NOVIEMBRE' },
    { label: 'Diciembre', value: 'DICIEMBRE' }
]
const props = defineProps<{
    id: number | null
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
}>()

const setEmpresa = (idPais: number) => {
    if (idPais == 1) {
        empresa.value = 'PRO MUNDO COMEX SAC.'
    } else {
        empresa.value = ''
    }
}


const errors = ref<Record<string, string>>({})

const validateForm = () => {
    errors.value = {}

    if (!carga.value) {
        errors.value.carga = 'La carga es requerida'
    }
    if (!mes.value) {
        errors.value.mes = 'El mes es requerido'
    }
    if (!pais.value) {
        errors.value.pais = 'El país es requerido'
    }
    if (!empresa.value) {
        errors.value.empresa = 'La empresa es requerida'
    }
    if (!fechaCierre.value) {
        errors.value.fechaCierre = 'La fecha de cierre es requerida'
    }
    if (!fechaArribo.value) {
        errors.value.fechaArribo = 'La fecha de arribo es requerida'
    }
    if (!fechaEntrega.value) {
        errors.value.fechaEntrega = 'La fecha de entrega es requerida'
    }

    return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
    try {
        if (!validateForm()) {
            return
        }

        loading.value = true
        emit('submit', {
            id: id.value,
            carga: carga.value,
            mes: mes.value,
            pais: pais.value,
            empresa: empresa.value,
            fechaCierre: fechaCierre.value,
            fechaArribo: fechaArribo.value,
            fechaEntrega: fechaEntrega.value
        })

    } catch (error) {
        console.error('Error al crear la carga consolidada:', error)
    } finally {
        loading.value = false
    }
}
onMounted(async () => {
    await getPaises()
    await getValidContainers()
    if (props.id) {

        const response = await getConsolidadoById(props.id)
        if (response) {
            id.value = response.id
            // Asegurarse de que el valor de carga sea un string
            carga.value = parseInt(response.carga)
            // El mes viene como número, convertirlo a string para el select
            mes.value = response.mes?.toString()
            // Asegurarse de que el país sea un string
            pais.value = response.id_pais
            empresa.value = response.empresa
            fechaCierre.value = new CalendarDate(getDateParts(response.f_cierre).year, getDateParts(response.f_cierre).month, getDateParts(response.f_cierre).day)
            fechaArribo.value = new CalendarDate(getDateParts(response.f_puerto).year, getDateParts(response.f_puerto).month, getDateParts(response.f_puerto).day)
            fechaEntrega.value = new CalendarDate(getDateParts(response.f_entrega).year, getDateParts(response.f_entrega).month, getDateParts(response.f_entrega).day)
        }
    }

})
</script>
