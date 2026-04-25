import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'irodori＋ | 看護師×施設 単発マッチング',
  description: '看護師と施設をつなぐ単発バイトのマッチングプラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: '#FBF7F7', fontFamily: 'sans-serif' }}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}