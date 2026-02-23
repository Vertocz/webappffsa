import "./globals.css";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import { DecryptionProvider } from '@/contexts/DecryptionContext'

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
