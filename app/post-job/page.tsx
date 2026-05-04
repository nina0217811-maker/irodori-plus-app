'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PostJobPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    work_date: '',
    time_from: '08:00',
    time_to: '17:00',
    wage_amount: '',
    facility_type: '',
    required_license: 'rn',
    description: '',
    is_urgent: false,
    tags: '',
    required_count: 1,
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

    const tagsArray = form.tags
      ? form.tags.split('　').concat(form.tags.split(' ')).filter(t => t.trim()).map(t => t.trim()).filter((v, i, a) => a.indexOf(v) === i)
      : []

    const { error } = await supabase.from('jobs').insert({
      facility_id: userId,
      work_date: form.work_date,
      time_from: form.time_from,
      time_to: form.time_to,
      wage_amount: parseInt(form.wage_amount),
      facility_type: form.facility_type,
      required_license: form.required_license,
      description: form.description,
      is_urgent: form.is_urgent,
      tags: tagsArray,
        required_count: form.required_count,
      status: 'open',
    })

    if (!error) {
      await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `【新着求人】\n📅 ${form.work_date}\n⏰ ${form.time_from}〜${form.time_to}\n🏥 ${form.facility_type}\n💰 日給 ¥${parseInt(form.wage_amount).toLocaleString()}\n\n求人を見る👇\nhttps://irodori0305.jp/jobs`,
        }),
      })
      setDone(true)
    } else {
      alert('投稿に失敗しました: ' + JSON.stringify(error))
    }
    setLoading(false)
  }

  if (done) return (
    <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>求人を投稿しました</h2>
      <p style={{ color: '#64748B', lineHeight: '1.7', marginBottom: '28px' }}>
        看護師からの応募が来たらお知らせします。
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          width: '100%', padding: '12px',
          background: '#E07070', color: '#fff',
          border: 'none', borderRadius: '8px',
          fontSize: '15px', fontWeight: '700', cursor: 'pointer',
        }}
      >
        ダッシュボードへ
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>
      <button
        onClick={() => router.push('/dashboard')}
        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', marginBottom: '20px' }}
      >
        ← 戻る
      </button>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px' }}>求人を投稿する</h1>

      <form onSubmit={handleSubmit} style={{
        background: '#fff', borderRadius: '12px', padding: '28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #EDE0E0',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>勤務日 *</label>
          <input type='date' required value={form.work_date} onChange={e => set('work_date', e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>開始時間 *</label>
            <input type='time' required value={form.time_from} onChange={e => set('time_from', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>終了時間 *</label>
            <input type='time' required value={form.time_to} onChange={e => set('time_to', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>日給（円・税込） *</label>
          <input type='number' required placeholder='25000' value={form.wage_amount} onChange={e => set('wage_amount', e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>施設種別 *</label>
          <select required value={form.facility_type} onChange={e => set('facility_type', e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}>
            <option value=''>選択してください</option>
            <option>病院</option>
            <option>クリニック</option>
            <option>介護老人保健施設</option>
            <option>訪問看護</option>
            <option>保育園</option>
            <option>その他</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>必要資格 *</label>
          <select required value={form.required_license} onChange={e => set('required_license', e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}>
            <option value='rn'>正看護師</option>
            <option value='lpn'>准看護師以上</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>業務内容 *</label>
          <textarea required value={form.description} onChange={e => set('description', e.target.value)}
            placeholder='業務内容、持ち物、注意点など...'
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', height: '100px', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>タグ（スペース区切り）</label>
          <input type='text' placeholder='夜勤なし 駅徒歩3分 交通費支給' value={form.tags} onChange={e => set('tags', e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'4px',fontWeight:'600'}}>募集人数</label><input type='number' min='1' max='99' value={form.required_count} onChange={e => set('required_count', parseInt(e.target.value))} style={{width:'80px',padding:'8px',borderRadius:'8px',border:'1px solid #ddd'}} /><span style={{marginLeft:'8px'}}>名</span></div>
            style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
          <label htmlFor='urgent' style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>急募にする</label>
        </div>

        <button type='submit' disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading ? '#ccc' : '#E07070',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '16px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '投稿中...' : '求人を投稿する'}
        </button>
        <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginTop: '12px' }}>
          投稿後すぐに公開されます。月額プランに含まれます。
        </div>
      </form>
    </div>
  )
}