'use server'

import { decryptText, decryptBlob } from '@/app/lib/encryption'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

const BUCKET = 'depots'

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY non configurée sur le serveur')
  return key
}

/**
 * Les Server Actions sont des endpoints HTTP publics : le middleware (proxy.ts)
 * ne suffit pas à les protéger. Chaque action sensible vérifie donc elle-même
 * qu'un utilisateur est connecté.
 */
async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')
  return { supabase, user }
}

/**
 * Extrait le chemin de l'objet dans le bucket à partir de l'URL stockée en base
 * (ex. https://xxx.supabase.co/storage/v1/object/public/depots/123-abc.enc).
 * Ne fait jamais de requête vers une URL arbitraire fournie par le client.
 */
function extractStoragePath(audioUrl: string): string {
  const match = audioUrl.match(new RegExp(`/${BUCKET}/([^?#]+)$`))
  const path = match ? decodeURIComponent(match[1]) : ''
  if (!path || path.includes('..') || path.startsWith('/')) {
    throw new Error('Chemin audio invalide')
  }
  return path
}

// ─── Déchiffrement de texte ────────────────────────────────────────────────

export async function actionDecryptText(
  ciphertext: string,
  iv: string,
  salt: string
): Promise<string> {
  await requireUser()
  return decryptText(ciphertext, iv, salt, getKey())
}

// ─── Déchiffrement audio ───────────────────────────────────────────────────
// Retourne le fichier audio déchiffré en base64.
// Le client le reconvertit en Blob pour l'élément <audio>.
// Le fichier est lu via la session de l'utilisateur connecté : le bucket
// peut donc être privé.

export async function actionDecryptAudio(
  audioUrl: string,
  iv: string,
  salt: string
): Promise<string> {
  const { supabase } = await requireUser()

  const { data: encryptedBlob, error } = await supabase.storage
    .from(BUCKET)
    .download(extractStoragePath(audioUrl))
  if (error || !encryptedBlob) {
    throw new Error('Erreur téléchargement audio')
  }

  const decryptedBlob = await decryptBlob(
    encryptedBlob, iv, salt, getKey(), 'audio/webm'
  )

  // Convertit le Blob en base64 pour pouvoir le traverser la frontière serveur→client
  const arrayBuffer = await decryptedBlob.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

// ─── Journal des accès ─────────────────────────────────────────────────────
// Ces actions récupèrent l'email de l'utilisateur depuis la session Supabase
// pour un audit trail réel.

export async function actionLogConsultation(signalementId: string): Promise<void> {
  const { supabase, user } = await requireUser()

  await supabase.from('journal_acces').insert({
    signalement_id: signalementId,
    utilisateur: user.email ?? 'inconnu',
    action: 'consultation',
  })
}

export async function actionLogStatutChange(
  signalementId: string,
  ancienStatut: string,
  nouveauStatut: string
): Promise<void> {
  const { supabase, user } = await requireUser()

  await supabase.from('journal_acces').insert({
    signalement_id: signalementId,
    utilisateur: user.email ?? 'inconnu',
    action: 'modification_statut',
    ancien_statut: ancienStatut,
    nouveau_statut: nouveauStatut,
  })
}
