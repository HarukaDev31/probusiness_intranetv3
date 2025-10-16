import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { AduanaService, type AduanaData, type AduanaResponse } from '~/services/cargaconsolidada/aduanaService'
import type { FileItem } from '~/types/commons/file'

export const useAduana = () => {
    const route = useRoute()
    const { showSuccess, showError } = useModal()
    const { withSpinner } = useSpinner()
    const aduanaFiles = ref<FileItem[]>([])
    const aduanaImpuestosPagados = ref<FileItem[]>([])
    // Estado reactivo
    const loading = ref(false)
    const aduanaData = ref<AduanaData | null>(null)
    const error = ref<string | null>(null)

    // Obtener ID del contenedor desde la ruta
    const containerId = computed(() => {
        const id = route.params.id
        return id ? parseInt(id as string) : null
    })

    // Form data
    const formData = ref({
        naviera: '',
        multa: 0,
        observaciones: '',
        tipo_contenedor: '',
        fecha_levante: '',
        fecha_zarpe: '',
        numero_dua: '',
        fecha_arribo: '',
        valor_fob: 0,
        fecha_declaracion: '',
        valor_flete: 0,
        canal_control: '',
        costo_destino: 0,
        ajuste_valor: 0,
        files: [] as File[],
        impuestos_pagados: [] as File[]
    })

    // Validar si el formulario tiene al menos un campo lleno
    const isFormValid = computed(() => {
        return Object.values(formData.value).some(value => {
            if (Array.isArray(value)) {
                return value.length > 0
            }
            return value !== '' && value !== 0 && value !== null && value !== undefined
        })
    })

    // Cargar datos existentes
    const loadAduanaData = async () => {
        
        
        if (!containerId.value) {
            
            return
        }

        try {
            loading.value = true
            error.value = null
            aduanaFiles.value = []
            aduanaImpuestosPagados.value = []

            
            const response = await AduanaService.getAduanaByContainer(containerId.value)
            
            
            if (response.success && response.data ) {
                const apiData = response.data // La API devuelve un array
                
                aduanaData.value = apiData
               
                const mappedData = {
                    naviera: apiData.naviera || '',
                    multa: apiData.multa ? parseFloat(apiData.multa) : 0,
                    observaciones: apiData.observaciones || '',
                    tipo_contenedor: apiData.tipo_contenedor || '',
                    fecha_levante: apiData.fecha_levante && apiData.fecha_levante !== '0000-00-00' ? apiData.fecha_levante.split(' ')[0] : '',
                    fecha_zarpe: apiData.fecha_zarpe ? apiData.fecha_zarpe.split(' ')[0] : '',
                    numero_dua: apiData.numero_dua || '',
                    fecha_arribo: apiData.fecha_arribo ? apiData.fecha_arribo.split(' ')[0] : '',
                    valor_fob: apiData.valor_fob ? parseFloat(apiData.valor_fob) : 0,
                    fecha_declaracion: apiData.fecha_declaracion ? apiData.fecha_declaracion.split(' ')[0] : '',
                    valor_flete: apiData.valor_flete ? parseFloat(apiData.valor_flete) : 0,
                    canal_control: apiData.canal_control || '',
                    costo_destino: apiData.costo_destino ? parseFloat(apiData.costo_destino) : 0,
                    ajuste_valor: apiData.ajuste_valor ? parseFloat(apiData.ajuste_valor) : 0,
                    files: apiData.files,
                    impuestos_pagados: apiData.files
                }
                
                formData.value = mappedData
                
                aduanaFiles.value = apiData.files.map((file: FileItem) => {
                    if (file.tipo == "aduana") {
                        return file
                    }
                }).filter((file: FileItem) => file !== undefined)
                aduanaImpuestosPagados.value = apiData.files.map((file: FileItem) => {
                    
                    if (file.tipo == "impuestos") {
                        return file
                    }
                }).filter((file: FileItem) => file !== undefined)
                
                
            }
        } catch (err: any) {
            error.value = err.message || 'Error al cargar los datos de aduana'
        } finally {
            loading.value = false
        }
    }

    // Guardar datos (crear o actualizar)
    const saveAduana = async () => {
        if (!containerId.value) {
            showError('Error', 'ID de contenedor no válido')
            return
        }

        if (!isFormValid.value) {
            showError('Error', 'Por favor complete al menos un campo del formulario')
            return
        }

        try {
            loading.value = true

            const dataToSend: AduanaData = {
                ...formData.value,
                idContainer: containerId.value
            }

            // Determinar si es crear o actualizar basándose en si ya existen datos
            const isUpdate = aduanaData.value !== null
            const action = isUpdate ? 'actualizando' : 'guardando'
            const successMessage = isUpdate ? 'actualizados' : 'guardados'

            const response = await withSpinner(async () => {
                if (isUpdate) {
                    return await AduanaService.updateAduana(containerId.value!, dataToSend)
                } else {
                    return await AduanaService.saveAduana(dataToSend)
                }
            }, `${action} datos de aduana...`)

            if (response.success) {
                showSuccess('Éxito', `Datos de aduana ${successMessage} correctamente`)
                await loadAduanaData() // Recargar datos
                return true
            } else {
                showError('Error', response.error || `Error al ${action} los datos`)
                return false
            }
        } catch (err: any) {
            showError('Error', err.message || 'Error al procesar los datos de aduana')
            return false
        } finally {
            loading.value = false
        }
    }

    // Actualizar datos
    const updateAduana = async () => {
        if (!containerId.value) {
            showError('Error', 'ID de contenedor no válido')
            return
        }

        try {
            loading.value = true

            const dataToSend: AduanaData = {
                ...formData.value,
                idContainer: containerId.value
            }

            const response = await withSpinner(async () => {
                return await AduanaService.updateAduana(containerId.value!, dataToSend)
            }, 'Actualizando datos de aduana...')

            if (response.success) {
                showSuccess('Éxito', 'Datos de aduana actualizados correctamente')
                await loadAduanaData() // Recargar datos
                return true
            } else {
                showError('Error', response.error || 'Error al actualizar los datos')
                return false
            }
        } catch (err: any) {
            showError('Error', err.message || 'Error al actualizar los datos de aduana')
            return false
        } finally {
            loading.value = false
        }
    }

    // Manejadores de archivos
    const handleTributosFiles = (files: File[]) => {
        formData.value.files = files
    }

    const handleImpuestosFiles = (files: File[]) => {
        formData.value.impuestos_pagados = files
    }

    // Resetear formulario
    const resetForm = () => {
        formData.value = {
            naviera: '',
            multa: 0,
            observaciones: '',
            tipo_contenedor: '',
            fecha_levante: '',
            fecha_zarpe: '',
            numero_dua: '',
            fecha_arribo: '',
            valor_fob: 0,
            fecha_declaracion: '',
            valor_flete: 0,
            canal_control: '',
            costo_destino: 0,
            ajuste_valor: 0,
            files: [],
            impuestos_pagados: []
        }
    }

    const deleteFileAduana = async (fileId: string) => {
        try {
            const response = await AduanaService.deleteFileAduana(fileId)
            return response
        } catch (error) {
            console.error('Error al eliminar el archivo de aduana:', error)
            return { success: false, error: 'Error al eliminar el archivo de aduana' }
        }
        finally {
            loading.value = false
        }
    }

    return {
        // Estado
        loading: readonly(loading),
        error: readonly(error),
        aduanaData: readonly(aduanaData),
        formData,
        containerId,
        isFormValid,

        // Métodos
        loadAduanaData,
        saveAduana,
        updateAduana,
        handleTributosFiles,
        handleImpuestosFiles,
        resetForm,
        aduanaFiles,
        aduanaImpuestosPagados,
        deleteFileAduana
    }
}
