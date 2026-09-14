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
                    <UInputMenu
                        v-model="empresaMenu"
                        :items="empresasOptions"
                        create-item
                        class="w-full"
                        placeholder="Busca o escribe una empresa"
                        @update:search-term="onEmpresaSearch"
                        @update:model-value="onEmpresaMenuChange"
                        @update:open="onEmpresaOpen"
                        @blur="commitEmpresaPendiente"
                        @create="onEmpresaCreate"
                    />
                </UFormField>
                <UFormField label="Límite CBM IMO (opcional)" :error="errors.limiteCbmImo">
                    <UInput
                        v-model="limiteCbmImo"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ej. 5.00"
                        class="w-full"
                    />
                </UFormField>
                <UFormField v-if="isOrgAdmin" label="TC Yuan (opcional)" :error="errors.tcYuan">
                    <UInput
                        v-model="tcYuan"
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="Ej. 0.138"
                        class="w-full"
                    />
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
import type { CreateConsolidadoModalProps } from './types'
import { TC_YUAN_DEFAULT_NO_ADMIN } from './constants'
import { ref, computed, defineEmits, defineProps } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { getLocalTimeZone, DateFormatter, } from '@internationalized/date'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import { useOptions } from '~/composables/commons/useOptions'
import { useUserRole } from '~/composables/auth/useUserRole'
//const modelValue = shallowRef(new CalendarDate(2022, 1, 10))
const id = ref<number | null>(null)
const carga = ref<number>()
const mes = ref<string>()
const pais = ref<number>()
const empresa = ref<string>('')
const empresaMenu = ref<string | { label: string; value: string } | null>('')
const empresaSearchTerm = ref('')
let empresaUltimoFueEscritura = false
const limiteCbmImo = ref<number | null>(null)
const tcYuan = ref<number | string | null>(null)
const hoy = new Date();
const fechaCierre = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))
const fechaArribo = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))
const fechaEntrega = shallowRef(new CalendarDate(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()))
const { getValidContainers, validContainers, getConsolidadoById, getEmpresasCreadas, empresasCreadas } = useConsolidado()
const { paises, getPaises } = useOptions()
const { currentOrganizacionId, fetchCurrentUser } = useUserRole()
const isOrgAdmin = computed(() => currentOrganizacionId.value === 1)
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
const props = defineProps<CreateConsolidadoModalProps>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
}>()

const setEmpresa = (idPais: number) => {
    if (idPais == 1) {
        aplicarEmpresa('PRO MUNDO COMEX SAC.')
    } else {
        aplicarEmpresa('')
    }
}

const empresasOptions = computed(() => {
    const names = empresasCreadas.value
        .map((e) => String(e.value || e.label || '').trim())
        .filter(Boolean)
    if (empresa.value && !names.some((n) => n.toLowerCase() === empresa.value.toLowerCase())) {
        names.unshift(empresa.value)
    }
    return names
})

function nombreDeEmpresa(item: string | { label?: string; value?: string } | null | undefined) {
    if (!item) return ''
    if (typeof item === 'string') return item.trim()
    return String(item.value || item.label || '').trim()
}

function aplicarEmpresa(nombre: string) {
    const trimmed = (nombre || '').trim()
    empresa.value = trimmed
    empresaMenu.value = trimmed
    empresaSearchTerm.value = ''
    empresaUltimoFueEscritura = false
    if (trimmed && !empresasCreadas.value.some((e) => String(e.value || e.label).toLowerCase() === trimmed.toLowerCase())) {
        empresasCreadas.value = [{ label: trimmed, value: trimmed }, ...empresasCreadas.value]
    }
}

function onEmpresaSearch(term: string) {
    empresaSearchTerm.value = term
    if (term !== '') {
        empresaUltimoFueEscritura = true
        empresa.value = term
    } else if (empresaUltimoFueEscritura) {
        empresa.value = ''
    }
}

function onEmpresaMenuChange(value: string | { label?: string; value?: string } | null) {
    if (!value) {
        if (empresaUltimoFueEscritura) {
            commitEmpresaPendiente()
        } else if (empresa.value.trim()) {
            const actual = nombreDeEmpresa(empresaMenu.value)
            if (!actual) empresaMenu.value = empresa.value.trim()
        }
        return
    }
    aplicarEmpresa(nombreDeEmpresa(value))
}

