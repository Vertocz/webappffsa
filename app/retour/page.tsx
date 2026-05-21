'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

// ─── Types ─────────────────────────────────────────────────────────────────

interface SportifData {
  s_compris: boolean | null
  s_scenario_aide: boolean | null
  s_bouton_facile: boolean | null
  s_anonymat: boolean | null
  s_confiance_protection: boolean | null
  s_confiance_reel: boolean | null
  s_telephone_facile: boolean | null
  s_recommande: boolean | null
  s_plus_simple: string
  s_difficile: string
  s_changement: string
}

interface EducateurData {
  e_parcours_logique: boolean | null
  e_scenario_adapte: boolean | null
  e_objectif_compris: boolean | null
  e_anonymat_clair: boolean | null
  e_adapte_handicap: boolean | null
  e_recommande: boolean | null
  e_utilisation_autonome: boolean | null
  e_difficultes_observees: string
  e_concepts_problemes: string
  e_ameliorations: string
  e_observations_libres: string
}

// ─── Composant OuiNon ──────────────────────────────────────────────────────

function OuiNon({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-5 py-2 rounded-lg font-bold text-sm transition-all border-2 ${
          value === true
            ? 'bg-green-600 text-white border-green-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
        }`}
      >
        Oui
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-5 py-2 rounded-lg font-bold text-sm transition-all border-2 ${
          value === false
            ? 'bg-[var(--red)] text-white border-[var(--red)]'
            : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
        }`}
      >
        Non
      </button>
    </div>
  )
}

// ─── Composant ligne question ──────────────────────────────────────────────

function QuestionRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-800 flex-1 leading-snug">{label}</span>
      <OuiNon value={value} onChange={onChange} />
    </div>
  )
}

// ─── Composant question ouverte ────────────────────────────────────────────

function QuestionOuverte({
  label,
  value,
  onChange,
  placeholder = 'Votre réponse...',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--blue)] focus:outline-none text-sm resize-none transition-colors"
      />
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────

