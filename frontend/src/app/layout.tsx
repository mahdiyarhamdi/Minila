import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'
import MobileBottomNav from '@/components/MobileBottomNav'
import ContentWrapper from '@/components/ContentWrapper'

export const metadata: Metadata = {
  title: 'Minila - Connect Travelers & Senders',
  description: 'Smart platform for coordination between travelers and senders through trusted communities',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Minila',
  },
}

export const viewport: Viewport = {
  themeColor: '#00A8E8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
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
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Navbar />
          <ContentWrapper>
            {children}
          </ContentWrapper>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  )
}
