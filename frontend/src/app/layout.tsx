import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Minila - پلتفرم هماهنگی مسافر و بار',
  description: 'پلتفرم هوشمند برای هماهنگی بین مسافران و فرستندگان بار',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  )
}