export default function RetourExperiencePage() {
  const router = useRouter()
  const [etape, setEtape] = useState<'sportif' | 'educateur' | 'merci'>('sportif')
  const [isSaving, setIsSaving] = useState(false)

  const [sportif, setSportif] = useState<SportifData>({
    s_compris: null,
    s_scenario_aide: null,
    s_bouton_facile: null,
    s_anonymat: null,
    s_confiance_protection: null,
    s_confiance_reel: null,
    s_telephone_facile: null,
    s_recommande: null,
    s_plus_simple: '',
    s_difficile: '',
    s_changement: '',
  })

  const [educateur, setEducateur] = useState<EducateurData>({
    e_parcours_logique: null,
    e_scenario_adapte: null,
    e_objectif_compris: null,
    e_anonymat_clair: null,
    e_adapte_handicap: null,
    e_recommande: null,
    e_utilisation_autonome: null,
    e_difficultes_observees: '',
    e_concepts_problemes: '',
    e_ameliorations: '',
    e_observations_libres: '',
  })

  const setSportifField = <K extends keyof SportifData>(key: K, value: SportifData[K]) =>
    setSportif((prev) => ({ ...prev, [key]: value }))

  const setEducateurField = <K extends keyof EducateurData>(key: K, value: EducateurData[K]) =>
    setEducateur((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from('retours_experience').insert({
        ...sportif,
        ...educateur,
      })
      if (error) throw error
      setEtape('merci')
    } catch (err) {
      console.error('Erreur envoi retour:', err)
      alert('Une erreur est survenue. Réessayez.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Indicateur d'étape ───────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      {['sportif', 'educateur'].map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            etape === s
              ? 'bg-[var(--blue)] text-white scale-110'
              : etape === 'merci' || (s === 'sportif' && etape === 'educateur')
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-400'
          }`}>
            {etape === 'merci' || (s === 'sportif' && etape === 'educateur') ? '✓' : i + 1}
          </div>
          <span className={`text-sm font-medium ${etape === s ? 'text-[var(--blue)]' : 'text-gray-400'}`}>
            {s === 'sportif' ? 'Sportif·ve' : 'Éducateur·rice'}
          </span>
          {i === 0 && <div className="w-12 h-0.5 bg-gray-200" />}
        </div>
      ))}
    </div>
  )

  // ── Page de remerciement ─────────────────────────────────────────
  if (etape === 'merci') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="!text-3xl">Merci pour votre retour !</h1>
        <p className="text-gray-600 text-lg">
          Vos impressions ont bien été enregistrées. Elles nous aideront à améliorer l'application.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-8 py-3 bg-[var(--blue)] text-white rounded-xl font-bold hover:bg-[var(--red)] transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  // ── Étape Sportif ────────────────────────────────────────────────
  if (etape === 'sportif') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <StepIndicator />

        <div className="text-center space-y-2">
          <div className="inline-block bg-[var(--blue)] text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full mb-2">
            Étape 1 sur 2
          </div>
          <h1 className="!text-2xl !pb-2">Retour du sportif · de la sportive</h1>
          <p className="text-gray-500 text-sm">Réponds aux questions suivantes sur l'application que tu viens d'essayer.</p>
        </div>

        {/* Questions fermées */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-1">
          <h2 className="!text-base !text-left !pb-3 !pt-0 text-gray-700 font-bold border-b border-gray-100 mb-2">
            Évaluation rapide
          </h2>
          <QuestionRow label="J'ai compris ce que je devais faire sur l'application"
            value={sportif.s_compris} onChange={(v) => setSportifField('s_compris', v)} />
          <QuestionRow label="Le scénario proposé m'a aidé à savoir quoi dire ou écrire"
            value={sportif.s_scenario_aide} onChange={(v) => setSportifField('s_scenario_aide', v)} />
          <QuestionRow label="J'ai trouvé le bouton pour déposer mon signalement facilement"
            value={sportif.s_bouton_facile} onChange={(v) => setSportifField('s_bouton_facile', v)} />
          <QuestionRow label="J'ai pu choisir de rester anonyme ou de me présenter"
            value={sportif.s_anonymat} onChange={(v) => setSportifField('s_anonymat', v)} />
          <QuestionRow label="J'ai eu le sentiment que mon message était protégé / confidentiel"
            value={sportif.s_confiance_protection} onChange={(v) => setSportifField('s_confiance_protection', v)} />
          <QuestionRow label="J'aurais confiance pour utiliser cette application pour de vrai"
            value={sportif.s_confiance_reel} onChange={(v) => setSportifField('s_confiance_reel', v)} />
          <QuestionRow label="L'application est facile à utiliser sur un téléphone"
            value={sportif.s_telephone_facile} onChange={(v) => setSportifField('s_telephone_facile', v)} />
          <QuestionRow label="Je conseillerais cette plateforme à d'autres sportifs"
            value={sportif.s_recommande} onChange={(v) => setSportifField('s_recommande', v)} />
        </div>

        {/* Questions ouvertes */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
          <h2 className="!text-base !text-left !pb-3 !pt-0 text-gray-700 font-bold border-b border-gray-100">
            Tes impressions
          </h2>
          <QuestionOuverte label="Qu'est-ce qui t'a semblé le plus simple ?"
            value={sportif.s_plus_simple} onChange={(v) => setSportifField('s_plus_simple', v)} />
          <QuestionOuverte label="Qu'est-ce qui t'a été difficile ou peu clair ?"
            value={sportif.s_difficile} onChange={(v) => setSportifField('s_difficile', v)} />
          <QuestionOuverte label="Tu changerais quoi si tu pouvais ?"
            value={sportif.s_changement} onChange={(v) => setSportifField('s_changement', v)} />
        </div>

        <button
          onClick={() => setEtape('educateur')}
          className="w-full py-4 bg-[var(--blue)] text-white rounded-xl font-bold text-lg hover:bg-[var(--red)] transition-colors"
        >
          Continuer → Partie éducateur·rice
        </button>
      </div>
    )
  }

  // ── Étape Éducateur ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <StepIndicator />

      <div className="text-center space-y-2">
        <div className="inline-block bg-[var(--red)] text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full mb-2">
          Étape 2 sur 2
        </div>
        <h1 className="!text-2xl !pb-2">Retour de l'éducateur · l'éducatrice</h1>
        <p className="text-gray-500 text-sm">Votre regard sur l'expérience de la personne accompagnée.</p>
      </div>

      {/* Questions fermées */}
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-1">
        <h2 className="!text-base !text-left !pb-3 !pt-0 text-gray-700 font-bold border-b border-gray-100 mb-2">
          Évaluation rapide
        </h2>
        <QuestionRow label="Le parcours de signalement m'a semblé logique et fluide"
          value={educateur.e_parcours_logique} onChange={(v) => setEducateurField('e_parcours_logique', v)} />
        <QuestionRow label="Le scénario présenté était adapté au public testé"
          value={educateur.e_scenario_adapte} onChange={(v) => setEducateurField('e_scenario_adapte', v)} />
        <QuestionRow label="La personne accompagnée a compris l'objectif de l'application"
          value={educateur.e_objectif_compris} onChange={(v) => setEducateurField('e_objectif_compris', v)} />
        <QuestionRow label="La notion d'anonymat / confidentialité est suffisamment claire"
          value={educateur.e_anonymat_clair} onChange={(v) => setEducateurField('e_anonymat_clair', v)} />
        <QuestionRow label="L'application semble adaptée aux personnes en situation de handicap"
          value={educateur.e_adapte_handicap} onChange={(v) => setEducateurField('e_adapte_handicap', v)} />
        <QuestionRow label="Je recommanderais cet outil à des licencié·e·s FFSA"
          value={educateur.e_recommande} onChange={(v) => setEducateurField('e_recommande', v)} />
        <QuestionRow label="L'interface est suffisamment simple pour une utilisation autonome"
          value={educateur.e_utilisation_autonome} onChange={(v) => setEducateurField('e_utilisation_autonome', v)} />
      </div>

      {/* Questions ouvertes */}
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
        <h2 className="!text-base !text-left !pb-3 !pt-0 text-gray-700 font-bold border-b border-gray-100">
          Vos impressions
        </h2>
        <QuestionOuverte label="Quelles difficultés avez-vous observées chez la personne accompagnée ?"
          value={educateur.e_difficultes_observees} onChange={(v) => setEducateurField('e_difficultes_observees', v)} />
        <QuestionOuverte label="Y a-t-il des mots, des étapes ou des concepts qui ont posé problème ?"
          value={educateur.e_concepts_problemes} onChange={(v) => setEducateurField('e_concepts_problemes', v)} />
        <QuestionOuverte label="Quelles améliorations vous sembleraient prioritaires ?"
          value={educateur.e_ameliorations} onChange={(v) => setEducateurField('e_ameliorations', v)} />
        <QuestionOuverte label="Observations libres"
          value={educateur.e_observations_libres} onChange={(v) => setEducateurField('e_observations_libres', v)}
          placeholder="Tout ce qui vous semble utile à noter..." />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setEtape('sportif')}
          className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-colors"
        >
          ← Retour
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 py-4 bg-[var(--yellow)] text-white rounded-xl font-bold text-lg hover:bg-[var(--red)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Envoi en cours...' : '✅ Envoyer nos retours'}
        </button>
      </div>
    </div>
  )
}
