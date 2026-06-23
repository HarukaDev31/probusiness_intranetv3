import { WA_INBOX_NOTIFICATION_SOUND_URL } from '~/constants/waInboxNotification'

let audio: HTMLAudioElement | null = null
let warmed = false

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!audio) {
    audio = new Audio(WA_INBOX_NOTIFICATION_SOUND_URL)
    audio.preload = 'auto'
  }
  return audio
}

/** Precarga el audio tras un gesto del usuario (requisito de autoplay en navegadores). */
export function precalentarSonidoWaInbox(): void {
  if (typeof window === 'undefined' || warmed) return
  const el = getAudio()
  if (!el) return
  warmed = true
  el.volume = 1
  const play = el.play()
  if (play) {
    play
      .then(() => {
        el.pause()
        el.currentTime = 0
      })
      .catch(() => {
        warmed = false
      })
  }
}

export function reproducirSonidoWaInbox(): void {
  if (typeof window === 'undefined') return
  const el = getAudio()
  if (!el) return
  el.currentTime = 0
  void el.play().catch(() => {})
}

export function registrarPrecalentadoSonidoWaInboxEnPrimerClic(): void {
  if (typeof document === 'undefined') return
  if (!localStorage.getItem('auth_token')) return

  const handler = () => {
    document.removeEventListener('click', handler, true)
    document.removeEventListener('keydown', handler, true)
    precalentarSonidoWaInbox()
  }
  document.addEventListener('click', handler, true)
  document.addEventListener('keydown', handler, true)
}
