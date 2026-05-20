'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const scenarios = [
  {
    emoji: '🤗',
    titre: 'Un câlin qui va trop loin',
    texte: `Tu viens de marquer un panier décisif et de gagner le match. Pour te féliciter, une personne du club s'approche de toi. Elle te prend dans ses bras, mais te serre beaucoup trop fort et trop longtemps. Elle pose ses mains sur ton corps.

Tu t'écartes pour qu'elle arrête, mais elle te dit : "C'est normal, c'est pour te féliciter" et continue.

Tu sais au fond de toi que ce n'est pas normal. Tu te sens mal avec cette situation.`,
  },
  {
    emoji: '😤',
    titre: 'Un entraîneur qui perd le contrôle',
    texte: `Pendant l'entraînement sur le terrain de basket, tu rates plusieurs lancers. Ton entraîneur s'énerve très fort. Il crie sur toi devant toute l'équipe et jette son chronomètre par terre.

Tu as eu peur. Tu n'as plus envie de retourner à l'entraînement.`,
  },
  {
    emoji: '😳',
    titre: 'Des remarques bizarres sur ton corps',
    texte: `Tu es sur le terrain pour t'entraîner. Une personne du club te regarde longuement et te fait des remarques sur ton corps ou sur ta tenue :

"Ton short te va bien, tourne-toi pour voir." Ou encore : "Tu as un beau corps pour jouer au basket."

Cette personne répète ces phrases à chaque fois qu'elle te voit. Tu te sens très gêné·e et tu as peur de la croiser.`,
  },
  {
    emoji: '😨',
    titre: 'Intimidation dans les vestiaires',
    texte: `Tu bois une boisson après le match. Un joueur s'approche de toi et te bouscule volontairement pour te piquer ta boisson ou ton équipement.

Il te regarde dans les yeux et dit : "Si tu parles de ça à quelqu'un, tu vas voir."

Tu as peur des conséquences.`,
  },
  {
    emoji: '😢',
    titre: 'Des moqueries après une défaite',
    texte: `Tu viens de perdre un match important. Dans les vestiaires, un joueur d'une autre équipe se moque de toi. Il rigole très fort et te dit que tu es "nul·le", que tu ne sais pas jouer au basket.

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
        <div className="bg-[var(--blue)] px-8 py-6 text-white flex-shrink-0">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-70 mb-1">
            Situation fictive
          </p>
          <h2 className="text-xl font-bold leading-snug">
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
