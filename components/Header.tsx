"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

const links = [
  { href: '/', label: '🏠 Accueil' },
  { href: '/depot', label: '🔴 Signaler des faits de violence' },
  { href: '/liens-utiles', label: '🆘 Qui peut m\'aider ?'},
]

export default function Header() {
  return (
    <header className="bg-[var(--blue)] px-4 py-4 md:px-8">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        {/* Logo à gauche */}
        <div className="flex-shrink-0">
          <Link href="/">
            <Image 
              src={"/Logo-FFSA.png"} 
              alt="" 
              width={810} 
              height={1536} 
              className="w-auto h-24 md:h-28 object-contain"
            />
          </Link>
        </div>
        
        {/* Titre centré */}
        <div className="flex-1 text-center px-4">
          <p className="text-white text-lg md:text-2xl lg:text-3xl xl:text-4xl font-semibold leading-tight">
            Signalez, nous vous écouterons.
          </p>
        </div>
        
        {/* Menu à droite */}
        <div className="flex-shrink-0">
          <Menu>
            <MenuButton className="rounded bg-[var(--yellow)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--red)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--yellow)] focus:ring-offset-2 focus:ring-offset-[var(--blue)]">
              MENU
            </MenuButton>
            <MenuItems 
              anchor="bottom end"
              className="mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div className="py-1">
                {links.map((link) => (
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
              </div>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  )
}