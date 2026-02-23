"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { decryptText, decryptBlob } from '@/app/lib/encryption'
import { useDecryption } from '@/contexts/DecryptionContext'
import PassphraseModal from '@/components/PassPhraseModal'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Signalement {
  id: string
  created_at: string
  type_commission: 'violences' | 'ethique' | 'ne_sais_pas'
  type_depot: 'vocal' | 'ecrit'
  anonyme: boolean
  // Anciennes colonnes (compatibilité)
  nom_prenom: string | null
  telephone: string | null
  texte_ecrit: string | null
  audio_url: string | null
  // Nouvelles colonnes chiffrées
  nom_prenom_chiffre: string | null
  nom_prenom_iv: string | null
  nom_prenom_salt: string | null
  telephone_chiffre: string | null
  telephone_iv: string | null
  telephone_salt: string | null
  texte_chiffre: string | null
  texte_iv: string | null
  texte_salt: string | null
  audio_iv: string | null
  audio_salt: string | null
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

interface DecryptedData {
  nomPrenom?: string
  telephone?: string
  texte?: string
  audioUrl?: string
}

export default function DetailSignalement() {
  const params = useParams()
  const [signalement, setSignalement] = useState<Signalement | null>(null)
  const [decryptedData, setDecryptedData] = useState<DecryptedData>({})
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedStatut, setSelectedStatut] = useState('')
  const hasLoggedRef = useRef(false)
  const { passphrase, isAuthenticated } = useDecryption()

  useEffect(() => {
    if (params.id && isAuthenticated) {
      fetchSignalement()
      fetchJournal()
      
      if (!hasLoggedRef.current) {
        logConsultation()
        hasLoggedRef.current = true
      }
    }
  }, [params.id, isAuthenticated])

  useEffect(() => {
    if (signalement && passphrase) {
      decryptSignalement()
    }
  }, [signalement, passphrase])

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

  const decryptSignalement = async () => {
    if (!signalement || !passphrase) return

    setIsDecrypting(true)
    try {
      const decrypted: DecryptedData = {}

      // Déchiffrer le nom/prénom
      if (signalement.nom_prenom_chiffre && signalement.nom_prenom_iv && signalement.nom_prenom_salt) {
        try {
          decrypted.nomPrenom = await decryptText(
            signalement.nom_prenom_chiffre,
            signalement.nom_prenom_iv,
            signalement.nom_prenom_salt,
            passphrase
          )
        } catch (err) {
          console.error('Erreur déchiffrement nom:', err)
          decrypted.nomPrenom = '[Erreur déchiffrement]'
        }
      }

      // Déchiffrer le téléphone
      if (signalement.telephone_chiffre && signalement.telephone_iv && signalement.telephone_salt) {
        try {
          decrypted.telephone = await decryptText(
            signalement.telephone_chiffre,
            signalement.telephone_iv,
            signalement.telephone_salt,
            passphrase
          )
        } catch (err) {
          console.error('Erreur déchiffrement téléphone:', err)
          decrypted.telephone = '[Erreur déchiffrement]'
        }
      }

      // Déchiffrer le texte
      if (signalement.texte_chiffre && signalement.texte_iv && signalement.texte_salt) {
        try {
          decrypted.texte = await decryptText(
            signalement.texte_chiffre,
            signalement.texte_iv,
            signalement.texte_salt,
            passphrase
          )
        } catch (err) {
          console.error('Erreur déchiffrement texte:', err)
          decrypted.texte = '[Erreur déchiffrement du texte]'
        }
      }

      // Déchiffrer l'audio
      if (signalement.audio_url && signalement.audio_iv && signalement.audio_salt) {
        try {
          console.log('Tentative de déchiffrement audio...')
          const response = await fetch(signalement.audio_url)
          if (!response.ok) {
            throw new Error(`Erreur téléchargement audio: ${response.status}`)
          }
          
          const encryptedBlob = await response.blob()
          console.log('Blob téléchargé:', encryptedBlob.size, 'bytes')
          
          const decryptedBlob = await decryptBlob(
            encryptedBlob,
            signalement.audio_iv,
            signalement.audio_salt,
            passphrase,
            'audio/webm'
          )
          console.log('Blob déchiffré:', decryptedBlob.size, 'bytes')
          
          decrypted.audioUrl = URL.createObjectURL(decryptedBlob)
          console.log('URL audio créée:', decrypted.audioUrl)
        } catch (err) {
          console.error('Erreur déchiffrement audio:', err)
          // Ne pas bloquer l'affichage, juste logger l'erreur
          decrypted.audioUrl = undefined
        }
      }

      setDecryptedData(decrypted)
    } catch (err) {
      console.error('Erreur déchiffrement:', err)
    } finally {
      setIsDecrypting(false)
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
      const { error: updateError } = await supabase
        .from('signalements')
        .update({ statut: selectedStatut })
        .eq('id', signalement.id)

      if (updateError) throw updateError

      await supabase
        .from('journal_acces')
        .insert({
          signalement_id: signalement.id,
          utilisateur: 'invité',
          action: 'modification_statut',
          ancien_statut: signalement.statut,
          nouveau_statut: selectedStatut
        })

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

  // Utiliser les données déchiffrées si disponibles, sinon les données en clair (anciennes)
  const displayNomPrenom = decryptedData.nomPrenom || signalement.nom_prenom
  const displayTelephone = decryptedData.telephone || signalement.telephone
  const displayTexte = decryptedData.texte || signalement.texte_ecrit
  const displayAudioUrl = decryptedData.audioUrl || signalement.audio_url

  return (
    <>
      <PassphraseModal />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/suivi"
            className="text-[var(--blue)] hover:underline font-semibold"
          >
            ← Retour à la liste
          </Link>
        </div>

        {/* Badge déchiffrement */}
        {isDecrypting && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-3"></div>
            <span className="text-blue-900 font-semibold">Déchiffrement en cours...</span>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1>Détail du signalement</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Date de dépôt</div>
              <div className="text-gray-900">{formatDateTime(signalement.created_at)}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Commission concernée</div>
              <div className="text-gray-900">{getCommissionLabel(signalement.type_commission)}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Type de dépôt</div>
              <div className="text-gray-900">
                {signalement.type_depot === 'vocal' ? 'Message vocal' : 'Message écrit'}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Identité du déposant</div>
              {signalement.anonyme ? (
                <div className="text-gray-500 italic">Anonyme</div>
              ) : (
                <div>
                  <div className="text-gray-900">{displayNomPrenom || 'Non renseigné'}</div>
                  {displayTelephone && (
                    <div className="text-sm text-gray-600">{displayTelephone}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2>Contenu du signalement</h2>
          
          <div className="mt-4">
            {signalement.type_depot === 'ecrit' && displayTexte && (
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                {displayTexte}
              </div>
            )}
            {signalement.type_depot === 'vocal' && displayAudioUrl && (
              <div>
                <audio src={displayAudioUrl} controls className="w-full" />
              </div>
            )}
            {signalement.type_depot === 'vocal' && !displayAudioUrl && signalement.audio_url && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-800">
                ⚠️ Erreur lors du déchiffrement de l'audio. Vérifiez la passphrase ou consultez les logs.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2>Gestion du statut</h2>
          
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 p-3 hover:bg-gray-200 hover:text-gray-800 rounded-lg cursor-pointer bg-gray-100 text-gray-900 transition-colors">
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

            <label className="flex items-center gap-3 p-3 hover:bg-slate-800 hover:text-slate-300 rounded-lg cursor-pointer bg-gray-100 text-gray-900 transition-colors">
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

            <label className="flex items-center gap-3 p-3 hover:bg-[var(--yellow)] hover:text-yellow-900 rounded-lg cursor-pointer bg-gray-100 text-gray-900 transition-colors">
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

            <label className="flex items-center gap-3 p-3 hover:bg-[var(--red)] hover:text-red-100 rounded-lg cursor-pointer bg-gray-100 text-gray-900 transition-colors">
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

            <label className="flex items-center gap-3 p-3 hover:bg-green-900 hover:text-green-200 rounded-lg cursor-pointer bg-gray-100 text-gray-900 transition-colors">
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
    </>
  )
}