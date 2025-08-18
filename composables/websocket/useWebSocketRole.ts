import { ref, onMounted } from 'vue'
import { useUserRole } from '../auth/useUserRole'
import { useEcho } from './useEcho'
import { websocketRoles } from '@/config/websocket/channels'

export const useWebSocketRole = () => {
    const { currentRole: userRole } = useUserRole()
    const { subscribeToRoleChannels, unsubscribeFromChannel } = useEcho()
    const currentRole = ref<string | null>(null)

    const setupRoleChannels = async () => {
        console.log('userRole', userRole.value)
        if (!userRole.value) return

        currentRole.value = userRole.value
        console.log('currentRole', currentRole.value)
        const roleConfig = Object.values(websocketRoles).find(config => config.role === userRole.value)

        if (roleConfig) {
            subscribeToRoleChannels(roleConfig)
        }
    }

    const cleanupRoleChannels = () => {
        const roleConfig = Object.values(websocketRoles).find(config => config.role === currentRole.value)
        if (roleConfig) {
            roleConfig.channels.forEach(channel => {
                unsubscribeFromChannel(channel.name)
            })
        }
        currentRole.value = null
    }

    onMounted(() => {
        setupRoleChannels()
    })

    return {
        currentRole,
        setupRoleChannels,
        cleanupRoleChannels
    }
}