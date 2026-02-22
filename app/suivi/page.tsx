"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

interface Signalement {
  id: string
  created_at: string
  type_commission: 'violences' | 'ethique' | 'ne_sais_pas'
  type_depot: 'vocal' | 'ecrit'
  anonyme: boolean
  nom_prenom: string | null
  telephone: string | null
  texte_ecrit: string | null
  audio_url: string | null
}

export default function SuiviSignalements() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [filtreCommission, setFiltreCommission] = useState<'violences' | 'ethique' | 'ne_sais_pas' | 'tous'>('tous')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSignalements()
  }, [filtreCommission])

  const fetchSignalements = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('signalements')
        .select('*')
        .order('created_at', { ascending: false })

      if (filtreCommission !== 'tous') {
        query = query.eq('type_commission', filtreCommission)
      }

      const { data, error } = await query

      if (error) throw error
      setSignalements(data || [])
    } catch (error) {
      console.error('Erreur chargement signalements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const getCommissionLabel = (type: string) => {
    switch (type) {
      case 'violences':
        return 'Lutte contre les violences'
      case 'ethique':
        return 'Question éthique'
      case 'ne_sais_pas':
        return 'Non précisé'
      default:
        return type
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-[var(--blue)] mb-6">Suivi des signalements</h1>

        {/* Filtres */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Filtrer par commission</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFiltreCommission('tous')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtreCommission === 'tous'
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tous les signalements
            </button>
            <button
              onClick={() => setFiltreCommission('violences')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtreCommission === 'violences'
                  ? 'bg-[var(--red)] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Lutte contre les violences
            </button>
            <button
              onClick={() => setFiltreCommission('ethique')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtreCommission === 'ethique'
                  ? 'bg-[var(--yellow)] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Questions éthiques
            </button>
            <button
              onClick={() => setFiltreCommission('ne_sais_pas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtreCommission === 'ne_sais_pas'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Non précisés
            </button>
          </div>
        </div>

        {/* Nombre de résultats */}
        <div className="text-sm text-gray-600 mb-4">
          {isLoading ? (
            'Chargement...'
          ) : (
            `${signalements.length} signalement${signalements.length > 1 ? 's' : ''} trouvé${signalements.length > 1 ? 's' : ''}`
          )}
        </div>
      </div>

      {/* Liste des signalements */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-l-8 border-gray-300 border-t-[var(--blue)]"></div>
        </div>
      ) : signalements.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
          Aucun signalement trouvé
        </div>
      ) : (
        <div className="space-y-4">
          {signalements.map((signalement) => {
              const borderColors = {
                violences: 'border-red-500',
                ethique: 'border-yellow-500',
                ne_sais_pas: 'border-gray-400'
              }
              
              return (
                <div
                  key={signalement.id}
                  className={`bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow border-2 ${borderColors[signalement.type_commission]}`}
                >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date */}
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Date de dépôt</div>
                  <div className="text-gray-900">{formatDate(signalement.created_at)}</div>
                </div>

                {/* Commission */}
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Commission</div>
                  <div className="text-gray-900">{getCommissionLabel(signalement.type_commission)}</div>
                </div>

                {/* Identité */}
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Identité</div>
                  {signalement.anonyme ? (
                    <div className="text-gray-500 italic">Anonyme</div>
                  ) : (
                    <div>
                      <div className="text-gray-900">{signalement.nom_prenom || 'Non renseigné'}</div>
                      {signalement.telephone && (
                        <div className="text-sm text-gray-600">{signalement.telephone}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contenu */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {signalement.type_depot === 'ecrit' && signalement.texte_ecrit && (
                    <div className="text-gray-700 bg-gray-50 p-3 rounded">
                      {signalement.texte_ecrit}
                  </div>
                )}
                {signalement.type_depot === 'vocal' && signalement.audio_url && (
                    <audio src={signalement.audio_url} controls className="w-full" />
                )}
              </div>
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}