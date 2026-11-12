import { useCallback, useMemo, useRef, useState } from 'react'
import { getAvailableVoices, speakText, stopSpeech } from '../services/speechService'
import type { AlertPriority } from '../types'

const priorityValue: Record<AlertPriority, number> = {
  info: 1,
  warning: 2,
  urgent: 3,
}

export function useSpeech() {
  const [enabled, setEnabled] = useState(true)
  const [rate, setRate] = useState(1)
  const [voiceName, setVoiceName] = useState('')
  const [lastMessage, setLastMessage] = useState('')
  const lastMessageRef = useRef('')
  const lastPriorityRef = useRef<AlertPriority>('info')
  const recentMessagesRef = useRef(new Map<string, number>())
  const activePriorityRef = useRef(0)

  const voices = useMemo(() => getAvailableVoices(), [])

  const speak = useCallback(
    (message: string, priority: AlertPriority = 'info', force = false) => {
      const cleaned = message.trim()
      if (!cleaned || !enabled) return

      const key = cleaned.toLowerCase()
      const now = Date.now()
      const cooldownMs = priority === 'urgent' ? 5000 : 10000
      const lastSpokenAt = recentMessagesRef.current.get(key) ?? 0

      if (!force && now - lastSpokenAt < cooldownMs) return
      if (
        !force &&
        window.speechSynthesis?.speaking &&
        priorityValue[priority] <= activePriorityRef.current
      ) {
        return
      }

      activePriorityRef.current = priorityValue[priority]
      const voice = voices.find((item) => item.name === voiceName) ?? null
      const started = speakText(cleaned, {
        enabled,
        rate,
        voice,
        onEnd: () => {
          activePriorityRef.current = 0
        },
        onError: () => {
          activePriorityRef.current = 0
        },
      })
      if (started) {
        recentMessagesRef.current.set(key, now)
        if (recentMessagesRef.current.size > 100) {
          const oldestKey = recentMessagesRef.current.keys().next().value
          if (oldestKey) recentMessagesRef.current.delete(oldestKey)
        }
        lastMessageRef.current = cleaned
        lastPriorityRef.current = priority
        setLastMessage(cleaned)
      } else {
        activePriorityRef.current = 0
      }
    },
    [enabled, rate, voiceName, voices],
  )

  const repeatLatest = useCallback(() => {
    if (!lastMessageRef.current) return
    speak(lastMessageRef.current, lastPriorityRef.current, true)
  }, [speak])

  const mute = useCallback(() => {
    setEnabled(false)
    stopSpeech()
    activePriorityRef.current = 0
  }, [])

  const unmute = useCallback(() => {
    setEnabled(true)
  }, [])

  return {
    enabled,
    lastMessage,
    setEnabled,
    rate,
    setRate,
    voiceName,
    setVoiceName,
    voices,
    speak,
    repeatLatest,
    mute,
    unmute,
    lastMessageRef,
  }
}
