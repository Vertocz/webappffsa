'use server'

import { decryptText, decryptBlob } from '@/app/lib/encryption'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY non configurée sur le serveur')
  return key
}

// ─── Déchiffrement de texte ────────────────────────────────────────────────

export async function actionDecryptText(
  ciphertext: string,
  iv: string,
  salt: string
): Promise<string> {
  return decryptText(ciphertext, iv, salt, getKey())
}

// ─── Déchiffrement audio ───────────────────────────────────────────────────
// Retourne le fichier audio déchiffré en base64.
// Le client le reconvertit en Blob pour l'élément <audio>.

export async function actionDecryptAudio(
  audioUrl: string,
  iv: string,
  salt: string
): Promise<string> {
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error(`Erreur téléchargement audio : ${response.status}`)
  }

  const encryptedBlob = await response.blob()
  const decryptedBlob = await decryptBlob(
    encryptedBlob, iv, salt, getKey(), 'audio/webm'
  )

  // Convertit le Blob en base64 pour pouvoir le traverser la frontière serveur→client
  const arrayBuffer = await decryptedBlob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// ─── Journal des accès ─────────────────────────────────────────────────────
// Ces actions récupèrent l'email de l'utilisateur depuis la session Supabase
// pour un audit trail réel.

export async function actionLogConsultation(signalementId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('journal_acces').insert({
    signalement_id: signalementId,
    utilisateur: user?.email ?? 'inconnu',
    action: 'consultation',
  })
}

export async function actionLogStatutChange(
  signalementId: string,
  ancienStatut: string,
  nouveauStatut: string
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('journal_acces').insert({
    signalement_id: signalementId,
    utilisateur: user?.email ?? 'inconnu',
    action: 'modification_statut',
    ancien_statut: ancienStatut,
    nouveau_statut: nouveauStatut,
  })
}
