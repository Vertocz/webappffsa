import "./globals.css"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import HeaderClient from "@/components/HeaderClient"

export const metadata: Metadata = {
  title: {
    default: "Plateforme de Signalements - FFSA",
    template: "%s | Ethik FFSA",
  },
  description:
    "Plateforme de signalements confidentiels de violences et de questions éthiques au sein de la Fédération Française de Sport Adapté.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <HeaderClient />
        {children}
      </body>
    </html>
  )
}
