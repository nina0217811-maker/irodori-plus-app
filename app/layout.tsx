import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  title: 'irodori+ | 沖縄の看護師採用・求人掲載プラットフォーム',
  description: '沖縄の医療・介護施設向け看護師採用プラットフォーム。紹介手数料ゼロ・月額¥11,000〜。単発バイトから正社員採用まで一括サポート。登録看護師260名以上。沖縄県全域対応。',
  keywords: '沖縄 看護師 採用, 沖縄 看護師 求人 掲載, 看護師 採用 紹介手数料なし, 訪問看護 スタッフ 募集 沖縄, 介護施設 看護師 採用 沖縄, 看護師 求人 沖縄, クリニック 看護師 募集 沖縄',
  openGraph: {
    title: 'irodori+ | 沖縄の看護師採用・求人掲載プラットフォーム',
    description: '沖縄の医療・介護施設向け看護師採用プラットフォーム。紹介手数料ゼロ・月額¥11,000〜。単発から正社員採用まで一括サポート。',
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
      <GoogleAnalytics gaId='G-3FXSHBDYYD' />
</body>
    </html>
  )
}