function onEmpresaCreate(item: string | { label?: string; value?: string }) {
    aplicarEmpresa(nombreDeEmpresa(item))
}

function commitEmpresaPendiente() {
    if (!empresaUltimoFueEscritura) return
    empresaUltimoFueEscritura = false
    const term = (empresaSearchTerm.value || empresa.value || '').trim()
    if (!term) {
        aplicarEmpresa('')
        return
    }
    const match = empresasOptions.value.find((n) => n.toLowerCase() === term.toLowerCase())
    aplicarEmpresa(match || term)
}

function onEmpresaOpen(open: boolean) {
    if (!open) commitEmpresaPendiente()
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
    if (!empresa.value?.trim()) {
        errors.value.empresa = 'La empresa es requerida'
    }
    if (limiteCbmImo.value !== null && limiteCbmImo.value !== ('' as any)) {
        const numeric = Number(limiteCbmImo.value)
        if (Number.isNaN(numeric) || numeric < 0) {
            errors.value.limiteCbmImo = 'El límite CBM IMO debe ser un número mayor o igual a 0'
        }
    }
    if (isOrgAdmin.value && tcYuan.value !== null && tcYuan.value !== ('' as any)) {
        const numeric = Number(tcYuan.value)
        if (Number.isNaN(numeric) || numeric < 0) {
            errors.value.tcYuan = 'El TC Yuan debe ser un número mayor o igual a 0'
        }
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

function resolverTcYuanSubmit(): number | null {
    if (!isOrgAdmin.value) {
        const numeric = Number(tcYuan.value)
        return Number.isNaN(numeric) ? TC_YUAN_DEFAULT_NO_ADMIN : numeric
    }
    if (tcYuan.value !== null && tcYuan.value !== ('' as any)) {
        return Number(tcYuan.value)
    }
    return null
}

const handleSubmit = async () => {
    try {
        commitEmpresaPendiente()
        if (!validateForm()) {
            return
        }

        loading.value = true
        emit('submit', {
            id: id.value,
            carga: carga.value,
            mes: mes.value,
            pais: pais.value,
            empresa: empresa.value.trim(),
            fechaCierre: fechaCierre.value,
            fechaArribo: fechaArribo.value,
            fechaEntrega: fechaEntrega.value,
            limiteCbmImo: limiteCbmImo.value !== null && limiteCbmImo.value !== ('' as any)
                ? Number(limiteCbmImo.value)
                : null,
            tcYuan: resolverTcYuanSubmit(),
        })

    } catch (error) {
        console.error('Error al crear la carga consolidada:', error)
    } finally {
        loading.value = false
    }
}
onMounted(async () => {
    fetchCurrentUser()
    await getPaises()
    await Promise.all([getValidContainers(), getEmpresasCreadas()])
    if (!props.id && !isOrgAdmin.value) {
        tcYuan.value = TC_YUAN_DEFAULT_NO_ADMIN
    }
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
            aplicarEmpresa(response.empresa || '')
            fechaCierre.value = new CalendarDate(getDateParts(response.f_cierre).year, getDateParts(response.f_cierre).month, getDateParts(response.f_cierre).day)
            fechaArribo.value = new CalendarDate(getDateParts(response.f_puerto).year, getDateParts(response.f_puerto).month, getDateParts(response.f_puerto).day)
            fechaEntrega.value = new CalendarDate(getDateParts(response.f_entrega).year, getDateParts(response.f_entrega).month, getDateParts(response.f_entrega).day)
            limiteCbmImo.value = typeof response.limite_cbm_imo === 'number' || typeof response.limite_cbm_imo === 'string'
                ? Number(response.limite_cbm_imo)
                : null
            tcYuan.value = response.tc_yuan != null
                ? Number(response.tc_yuan)
                : (!isOrgAdmin.value ? TC_YUAN_DEFAULT_NO_ADMIN : null)
        }
    }

})
</script>
