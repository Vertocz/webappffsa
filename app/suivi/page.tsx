'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { STATUT_LABELS, STATUT_BADGE_COLORS, STATUT_BORDER_COLORS } from '@/app/lib/statuts'
import Link from 'next/link'

interface Signalement {
  id: string
  created_at: string
  anonyme: boolean
  statut: string
  type_depot: 'vocal' | 'ecrit'
}

export default function SuiviSignalements() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [filtreStatut, setFiltreStatut] = useState<
    'non_traite' | 'non_avenu' | 'transmis_ethique' | 'transmis_discipline' | 'traite' | 'tous'
  >('tous')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSignalements()
  }, [filtreStatut])

  const fetchSignalements = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('signalements')
        .select('id, created_at, anonyme, statut, type_depot')
        .order('created_at', { ascending: false })

      if (filtreStatut !== 'tous') {
        query = query.eq('statut', filtreStatut)
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
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  const getStatutBadge = (statut: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUT_BADGE_COLORS[statut] ?? STATUT_BADGE_COLORS.non_traite}`}>
        {STATUT_LABELS[statut] ?? statut}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1>Suivi des signalements</h1>

        {/* Filtres */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Filtrer par statut</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'tous',                label: 'Tous les signalements',  active: 'bg-[var(--blue)] text-white' },
              { value: 'non_traite',          label: STATUT_LABELS.non_traite,          active: 'bg-gray-600 text-white' },
              { value: 'transmis_ethique',    label: STATUT_LABELS.transmis_ethique,    active: 'bg-[var(--yellow)] text-white' },
              { value: 'transmis_discipline', label: STATUT_LABELS.transmis_discipline, active: 'bg-[var(--red)] text-white' },
              { value: 'traite',              label: STATUT_LABELS.traite,              active: 'bg-green-700 text-white' },
              { value: 'non_avenu',           label: STATUT_LABELS.non_avenu,           active: 'bg-slate-700 text-white' },
            ].map(({ value, label, active }) => (
              <button
                key={value}
                onClick={() => setFiltreStatut(value as typeof filtreStatut)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtreStatut === value
                    ? active
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {isLoading
            ? 'Chargement...'
            : `${signalements.length} signalement${signalements.length > 1 ? 's' : ''} trouvé${signalements.length > 1 ? 's' : ''}`
          }
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[var(--blue)]"></div>
        </div>
      ) : signalements.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
          Aucun signalement trouvé
        </div>
      ) : (
        <div className="space-y-3">
          {signalements.map((s) => {
            return (
              <Link
                key={s.id}
                href={`/suivi/${s.id}`}
                className={`block bg-white shadow-md rounded-lg p-5 hover:shadow-xl transition-all border-l-8 ${STATUT_BORDER_COLORS[s.statut] ?? STATUT_BORDER_COLORS.non_traite} hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-1">

                    <div className="min-w-[100px]">
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-semibold text-gray-900">{formatDate(s.created_at)}</div>
                    </div>

                    <div className="min-w-[120px]">
                      <div className="text-sm text-gray-500">Déposant</div>
                      <div className="font-semibold text-gray-900">
                        {s.anonyme
                          ? <span className="italic text-gray-400">Anonyme</span>
                          : <span>Identifié</span>
                        }
                      </div>
                    </div>

                    <div className="min-w-[100px]">
                      <div className="text-sm text-gray-500">Format</div>
                      <div className="font-semibold text-gray-900">
                        {s.type_depot === 'vocal' ? '🎤 Vocal' : '✍️ Écrit'}
                      </div>
                    </div>

                    <div>{getStatutBadge(s.statut)}</div>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
