'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/suivi'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Compte non confirmé. Désactivez la confirmation email dans Supabase Dashboard → Auth → Settings.')
        } else {
          setError('Email ou mot de passe incorrect.')
        }
        return
      }

      router.push(redirect)
      router.refresh()
    } catch (err) {
      console.error('Erreur connexion:', err)
      setError('Une erreur inattendue est survenue. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Adresse e-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--blue)] focus:outline-none transition-colors"
          placeholder="prenom.nom@ffsa.fr"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
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
        disabled={isLoading}
        className="w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-bold text-lg hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}

export default function LoginPage() {
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
            <h1 className="!text-2xl !pt-0 !pb-1">
              Espace administrateur
            </h1>
            <p className="text-gray-500 text-sm">
              Connectez-vous pour consulter et gérer les signalements
            </p>
          </div>
        </div>

        {/* useSearchParams() doit être dans un Suspense boundary */}
        <Suspense fallback={<div className="h-48" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-gray-400">
          🔒 Accès sécurisé — vos actions sont enregistrées
        </p>
      </div>
    </div>
  )
}