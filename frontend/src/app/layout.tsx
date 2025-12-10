import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Minila - Traveler & Cargo Coordination Platform',
  description: 'Smart platform for coordination between travelers and cargo senders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Note: The actual lang and dir attributes are set dynamically by LanguageContext
  // We start with 'en' and 'ltr' as defaults which will be updated client-side
  return (
    <html lang="en" dir="ltr" className="lang-en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
