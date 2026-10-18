'use server'

import { createClient } from '@supabase/supabase-js'
import { encryptText, encryptBlob } from '@/app/lib/encryption'

// ─── Limites de validation (le formulaire est public) ──────────────────────
const MAX_TEXT_CHARS = 20_000
const MAX_NAME_CHARS = 200
const MAX_PHONE_CHARS = 40
// 5 min à 32 kbps ≈ 1,2 Mo ; on garde de la marge. Vercel plafonne à ~4,5 Mo.
const MAX_AUDIO_BYTES = 3 * 1024 * 1024

export type SubmitResult = { ok: true } | { ok: false; error: string }

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY non configurée sur le serveur')
  return key
}

/**
 * Reçoit un signalement en clair, le chiffre côté serveur (AES-256-GCM)
 * et l'enregistre dans Supabase.
 *
 * Utilise le client Supabase anonyme (sans session) : les droits sont ceux
 * du rôle `anon`, à encadrer par les politiques RLS (INSERT uniquement).
 */
export async function actionSubmitSignalement(formData: FormData): Promise<SubmitResult> {
  let uploadedPath: string | null = null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  try {
    // ── Lecture et validation des champs ──────────────────────────────────
    const typeDepot = formData.get('typeDepot')
    if (typeDepot !== 'vocal' && typeDepot !== 'ecrit') {
      return { ok: false, error: 'Type de dépôt invalide' }
    }

    const anonyme = formData.get('anonyme') === 'true'
    const passphrase = getKey()

    let encryptedData: Record<string, string> = {}
    let audioUrlStored: string | null = null

    // ── Message écrit ─────────────────────────────────────────────────────
    if (typeDepot === 'ecrit') {
      const texte = String(formData.get('texte') ?? '').trim()
      if (!texte || texte.length > MAX_TEXT_CHARS) {
        return { ok: false, error: 'Message invalide' }
      }
      const enc = await encryptText(texte, passphrase)
      encryptedData = {
        texte_chiffre: enc.ciphertext,
        texte_iv: enc.iv,
        texte_salt: enc.salt,
      }
    }

    // ── Message vocal ─────────────────────────────────────────────────────
    if (typeDepot === 'vocal') {
      const audio = formData.get('audio')
      if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
        return { ok: false, error: 'Fichier audio invalide ou trop volumineux' }
      }
      if (!audio.type.startsWith('audio/')) {
        return { ok: false, error: 'Format audio invalide' }
      }

      const { encryptedBlob, iv, salt } = await encryptBlob(audio, passphrase)
      const fileName = `${Date.now()}-${crypto.randomUUID()}.enc`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('depots')
        .upload(fileName, encryptedBlob, {
          contentType: 'application/octet-stream',
          cacheControl: '3600',
          upsert: false,
        })
      if (uploadError) throw uploadError

      uploadedPath = uploadData.path
      const { data: { publicUrl } } = supabase.storage
        .from('depots')
        .getPublicUrl(uploadData.path)

      audioUrlStored = publicUrl
      encryptedData = { audio_iv: iv, audio_salt: salt }
    }

    // ── Coordonnées (uniquement si non anonyme) ───────────────────────────
    let encryptedContact: Record<string, string> = {}
    if (!anonyme) {
      const nom = String(formData.get('nomPrenom') ?? '').trim().slice(0, MAX_NAME_CHARS)
      const tel = String(formData.get('telephone') ?? '').trim().slice(0, MAX_PHONE_CHARS)

      if (nom) {
        const enc = await encryptText(nom, passphrase)
        encryptedContact = {
          ...encryptedContact,
          nom_prenom_chiffre: enc.ciphertext,
          nom_prenom_iv: enc.iv,
          nom_prenom_salt: enc.salt,
        }
      }
      if (tel) {
        const enc = await encryptText(tel, passphrase)
        encryptedContact = {
          ...encryptedContact,
          telephone_chiffre: enc.ciphertext,
          telephone_iv: enc.iv,
          telephone_salt: enc.salt,
        }
      }
    }

    // ── Enregistrement ────────────────────────────────────────────────────
    const { error: dbError } = await supabase.from('signalements').insert({
      audio_url: audioUrlStored,
      type_depot: typeDepot,
      anonyme,
      ...encryptedData,
      ...encryptedContact,
      texte_ecrit: null,
      nom_prenom: null,
      telephone: null,
    })
    if (dbError) throw dbError

    return { ok: true }
  } catch (error) {
    // On ne journalise jamais le contenu du signalement, seulement l'erreur technique.
    console.error('Erreur enregistrement signalement:', error)

    // Nettoyage best-effort du fichier audio orphelin (peut échouer selon la RLS storage).
    if (uploadedPath) {
      await supabase.storage.from('depots').remove([uploadedPath]).catch(() => {})
    }
    return { ok: false, error: "Erreur lors de l'enregistrement" }
  }
}
