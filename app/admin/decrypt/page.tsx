'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { actionDecryptText, actionDecryptAudio } from '@/app/actions/decrypt'
import Link from 'next/link'

interface Signalement {
  id: string
  created_at: string
  type_depot: 'vocal' | 'ecrit'
  anonyme: boolean
  texte_chiffre: string | null
  texte_iv: string | null
  texte_salt: string | null
  audio_url: string | null
  audio_iv: string | null
  audio_salt: string | null
  nom_prenom_chiffre: string | null
  nom_prenom_iv: string | null
  nom_prenom_salt: string | null
  telephone_chiffre: string | null
  telephone_iv: string | null
  telephone_salt: string | null
  statut: string
}

interface DecryptedResult {
  id: string
  type_depot: 'vocal' | 'ecrit'
  anonyme: boolean
  texte?: string
  audioUrl?: string
  nomPrenom?: string
  telephone?: string
}

function base64ToObjectUrl(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/webm' }))
}

export default function AdminSignalementsDecrypt() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decryptedData, setDecryptedData] = useState<DecryptedResult | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSignalements()
  }, [])

  const fetchSignalements = async () => {
    const { data, error } = await supabase
      .from('signalements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Erreur:', error)
    else setSignalements(data || [])
  }

  const handleDecrypt = async (s: Signalement) => {
    setIsDecrypting(true)
    setError('')
    setDecryptedData(null)

    try {
      const decrypted: DecryptedResult = {
        id: s.id,
        type_depot: s.type_depot,
        anonyme: s.anonyme,
      }

      if (s.texte_chiffre && s.texte_iv && s.texte_salt) {
        decrypted.texte = await actionDecryptText(s.texte_chiffre, s.texte_iv, s.texte_salt)
      }

      if (s.audio_url && s.audio_iv && s.audio_salt) {
        const base64 = await actionDecryptAudio(s.audio_url, s.audio_iv, s.audio_salt)
        decrypted.audioUrl = base64ToObjectUrl(base64)
      }

      if (s.nom_prenom_chiffre && s.nom_prenom_iv && s.nom_prenom_salt) {
        decrypted.nomPrenom = await actionDecryptText(
          s.nom_prenom_chiffre, s.nom_prenom_iv, s.nom_prenom_salt
        )
      }

      if (s.telephone_chiffre && s.telephone_iv && s.telephone_salt) {
        decrypted.telephone = await actionDecryptText(
          s.telephone_chiffre, s.telephone_iv, s.telephone_salt
        )
      }

      setDecryptedData(decrypted)
      setSelectedId(s.id)
    } catch (err) {
      console.error('Erreur déchiffrement:', err)
      setError('Erreur lors du déchiffrement.')
    } finally {
      setIsDecrypting(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString))

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1>Administration — Signalements</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Liste */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2>Signalements</h2>
          <div className="mt-4 space-y-3">
            {signalements.length === 0 ? (
              <p className="text-gray-500">Aucun signalement</p>
            ) : (
              signalements.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleDecrypt(s)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedId === s.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{formatDate(s.created_at)}</div>
                      <div className="text-sm text-gray-600">
                        {s.type_depot === 'vocal' ? '🎤 Audio' : '📝 Texte'}
                        {' • '}
                        {s.anonyme ? 'Anonyme' : 'Identifié'}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      🔒 Chiffré
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panneau déchiffré */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2>Contenu déchiffré</h2>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {isDecrypting && (
            <div className="mt-4 text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Déchiffrement en cours...</p>
            </div>
          )}

          {!isDecrypting && !decryptedData && !error && (
            <div className="mt-4 text-center py-12 text-gray-500">
              Sélectionnez un signalement pour le déchiffrer
            </div>
          )}

          {decryptedData && !isDecrypting && (
            <div className="mt-4 space-y-4">
              {decryptedData.texte && (
                <div>
                  <h3 className="font-semibold mb-2">Message</h3>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {decryptedData.texte}
                  </div>
                </div>
              )}
              {decryptedData.audioUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Audio</h3>
                  <audio src={decryptedData.audioUrl} controls className="w-full" />
                </div>
              )}
              {!decryptedData.anonyme && (decryptedData.nomPrenom || decryptedData.telephone) && (
                <div>
                  <h3 className="font-semibold mb-2">Coordonnées</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {decryptedData.nomPrenom && <p><strong>Nom :</strong> {decryptedData.nomPrenom}</p>}
                    {decryptedData.telephone && <p><strong>Téléphone :</strong> {decryptedData.telephone}</p>}
                  </div>
                </div>
              )}
              <Link
                href={`/suivi/${decryptedData.id}`}
                className="block w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-semibold hover:bg-[var(--red)] transition-colors text-center"
              >
                Voir les détails complets →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
