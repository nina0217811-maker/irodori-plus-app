'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'nurse' | 'facility'>('nurse')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Supabaseで認証ユーザーを作成
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !data.user) {
      setError('登録に失敗しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    // profilesテーブルに保存
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        role,
        name,
      })

    if (profileError) {
      setError('プロフィールの作成に失敗しました。')
      setLoading(false)
      return
    }

    // 看護師 or 施設テーブルにも保存
    if (role === 'nurse') {
      await supabase.from('nurse_profiles').insert({
        id: data.user.id,
        license: 'rn',
      })
    } else {
      await supabase.from('facilities').insert({
        id: data.user.id,
        facility_name: name,
      })
    }

    role === 'facility' ? router.push('/dashboard') : router.push('/mypage')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FBF7F7',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#fff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
          アカウント作成
        </h1>

        {/* ロール選択 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {(['nurse', 'facility'] as const).map(r => (
            <div
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                border: `2px solid ${role === r ? '#E07070' : '#E2E8F0'}`,
                textAlign: 'center',
                cursor: 'pointer',
                background: role === r ? '#FDF0F0' : '#fff',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>
                {r === 'nurse' ? '👩‍⚕️' : '🏥'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: role === r ? '#C45A5A' : '#1A2235' }}>
                {r === 'nurse' ? '看護師' : '施設・病院'}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
              {role === 'nurse' ? 'お名前' : '施設名'}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder={role === 'nurse' ? '田中 みなみ' : 'さくら介護老人保健施設'}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: '6px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: '6px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
              パスワード（8文字以上）
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: '6px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#991B1B',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#E07070',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '登録中...' : '無料で登録する'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748B' }}>
          すでにアカウントをお持ちの方{' '}
          <a href="/login" style={{ color: '#E07070', fontWeight: '600' }}>
            ログイン
          </a>
        </div>
      </div>
    </div>
  )
}
