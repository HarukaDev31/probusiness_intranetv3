<template>
    <UButton
        icon="i-heroicons-clock"
        label="Hora corte"
        color="neutral"
        variant="outline"
        size="sm"
        @click="openModal"
    />

    <UModal v-model:open="isOpen" title="Hora de corte — Excel CONTACTAR">
        <template #body>
            <div class="space-y-4">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    Define a qué hora se congela el bloque histórico de <strong>CARGA POR CONTACTAR</strong> en el Excel de Drive.
                </p>

                <div class="flex flex-col gap-1 max-w-[12rem]">
                    <label class="text-sm text-gray-600 dark:text-gray-400">Hora de corte</label>
                    <UInput
                        v-model="horaCorteInput"
                        type="time"
                        size="md"
                        :disabled="loadingCorteConfig || savingCorteConfig"
                    />
                </div>

                <p v-if="loadingCorteConfig" class="text-sm text-gray-500 dark:text-gray-400">
                    Cargando…
                </p>
                <p v-else-if="corteConfig" class="text-sm text-gray-500 dark:text-gray-400 leading-snug">
                    Periodo vigente: {{ corteConfig.periodo_contactar_inicio }} → {{ corteConfig.periodo_contactar_fin }}
                    ({{ corteConfig.timezone }}).
                </p>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton label="Cancelar" color="neutral" variant="ghost" @click="isOpen = false" />
                <UButton
                    label="Guardar"
                    color="primary"
                    :loading="savingCorteConfig"
                    :disabled="loadingCorteConfig"
                    @click="handleSave"
                />
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSeguimientoDriveCorteConfig } from '~/composables/cargaconsolidada/seguimiento-drive/useSeguimientoDriveCorteConfig'

const isOpen = ref(false)

const {
    corteConfig,
    horaCorteInput,
    loadingCorteConfig,
    savingCorteConfig,
    loadCorteConfig,
    saveCorteConfig,
} = useSeguimientoDriveCorteConfig()

const openModal = () => {
    isOpen.value = true
}

watch(isOpen, (open) => {
    if (open) {
        loadCorteConfig()
    }
})

const handleSave = async () => {
    const ok = await saveCorteConfig()
    if (ok) {
        isOpen.value = false
    }
}
</script>
