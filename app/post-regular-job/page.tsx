'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PostRegularJobPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    title: '',
    employment_type: '常勤',
    salary_type: '月給',
    salary_amount: '',
    work_hours: '',
    work_days: '',
    location: '',
    description: '',
    required_license: 'rn',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUserId(data.user.id)
    })
  }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setLoading(true)

    const { error } = await supabase.from('regular_jobs').insert({
      facility_id: userId,
      title: form.title,
      employment_type: form.employment_type,
      salary_type: form.salary_type,
      salary_amount: parseInt(form.salary_amount),
      work_hours: form.work_hours,
      work_days: form.work_days,
      location: form.location,
      description: form.description,
      required_license: form.required_license,
      status: 'open',
    })

    if (!error) {
      await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `【新着求人・${form.employment_type}】\n💼 ${form.title}\n📍 ${form.location}\n💰 ${form.salary_type} ¥${parseInt(form.salary_amount).toLocaleString()}\n⏰ ${form.work_hours}\n\n詳細はこちら👇\nhttps://irodori0305.jp/regular-jobs`,
        }),
      })
      setDone(true)
    } else {
      alert('投稿に失敗しました: ' + error.message)
    }
    setLoading(false)
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }

  if (done) return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>求人を投稿しました</h2>
      <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: 12, background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        ダッシュボードへ
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>← 戻る</button>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>常勤・パート求人を投稿する</h1>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #EDE0E0' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>求人タイトル *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)} style={inp} placeholder='例：正看護師募集・クリニック外来' />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>雇用形態 *</label>
            <select required value={form.employment_type} onChange={e => set('employment_type', e.target.value)} style={inp}>
              <option>常勤</option>
              <option>パート</option>
              <option>契約社員</option>
              <option>派遣</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>給与形態 *</label>
            <select required value={form.salary_type} onChange={e => set('salary_type', e.target.value)} style={inp}>
              <option>月給</option>
              <option>時給</option>
              <option>日給</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>給与金額（円） *</label>
          <input required type='number' value={form.salary_amount} onChange={e => set('salary_amount', e.target.value)} style={inp} placeholder='例：250000' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>勤務地 *</label>
          <input required value={form.location} onChange={e => set('location', e.target.value)} style={inp} placeholder='例：沖縄県那覇市おもろまち1-1-1' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>勤務時間 *</label>
          <input required value={form.work_hours} onChange={e => set('work_hours', e.target.value)} style={inp} placeholder='例：08:30〜17:30' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>勤務日 *</label>
          <input required value={form.work_days} onChange={e => set('work_days', e.target.value)} style={inp} placeholder='例：月〜金（土日祝休み）' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>必要資格 *</label>
          <select required value={form.required_license} onChange={e => set('required_license', e.target.value)} style={inp}>
            <option value='rn'>正看護師</option>
            <option value='lpn'>准看護師以上</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>業務内容 *</label>
          <textarea required value={form.description} onChange={e => set('description', e.target.value)}
            placeholder='業務内容、職場環境、待遇など...'
            style={{ ...inp, height: '120px', resize: 'vertical' }} />
        </div>

        <button type='submit' disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '投稿中...' : '求人を投稿する'}
        </button>
      </form>
    </div>
  )
}
