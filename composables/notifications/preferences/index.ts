export {
  useNotificationPreferences,
  loadNotificationPreferences,
  resetNotificationPreferences,
  canShowWsNotification,
} from './useNotificationPreferences'

export {
  WS_NOTIFICATION_TYPES,
  WS_NOTIFICATION_CHANNELS,
  getWsNotificationType,
} from './constants'

export { WS_NOTIFICATION_KEYS } from './keys'
export type { WsNotificationKey } from './keys'

export {
  canShowWs,
  wsShowSuccess,
  wsShowError,
  dispatchWsModal,
} from './wsNotificationHelpers'

export { getAvailableNotificationKeysForUser, rolesMatch } from './getAvailableKeysForUser'
export { WS_EVENT_TO_NOTIFICATION_KEY } from './eventKeyMap'

export type {
  WsNotificationChannel,
  WsNotificationType,
  WsNotificationPreferenceRecord,
} from '~/types/notifications/preferences'
