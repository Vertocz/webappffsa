"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Field, Label, Textarea } from '@headlessui/react'
import { supabase } from '@/app/lib/supabase'
import { encryptText, encryptBlob } from '@/app/lib/encryption'
import VoiceRecorder from './VoiceRecorder'
import ContactForm from './ContactForm'
import ConfirmSubmitModal from './ConfirmSubmitModal'
import Toast from './Toast'

// Étapes du formulaire, utilisées pour la barre de progression
const TOTAL_STEPS = 3

// Extrait proprement les infos utiles d'une erreur Supabase (évite tout `any`)
function extractErrorInfo(error: unknown): { message?: string; details?: string; hint?: string } {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>
    return {
      message: typeof e.message === 'string' ? e.message : undefined,
      details: typeof e.details === 'string' ? e.details : undefined,
      hint: typeof e.hint === 'string' ? e.hint : undefined,
    }
  }
  return {}
}

export default function SignalForm() {
  const router = useRouter()

  const [typeDepot, setTypeDepot] = useState<'vocal' | 'ecrit'>('vocal')
  const [hasChosenFormat, setHasChosenFormat] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [contactDone, setContactDone] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showToastError, setShowToastError] = useState(false)

  const [formData, setFormData] = useState({
    nomPrenom: '',
    telephone: '',
    texteEcrit: ''
  })

  // Références utilisées pour faire défiler automatiquement vers l'étape suivante
  const depotDetailRef = useRef<HTMLDivElement>(null)
  const contactSectionRef = useRef<HTMLDivElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  // `delayMs` laisse le temps au clavier virtuel de se refermer sur mobile
  // avant de faire défiler la page, pour un rendu plus doux.
  const scrollToRef = (
    ref: React.RefObject<HTMLElement | null>,
    block: ScrollLogicalPosition = 'start',
    delayMs = 0
  ) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block })
      })
    }, delayMs)
  }

  const contentDone = typeDepot === 'vocal' ? !!audioBlob : formData.texteEcrit.trim().length > 0
  const currentStep = contentDone ? 3 : (hasChosenFormat ? 2 : 1)

  // Choix "vocal" / "écrit" : on avance d'une étape et on descend vers la section correspondante
  const chooseTypeDepot = (choice: 'vocal' | 'ecrit') => {
    setTypeDepot(choice)
    setHasChosenFormat(true)
    scrollToRef(depotDetailRef)
  }

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob)
    const url = URL.createObjectURL(blob)
    setAudioUrl(url)
    setRecordingTime(duration)
    // L'enregistrement est terminé : direction les coordonnées
    scrollToRef(contactSectionRef)
  }

  // Une fois les coordonnées (ou le choix d'anonymat) renseignées, direction le bouton d'envoi
  const handleContactStepComplete = () => {
    setContactDone(true)
    scrollToRef(submitButtonRef, 'center', 300)
  }

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
  }

  // Appelé par le bouton principal — ouvre la modale de confirmation
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirm(true)
  }

  // Appelé par la modale après confirmation
  const handleConfirmedSubmit = async () => {
    setShowConfirm(false)
    setIsSubmitting(true)

    try {
      const passphrase = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
      if (!passphrase) {
        throw new Error('Clé de chiffrement non configurée')
      }

      let audioUrlStored = null
      let encryptedData: Record<string, string> = {}

      // Chiffrement du message écrit
      if (typeDepot === 'ecrit' && formData.texteEcrit) {
        const encrypted = await encryptText(formData.texteEcrit, passphrase)
        encryptedData = {
          texte_chiffre: encrypted.ciphertext,
          texte_iv:      encrypted.iv,
          texte_salt:    encrypted.salt
        }
      }

      // Chiffrement et upload du fichier audio
      if (typeDepot === 'vocal' && audioBlob) {
        const { encryptedBlob, iv, salt } = await encryptBlob(audioBlob, passphrase)
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.enc`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('depots')
          .upload(fileName, encryptedBlob, {
            contentType: 'application/octet-stream',
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('depots')
          .getPublicUrl(uploadData.path)

        audioUrlStored = publicUrl
        encryptedData = { audio_iv: iv, audio_salt: salt }
      }

      // Chiffrement des coordonnées si non anonyme
      let encryptedContact: Record<string, string> = {}
      if (!isAnonymous && formData.nomPrenom) {
        const encryptedNom = await encryptText(formData.nomPrenom, passphrase)
        encryptedContact = {
          ...encryptedContact,
          nom_prenom_chiffre: encryptedNom.ciphertext,
          nom_prenom_iv:      encryptedNom.iv,
          nom_prenom_salt:    encryptedNom.salt
        }
      }
      if (!isAnonymous && formData.telephone) {
        const encryptedTel = await encryptText(formData.telephone, passphrase)
        encryptedContact = {
          ...encryptedContact,
          telephone_chiffre: encryptedTel.ciphertext,
          telephone_iv:      encryptedTel.iv,
          telephone_salt:    encryptedTel.salt
        }
      }

      const { error: dbError } = await supabase
        .from('signalements')
        .insert({
          audio_url:    audioUrlStored,
          type_depot:   typeDepot,
          anonyme:      isAnonymous,
          ...encryptedData,
          ...encryptedContact,
          texte_ecrit:  null,
          nom_prenom:   null,
          telephone:    null
        })

      if (dbError) throw dbError

      router.push('/retour')

    } catch (error) {
      const { message, details, hint } = extractErrorInfo(error)
      console.error('Erreur envoi:', JSON.stringify(error, null, 2))
      console.error('Erreur envoi (message):', message)
      console.error('Erreur envoi (details):', details)
      console.error('Erreur envoi (hint):', hint)
      setShowToastError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    !isSubmitting &&
    (typeDepot === 'vocal' ? !!audioBlob : !!formData.texteEcrit)

  return (
    <>
      {showToastError && (
        <Toast
          message="Une erreur est survenue lors de l'envoi. Veuillez réessayer."
          type="error"
          onClose={() => setShowToastError(false)}
        />
      )}

      {showConfirm && (
        <ConfirmSubmitModal
          typeDepot={typeDepot}
          isAnonymous={isAnonymous}
          nomPrenom={formData.nomPrenom}
          recordingTime={recordingTime}
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <form onSubmit={handleSubmitClick} className="max-w-3xl mx-auto space-y-8 pb-8">

        {/* Barre de progression — toujours visible en haut de l'écran */}
        <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="flex justify-between items-center text-sm font-semibold text-gray-500 mb-2">
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              title="Retour à l'accueil"
              className="text-lg leading-none text-gray-500 hover:text-[var(--blue)] transition-colors"
            >
              🏠
            </Link>
            <span>Étape {currentStep} / {TOTAL_STEPS}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--blue)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Choix vocal ou écrit */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-[var(--blue)]">
            Comment souhaitez-vous signaler ? {hasChosenFormat && <span aria-hidden="true">✅</span>}
          </h2>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => chooseTypeDepot('vocal')}
              className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                typeDepot === 'vocal'
                  ? 'bg-[var(--blue)] text-white scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[var(--blue)]'
              }`}
            >
              🎤 Message vocal
            </button>
            <button
              type="button"
              onClick={() => chooseTypeDepot('ecrit')}
              className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                typeDepot === 'ecrit'
                  ? 'bg-[var(--blue)] text-white scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[var(--blue)]'
              }`}
            >
              ✍️ Message écrit
            </button>
          </div>
        </div>

        {/* Enregistrement vocal */}
        {typeDepot === 'vocal' && (
          <div ref={depotDetailRef} className="bg-gray-50 p-6 rounded-lg space-y-6">
            <h2 className="text-xl font-bold text-[var(--blue)]">
              🗣️ Votre message vocal {contentDone && <span aria-hidden="true">✅</span>}
            </h2>
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              audioBlob={audioBlob}
              audioUrl={audioUrl}
              recordingTime={recordingTime}
              onReset={resetRecording}
            />
          </div>
        )}

        {/* Message écrit */}
        {typeDepot === 'ecrit' && (
          <div ref={depotDetailRef} className="bg-gray-50 p-6 rounded-lg">
            <Field>
              <Label className="block text-xl font-bold mb-3 text-[var(--blue)]">
                <h2>
                  📝 Votre message écrit {contentDone && <span aria-hidden="true">✅</span>}
                </h2>
              </Label>
              <Textarea
                value={formData.texteEcrit}
                onChange={(e) => setFormData({ ...formData, texteEcrit: e.target.value })}
                onBlur={() => {
                  // Petit délai pour laisser le clavier virtuel se refermer sur mobile
                  if (formData.texteEcrit.trim()) scrollToRef(contactSectionRef, 'start', 300)
                }}
                required
                rows={10}
                placeholder="Décrivez les faits ici..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--blue)] focus:outline-none text-lg"
              />
            </Field>
          </div>
        )}

        {/* Coordonnées */}
        <div ref={contactSectionRef}>
          <ContactForm
            isAnonymous={isAnonymous}
            onAnonymousChange={setIsAnonymous}
            nomPrenom={formData.nomPrenom}
            telephone={formData.telephone}
            onNomPrenomChange={(value) => setFormData({ ...formData, nomPrenom: value })}
            onTelephoneChange={(value) => setFormData({ ...formData, telephone: value })}
            onStepComplete={handleContactStepComplete}
            completed={contactDone}
          />
        </div>

        {/* Bouton envoyer */}
        <button
          ref={submitButtonRef}
          type="submit"
          disabled={!canSubmit}
          className="w-full py-4 px-6 bg-[var(--yellow)] text-white rounded-lg font-bold text-xl hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '🔒 Chiffrement et envoi en cours...' : '📨 Envoyer mon signalement'}
        </button>
      </form>
    </>
  )
}
