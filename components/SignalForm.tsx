"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Field, Label, Textarea } from '@headlessui/react'
import { supabase } from '@/app/lib/supabase'
import { encryptText, encryptBlob } from '@/app/lib/encryption'
import VoiceRecorder from './VoiceRecorder'
import ContactForm from './ContactForm'
import CommissionSelector from './CommissionSelector'
import ConfirmSubmitModal from './ConfirmSubmitModal'
import Toast from './Toast'

export default function SignalForm() {
  const router = useRouter()

  const [typeDepot, setTypeDepot] = useState<'vocal' | 'ecrit'>('vocal')
  const [typeCommission, setTypeCommission] = useState<'violences' | 'ethique' | 'ne_sais_pas'>('ne_sais_pas')
  const [isAnonymous, setIsAnonymous] = useState(false)
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
          type_commission: typeCommission,
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
      console.error('Erreur envoi:', JSON.stringify(error, null, 2))
      console.error('Erreur envoi (message):', (error as any)?.message)
      console.error('Erreur envoi (details):', (error as any)?.details)
      console.error('Erreur envoi (hint):', (error as any)?.hint)
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
          typeCommission={typeCommission}
          recordingTime={recordingTime}
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <form onSubmit={handleSubmitClick} className="max-w-3xl mx-auto space-y-8 pb-8">

        {/* Choix vocal ou écrit */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-[var(--blue)]">Comment souhaitez-vous signaler ?</h2>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTypeDepot('vocal')}
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
              onClick={() => setTypeDepot('ecrit')}
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
          <div className="bg-gray-50 p-6 rounded-lg space-y-6">
            <h2 className="text-xl font-bold text-[var(--blue)]">🗣️ Votre message vocal</h2>
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
          <div className="bg-gray-50 p-6 rounded-lg">
            <Field>
              <Label className="block text-xl font-bold mb-3 text-[var(--blue)]">
                <h2>📝 Votre message écrit</h2>
              </Label>
              <Textarea
                value={formData.texteEcrit}
                onChange={(e) => setFormData({ ...formData, texteEcrit: e.target.value })}
                required
                rows={10}
                placeholder="Décrivez les faits ici..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--blue)] focus:outline-none text-lg"
              />
            </Field>
          </div>
        )}

        {/* Coordonnées */}
        <ContactForm
          isAnonymous={isAnonymous}
          onAnonymousChange={setIsAnonymous}
          nomPrenom={formData.nomPrenom}
          telephone={formData.telephone}
          onNomPrenomChange={(value) => setFormData({ ...formData, nomPrenom: value })}
          onTelephoneChange={(value) => setFormData({ ...formData, telephone: value })}
        />

        {/* Choix de la commission */}
        <CommissionSelector
          value={typeCommission}
          onChange={setTypeCommission}
        />

        {/* Bouton envoyer */}
        <button
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
