import { ref, onMounted } from 'vue'
import { useUserRole } from '../auth/useUserRole'
import { useEcho } from './useEcho'
import { getWebsocketRoles } from '@/config/websocket/channels'

export const useWebSocketRole = () => {
    const { currentRole: userRole } = useUserRole()
    const { subscribeToRoleChannels, unsubscribeFromChannel } = useEcho()
    const currentRole = ref<string | null>(null)

    const setupRoleChannels = async () => {
        
        if (!userRole.value) return

        currentRole.value = userRole.value
        
        // Obtener la configuración actualizada (incluye registros dinámicos)
        const websocketRoles = getWebsocketRoles()
        const roleConfig = Object.values(websocketRoles).find(config => config.role === userRole.value)

        if (roleConfig) {
            
            try {
                subscribeToRoleChannels(roleConfig)
                
            } catch (error) {
                console.error('❌ Error configurando canales para rol:', roleConfig.role, error)
            }
        } else {
            console.warn('⚠️ No se encontró configuración para el rol:', userRole.value)
        }
    }

    const cleanupRoleChannels = () => {
        // Obtener la configuración actualizada
        const websocketRoles = getWebsocketRoles()
        const roleConfig = Object.values(websocketRoles).find(config => config.role === currentRole.value)
        if (roleConfig) {
            roleConfig.channels.forEach(channel => {
                unsubscribeFromChannel(channel.name)
            })
        }
        currentRole.value = null
    }

    // Removido onMounted para evitar llamadas duplicadas desde el plugin

    return {
        currentRole,
        setupRoleChannels,
        cleanupRoleChannels
    }
}