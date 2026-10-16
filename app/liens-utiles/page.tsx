'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const liens = [
  { href: 'https://colosse.fr/jai-besoin-daide/', label: "Colosse aux pieds d'argile", image: '/Logo-Colosse.svg' },
  { href: 'https://www.france-victimes.fr/', label: 'France Victimes', image: '/116_006_2022.png' },
  { href: 'https://www.assorebond.com/', label: 'Association Rebond', image: '/rebond.png' },
]

// Bandeau affiché uniquement juste après l'envoi d'un signalement (?envoye=1)
function ConfirmationEnvoi() {
  const searchParams = useSearchParams()
  if (searchParams.get('envoye') !== '1') return null

  return (
    <div className="max-w-2xl mx-auto mb-10 bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center space-y-2">
      <div className="text-4xl" aria-hidden="true">✅</div>
      <p className="text-lg font-bold text-green-800">
        Votre signalement a bien été envoyé
      </p>
      <p className="text-green-700">
        Merci de votre confiance. Il va être lu avec attention.
      </p>
    </div>
  )
}

export default function LiensUtiles() {
  return (
    <section className="container mx-auto px-4 py-8">
      <Suspense fallback={null}>
        <ConfirmationEnvoi />
      </Suspense>

      <h1 className="text-center mb-8">Qui peut m&apos;aider ?</h1>
      
      <div className="flex flex-wrap justify-center items-center gap-8 max-w-5xl mx-auto">
        {liens.map((lien) => (
          <Link 
            href={lien.href} 
            key={lien.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 p-6 rounded-lg hover:bg-gray-50 transition-all hover:shadow-lg"
          >
            <div className="relative h-24 w-48 md:h-28 md:w-56">
              <Image 
                src={lien.image} 
                alt={lien.label}
                fill
                className="object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-center font-semibold text-[var(--blue)] group-hover:text-[var(--red)] transition-colors">
              {lien.label}
            </p>
          </Link>
        ))}            
      </div>
    </section>
  );
}