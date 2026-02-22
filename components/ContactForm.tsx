"use client"

import { useState } from 'react'
import { Field, Input, Label } from '@headlessui/react'

interface ContactFormProps {
  isAnonymous: boolean
  onAnonymousChange: (value: boolean) => void
  nomPrenom: string
  telephone: string
  onNomPrenomChange: (value: string) => void
  onTelephoneChange: (value: string) => void
}

export default function ContactForm({
  isAnonymous,
  onAnonymousChange,
  nomPrenom,
  telephone,
  onNomPrenomChange,
  onTelephoneChange
}: ContactFormProps) {
  const [showModal, setShowModal] = useState(false)

  const handleAnonymousClick = () => {
    setShowModal(true)
  }

  const handleConfirmAnonymous = () => {
    onAnonymousChange(true)
    onNomPrenomChange('')
    onTelephoneChange('')
    setShowModal(false)
  }

  const handleReturnToIdentified = () => {
    onAnonymousChange(false)
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-[var(--blue)]">Pour qu'on puisse vous aider</h2>
      
      {!isAnonymous ? (
        <div className="space-y-4">
          <Field>
            <Label className="block text-lg font-semibold mb-2">Prénom Nom</Label>
            <Input
              value={nomPrenom}
              onChange={(e) => onNomPrenomChange(e.target.value)}
              placeholder="Jeanne Dupont"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--blue)] focus:outline-none text-lg"
            />
          </Field>

          <Field>
            <Label className="block text-lg font-semibold mb-2">Téléphone</Label>
            <Input
              type="tel"
              value={telephone}
              onChange={(e) => onTelephoneChange(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--blue)] focus:outline-none text-lg"
            />
          </Field>

          <button
            type="button"
            onClick={handleAnonymousClick}
            className="w-full py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            🔒 Je préfère rester anonyme
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center space-y-3">
            <p className="text-lg text-gray-800 font-semibold">
              Vous avez choisi de rester anonyme
            </p>
            <p className="text-sm text-gray-600">
              Votre identité ne sera pas enregistrée
            </p>
          </div>

          <button
            type="button"
            onClick={handleReturnToIdentified}
            className="w-full py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-semibold hover:bg-[var(--red)] transition-colors flex items-center justify-center gap-2"
          >
            👤 Finalement, je souhaite fournir mes coordonnées
          </button>
        </div>
      )}

      {/* Modal de confirmation */}
      {showModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-xl font-bold text-[var(--blue)]">
                Signalement anonyme
              </h3>
              
              <div className="text-gray-700 space-y-3">
                <p>
                  Cette option vous permet de signaler mais <strong>limite notre capacité à agir et/ou à vous recontacter</strong>.
                </p>
                <p>
                  En fournissant vos coordonnées, nous pourrons vous recontacter pour vous apporter un soutien personnalisé, clarifier votre situation si besoin, ou vous informer des suites données à votre signalement.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmAnonymous}
                  className="flex-1 py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-semibold hover:bg-[var(--red)] transition-colors"
                >
                  J'ai compris
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}