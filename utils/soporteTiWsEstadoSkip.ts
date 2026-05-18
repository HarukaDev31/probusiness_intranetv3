/** Evita notificación WS de estado justo después de cambiarlo el mismo usuario. */
export function marcarEstadoCambiadoPorMi(chatUuid: string, ms = 5000) {
  const map = useState<Record<string, number>>('soporte-ti-ignorar-notif-estado', () => ({}))
  map.value = { ...map.value, [chatUuid]: Date.now() + ms }
}

export function debeIgnorarNotifEstadoWs(chatUuid: string): boolean {
  const map = useState<Record<string, number>>('soporte-ti-ignorar-notif-estado', () => ({}))
  return (map.value[chatUuid] ?? 0) > Date.now()
}
