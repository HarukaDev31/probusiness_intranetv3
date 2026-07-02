import { OptionsService } from "~/services/commons/optionsService"

export const useOptions = () => {
    const paises = ref<any[]>([])
    const getPaises = async () => {
        try {
            const response = await OptionsService.getPaises()
            paises.value = response.data
        } catch (error) {
            console.error('Error en useOptions.getPaises:', error)
        }
    }
    return { paises, getPaises }
}   