"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { decryptText } from '@/app/lib/encryption'
import { useDecryption } from '@/contexts/DecryptionContext'
import PassphraseModal from '@/components/PassPhraseModal'
import Link from 'next/link'

interface Signalement {
  id: string
  created_at: string
  type_commission: 'violences' | 'ethique' | 'ne_sais_pas'
  anonyme: boolean
  nom_prenom: string | null
  nom_prenom_chiffre: string | null
  nom_prenom_iv: string | null
  nom_prenom_salt: string | null
  statut: string
  type_depot: 'vocal' | 'ecrit'
}

export default function SuiviSignalements() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [filtreCommission, setFiltreCommission] = useState<'violences' | 'ethique' | 'ne_sais_pas' | 'tous'>('tous')
  const [isLoading, setIsLoading] = useState(true)
  const { passphrase, isAuthenticated } = useDecryption()

  useEffect(() => {
    if (isAuthenticated) {
      fetchSignalements()
    }
  }, [filtreCommission, isAuthenticated])

  const fetchSignalements = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('signalements')
        // include type_depot which is required by our Signalement interface
        .select('id, created_at, type_commission, anonyme, nom_prenom, nom_prenom_chiffre, nom_prenom_iv, nom_prenom_salt, statut, type_depot')
        .order('created_at', { ascending: false })

      if (filtreCommission !== 'tous') {
        query = query.eq('type_commission', filtreCommission)
      }

      const { data, error } = await query

      if (error) throw error

      // Déchiffrer les noms si chiffrés
      const decryptedData = await Promise.all(
        (data || []).map(async (sig) => {
          // preserve type_depot and other fields when returning
          if (sig.nom_prenom_chiffre && sig.nom_prenom_iv && sig.nom_prenom_salt && passphrase) {
            try {
              const decrypted = await decryptText(
                sig.nom_prenom_chiffre,
                sig.nom_prenom_iv,
                sig.nom_prenom_salt,
                passphrase
              )
              return { ...sig, nom_prenom: decrypted }
            } catch (err) {
              console.error('Erreur déchiffrement nom:', err)
              return { ...sig, nom_prenom: '[Erreur déchiffrement]' }
            }
          }
          return sig
        })
      )

      setSignalements(decryptedData)
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
        return 'Commission contre les violences'
      case 'ethique':
        return "Commission d'éthique"
      case 'ne_sais_pas':
        return 'Non précisé'
      default:
        return type
    }
  }

  const getStatutBadge = (statut: string) => {
    const badges = {
      non_traite: 'bg-gray-200 text-gray-800',
      non_avenu: 'bg-slate-800 text-slate-300',
      transmis_ethique: 'bg-[var(--yellow)] text-yellow-900',
      transmis_discipline: 'bg-[var(--red)] text-red-100',
      traite: 'bg-green-900 text-green-200'
    }
    
    const labels = {
      non_traite: 'Non traité',
      non_avenu: 'Non avenu',
      transmis_ethique: "Transmis au comité d'éthique",
      transmis_discipline: 'Transmis à la commission de discipline',
      traite: 'Traité'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[statut as keyof typeof badges] || badges.non_traite}`}>
        {labels[statut as keyof typeof labels] || statut}
      </span>
    )
  }

  return (
    <>
      <PassphraseModal onSuccess={fetchSignalements} />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1>Suivi des signalements</h1>

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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[var(--blue)]"></div>
          </div>
        ) : signalements.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
            Aucun signalement trouvé
          </div>
        ) : (
          <div className="space-y-3">
            {signalements.map((signalement) => {
              const borderColors = {
                violences: 'border-l-red-500',
                ethique: 'border-l-yellow-500',
                ne_sais_pas: 'border-l-gray-400'
              }
              
              return (
                <Link
                  key={signalement.id}
                  href={`/suivi/${signalement.id}`}
                  className={`block bg-white shadow-md rounded-lg p-5 hover:shadow-xl transition-all border-l-8 ${borderColors[signalement.type_commission]} hover:scale-[1.01]`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6 flex-1">
                      {/* Date */}
                      <div className="min-w-[100px]">
                        <div className="text-sm text-gray-500">Date</div>
                        <div className="font-semibold text-gray-900">{formatDate(signalement.created_at)}</div>
                      </div>

                      {/* Identité */}
                      <div className="min-w-[150px]">
                        <div className="text-sm text-gray-500">Déposant</div>
                        <div className="font-semibold text-gray-900">
                          {signalement.anonyme ? (
                            <span className="italic text-gray-500">Anonyme</span>
                          ) : (
                            signalement.nom_prenom || 'Non renseigné'
                          )}
                        </div>
                      </div>

                      {/* Commission */}
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Commission</div>
                        <div className="font-semibold text-gray-900">{getCommissionLabel(signalement.type_commission)}</div>
                      </div>

                      {/* Type de dépôt */}
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Type de dépôt</div>
                        <div className="font-semibold text-gray-900">
                          {signalement.type_depot === 'ecrit' ? 'Message écrit' : 'Message vocal'}
                        </div>
                      </div>

                      {/* Statut */}
                      <div>
                        {getStatutBadge(signalement.statut)}
                      </div>
                    </div>

                    {/* Flèche */}
                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}