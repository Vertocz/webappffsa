'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const scenarios = [
  {
    emoji: '🤗',
    titre: 'Un câlin qui va trop loin',
    texte: `Tu viens de gagner un tournoi de tennis de table très important. Pour te féliciter, un adulte du club s'approche de toi. Il te prend dans ses bras, mais te serre beaucoup trop fort et trop longtemps. Il pose ses mains sur ton corps.

Tu te pousses pour qu'il arrête, mais il te dit : "C'est normal, c'est pour te féliciter" et continue.

Tu sais au fond de toi que ce n'est pas normal. Tu te sens mal avec cette situation.`,
  },
  {
    emoji: '😤',
    titre: 'Un entraîneur qui perd le contrôle',
    texte: `Pendant l'entraînement, tu rates plusieurs retours et tu perds des points facilement. Ton entraîneur s'énerve très fort. Il crie sur toi devant tous les autres joueurs et frappe la table avec sa raquette.

Tu as eu peur. Tu n'as plus envie de retourner à l'entraînement.`,
  },
  {
    emoji: '😳',
    titre: 'Des remarques bizarres sur ton corps',
    texte: `Tu t'échauffes avant un match. Une personne du club te regarde longuement et te fait des remarques sur ton corps ou sur ta tenue :

"Ton short te va bien, tourne-toi pour voir." Ou encore : "Tu as un beau corps pour jouer au ping."

Cette personne répète ces phrases à chaque fois qu'elle te voit. Tu te sens très gêné·e et tu as peur de la croiser.`,
  },
  {
    emoji: '😨',
    titre: 'Intimidation dans la salle',
    texte: `Tu ranges ta raquette après l'entraînement. Un joueur plus vieux s'approche de toi et te pousse volontairement pour te prendre ton étui ou ta raquette.

Il te regarde dans les yeux et dit : "Si tu parles de ça à quelqu'un, tu vas voir."

Tu as peur des conséquences.`,
  },
  {
    emoji: '😢',
    titre: 'Des moqueries après une défaite',
    texte: `Tu viens de perdre un match de championnat. Dans la salle, un joueur de l'équipe adverse se moque de toi. Il rigole très fort et te dit que tu es "nul·le", que tu n'as rien à faire à cette table.

Tu te sens très triste et tu as honte. Tu ne veux plus revenir.`,
  },
]

export default function ScenarioModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [index, setIndex] = useState(() => Math.floor(Math.random() * scenarios.length))
  const [isLeaving, setIsLeaving] = useState(false)

  const scenario = scenarios[index]

  const nextScenario = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIndex((i) => (i + 1) % scenarios.length)
      setIsLeaving(false)
    }, 200)
  }

  const handleAccept = () => {
    router.push('/depot')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">

        {/* En-tête — fixe */}
        <div className="bg-[var(--blue)] px-5 py-3 text-white flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">
            Situation fictive
          </p>
          <h2 className="!text-base !font-semibold !pb-0 !pt-0 leading-snug text-white">
            Voici un scénario pour t'aider à tester l'application
          </h2>
        </div>

        {/* Scénario — scrollable si l'écran est petit */}
        <div
          className="px-8 py-6 overflow-y-auto flex-1 transition-opacity duration-200"
          style={{ opacity: isLeaving ? 0 : 1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{scenario.emoji}</span>
            <h3 className="text-lg font-bold text-[var(--blue)]">{scenario.titre}</h3>
          </div>

          <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
            {scenario.texte}
          </p>

          <div className="mt-5 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg text-sm text-amber-800">
            💡 Cette situation est <strong>entièrement fictive</strong>. Tu vas faire semblant de la vivre pour tester comment fonctionne le signalement.
          </div>
        </div>

        {/* Actions — fixes en bas */}
        <div className="px-8 py-6 flex flex-col gap-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={handleAccept}
            className="w-full py-4 px-6 bg-[var(--yellow)] hover:bg-[var(--red)] text-white font-bold rounded-xl transition-colors text-base"
          >
            ✅ Je suis d'accord pour essayer avec cette situation
          </button>
          <button
            onClick={nextScenario}
            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
          >
            🔄 Je veux une autre situation
          </button>
          <button
            onClick={onClose}
            className="text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Annuler
          </button>
        </div>

      </div>
    </div>
  )
}