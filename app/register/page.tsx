'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'nurse' | 'facility' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [facilityType, setFacilityType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? '登録に失敗しました')
      setLoading(false)
      return
    }

    if (role === 'facility') {
      const { error: facilityError } = await supabase.from('facilities').insert({
        id: data.user.id,
        facility_name: facilityName,
        facility_type: facilityType,
        email: email,
      })
      if (facilityError) {
        setError('施設情報の登録に失敗しました: ' + facilityError.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } else {
      router.push('/mypage')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#FBF7F7', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#fff', padding: '40px', borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '440px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
          新規登録
        </h1>

        {/* ロール選択 */}
        {!role ? (
          <div>
            <p style={{ fontSize: '14px', color: '#64748B', textAlign: 'center', marginBottom: '20px' }}>
              どちらで登録しますか？
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setRole('nurse')}
                style={{
                  flex: 1, padding: '20px', borderRadius: '12px',
                  border: '2px solid #EDE0E0', background: '#fff',
                  cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>👩‍⚕️</div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>看護師として登録</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>単発バイトを探す</div>
              </button>
              <button
                onClick={() => setRole('facility')}
                style={{
                  flex: 1, padding: '20px', borderRadius: '12px',
                  border: '2px solid #EDE0E0', background: '#fff',
                  cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏥</div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>施設として登録</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>看護師を募集する</div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRole(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '13px' }}
              >
                ← 戻る
              </button>
              <span style={{ fontSize: '13px', color: '#64748B' }}>
                {role === 'nurse' ? '👩‍⚕️ 看護師として登録' : '🏥 施設として登録'}
              </span>
            </div>

            {role === 'facility' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>施設名 *</label>
                  <input
                    type="text" required value={facilityName}
                    onChange={e => setFacilityName(e.target.value)}
                    placeholder="さくら介護老人保健施設"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>施設種別 *</label>
                  <select
                    required value={facilityType}
                    onChange={e => setFacilityType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="">選択してください</option>
                    <option>病院</option>
                    <option>クリニック</option>
                    <option>介護老人保健施設</option>
                    <option>訪問看護</option>
                    <option>保育園</option>
                    <option>その他</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>メールアドレス *</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>パスワード *</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6文字以上"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', background: '#E07070',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748B' }}>
          すでにアカウントをお持ちの方{' '}
          <a href="/login" style={{ color: '#E07070', fontWeight: '600' }}>ログイン</a>
        </div>
      </div>
    </div>
  )
}