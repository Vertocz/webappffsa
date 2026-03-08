"use client"

import { useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

const styles: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error:   'bg-[var(--red)] text-white',
  info:    'bg-[var(--blue)] text-white',
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
}

export default function Toast({ message, type = 'success', onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      role="alert"
      className={`
        fixed top-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3
        px-6 py-4 rounded-xl shadow-2xl
        text-base font-semibold
        animate-in fade-in slide-in-from-top-4 duration-300
        ${styles[type]}
      `}
    >
      <span className="text-lg">{icons[type]}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )
}