export type SpeechVoice = SpeechSynthesisVoice |
  {
    name: string
    lang: string
  }

export function getAvailableVoices(): SpeechVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return []
  }

  return window.speechSynthesis.getVoices()
}

export function speakText(
  text: string,
  options: {
    rate?: number
    voice?: SpeechVoice | null
    enabled?: boolean
    onEnd?: () => void
    onError?: () => void
  } = {},
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false
  }

  const { rate = 1, voice, enabled = true, onEnd, onError } = options

  if (!enabled || !text.trim()) return false

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.lang = 'en-US'

  if (voice && 'name' in voice) {
    utterance.voice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.name === voice.name) ?? null
  }

  utterance.onend = onEnd ?? null
  utterance.onerror = onError ? () => onError() : null
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
