import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'irodori+ | 看護師×施設 単発バイト マッチング【沖縄】',
  description: '看護師の単発・スポットバイトを探すならirodori+。沖縄エリアの病院・クリニック・介護施設の求人を掲載。自由なシフトで働けるナースのためのマッチングプラットフォーム。',
  keywords: '看護師 単発バイト, 看護師 スポット, 沖縄 看護師 求人, 沖縄 看護師 バイト, 看護師 マッチング, 単発 看護 沖縄',
  openGraph: {
    title: 'irodori+ | 看護師×施設 単発マッチング',
    description: '自由なシフトで働ける看護師のためのマッチングプラットフォーム',
    url: 'https://irodori0305.jp',
    siteName: 'irodori+',
    locale: 'ja_JP',
    type: 'website',
  },
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
        <Footer />
      </body>
    </html>
  )
}
