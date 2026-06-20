import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent.OS — Autonomous Trading Intelligence',
  description: 'Perception → Decision → Execution → Risk → Exit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Inline black background paints BEFORE Tailwind/global CSS loads, killing
    // the white flash on refresh (during which the white "AGENT" title was
    // invisible and only the acid ".OS" showed).
    <html lang="en" style={{ background: '#000' }}>
      <body style={{ background: '#000' }}>{children}</body>
    </html>
  )
}
