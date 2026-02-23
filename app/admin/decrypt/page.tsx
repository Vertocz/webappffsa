"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { decryptText, decryptBlob } from '@/app/lib/encryption'
import Link from 'next/link'

interface Signalement {
  id: string
  created_at: string
  type_commission: string
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

export default function AdminSignalementsDecrypt() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decryptedData, setDecryptedData] = useState<any>(null)
  const [passphrase, setPassphrase] = useState('')
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

    if (error) {
      console.error('Erreur:', error)
    } else {
      setSignalements(data || [])
    }
  }

  const handleDecrypt = async (signalement: Signalement) => {
    setIsDecrypting(true)
    setError('')
    setDecryptedData(null)

    try {
      // Utiliser la passphrase de l'env ou celle entrée par l'admin
      const key = passphrase || process.env.NEXT_PUBLIC_ENCRYPTION_KEY
      if (!key) {
        throw new Error('Passphrase requise')
      }

      const decrypted: any = {
        id: signalement.id,
        type_depot: signalement.type_depot,
        anonyme: signalement.anonyme
      }

      // Déchiffrer le texte si présent
      if (signalement.texte_chiffre && signalement.texte_iv && signalement.texte_salt) {
        decrypted.texte = await decryptText(
          signalement.texte_chiffre,
          signalement.texte_iv,
          signalement.texte_salt,
          key
        )
      }

      // Déchiffrer l'audio si présent
      if (signalement.audio_url && signalement.audio_iv && signalement.audio_salt) {
        // Télécharger le fichier chiffré
        const response = await fetch(signalement.audio_url)
        const encryptedBlob = await response.blob()

        // Déchiffrer
        const decryptedBlob = await decryptBlob(
          encryptedBlob,
          signalement.audio_iv,
          signalement.audio_salt,
          key,
          'audio/webm'
        )

        // Créer une URL pour lecture
        decrypted.audioUrl = URL.createObjectURL(decryptedBlob)
      }

      // Déchiffrer les coordonnées si présentes
      if (signalement.nom_prenom_chiffre && signalement.nom_prenom_iv && signalement.nom_prenom_salt) {
        decrypted.nomPrenom = await decryptText(
          signalement.nom_prenom_chiffre,
          signalement.nom_prenom_iv,
          signalement.nom_prenom_salt,
          key
        )
      }

      if (signalement.telephone_chiffre && signalement.telephone_iv && signalement.telephone_salt) {
        decrypted.telephone = await decryptText(
          signalement.telephone_chiffre,
          signalement.telephone_iv,
          signalement.telephone_salt,
          key
        )
      }

      setDecryptedData(decrypted)
      setSelectedId(signalement.id)
    } catch (err) {
      console.error('Erreur déchiffrement:', err)
      setError('Erreur lors du déchiffrement. Vérifiez la passphrase.')
    } finally {
      setIsDecrypting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1>Administration - Signalements chiffrés</h1>
        
        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-900 mb-2">🔐 Passphrase de déchiffrement</h3>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Entrez la passphrase (ou laissez vide pour utiliser celle par défaut)"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <p className="text-sm text-gray-600 mt-2">
            Par défaut, la passphrase est lue depuis NEXT_PUBLIC_ENCRYPTION_KEY
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des signalements */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2>Signalements</h2>
          
          <div className="mt-4 space-y-3">
            {signalements.length === 0 ? (
              <p className="text-gray-500">Aucun signalement</p>
            ) : (
              signalements.map((signalement) => (
                <div
                  key={signalement.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedId === signalement.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => handleDecrypt(signalement)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">
                        {formatDate(signalement.created_at)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {signalement.type_depot === 'vocal' ? '🎤 Audio' : '📝 Texte'}
                        {' • '}
                        {signalement.anonyme ? 'Anonyme' : 'Identifié'}
                      </div>
                    </div>
                    <div>
                      {signalement.texte_chiffre || signalement.audio_url ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          🔒 Chiffré
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Non chiffré
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panneau de déchiffrement */}
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
              {/* Texte déchiffré */}
              {decryptedData.texte && (
                <div>
                  <h3 className="font-semibold mb-2">Message</h3>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {decryptedData.texte}
                  </div>
                </div>
              )}

              {/* Audio déchiffré */}
              {decryptedData.audioUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Audio</h3>
                  <audio src={decryptedData.audioUrl} controls className="w-full" />
                </div>
              )}

              {/* Coordonnées déchiffrées */}
              {!decryptedData.anonyme && (decryptedData.nomPrenom || decryptedData.telephone) && (
                <div>
                  <h3 className="font-semibold mb-2">Coordonnées</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {decryptedData.nomPrenom && (
                      <p><strong>Nom :</strong> {decryptedData.nomPrenom}</p>
                    )}
                    {decryptedData.telephone && (
                      <p><strong>Téléphone :</strong> {decryptedData.telephone}</p>
                    )}
                  </div>
                </div>
              )}

              <Link
                href={`/suivi/${decryptedData.id}`}
                className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Voir les détails complets
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}