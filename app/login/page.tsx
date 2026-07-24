'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが間違っています')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: facility } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', user.id)
      .single()

    if (facility) {
      router.push('/dashboard')
    } else {
      // 看護師の場合: プロフィール完了チェック
      const { data: np } = await supabase
        .from('nurse_profiles')
        .select('name, license, areas, skills, license_url')
        .eq('id', user.id)
        .maybeSingle()

      const isComplete = !!(
        np?.name &&
        np?.license &&
        np?.areas?.length > 0 &&
        np?.skills?.length > 0 &&
        np?.license_url
      )

      if (!isComplete) {
        // 未完了 → ポップアップ表示フラグ付きでmypageへ
        router.push('/mypage?popup=1')
      } else {
        router.push('/mypage')
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#FBF7F7', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#fff', padding: '40px', borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
          ログイン
        </h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>メールアドレス</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>パスワード</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }}
            />
          </div>
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
