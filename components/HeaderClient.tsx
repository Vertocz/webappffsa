'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const Header = dynamic(() => import('@/components/Header'), { ssr: false })

export default function HeaderClient() {
  const pathname = usePathname()

  // Sur la page de dépôt, on retire l'en-tête pour aller directement à l'essentiel
  if (pathname === '/depot') return null

  return <Header />
}
