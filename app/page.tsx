"use client"

import { useRef, useEffect, useState } from 'react'
import Link from "next/link"

function AutoPlayYouTube({ videoId }: { videoId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    // Intersection Observer pour mobile
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && iframe.contentWindow) {
            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
          } else if (iframe.contentWindow) {
            iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(iframe)
    return () => observer.disconnect()
  }, [])

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    }
  }

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-video">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&mute=1&controls=1&rel=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

export default function AccueilPage() {
  return (
    <section className="container mx-auto px-4">
      <h1>Signalement pour un.e licencié.e à la FFSA</h1>
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
            Je fais mon signalement →
          </Link>
        </div>
      </div>
      <h2>Qu'est-ce qu'un comité d'éthique ?</h2>
      <div className="text-center">Vidéo de présentation du comité d'éthique</div>
      <h2>Qu'est-ce que la confidentialité ?</h2>
      <p className="text-center">Vidéo sur la confidentialité</p>
      <h2>Signaler des faits de violence</h2>
      <h3>Qu'est-ce qu'un fait de violence ?</h3>
      <div className="my-6">
        <AutoPlayYouTube videoId="Y6vxWGHQR4w" />
      </div>
      <h3>Pourquoi est-il important de les signaler ?</h3>
    </section>
  )
}