"use client"

import { useState } from 'react'
import { Field, Input, Label, Switch } from '@headlessui/react'

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

  const handleToggle = (value: boolean) => {
    if (value) {
      // Passer en anonyme → afficher la modale de confirmation
      setShowModal(true)
    } else {
      // Revenir à identifié → directement
      onAnonymousChange(false)
    }
  }

  const handleConfirmAnonymous = () => {
    onAnonymousChange(true)
    onNomPrenomChange('')
    onTelephoneChange('')
    setShowModal(false)
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-[var(--blue)]">Pour qu'on puisse vous aider</h2>

      {/* Switch anonyme */}
      <div className="flex items-center gap-3 mb-6">
        <Switch
          checked={isAnonymous}
          onChange={handleToggle}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-offset-2 ${
            isAnonymous ? 'bg-yellow-400' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
              isAnonymous ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </Switch>
        <span className="text-base font-semibold text-gray-700 select-none">
          🔒 Je préfère rester anonyme
        </span>
      </div>

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
        </div>
      ) : (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center space-y-2">
          <p className="text-lg text-gray-800 font-semibold">
            Vous avez choisi de rester anonyme
          </p>
          <p className="text-sm text-gray-600">
            Votre identité ne sera pas enregistrée
          </p>
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
                  Donner mes coordonnées
                </button>
                <button
                  onClick={handleConfirmAnonymous}
                  className="flex-1 py-3 px-6 bg-[var(--blue)] text-white rounded-lg font-semibold hover:bg-[var(--red)] transition-colors"
                >
                  Rester anonyme
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}