import { ref, computed } from 'vue'

interface UserGroup {
  id: number
  nombre: string
  descripcion: string
  tipo_privilegio: number
  estado: number
  notificacion: number
}

interface UserCompany {
  id: number
  nombre: string
}

interface UserOrganization {
  id: number
  nombre: string
}

interface UserRaw {
  id: number
  nombre: string
  nombres_apellidos: string
  email: string
  empresa: UserCompany
  estado: number
  grupo: UserGroup
  organizacion: UserOrganization
}

interface UserData {
  role: string
  avatar: string | null
  isActive: boolean
  raw: UserRaw
  email: string
  empresa: UserCompany
  grupo: UserGroup
  descripcion: string
  estado: number
  id: number
  nombre: string
  organizacion: UserOrganization
}

// Variables globales para el patrón singleton
let globalUserData: Ref<UserData | null> | null = null
let globalLoading: Ref<boolean> | null = null
let globalError: Ref<string | null> | null = null

export const useUserRole = () => {
  // Usar variables globales si ya existen, sino crear nuevas
  const userData = globalUserData || (globalUserData = ref<UserData | null>(null))
  const loading = globalLoading || (globalLoading = ref(false))
  const error = globalError || (globalError = ref<string | null>(null))

  // Computed para obtener el rol (grupo.nombre)
  const currentRole = computed(() => {
    return userData.value?.raw?.grupo?.nombre || ''
  })

  // Computed para obtener el nombre completo del usuario
  const userName = computed(() => {
    return userData.value?.raw?.nombres_apellidos || userData.value?.raw?.nombre || ''
  })

  // Computed para obtener el email del usuario
  const userEmail = computed(() => {
    return userData.value?.email || ''
  })

  // Computed para obtener la empresa del usuario
  const userCompany = computed(() => {
    return userData.value?.empresa?.nombre || ''
  })

  // Computed para verificar si el usuario está activo
  const isUserActive = computed(() => {
    return userData.value?.isActive || false
  })

  // Función para obtener los datos del usuario actual desde localStorage
  const fetchCurrentUser = () => {
    try {
      loading.value = true
      error.value = null

      const authUser = localStorage.getItem('auth_user')
      if (!authUser) {
        error.value = 'No se encontraron datos del usuario'
        return
      }

      const userDataFromStorage = JSON.parse(authUser)
      userData.value = userDataFromStorage
    } catch (err: any) {
      console.error('Error parsing user data from localStorage:', err)
      error.value = 'Error al leer datos del usuario'
    } finally {
      loading.value = false
    }
  }

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (role: string): boolean => {
    console.log('currentRole:', currentRole.value)
    return currentRole.value.toLowerCase() === role.toLowerCase()
  }

  // Función para verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  // Función para obtener todos los datos del usuario
  const getUserData = () => {
    return userData.value
  }

  return {
    // Estado
    userData: readonly(userData),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    currentRole,
    userName,
    userEmail,
    userCompany,
    isUserActive,

    // Métodos
    fetchCurrentUser,
    hasRole,
    hasAnyRole,
    getUserData
  }
} 