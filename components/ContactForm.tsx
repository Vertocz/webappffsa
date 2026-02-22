"use client"

import { Field, Input, Label } from '@headlessui/react'
import Tooltip from './ToolTip'

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
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-[var(--blue)]">Pour qu'on puisse vous aider</h2>
      
      <div className="space-y-3 mb-6">
        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-300 cursor-pointer hover:border-[var(--blue)] transition-colors">
          <input
            type="radio"
            name="anonymat"
            checked={!isAnonymous}
            onChange={() => onAnonymousChange(false)}
            className="w-5 h-5 text-[var(--blue)]"
          />
          <div className="flex-1 flex items-center gap-2">
            <div className="font-semibold text-lg">👤 Avec mes coordonnées</div>
            <Tooltip content="En fournissant vos coordonnées, nous pourrons vous recontacter pour vous apporter un soutien personnalisé, clarifier votre situation si besoin, ou vous informer des suites données à votre signalement.">
              <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-gray-400 text-white text-xs font-bold">
                i
              </div>
            </Tooltip>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-300 cursor-pointer hover:border-[var(--blue)] transition-colors">
          <input
            type="radio"
            name="anonymat"
            checked={isAnonymous}
            onChange={() => onAnonymousChange(true)}
            className="w-5 h-5 text-[var(--blue)]"
          />
          <div className="flex-1 flex items-center gap-2">
            <div>
              <div className="font-semibold text-lg">🔒 Signalement anonyme</div>
            </div>
            <Tooltip content="Votre identité restera strictement confidentielle. Aucune information personnelle ne sera enregistrée. Cette option vous permet de signaler mais limite notre capacité à agir et/ou à vous recontacter.">
              <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-gray-400 text-white text-xs font-bold">
                i
              </div>
            </Tooltip>
          </div>
        </label>
      </div>

      {!isAnonymous && (
        <div className="space-y-4 mt-6 pt-6 border-t-2 border-gray-200">
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
      )}
    </div>
  )
}