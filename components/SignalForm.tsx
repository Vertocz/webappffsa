"use client"

import { useState, useEffect } from 'react'
import { Field, Label, Textarea } from '@headlessui/react'
import { supabase } from '@/app/lib/supabase'
import VoiceRecorder from './VoiceRecorder'
import ContactForm from './ContactForm'
import CommissionSelector from './CommissionSelector'

export default function SignalForm() {
  const [typeDepot, setTypeDepot] = useState<'vocal' | 'ecrit'>('vocal')
  const [typeCommission, setTypeCommission] = useState<'violences' | 'ethique' | 'ne_sais_pas'>('ne_sais_pas')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let audioUrlStored = null

      if (typeDepot === 'vocal' && audioBlob) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webm`
        const { error: uploadError } = await supabase.storage
          .from('depots')
          .upload(fileName, audioBlob, {
            contentType: 'audio/webm'
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('depots')
          .getPublicUrl(fileName)

        audioUrlStored = publicUrl
      }

      const { error: dbError } = await supabase
        .from('signalements')
        .insert({
          audio_url: audioUrlStored,
          type_depot: typeDepot,
          type_commission: typeCommission,
          texte_ecrit: typeDepot === 'ecrit' ? formData.texteEcrit : null,
          anonyme: isAnonymous,
          nom_prenom: !isAnonymous ? formData.nomPrenom : null,
          telephone: !isAnonymous ? formData.telephone : null
        })

      if (dbError) throw dbError

      setShowSuccess(true)
      
      setTimeout(() => {
        window.location.href = '/liens-utiles'
      }, 3000)

    } catch (error) {
      console.error('Erreur envoi:', error)
      alert('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 pb-8">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-bounce">
          ✓ Votre signalement a bien été envoyé
        </div>
      )}

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
            🗣️ Message vocal
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
          <h2 className="text-xl font-bold text-[var(--blue)]">🎤 Votre message vocal</h2>
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
              placeholder={"Décrivez les faits ici...\n" + 
                "N'hésitez pas à donner un maximum de détails pour que nous puissions vous aider au mieux.\n" + 
                "Vous pouvez donner des informations sur les personnes impliquées, les dates, les lieux, etc."}
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
        disabled={isSubmitting || (typeDepot === 'vocal' && !audioBlob) || (typeDepot === 'ecrit' && !formData.texteEcrit)}
        className="w-full py-4 px-6 bg-[var(--yellow)] text-white rounded-lg font-bold text-xl hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Envoi en cours...' : '📤 Envoyer mon signalement'}
      </button>
    </form>
  )
}