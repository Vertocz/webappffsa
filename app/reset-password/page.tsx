'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  useEffect(() => {
    // Supabase gère automatiquement le token depuis l'URL (#access_token=...)
    // On écoute l'événement PASSWORD_RECOVERY pour confirmer que la session est active
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Timeout : si après 3s aucun événement PASSWORD_RECOVERY, le lien est invalide/expiré
    const timeout = setTimeout(() => {
      setInvalidLink(true)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // Annuler le timeout dès que la session est prête
  useEffect(() => {
    if (sessionReady) setInvalidLink(false)
  }, [sessionReady])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      console.error('Erreur reset:', err)
      setError('Une erreur est survenue. Le lien est peut-être expiré.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-10 space-y-8">

        <div className="text-center space-y-4">
          <Image
            src="/Logo-FFSA.png"
            alt=""
            width={120}
            height={60}
            className="mx-auto object-contain"
          />
          <div>
            <h1 className="!text-2xl !pt-0 !pb-1">Nouveau mot de passe</h1>
            <p className="text-gray-500 text-sm">
              Choisissez un nouveau mot de passe pour votre compte
            </p>
          </div>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-green-800 text-sm font-medium text-center">
              ✅ Mot de passe mis à jour avec succès !<br />
              <span className="font-normal">Vous allez être redirigé vers la page de connexion…</span>
            </div>
          </div>
        ) : invalidLink && !sessionReady ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 text-sm font-medium text-center">
              ⚠️ Ce lien est invalide ou a expiré.<br />
              <span className="font-normal">Faites une nouvelle demande depuis la page de connexion.</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-bold hover:bg-[var(--red)] transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        ) : !sessionReady ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[var(--blue)]"></div>
            <p className="mt-4 text-gray-500 text-sm">Vérification du lien…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--blue)] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--blue)] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password || !confirm}
              className="w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-bold text-lg hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400">
          🔒 Accès sécurisé — vos actions sont enregistrées
        </p>
      </div>
    </div>
  )
}