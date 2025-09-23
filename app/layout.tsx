import * as React from "react"
import type { Metadata } from "next"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { NotificationProvider } from "@/components/notification-system"
import { Toaster } from "@/components/ui/toaster"
import { ClientOnly } from "@/components/client-only"

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
  title: "IBD Contracting - AI-Assisted Contract Negotiation",
  description: "Professional contract collaboration platform for AI-assisted contract negotiation and document generation",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>
                  <body suppressHydrationWarning={true}>
        
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
        <ClientOnly>
          <Toaster />
        </ClientOnly>
      </body>
    </html>
  )
}
