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
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

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
        router.push('/mypage?popup=1')
      } else {
        router.push('/mypage')
      }
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://irodori0305.jp/reset-password',
    })
    setResetLoading(false)
    setResetSent(true)
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF7F7', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>

        {resetMode ? (
          <>
            <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>パスワードをリセット</h1>
            <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginBottom: '24px', lineHeight: 1.7 }}>
              登録したメールアドレスを入力してください。<br />パスワード再設定のリンクを送ります。
            </p>
            {resetSent ? (
              <div style={{ background: '#D1FAE5', color: '#065F46', padding: '14px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', lineHeight: 1.7 }}>
                メールを送信しました！<br />受信ボックスをご確認ください。
              </div>
            ) : (
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>メールアドレス</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
                </div>
                <button type="submit" disabled={resetLoading} style={{ width: '100%', padding: '12px', background: resetLoading ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>
                  {resetLoading ? '送信中...' : 'リセットメールを送る'}
                </button>
              </form>
            )}
            <button onClick={() => { setResetMode(false); setResetSent(false) }} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', color: '#64748B', cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit' }}>
              ← ログインに戻る
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>ログイン</h1>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>メールアドレス</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>パスワード</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
              </div>
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button type="button" onClick={() => setResetMode(true)} style={{ background: 'none', border: 'none', color: '#E07070', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  パスワードを忘れた方はこちら
                </button>
              </div>
              {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
