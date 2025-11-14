import { useAuth } from '~/composables/auth/useAuth'
import { ProfileService } from '~/services/commons/profileService'
import type { UserProfile, UserBusiness } from '~/types/userprofile'

export const useProfile = () => {
    const profile = ref<UserProfile>({} as UserProfile)
    const loading = ref(false)
    const error = ref<string | null>(null)
    
    const getProfile = async (fechaInicio?: string, fechaFin?: string) => {
        try {
            loading.value = true
            const response = await ProfileService.getProfile(fechaInicio, fechaFin)
            profile.value = response.user
            return response
        } catch (err) {
            console.error('Error al cargar el perfil:', err)
            error.value = 'Error al cargar el perfil'
        } finally {
            loading.value = false
        }
    }

    const updateProfile = async (profileData: Partial<UserProfile>, photoFile?: File) => {
        try {
            loading.value = true
            const response = await ProfileService.updateProfile(profileData, photoFile)
            profile.value = { ...profile.value, ...response.user }
            return response
        } catch (err) {
            console.error('Error al actualizar el perfil:', err)
            error.value = 'Error al actualizar el perfil'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateBusiness = async (businessData: Partial<UserBusiness>) => {
        try {
            loading.value = true
            const response = await ProfileService.updateBusiness(businessData)
            if (profile.value.business) {
                profile.value.business = { ...profile.value.business, ...response.business }
            }
            return response
        } catch (err) {
            console.error('Error al actualizar la empresa:', err)
            error.value = 'Error al actualizar la empresa'
            throw err
        } finally {
            loading.value = false
        }
    }

    const uploadProfilePhoto = async (file: File) => {
        try {
            loading.value = true
            const response = await ProfileService.uploadProfilePhoto(file)
            profile.value.photoUrl = response.photoUrl
            return response
        } catch (err) {
            console.error('Error al subir la foto:', err)
            error.value = 'Error al subir la foto'
            throw err
        } finally {
            loading.value = false
        }
    }

    return { 
        profile, 
        loading, 
        error, 
        getProfile, 
        updateProfile, 
        updateBusiness, 
        uploadProfilePhoto 
    }
}