import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'

import { env } from '@/env'
import { ReactQueryProvider } from '@/providers/ReactQueryProvider'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Fitnesspark Class Calendar - by Javier Pérez',
  description:
    'Generate a calendar of Fitnesspark classes that you can import into Google Calendar',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-gray-100 ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>{children}</ReactQueryProvider>

        <footer className="text-center text-muted-foreground text-sm my-8">
          <p className="flex justify-center items-center gap-2">
            <Link
              className="hover:text-black hover:underline font-bold"
              href="
https://javierperez.com?utm_sourcefitnesspark-ical&utm_medium=footer&utm_campaign=fitnesspark-ical"
              target="_blank"
              rel="noopener noreferrer"
            >
              &copy; {new Date().getFullYear()} Javier Pérez
            </Link>{' '}
            •{' '}
            <Link
              href="https://paypal.me/javierperezcom"
              className="hover:text-black hover:underline font-bold"
              target="_blank"
              rel="noopener noreferrer"
            >
              Donate
            </Link>{' '}
            • <span>made in 🇨🇭 with ❤️ </span>
          </p>
        </footer>
        {env.UMAMI_WEBSITE_ID && (
          <script
            defer
            src="https://analytics.javierperez.com/script.js"
            data-website-id={env.UMAMI_WEBSITE_ID}
          />
        )}
      </body>
    </html>
  )
}
