'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type UserType = 'nurse' | 'facility' | null
type Step = 'select' | 'tutorial' | 'form'

const NURSE_STEPS = [
  { emoji: '📝', title: '無料で会員登録', desc: 'メールアドレスだけで30秒で完了。登録費用は一切かかりません' },
  { emoji: '👤', title: 'プロフィール登録', desc: '資格・エリア・免許証を登録すると施設からスカウトが届きます' },
  { emoji: '🔍', title: '求人を探して応募', desc: '単発・正社員どちらも1タップで応募できます' },
  { emoji: '💬', title: '採用確定→チャットで確認', desc: '施設とチャットして持ち物・集合場所を確認して勤務へ' },
]

const FACILITY_STEPS = [
  { emoji: '🏥', title: '無料で施設登録', desc: 'メールアドレスだけで登録完了。最短10分で求人公開できます' },
  { emoji: '📋', title: '求人を投稿', desc: '勤務日・時間・日給を入力するだけ。登録看護師にLINE通知が届きます' },
  { emoji: '👩‍⚕️', title: '応募が届いたら採用を決定', desc: '看護師のプロフィールを確認して採用・不採用を選ぶだけ' },
  { emoji: '💬', title: '採用確定→チャットで詳細を共有', desc: '持ち物・集合場所などをチャットで伝えて当日を迎えましょう' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [userType, setUserType] = useState<UserType>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelect = (type: UserType) => {
    setUserType(type)
    setStep('tutorial')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('パスワードが一致しません'); return }
    if (password.length < 8) { setError('パスワードは8文字以上で入力してください'); return }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? '登録に失敗しました')
      setLoading(false)
      return
    }

    if (userType === 'facility') {
      await supabase.from('facilities').insert({
        id: data.user.id,
        facility_name: facilityName,
        plan_status: 'inactive',
        is_subscribed: false,
        created_at: new Date().toISOString(),
      })
      router.push('/dashboard')
    } else {
      router.push('/mypage?popup=1')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit',
  }

  const steps = userType === 'nurse' ? NURSE_STEPS : FACILITY_STEPS
  const accentColor = userType === 'nurse' ? '#E07070' : '#1A2235'
  const accentBg = userType === 'nurse' ? '#FDF0F0' : '#F1F5F9'

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F7', fontFamily: 'sans-serif', padding: '32px 20px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>

        {/* ステップバー */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {['select', 'tutorial', 'form'].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: ['select', 'tutorial', 'form'].indexOf(step) >= i ? accentColor : '#EDE0E0' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 28 }}>
          <span style={{ color: step === 'select' ? accentColor : '#94A3B8' }}>ユーザー選択</span>
          <span style={{ color: step === 'tutorial' ? accentColor : '#94A3B8' }}>使い方確認</span>
          <span style={{ color: step === 'form' ? accentColor : '#94A3B8' }}>登録</span>
        </div>

        {/* STEP 1: 選択 */}
        {step === 'select' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>👋</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1A2235', marginBottom: 6 }}>irodori+へようこそ</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>どちらとして登録しますか？</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <button onClick={() => handleSelect('nurse')} style={{ background: '#FDF0F0', border: '2px solid #E07070', borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>👩‍⚕️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#E07070', marginBottom: 4 }}>看護師</div>
                <div style={{ fontSize: 11, color: '#C45A5A' }}>バイト・転職を探す</div>
              </button>
              <button onClick={() => handleSelect('facility')} style={{ background: '#F1F5F9', border: '2px solid #1A2235', borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏥</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2235', marginBottom: 4 }}>施設・病院</div>
                <div style={{ fontSize: 11, color: '#475569' }}>看護師を採用する</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: チュートリアル */}
        {step === 'tutorial' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>
                {userType === 'nurse' ? '👩‍⚕️ 看護師として使う流れ' : '🏥 施設として使う流れ'}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1A2235' }}>使い方はかんたん4ステップ</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${accentColor}`, overflow: 'hidden', marginBottom: 20 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ padding: '14px 16px', borderBottom: i < steps.length - 1 ? '0.5px solid #EDE0E0' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2235', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: accentColor, flexShrink: 0 }}>{i + 1}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('form')}
              style={{ width: '100%', padding: 14, background: accentColor, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
            >
              {userType === 'nurse' ? '👩‍⚕️ 看護師として登録する' : '🏥 施設として登録する'}
            </button>
            <button
              onClick={() => setStep('select')}
              style={{ width: '100%', padding: 10, background: 'none', border: '1px solid #EDE0E0', borderRadius: 10, fontSize: 13, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ← 選び直す
            </button>
          </div>
        )}

        {/* STEP 3: 登録フォーム */}
        {step === 'form' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1A2235', marginBottom: 6 }}>
                {userType === 'nurse' ? '👩‍⚕️ 看護師として登録' : '🏥 施設として登録'}
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>登録は無料・30秒で完了します</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', border: '1px solid #EDE0E0' }}>
              <form onSubmit={handleRegister}>
                {userType === 'facility' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>施設名・病院名 *</label>
                    <input value={facilityName} onChange={e => setFacilityName(e.target.value)} required style={inp} placeholder="例：訪問看護ステーションはな" />
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>メールアドレス *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} placeholder="example@email.com" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>パスワード *（8文字以上）</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>パスワード（確認）*</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inp} />
                </div>
                {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: 13, background: loading ? '#ccc' : accentColor, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
                  {loading ? '登録中...' : '登録する'}
                </button>
                <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 1.7 }}>
                  登録することで<a href="/terms" style={{ color: '#94A3B8' }}>利用規約</a>・<a href="/privacy" style={{ color: '#94A3B8' }}>プライバシーポリシー</a>に同意したものとみなします
                </div>
              </form>
            </div>

            <button onClick={() => setStep('tutorial')} style={{ width: '100%', padding: 10, background: 'none', border: 'none', fontSize: 13, color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }}>
              ← 使い方に戻る
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748B' }}>
          すでにアカウントをお持ちの方は<a href="/login" style={{ color: '#E07070', fontWeight: 600 }}>ログイン</a>
        </div>

      </div>
    </div>
  )
}
