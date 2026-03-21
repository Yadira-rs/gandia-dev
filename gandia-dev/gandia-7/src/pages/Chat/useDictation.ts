import { useState, useCallback, useEffect } from 'react'

export interface UseDictationReturn {
  active:     boolean
  transcript: string
  interim:    string
  supported:  boolean
  stop:       () => void
}

export function useDictation(
  onCommit: (text: string) => void,
  onCancel: () => void,
): UseDictationReturn {
  const supported = typeof window !== 'undefined' &&
    !!(((window as unknown as Record<string,unknown>).SpeechRecognition ||
        (window as unknown as Record<string,unknown>).webkitSpeechRecognition))

  const [active,     setActive]     = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim,    setInterim]    = useState('')

  const stop = useCallback(() => {
    setActive(false)
    setTranscript('')
    setInterim('')
    window.dispatchEvent(new CustomEvent('gandia:dictation-stop'))
  }, [])

  useEffect(() => {
    const onStart = () => {
      setActive(true)
      setTranscript('')
      setInterim('')
    }
    const onTranscript = (e: Event) => {
      const { transcript: t, interim: i } = (e as CustomEvent<{transcript:string; interim:string}>).detail
      setTranscript(t)
      setInterim(i)
    }
    // commit y cancel usan las callbacks directamente en cada render via cierre
    window.addEventListener('gandia:dictation-started',    onStart)
    window.addEventListener('gandia:dictation-transcript', onTranscript)
    return () => {
      window.removeEventListener('gandia:dictation-started',    onStart)
      window.removeEventListener('gandia:dictation-transcript', onTranscript)
    }
  }, [])

  // commit y cancel: re-registrar cuando cambian las callbacks
  useEffect(() => {
    const onCommitEvt = (e: Event) => {
      const { text } = (e as CustomEvent<{text:string}>).detail
      setActive(false)
      setTranscript('')
      setInterim('')
      onCommit(text)
    }
    window.addEventListener('gandia:dictation-commit', onCommitEvt)
    return () => window.removeEventListener('gandia:dictation-commit', onCommitEvt)
  }, [onCommit])

  useEffect(() => {
    const onCancelEvt = () => {
      setActive(false)
      setTranscript('')
      setInterim('')
      onCancel()
    }
    window.addEventListener('gandia:dictation-cancelled', onCancelEvt)
    return () => window.removeEventListener('gandia:dictation-cancelled', onCancelEvt)
  }, [onCancel])

  return { active, transcript, interim, supported, stop }
}