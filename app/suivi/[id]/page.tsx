"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
  statut: string
}

interface JournalEntry {
  id: string
  utilisateur: string
  action: string
  ancien_statut: string | null
  nouveau_statut: string | null
  created_at: string
}

export default function DetailSignalement() {
  const params = useParams()
  const router = useRouter()
  const [signalement, setSignalement] = useState<Signalement | null>(null)
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedStatut, setSelectedStatut] = useState('')
  const hasLoggedRef = useRef(false)

  useEffect(() => {
    if (params.id) {
      fetchSignalement()
      fetchJournal()
      
      // Log la consultation une seule fois
      if (!hasLoggedRef.current) {
        logConsultation()
        hasLoggedRef.current = true
      }
    }
  }, [params.id])

  const fetchSignalement = async () => {
    try {
      const { data, error } = await supabase
        .from('signalements')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setSignalement(data)
      setSelectedStatut(data.statut || 'non_traite')
    } catch (error) {
      console.error('Erreur chargement signalement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJournal = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_acces')
        .select('*')
        .eq('signalement_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJournal(data || [])
    } catch (error) {
      console.error('Erreur chargement journal:', error)
    }
  }

  const logConsultation = async () => {
    try {
      await supabase
        .from('journal_acces')
        .insert({
          signalement_id: params.id,
          utilisateur: 'invité',
          action: 'consultation'
        })
    } catch (error) {
      console.error('Erreur log consultation:', error)
    }
  }

  const handleStatutChange = async () => {
    if (!signalement || selectedStatut === signalement.statut) return

    setIsSaving(true)
    try {
      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('signalements')
        .update({ statut: selectedStatut })
        .eq('id', signalement.id)

      if (updateError) throw updateError

      // Journaliser le changement
      await supabase
        .from('journal_acces')
        .insert({
          signalement_id: signalement.id,
          utilisateur: 'invité',
          action: 'modification_statut',
          ancien_statut: signalement.statut,
          nouveau_statut: selectedStatut
        })

      // Recharger les données
      await fetchSignalement()
      await fetchJournal()

      alert('Statut mis à jour avec succès')
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      alert('Erreur lors de la mise à jour du statut')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatutLabel = (statut: string) => {
    const labels = {
      non_traite: 'Non traité',
      non_avenu: 'Non avenu',
      transmis_ethique: "Transmis au comité d'éthique",
      transmis_discipline: 'Transmis à la commission de discipline',
      traite: 'Traité'
    }
    return labels[statut as keyof typeof labels] || statut
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[var(--blue)]"></div>
        </div>
      </div>
    )
  }

  if (!signalement) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">Signalement non trouvé</p>
          <Link href="/suivi" className="text-[var(--blue)] hover:underline">
            Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <Link 
          href="/suivi"
          className="text-[var(--blue)] hover:underline font-semibold"
        >
          ← Retour à la liste
        </Link>
      </div>

      {/* Informations principales */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1>Détail du signalement</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Date de dépôt */}
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-1">Date de dépôt</div>
            <div className="text-gray-900">{formatDateTime(signalement.created_at)}</div>
          </div>

          {/* Commission */}
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-1">Commission concernée</div>
            <div className="text-gray-900">{getCommissionLabel(signalement.type_commission)}</div>
          </div>

          {/* Type de dépôt */}
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-1">Type de dépôt</div>
            <div className="text-gray-900">
              {signalement.type_depot === 'vocal' ? 'Message vocal' : 'Message écrit'}
            </div>
          </div>

          {/* Identité */}
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-1">Identité du déposant</div>
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
      </div>

      {/* Contenu du signalement */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2>Contenu du signalement</h2>
        
        <div className="mt-4">
          {signalement.type_depot === 'ecrit' && signalement.texte_ecrit && (
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
              {signalement.texte_ecrit}
            </div>
          )}
          {signalement.type_depot === 'vocal' && signalement.audio_url && (
            <div>
              <audio src={signalement.audio_url} controls className="w-full" />
            </div>
          )}
        </div>
      </div>

      {/* Gestion du statut */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2>Gestion du statut</h2>
        
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 p-3 bg-gray-200 text-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <input
              type="radio"
              name="statut"
              value="non_traite"
              checked={selectedStatut === 'non_traite'}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-4 h-4"
            />
            <span className="font-medium">Non traité</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-800 text-slate-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <input
              type="radio"
              name="statut"
              value="non_avenu"
              checked={selectedStatut === 'non_avenu'}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-4 h-4"
            />
            <span className="font-medium">Non avenu</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-[var(--yellow)] text-yellow-900 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <input
              type="radio"
              name="statut"
              value="transmis_ethique"
              checked={selectedStatut === 'transmis_ethique'}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-4 h-4"
            />
            <span className="font-medium">Transmis au comité d'éthique</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-[var(--red)] text-red-100 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <input
              type="radio"
              name="statut"
              value="transmis_discipline"
              checked={selectedStatut === 'transmis_discipline'}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-4 h-4"
            />
            <span className="font-medium">Transmis à la commission de discipline</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-green-900 text-green-200 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <input
              type="radio"
              name="statut"
              value="traite"
              checked={selectedStatut === 'traite'}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-4 h-4"
            />
            <span className="font-medium">Traité</span>
          </label>
        </div>

        <button
          onClick={handleStatutChange}
          disabled={isSaving || selectedStatut === signalement.statut}
          className="mt-6 w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-semibold hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer le changement de statut'}
        </button>
      </div>

      {/* Journal des accès */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2>Historique des accès et modifications</h2>
        
        {journal.length === 0 ? (
          <p className="text-gray-500 mt-4">Aucun historique disponible</p>
        ) : (
          <div className="mt-4 space-y-2">
            {journal.map((entry) => (
              <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{entry.utilisateur}</span>
                    {' - '}
                    <span className="text-gray-600">
                      {entry.action === 'consultation' && 'a consulté le signalement'}
                      {entry.action === 'modification_statut' && 
                        `a modifié le statut de "${getStatutLabel(entry.ancien_statut || '')}" vers "${getStatutLabel(entry.nouveau_statut || '')}"`
                      }
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatDateTime(entry.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}