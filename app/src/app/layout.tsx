import type { Metadata } from 'next'
import { Space_Grotesk, Figtree } from 'next/font/google'
import './globals.css'

// Space Grotesk for headings
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['300', '400', '500', '600', '700'],
})

// Figtree for body text
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Cosos — The Engine Room That Runs With You',
  description: 'The proactive AI decision-maker for solopreneurs and early-stage CEOs. Know if you\'re winning, every single day.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${figtree.variable} font-body`}>{children}</body>
    </html>
  )
}

