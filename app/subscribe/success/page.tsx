'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const update = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      await supabase
        .from('facilities')
        .update({ plan_status: 'active' })
        .eq('id', user.id)
    }
    update()
  }, [])

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '24px' }}>🎉</div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#1A2235' }}>
          お申し込みありがとうございます！
        </h1>
        <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '15px' }}>
          irodori＋ 掲載プランが有効になりました。
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '12px 32px',
            background: '#E07070',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          ダッシュボードへ
        </button>
      </div>
    </div>
  )
}
