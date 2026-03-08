'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { supabase } from '@/app/lib/supabase'
import type { User } from '@supabase/supabase-js'

const publicLinks = [
  { href: '/', label: '🏠 Accueil' },
  { href: '/depot', label: '🔴 Signaler des faits de violence' },
  { href: '/liens-utiles', label: '🆘 Qui peut m\'aider ?' },
]

const adminLinks = [
  { href: '/suivi', label: '📋 Suivi des signalements' },
]

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Récupère l'utilisateur courant
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    // Écoute les changements de session (connexion / déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const allLinks = user ? [...publicLinks, ...adminLinks] : publicLinks

  return (
    <header className="bg-[var(--blue)] px-4 py-4 md:px-8">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">

        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            <Image
              src="/Logo-FFSA.png"
              alt=""
              width={810}
              height={1536}
              className="w-auto h-24 md:h-28 object-contain"
            />
          </Link>
        </div>

        {/* Titre */}
        <div className="flex-1 text-center px-4">
          <p className="text-white text-lg md:text-2xl lg:text-3xl xl:text-4xl font-semibold leading-tight">
            Signalez, nous vous écoutons.
          </p>
          {user && (
            <p className="text-white/60 text-xs mt-1">
              Connecté : {user.email}
            </p>
          )}
        </div>

        {/* Menu */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {user && (
            <button
              onClick={handleLogout}
              className="hidden md:block text-white/70 hover:text-white text-sm transition-colors underline underline-offset-2"
            >
              Déconnexion
            </button>
          )}
          <Menu>
            <MenuButton className="rounded bg-[var(--yellow)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--red)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--yellow)] focus:ring-offset-2 focus:ring-offset-[var(--blue)]">
              MENU
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div className="py-1">
                {allLinks.map((link) => (
                  <MenuItem key={link.href}>
                    {({ focus }) => (
                      <a
                        href={link.href}
                        className={`block px-4 py-3 text-sm font-bold transition-colors ${
                          focus
                            ? 'bg-[var(--blue)] text-[var(--yellow)]'
                            : 'text-gray-700'
                        }`}
                      >
                        {link.label}
                      </a>
                    )}
                  </MenuItem>
                ))}
                {user && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left block px-4 py-3 text-sm font-bold transition-colors ${
                            focus
                              ? 'bg-red-50 text-[var(--red)]'
                              : 'text-gray-400'
                          }`}
                        >
                          ← Déconnexion
                        </button>
                      )}
                    </MenuItem>
                  </>
                )}
              </div>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  )
}
