import * as React from "react"
import type { Metadata } from "next"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "LegalCollab - AI-Assisted Contract Negotiation",
  description: "Professional legal collaboration platform for AI-assisted contract negotiation and document generation",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>
                  <body suppressHydrationWarning={true}>
        
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
