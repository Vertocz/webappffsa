"use client"

import { useState } from 'react'
import { useDecryption } from '@/contexts/DecryptionContext'

interface PassphraseModalProps {
  onSuccess?: () => void
}

export default function PassphraseModal({ onSuccess }: PassphraseModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setPassphrase, isAuthenticated } = useDecryption()

  // Si déjà authentifié (passphrase env), ne rien afficher
  if (isAuthenticated) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!inputValue.trim()) {
        throw new Error('Veuillez entrer une passphrase')
      }

      // Tester la passphrase en tentant un déchiffrement simple
      // (optionnel : vous pouvez aussi simplement l'accepter)
      setPassphrase(inputValue)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Passphrase invalide')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-2">
            Authentification requise
          </h2>
          <p className="text-gray-600">
            Entrez la passphrase de déchiffrement pour accéder aux signalements
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Passphrase
            </label>
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Entrez la passphrase de déchiffrement"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--blue)] focus:outline-none text-lg"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-semibold hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Vérification...' : 'Accéder aux signalements'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔒 La passphrase reste en mémoire uniquement pendant votre session
            <br />
            Elle n'est jamais stockée de manière permanente
          </p>
        </div>
      </div>
    </div>
  )
}