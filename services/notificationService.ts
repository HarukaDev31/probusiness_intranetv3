import type {
    Notification,
    NotificationFilters,
    NotificationCreateData,
    NotificationResponse,
    NotificationCountResponse,
    NotificationSingleResponse,
    NotificationActionResponse
} from '~/types/notification'
import { BaseService } from '~/services/base/BaseService'

export class NotificationService extends BaseService {
    private static baseUrl = '/api/notificaciones'

    /**
     * Obtiene las notificaciones paginadas con filtros
     */
    static async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
        try {
            const params = new URLSearchParams()

            if (filters.modulo) params.append('modulo', filters.modulo)
            if (filters.tipo) params.append('tipo', filters.tipo)
            if (filters.prioridad_minima) params.append('prioridad_minima', filters.prioridad_minima.toString())
            if (filters.no_leidas !== undefined) params.append('no_leidas', filters.no_leidas.toString())
            if (filters.per_page) params.append('per_page', filters.per_page.toString())
            if (filters.page) params.append('page', filters.page.toString())

            const queryString = params.toString()
            const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl

            const response = await this.apiCall<NotificationResponse>(url, {
                method: 'GET'
            })

            return response
        } catch (error) {
            console.error('Error al obtener las notificaciones:', error)
            throw error
        }
    }

    /**
     * Obtiene el conteo de notificaciones no leídas
     */
    static async getUnreadCount(): Promise<number> {
        try{
        const response = await this.apiCall<NotificationCountResponse>(`${this.baseUrl}/conteo-no-leidas`, {
            method: 'GET'
        })

        return response.data.total_no_leidas
        } catch (error) {
            console.error('Error al obtener el conteo de notificaciones no leídas:', error)
            throw error
        }
    }

    /**
     * Obtiene una notificación específica por ID
     */
    static async getNotification(id: number): Promise<Notification> {
        try{
        const response = await this.apiCall<NotificationSingleResponse>(`${this.baseUrl}/${id}`, {
            method: 'GET'
        })

        return response.data
        } catch (error) {
            console.error('Error al obtener la notificación:', error)
            throw error
        }
    }

    /**
     * Crea una nueva notificación (solo administradores)
     */
    static async createNotification(notificationData: NotificationCreateData): Promise<Notification> {
        try{
        const response = await this.apiCall<NotificationSingleResponse>(this.baseUrl, {
            method: 'POST',
            body: notificationData
        })

        return response.data
        } catch (error) {
            console.error('Error al crear la notificación:', error)
            throw error
        }
    }

    /**
     * Marca una notificación como leída
     */
    static async markAsRead(id: number): Promise<void> {
        try{
        await this.apiCall<NotificationActionResponse>(`${this.baseUrl}/${id}/marcar-leida`, {
            method: 'PUT'
        })
        } catch (error) {
            console.error('Error al marcar la notificación como leída:', error)
            throw error
        }
    }

    /**
     * Marca múltiples notificaciones como leídas
     */
    static async markMultipleAsRead(notificationIds: number[]): Promise<void> {
        try{
        await this.apiCall<NotificationActionResponse>(`${this.baseUrl}/marcar-multiples-leidas`, {
            method: 'POST',
            body: {
                notificacion_ids: notificationIds
            }
        })
        } catch (error) {
            console.error('Error al marcar múltiples notificaciones como leídas:', error)
            throw error
        }
    }

    /**
     * Archiva una notificación
     */
    static async archiveNotification(id: number): Promise<void> {
        await this.apiCall<NotificationActionResponse>(`${this.baseUrl}/${id}/archivar`, {
            method: 'PUT'
        })
    }

    /**
     * Navega a la URL especificada en una notificación
     */
    static navigateToNotification(notification: Notification): void {
        if (!notification.navigate_to) return

        let url = notification.navigate_to

        // Agregar parámetros si existen
        if (notification.navigate_params) {
            let params: Record<string, any> = {}

            // Si navigate_params es un string JSON, parsearlo
            if (typeof notification.navigate_params === 'string') {
                try {
                    params = JSON.parse(notification.navigate_params)
                } catch (error) {
                    console.error('Error parsing navigate_params JSON:', error)
                    params = {}
                }
            } else {
                params = notification.navigate_params
            }

            // Separar parámetros de ruta y query params
            let pathParam: string | null = null
            const queryParams = new URLSearchParams()

            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    // El parámetro idContenedor va en la ruta para cotizaciones
                    if (key === 'idContenedor' && notification.navigate_to?.includes('cotizaciones')) {
                        pathParam = value.toString()
                    } else {
                        // Los demás parámetros van como query params
                        queryParams.append(key, value.toString())
                    }
                }
            })

            // Agregar el parámetro de ruta si existe
            if (pathParam) {
                url += `/${pathParam}`
            }

            // Agregar query parameters si existen
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`
            }
        }

        // Asegurar que la URL comience con /
        if (!url.startsWith('/')) {
            url = `/${url}`
        }

        // Navegar usando el router de Nuxt
        console.log('Navegando a:', url)
        console.log('URL original:', notification.navigate_to)
        console.log('Parámetros:', notification.navigate_params)
        navigateTo(url)
    }

    /**
     * Maneja el clic en una notificación (marca como leída y navega)
     */
    static async handleNotificationClick(notification: Notification): Promise<void> {
        try {
            // Solo marcar como leída si no lo está ya
            if (!notification.estado_usuario.leida) {
                await this.markAsRead(notification.id)
            }

            // Navegar si tiene destino
            this.navigateToNotification(notification)
        } catch (error) {
            console.error('Error al manejar clic en notificación:', error)
            throw error
        }
    }

    /**
     * Obtiene el color según el tipo de notificación
     */
    static getTypeColor(tipo: Notification['tipo']): string {
        const colors = {
            info: 'blue',
            success: 'green',
            warning: 'yellow',
            error: 'red'
        }
        return colors[tipo] || 'gray'
    }

    /**
     * Obtiene el ícono por defecto según el tipo
     */
    static getTypeIcon(tipo: Notification['tipo']): string {
        const icons = {
            info: 'i-heroicons-information-circle',
            success: 'i-heroicons-check-circle',
            warning: 'i-heroicons-exclamation-triangle',
            error: 'i-heroicons-x-circle'
        }
        return icons[tipo] || 'i-heroicons-bell'
    }

    /**
     * Obtiene la descripción de la prioridad
     */
    static getPriorityLabel(prioridad: Notification['prioridad']): string {
        const labels = {
            1: 'Crítica',
            2: 'Alta',
            3: 'Media',
            4: 'Baja',
            5: 'Informativa'
        }
        return labels[prioridad] || 'Media'
    }

    /**
     * Formatea la fecha de creación
     */
    static formatDate(dateString: string): string {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
            return diffInMinutes <= 1 ? 'Hace un momento' : `Hace ${diffInMinutes} minutos`
        } else if (diffInHours < 24) {
            return `Hace ${diffInHours} horas`
        } else {
            const diffInDays = Math.floor(diffInHours / 24)
            if (diffInDays === 1) return 'Hace 1 día'
            if (diffInDays < 7) return `Hace ${diffInDays} días`

            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        }
    }

    /**
     * Convierte una notificación del backend al formato legacy para compatibilidad
     */
    static toLegacyFormat(notification: Notification): any {
        return {
            id: notification.id.toString(),
            title: notification.titulo,
            description: notification.mensaje,
            status: notification.estado_usuario.leida ? 'read' : 'unread',
            category: notification.modulo,
            createdAt: new Date(notification.fecha_creacion)
        }
    }

}

// Instancia singleton del servicio
export const notificationService = new NotificationService()
