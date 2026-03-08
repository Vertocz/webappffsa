'use client'

import { useState, useRef, useEffect } from 'react'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  audioBlob: Blob | null
  audioUrl: string | null
  recordingTime: number
  onReset: () => void
}

export default function VoiceRecorder({
  onRecordingComplete,
  audioBlob,
  audioUrl,
  recordingTime,
  onReset
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [localRecordingTime, setLocalRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  // Ref pour avoir la durée courante dans le callback onstop (évite la stale closure)
  const localRecordingTimeRef = useRef(0)

  const MAX_RECORDING_TIME = 600 // 10 minutes

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  const analyzeAudio = () => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setAudioLevel(average / 255)
    animationRef.current = requestAnimationFrame(analyzeAudio)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // Utilise la ref pour avoir la durée réelle, pas la valeur capturée au démarrage
        onRecordingComplete(blob, localRecordingTimeRef.current)

        stream.getTracks().forEach(track => track.stop())
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {})
          audioContextRef.current = null
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setLocalRecordingTime(0)
      localRecordingTimeRef.current = 0
      analyzeAudio()

      timerRef.current = setInterval(() => {
        setLocalRecordingTime(prev => {
          const next = prev >= MAX_RECORDING_TIME ? prev : prev + 1
          localRecordingTimeRef.current = next
          if (prev >= MAX_RECORDING_TIME) stopRecording()
          return next
        })
      }, 1000)

    } catch (error) {
      console.error('Erreur accès micro:', error)
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioLevel(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (audioBlob) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Durée : {formatTime(recordingTime)}</p>
          <audio src={audioUrl || undefined} controls className="w-full" />
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 px-6 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
        >
          🔄 Réenregistrer
        </button>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      {isRecording && (
        <div className="flex justify-center items-center gap-1 h-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-[var(--red)] rounded-full transition-all duration-100"
              style={{
                height: `${20 + (Math.random() * audioLevel * 60)}px`,
                opacity: 0.5 + (audioLevel * 0.5)
              }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-32 h-32 rounded-full font-bold text-xl transition-all ${
          isRecording
            ? 'bg-[var(--red)] text-white animate-pulse'
            : 'bg-[var(--yellow)] text-white hover:scale-110'
        }`}
      >
        {isRecording ? '⏹ Stop' : '⏺ Parler'}
      </button>

      {isRecording && (
        <div className="text-2xl font-bold text-[var(--blue)]">
          {formatTime(localRecordingTime)} / {formatTime(MAX_RECORDING_TIME)}
        </div>
      )}

      <p className="text-gray-600">
        {isRecording
          ? 'Enregistrement en cours...'
          : 'Cliquez sur le bouton pour commencer à parler'}
      </p>
    </div>
  )
}
