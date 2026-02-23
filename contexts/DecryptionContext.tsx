"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DecryptionContextType {
  passphrase: string | null
  setPassphrase: (key: string) => void
  clearPassphrase: () => void
  isAuthenticated: boolean
}

const DecryptionContext = createContext<DecryptionContextType | undefined>(undefined)

export function DecryptionProvider({ children }: { children: ReactNode }) {
  const [passphrase, setPassphraseState] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Vérifier si on a une passphrase d'environnement au chargement
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    if (envKey) {
      setPassphraseState(envKey)
      setIsAuthenticated(true)
    }
  }, [])

  const setPassphrase = (key: string) => {
    setPassphraseState(key)
    setIsAuthenticated(true)
  }

  const clearPassphrase = () => {
    setPassphraseState(null)
    setIsAuthenticated(false)
  }

  return (
    <DecryptionContext.Provider
      value={{
        passphrase,
        setPassphrase,
        clearPassphrase,
        isAuthenticated
      }}
    >
      {children}
    </DecryptionContext.Provider>
  )
}

export function useDecryption() {
  const context = useContext(DecryptionContext)
  if (context === undefined) {
    throw new Error('useDecryption must be used within a DecryptionProvider')
  }
  return context
}