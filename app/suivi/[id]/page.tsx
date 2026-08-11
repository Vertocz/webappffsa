'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { STATUT_LABELS, getStatutLabel } from '@/app/lib/statuts'
import {
  actionDecryptText,
  actionDecryptAudio,
  actionLogConsultation,
  actionLogStatutChange,
} from '@/app/actions/decrypt'
import Toast from '@/components/Toast'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Signalement {
  id: string
  created_at: string
  type_depot: 'vocal' | 'ecrit'
  anonyme: boolean
  nom_prenom: string | null
  telephone: string | null
  texte_ecrit: string | null
  audio_url: string | null
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

interface Commentaire {
  id: string
  signalement_id: string
  auteur: string
  contenu: string
  created_at: string
}

interface DecryptedData {
  nomPrenom?: string
  telephone?: string
  texte?: string
  audioUrl?: string
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

function base64ToObjectUrl(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'audio/webm' })
  return URL.createObjectURL(blob)
}

export default function DetailSignalement() {
  const params = useParams()
  const id = params.id as string

  const [signalement, setSignalement] = useState<Signalement | null>(null)
  const [decryptedData, setDecryptedData] = useState<DecryptedData>({})
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [commentaires, setCommentaires] = useState<Commentaire[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [selectedStatut, setSelectedStatut] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [journalOpen, setJournalOpen] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentAuteur, setCommentAuteur] = useState('')
  const [commentContenu, setCommentContenu] = useState('')
  const [statutSuggestComment, setStatutSuggestComment] = useState(false)

  const audioObjectUrl = useRef<string | null>(null)
  const hasLoggedRef = useRef(false)

  useEffect(() => {
    fetchSignalement()
    fetchJournal()
    fetchCommentaires()
    if (!hasLoggedRef.current) {
      hasLoggedRef.current = true
      actionLogConsultation(id).catch(console.error)
    }
  }, [id])

  useEffect(() => {
    if (signalement) decryptAll(signalement)
  }, [signalement])

  useEffect(() => {
    return () => {
      if (audioObjectUrl.current) URL.revokeObjectURL(audioObjectUrl.current)
    }
  }, [])

  const fetchSignalement = async () => {
    try {
      const { data, error } = await supabase
        .from('signalements')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      setSignalement(data)
      setSelectedStatut(data.statut || 'non_traite')
    } catch (err) {
      console.error('Erreur chargement signalement:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJournal = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_acces')
        .select('*')
        .eq('signalement_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setJournal(data || [])
    } catch (err) {
      console.error('Erreur chargement journal:', err)
    }
  }

  const fetchCommentaires = async () => {
    try {
      const { data, error } = await supabase
        .from('commentaires_signalement')
        .select('*')
        .eq('signalement_id', id)
        .order('created_at', { ascending: true })
      if (error) throw error
      setCommentaires(data || [])
    } catch (err) {
      console.error('Erreur chargement commentaires:', err)
    }
  }

  const decryptAll = async (s: Signalement) => {
    setIsDecrypting(true)
    const decrypted: DecryptedData = {}

    try {
      if (s.nom_prenom_chiffre && s.nom_prenom_iv && s.nom_prenom_salt) {
        try {
          decrypted.nomPrenom = await actionDecryptText(
            s.nom_prenom_chiffre, s.nom_prenom_iv, s.nom_prenom_salt
          )
        } catch { decrypted.nomPrenom = '[Erreur déchiffrement]' }
      }

      if (s.telephone_chiffre && s.telephone_iv && s.telephone_salt) {
        try {
          decrypted.telephone = await actionDecryptText(
            s.telephone_chiffre, s.telephone_iv, s.telephone_salt
          )
        } catch { decrypted.telephone = '[Erreur déchiffrement]' }
      }

      if (s.texte_chiffre && s.texte_iv && s.texte_salt) {
        try {
          decrypted.texte = await actionDecryptText(
            s.texte_chiffre, s.texte_iv, s.texte_salt
          )
        } catch { decrypted.texte = '[Erreur déchiffrement]' }
      }

      if (s.audio_url && s.audio_iv && s.audio_salt) {
        try {
          const base64 = await actionDecryptAudio(s.audio_url, s.audio_iv, s.audio_salt)
          if (audioObjectUrl.current) URL.revokeObjectURL(audioObjectUrl.current)
          audioObjectUrl.current = base64ToObjectUrl(base64)
          decrypted.audioUrl = audioObjectUrl.current
        } catch (err) {
          console.error('Erreur déchiffrement audio:', err)
        }
      }

      setDecryptedData(decrypted)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleStatutChange = async () => {
    if (!signalement || selectedStatut === signalement.statut) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('signalements')
        .update({ statut: selectedStatut })
        .eq('id', signalement.id)
      if (error) throw error

      await actionLogStatutChange(signalement.id, signalement.statut, selectedStatut)

      await fetchSignalement()
      await fetchJournal()

      if (selectedStatut === 'traite') {
        setStatutSuggestComment(true)
        setShowCommentForm(true)
      }

      setToast({ message: 'Statut mis à jour avec succès', type: 'success' })
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
      setToast({ message: 'Erreur lors de la mise à jour du statut', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCommentaire = async () => {
    if (!commentAuteur.trim() || !commentContenu.trim()) return
    setIsSavingComment(true)
    try {
      const { error } = await supabase
        .from('commentaires_signalement')
        .insert({
          signalement_id: id,
          auteur: commentAuteur.trim(),
          contenu: commentContenu.trim(),
        })
      if (error) throw error
      setCommentContenu('')
      setCommentAuteur('')
      setShowCommentForm(false)
      setStatutSuggestComment(false)
      await fetchCommentaires()
      setToast({ message: 'Commentaire ajouté', type: 'success' })
    } catch (err) {
      console.error('Erreur ajout commentaire:', err)
      setToast({ message: "Erreur lors de l'ajout du commentaire", type: 'error' })
    } finally {
      setIsSavingComment(false)
    }
  }

  const formatDateTime = (dateString: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString))


  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[var(--blue)]"></div>
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

  const displayNomPrenom = decryptedData.nomPrenom || signalement.nom_prenom
  const displayTelephone = decryptedData.telephone || signalement.telephone
  const displayTexte     = decryptedData.texte     || signalement.texte_ecrit
  const displayAudioUrl  = decryptedData.audioUrl  || undefined

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link href="/suivi" className="text-[var(--blue)] hover:underline font-semibold">
          ← Retour à la liste
        </Link>

        {isDecrypting && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-3"></div>
            <span className="text-blue-900 font-semibold">Déchiffrement en cours...</span>
          </div>
        )}

        {/* Informations générales */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1>Détail du signalement</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Date de dépôt</div>
              <div className="text-gray-900">{formatDateTime(signalement.created_at)}</div>
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

        {/* Contenu du signalement */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2>Contenu du signalement</h2>
          <div className="mt-4">
            {signalement.type_depot === 'ecrit' && displayTexte && (
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                {displayTexte}
              </div>
            )}
            {signalement.type_depot === 'ecrit' && !displayTexte && !isDecrypting && (
              <p className="text-gray-400 italic">Contenu en cours de déchiffrement...</p>
            )}
            {signalement.type_depot === 'vocal' && displayAudioUrl && (
              <audio src={displayAudioUrl} controls className="w-full" />
            )}
            {signalement.type_depot === 'vocal' && !displayAudioUrl && signalement.audio_url && !isDecrypting && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-800">
                ⚠️ Erreur lors du déchiffrement de l'audio.
              </div>
            )}
          </div>
        </div>

        {/* Gestion du statut */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2>Gestion du statut</h2>
          <div className="mt-4 space-y-3">
            {[
              { value: 'non_traite',          label: STATUT_LABELS.non_traite,          hover: 'hover:bg-gray-200 hover:text-gray-800' },
              { value: 'non_avenu',           label: STATUT_LABELS.non_avenu,           hover: 'hover:bg-slate-800 hover:text-slate-300' },
              { value: 'transmis_ethique',    label: STATUT_LABELS.transmis_ethique,    hover: 'hover:bg-[var(--yellow)] hover:text-yellow-900' },
              { value: 'transmis_discipline', label: STATUT_LABELS.transmis_discipline, hover: 'hover:bg-[var(--red)] hover:text-red-100' },
              { value: 'traite',              label: STATUT_LABELS.traite,              hover: 'hover:bg-green-900 hover:text-green-200' },
            ].map(({ value, label, hover }) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-gray-100 text-gray-900 transition-colors ${hover}`}
              >
                <input
                  type="radio"
                  name="statut"
                  value={value}
                  checked={selectedStatut === value}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="font-medium">{label}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleStatutChange}
            disabled={isSaving || selectedStatut === signalement.statut}
            className="mt-6 w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-semibold hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer le changement de statut'}
          </button>
        </div>

        {/* Commentaires */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2>Commentaires</h2>
            {!showCommentForm && (
              <button
                onClick={() => setShowCommentForm(true)}
                className="text-sm px-4 py-2 bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--red)] transition-colors font-medium"
              >
                + Ajouter un commentaire
              </button>
            )}
          </div>

          {/* Invitation après passage à "traité" */}
          {statutSuggestComment && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              ✅ Statut passé à <strong>Traité</strong>. Souhaitez-vous laisser une note sur ce traitement ? (contact, contexte, suites données…)
            </div>
          )}

          {/* Fil des commentaires */}
          {commentaires.length === 0 && !showCommentForm && (
            <p className="text-gray-400 italic text-sm">Aucun commentaire pour l'instant.</p>
          )}

          {commentaires.length > 0 && (
            <div className="space-y-3 mb-4">
              {commentaires.map((c) => (
                <div key={c.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-[var(--blue)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 text-sm">{c.auteur}</span>
                    <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{c.contenu}</p>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire d'ajout */}
          {showCommentForm && (
            <div className="border-2 border-gray-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Votre nom affiché
                </label>
                <input
                  type="text"
                  value={commentAuteur}
                  onChange={(e) => setCommentAuteur(e.target.value)}
                  placeholder="Ex : Marie D."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--blue)]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Commentaire
                </label>
                <textarea
                  value={commentContenu}
                  onChange={(e) => setCommentContenu(e.target.value)}
                  placeholder="Contact établi, contexte, suite donnée..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--blue)] resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCommentForm(false)
                    setStatutSuggestComment(false)
                    setCommentAuteur('')
                    setCommentContenu('')
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCommentaire}
                  disabled={isSavingComment || !commentAuteur.trim() || !commentContenu.trim()}
                  className="px-4 py-2 bg-[var(--blue)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSavingComment ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historique des accès — accordéon */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <button
            onClick={() => setJournalOpen(!journalOpen)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="m-0">Historique des accès et modifications</h2>
            <span className="text-gray-400 text-lg ml-4">{journalOpen ? '▲' : '▼'}</span>
          </button>

          {journalOpen && (
            <div className="px-6 pb-6">
              {journal.length === 0 ? (
                <p className="text-gray-500">Aucun historique disponible</p>
              ) : (
                <div className="space-y-2">
                  {journal.map((entry) => (
                    <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{entry.utilisateur}</span>
                          {' — '}
                          <span className="text-gray-600">
                            {entry.action === 'consultation' && 'a consulté le signalement'}
                            {entry.action === 'modification_statut' &&
                              `a modifié le statut de "${getStatutLabel(entry.ancien_statut ?? '')}" vers "${getStatutLabel(entry.nouveau_statut ?? '')}"`
                            }
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs shrink-0 ml-4">
                          {formatDateTime(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  )
}