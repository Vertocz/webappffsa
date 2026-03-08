import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import { DecryptionProvider } from '@/contexts/DecryptionContext'

export const metadata: Metadata = {
  title: {
    default: "Signalement FFSA",
    template: "%s | Ethik FFSA",
  },
  description:
    "Plateforme de signalement confidentiel de violences et de questions éthiques au sein de la Fédération Française de Sport Adapté.",
  robots: {
    index: false,   // On ne veut pas que Google indexe une plateforme de signalement
    follow: false,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <DecryptionProvider>
          {children}
        </DecryptionProvider>
      </body>
    </html>
  );
}