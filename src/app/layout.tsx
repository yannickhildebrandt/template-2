import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BPMN Designer',
  description: 'Ein moderner BPMN-Editor mit Exportfunktionen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="bg-gray-50">
        <main className="flex min-h-screen flex-col overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
