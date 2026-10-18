"use client"
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'

export default function AccueilPage() {
  return (
    <section className="container mx-auto px-4">

      <h1>Signalement pour un.e licencié.e à la FFSA</h1>

      {/* Bloc principal CTA */}
      <div className="max-w-3xl mx-auto my-12 bg-gradient-to-br from-[var(--blue)] to-[var(--red)] rounded-2xl p-8 shadow-2xl">
        <h3 className="text-white text-center text-2xl font-bold mb-4">
          Vous êtes victime ou témoin de violences ?
        </h3>
        <p className="text-white/90 text-center mb-6">
          Votre signalement sera traité avec attention.
        </p>
        <div className="text-center">
          <Link
            href="/depot"
            className="inline-block rounded-xl bg-[var(--yellow)] px-10 py-5 text-2xl font-bold text-white hover:bg-white hover:text-[var(--blue)] transform hover:scale-105 transition-all duration-300 shadow-xl"
          >
            Je fais mon signalement
          </Link>
        </div>
      </div>
    </section>
  )
}