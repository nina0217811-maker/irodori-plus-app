'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const NURSE_SLIDES = [
  {
    icon: '👩‍⚕️',
    title: 'irodori+へようこそ！',
    desc: '沖縄の看護師と施設をつなぐ\nスポットマッチングサービスです\n空いた時間に単発バイトを始めましょう',
  },
  {
    icon: '📍',
    title: 'エリアで求人を探す',
    desc: '那覇・浦添・宜野湾など\nエリアや施設種別で絞り込んで\nぴったりの求人を見つけましょう',
  },
  {
    icon: '💬',
    title: '採用確定後はチャットで連絡',
    desc: '採用が決まったら施設と\nチャットで詳細を確認できます\n勤務前に疑問を解消しましょう',
  },
  {
    icon: '✨',
    title: 'プロフィールを充実させよう',
    desc: '免許証・口座情報を登録すると\n施設からの信頼度が上がります\n採用率アップにつながります',
  },
]

const FACILITY_SLIDES = [
  {
    icon: '🏥',
    title: 'irodori+へようこそ',
    desc: '急な欠員も安心。\n沖縄の看護師と施設をつなぐ\nスポットマッチングサービスです',
  },
  {
    icon: '📋',
    title: '求人を投稿して看護師を募集',
    desc: '勤務日・時間・給与を入力するだけ\n登録看護師に即座に通知されます',
  },
  {
    icon: '💳',
    title: '採用確定・支払い明細も管理',
    desc: '採用した看護師とチャットで連絡\n月末には支払い明細を\nPDFでダウンロードできます',
  },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') as 'nurse' | 'facility'
  const [step, setStep] = useState(0)

  const slides = role === 'facility' ? FACILITY_SLIDES : NURSE_SLIDES
  const total = slides.length
  const current = slides[step]

  const handleFinish = () => {
    router.push(role === 'facility' ? '/dashboard' : '/mypage')
  }

  const handleNext = () => {
    if (step < total - 1) setStep(s => s + 1)
    else handleFinish()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ background: '#FDF0F0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#C45A5A', fontWeight: 600 }}>{step + 1} / {total}</span>
          <button onClick={handleFinish} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>スキップ</button>
        </div>
        <div style={{ padding: '40px 28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 380 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FDF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 24 }}>
            {current.icon}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1A2235', marginBottom: 12, textAlign: 'center' }}>
            {current.title}
          </div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.9, marginBottom: 32, textAlign: 'center', whiteSpace: 'pre-line' }}>
            {current.desc}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{ height: 6, borderRadius: 3, background: i === step ? '#E07070' : '#EDE0E0', width: i === step ? 20 : 6, transition: 'all 0.2s' }} />
            ))}
          </div>
          <button onClick={handleNext} style={{ width: '100%', padding: '14px', background: '#E07070', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {step < total - 1 ? '次へ →' : '始める！'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>読み込み中...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
