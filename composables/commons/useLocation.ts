import { ref, watch } from 'vue'
import { LocationService } from '~/services/commons/locationService'
import { OptionsService } from '~/services/commons/optionsService'

export const useLocation = () => {
  const paises = ref<Array<{ value: number; label: string }>>([])
  const departamentos = ref<Array<{ id: number; nombre: string,label: string }>>([])
  const provincias = ref<Array<{ value: number; label: string; id?: number; nombre?: string }>>([])
  const distritos = ref<Array<{ id: number; nombre: string; id_provincia: number,label: string }>>([])

  const loadingPaises = ref(false)
  const loadingDepartamentos = ref(false)
  const loadingProvincias = ref(false)
  const loadingDistritos = ref(false)

  // Obtener países (usando OptionsService que tiene la estructura correcta)
  const fetchPaises = async () => {
    try {
      loadingPaises.value = true
      const response = await OptionsService.getPaises()
      if (response.success) {
        // Mapear los datos del API a la estructura { value, label }
        paises.value = response.data.map((p: any) => ({
          value: p.value,
          label: p.label
        }))
      }
    } catch (error) {
      console.error('Error al cargar países:', error)
    } finally {
      loadingPaises.value = false
    }
  }

  // Obtener departamentos
  const fetchDepartamentos = async () => {
    try {
      loadingDepartamentos.value = true
      const response = await LocationService.getDepartamentos()
      if (response.success) {
        departamentos.value = response.data.map((d: {
          id: number,
          nombre: string
        }) => ({
          id: d.id,
          nombre: d.nombre,
          label: d.nombre
        })) as Array<{ id: number; nombre: string; label: string }>
      }
    } catch (error) {
      console.error('Error al cargar departamentos:', error)
    } finally {
      loadingDepartamentos.value = false
    }
  }

  // Obtener provincias por departamento
  const fetchProvincias = async (idDepartamento: number) => {
    try {
      loadingProvincias.value = true
      provincias.value = []
      const response = await LocationService.getProvincias(idDepartamento)
      if (response.success) {
        // Mapear { id, nombre, id_provincia } a { value, label } para consistencia
        provincias.value = response.data.map((p: {
          id: number,
          nombre: string,
          id_provincia: number
        }) => ({
          value: p.id,
          label: p.nombre
        }))
      }
    } catch (error) {
      console.error('Error al cargar provincias:', error)
    } finally {
      loadingProvincias.value = false
    }
  }

  // Obtener distritos por provincia
  const fetchDistritos = async (idProvincia: number) => {
    try {
      loadingDistritos.value = true
      distritos.value = []
      const response = await LocationService.getDistritos(idProvincia)
      if (response.success) {
          distritos.value = response.data.map((d: {
            id: number,
            nombre: string,
            id_provincia: number
          }) => ({
          id: d.id,
          nombre: d.nombre,
          id_provincia: d.id_provincia,
          label: d.nombre
        }))
      }
    } catch (error) {
      console.error('Error al cargar distritos:', error)
    } finally {
      loadingDistritos.value = false
    }
  }
  const fetchAllProvincias = async () => {
    try {
      loadingProvincias.value = true
      provincias.value = []
      const response = await LocationService.getAllProvincias()
      if (response.success) {
        provincias.value = response.data
      }
    } catch (error) {
      console.error('Error al cargar provincias:', error)
    } finally {
      loadingProvincias.value = false
    }
  }
  // Función para limpiar provincias y distritos
  const limpiarProvinciasYDistritos = () => {
    provincias.value = []
    distritos.value = []
  }

  // Función para limpiar solo distritos
  const limpiarDistritos = () => {
    distritos.value = []
  }

  // Función para limpiar ubicaciones peruanas
  const limpiarUbicacionesPeruanas = () => {
    departamentos.value = []
    provincias.value = []
    distritos.value = []
  }

  // Función para inicializar con valores existentes
  const initializeLocation = async (paisId?: number, departamentoId?: number, provinciaId?: number, distritoId?: number) => {
    await fetchPaises()
    
    // Solo cargar ubicaciones peruanas si es Perú (id = 1)
    if (paisId === 1) {
      await fetchDepartamentos()
      
      if (departamentoId) {
        await fetchProvincias(departamentoId)
        
        if (provinciaId) {
          await fetchDistritos(provinciaId)
        }
      }
    }
  }

  return {
    // Estados
    paises,
    departamentos,
    provincias,
    distritos,
    
    // Loading states
    loadingPaises,
    loadingDepartamentos,
    loadingProvincias,
    loadingDistritos,
    
    // Métodos
    fetchPaises,
    fetchDepartamentos,
    fetchProvincias,
    fetchDistritos,
    limpiarProvinciasYDistritos,
    limpiarDistritos,
    limpiarUbicacionesPeruanas,
    initializeLocation,
    fetchAllProvincias
  }
}

