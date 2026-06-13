'use client'

import { useState } from 'react'

const C = {
  primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0',
  border: '#EDE0E0', sub: '#64748B', bg: '#FBF7F7', card: '#FFFFFF', text: '#1A2235',
}

export default function ContactPage() {
  const [form, setForm] = useState({
    facilityName: '', personName: '', email: '', phone: '',
    facilityType: '', inquiryType: '資料請求', message: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inp = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError('送信に失敗しました。時間をおいて再度お試しください。')
    }
    setLoading(false)
  }

  if (done) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 12 }}>送信しました！</h2>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.8, marginBottom: 8 }}>
          お問い合わせありがとうございます。<br />
          サービス資料をメールで送付しました。
        </p>
        <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.8, marginBottom: 28 }}>
          担当者より2営業日以内にご連絡いたします。<br />
          メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
        <a href="/" style={{ display: 'inline-block', padding: '12px 28px', background: C.primary, color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          トップページへ
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📩</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>お問い合わせ・資料請求</h1>
          <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.8 }}>
            資料請求を選択いただくと、サービス資料PDFを自動でお送りします。<br />
            その他ご質問・ご相談もお気軽にどうぞ。
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '32px 28px' }}>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>お問い合わせ種別 *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['資料請求', '料金相談', 'デモ依頼', 'その他'].map(t => (
                <button key={t} type="button" onClick={() => set('inquiryType', t)}
                  style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: form.inquiryType === t ? 600 : 400, background: form.inquiryType === t ? C.primary : '#fff', color: form.inquiryType === t ? '#fff' : C.sub, border: `1px solid ${form.inquiryType === t ? C.primary : C.border}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>施設名 *</label>
            <input required value={form.facilityName} onChange={e => set('facilityName', e.target.value)} style={inp} placeholder="さくら介護老人保健施設" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>担当者名 *</label>
            <input required value={form.personName} onChange={e => set('personName', e.target.value)} style={inp} placeholder="山田 花子" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>メールアドレス *</label>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inp} placeholder="info@example.com" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>電話番号</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} style={inp} placeholder="098-000-0000" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>施設種別</label>
            <select value={form.facilityType} onChange={e => set('facilityType', e.target.value)} style={{ ...inp, background: '#fff' }}>
              <option value="">選択してください</option>
              {['病院','クリニック','介護老人保健施設','訪問看護','デイサービス','訪問入浴','グループホーム','特別養護老人ホーム','有料老人ホーム','障害者施設','保育園','その他'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>メッセージ・ご質問</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="ご質問・ご要望があればご記入ください" style={{ ...inp, height: 100, resize: 'vertical' }} />
          </div>

          {form.inquiryType === '資料請求' && (
            <div style={{ background: C.light, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.dark, lineHeight: 1.7 }}>
              📄 送信後、サービス資料PDFをメールで自動送付します
            </div>
          )}

          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#ccc' : C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? '送信中...' : '送信する'}
          </button>
          <p style={{ fontSize: 12, color: C.sub, textAlign: 'center', marginTop: 10 }}>
            送信後、担当者より2営業日以内にご連絡いたします
          </p>
        </form>
      </div>
    </div>
  )
}
