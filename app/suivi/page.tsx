'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'

interface Signalement {
  id: string
  created_at: string
  type_commission: 'violences' | 'ethique' | 'ne_sais_pas'
  anonyme: boolean
  statut: string
  type_depot: 'vocal' | 'ecrit'
}

export default function SuiviSignalements() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [filtreCommission, setFiltreCommission] = useState<
    'violences' | 'ethique' | 'ne_sais_pas' | 'tous'
  >('tous')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSignalements()
  }, [filtreCommission])

  const fetchSignalements = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('signalements')
        .select('id, created_at, type_commission, anonyme, statut, type_depot')
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
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  const getCommissionLabel = (type: string) => {
    switch (type) {
      case 'violences':   return 'Commission contre les violences'
      case 'ethique':     return "Commission d'éthique"
      case 'ne_sais_pas': return 'Non précisé'
      default:            return type
    }
  }

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, string> = {
      non_traite:          'bg-gray-200 text-gray-800',
      non_avenu:           'bg-slate-800 text-slate-300',
      transmis_ethique:    'bg-[var(--yellow)] text-yellow-900',
      transmis_discipline: 'bg-[var(--red)] text-red-100',
      traite:              'bg-green-900 text-green-200',
    }
    const labels: Record<string, string> = {
      non_traite:          'Non traité',
      non_avenu:           'Non avenu',
      transmis_ethique:    "Transmis au comité d'éthique",
      transmis_discipline: 'Transmis à la commission de discipline',
      traite:              'Traité',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[statut] ?? badges.non_traite}`}>
        {labels[statut] ?? statut}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1>Suivi des signalements</h1>

        {/* Filtres */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Filtrer par commission</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'tous',       label: 'Tous les signalements', active: 'bg-[var(--blue)] text-white' },
              { value: 'violences',  label: 'Lutte contre les violences', active: 'bg-[var(--red)] text-white' },
              { value: 'ethique',    label: "Questions éthiques", active: 'bg-[var(--yellow)] text-white' },
              { value: 'ne_sais_pas',label: 'Non précisés', active: 'bg-gray-600 text-white' },
            ].map(({ value, label, active }) => (
              <button
                key={value}
                onClick={() => setFiltreCommission(value as typeof filtreCommission)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtreCommission === value
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
            const borderColors: Record<string, string> = {
              violences:   'border-l-red-500',
              ethique:     'border-l-yellow-500',
              ne_sais_pas: 'border-l-gray-400',
            }
            return (
              <Link
                key={s.id}
                href={`/suivi/${s.id}`}
                className={`block bg-white shadow-md rounded-lg p-5 hover:shadow-xl transition-all border-l-8 ${borderColors[s.type_commission]} hover:scale-[1.01]`}
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

                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Commission</div>
                      <div className="font-semibold text-gray-900">{getCommissionLabel(s.type_commission)}</div>
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
