'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type FormState = {
  work_date: string
  time_from: string
  time_to: string
  wage_type: string
  wage_amount: string
  facility_type: string
  required_license: string
  description: string
  items_to_bring: string
  dress_code: string
  parking: string
  lunch: string
  is_urgent: boolean
  tags: string
  required_count: number
  address: string
}

export default function PostJobPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [facilityAddress, setFacilityAddress] = useState('')
  const [lastForm, setLastForm] = useState<FormState | null>(null)
  const [form, setForm] = useState<FormState>({
    work_date: '',
    time_from: '08:00',
    time_to: '17:00',
    wage_type: 'daily',
    wage_amount: '',
    facility_type: '',
    required_license: 'rn',
    description: '',
    items_to_bring: '',
    dress_code: '',
    parking: '',
    lunch: '',
    is_urgent: false,
    tags: '',
    required_count: 1,
    address: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      const { data: facility } = await supabase
        .from('facilities')
        .select('address, facility_type')
        .eq('id', data.user.id)
        .maybeSingle()
      if (facility?.address) {
        setFacilityAddress(facility.address)
        setForm(f => ({ ...f, address: facility.address, facility_type: facility.facility_type ?? '' }))
      }
    })
  }, [])

  const [isSubscribed, setIsSubscribed] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)

  useEffect(() => {
    const checkPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: facility } = await supabase.from('facilities').select('plan_status, is_subscribed').eq('id', user.id).maybeSingle()
      if (!facility || (facility.plan_status !== 'active' && !facility.is_subscribed)) {
        setIsSubscribed(false)
        setShowPlanModal(true)
      }
    }
    checkPlan()
  }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const calcEstimate = () => {
    if (form.wage_type !== 'hourly' || !form.wage_amount || !form.time_from || !form.time_to) return null
    const [fh, fm] = form.time_from.split(':').map(Number)
    const [th, tm] = form.time_to.split(':').map(Number)
    const hours = (th * 60 + tm - fh * 60 - fm) / 60
    if (hours <= 0) return null
    return Math.round(parseInt(form.wage_amount) * hours)
  }

  const estimate = calcEstimate()

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPolicy(true)
  }

  const handleSubmit = async () => {
    if (!userId || !agreed) return
    setShowPolicy(false)
    setLoading(true)

    const tagsArray = form.tags
      ? form.tags.split('　').concat(form.tags.split(' ')).filter(t => t.trim()).map(t => t.trim()).filter((v, i, a) => a.indexOf(v) === i)
      : []

    const { data: insertedJob, error } = await supabase.from('jobs').insert({
      facility_id: userId,
      work_date: form.work_date,
      time_from: form.time_from,
      time_to: form.time_to,
      wage_type: form.wage_type,
      wage_amount: parseInt(form.wage_amount),
      facility_type: form.facility_type,
      required_license: form.required_license,
      description: form.description,
      items_to_bring: form.items_to_bring || null,
      dress_code: form.dress_code || null,
      parking: form.parking || null,
      lunch: form.lunch || null,
      is_urgent: form.is_urgent,
      tags: tagsArray,
      required_count: form.required_count,
      address: form.address || facilityAddress,
      status: 'open',
    }).select()

    if (!error) {
      const { data: facilityData } = await supabase
        .from('facilities')
        .select('facility_name, address')
        .eq('id', userId)
        .maybeSingle()

      const facilityName = facilityData?.facility_name ?? ''
      const address = form.address || facilityData?.address || ''
      const wageLabel = form.wage_type === 'hourly'
        ? `時給 ¥${parseInt(form.wage_amount).toLocaleString()}${estimate ? `（想定日給 ¥${estimate.toLocaleString()}）` : ''}`
        : `日給 ¥${parseInt(form.wage_amount).toLocaleString()}`

      const insertedId = insertedJob?.[0]?.id ?? ''
      // 全体LINE通知
      await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `【新着求人】\n📅 ${form.work_date}\n⏰ ${form.time_from}〜${form.time_to}\n🏥 ${facilityName}（${form.facility_type}）\n📍 ${address}\n💰 ${wageLabel}${form.description ? `\n📝 ${form.description}` : ''}\n\n求人を見る👇\nhttps://irodori0305.jp/jobs`,
        }),
      })

      // 希望条件マッチング通知
      await fetch('/api/match-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: insertedId,
          facilityName,
          workDate: form.work_date,
          timeFrom: form.time_from,
          timeTo: form.time_to,
          wageLabel,
          address,
          facilityType: form.facility_type,
          wageAmount: parseInt(form.wage_amount),
          description: form.description,
      items_to_bring: form.items_to_bring || null,
      dress_code: form.dress_code || null,
      parking: form.parking || null,
      lunch: form.lunch || null,
        }),
      })
      setLastForm({ ...form })
      setDone(true)
    } else {
      alert('投稿に失敗しました: ' + JSON.stringify(error))
    }
    setLoading(false)
  }

  // 別の日にコピーして再投稿
  const handleCopy = () => {
    if (!lastForm) return
    setForm({ ...lastForm, work_date: '' })
    setDone(false)
    setAgreed(false)
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }

  if (done) return (
    <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>求人を投稿しました</h2>
      <p style={{ color: '#64748B', lineHeight: '1.7', marginBottom: '28px' }}>
        看護師からの応募が来たらお知らせします。
      </p>

      {/* 投稿内容サマリー */}
      <div style={{ background: '#FBF7F7', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px', fontWeight: '600' }}>投稿した求人</div>
        {[
          ['📅 勤務日', lastForm?.work_date],
          ['⏰ 時間', `${lastForm?.time_from}〜${lastForm?.time_to}`],
          ['💰 給与', lastForm?.wage_type === 'hourly' ? `時給 ¥${parseInt(lastForm?.wage_amount || '0').toLocaleString()}` : `日給 ¥${parseInt(lastForm?.wage_amount || '0').toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ display: 'flex', gap: '8px', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #EDE0E0' }}>
            <span style={{ color: '#64748B', minWidth: '80px' }}>{label}</span>
            <span style={{ fontWeight: '600', color: '#1A2235' }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* 別の日にコピーボタン */}
        <button
          onClick={handleCopy}
          style={{ width: '100%', padding: '14px', background: '#fff', color: '#E07070', border: '2px solid #E07070', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
        >
          📋 別の日にコピーして投稿する
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ width: '100%', padding: '14px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
        >
          ダッシュボードへ
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>

      {showPolicy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1A2235' }}>求人掲載にあたって</h2>
            <div style={{ background: '#FDF0F0', borderRadius: '10px', padding: '16px', marginBottom: '16px', fontSize: '13px', lineHeight: '2', color: '#1A2235' }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: '#C45A5A' }}>【施設側のキャンセルポリシー】</div>
              <div>✅ 勤務24時間前までのキャンセルは無料</div>
              <div>⚠️ 勤務12時間前以降のキャンセルは直前キャンセルとして記録されます</div>
              <div style={{ marginTop: '12px', fontWeight: '700', marginBottom: '8px', color: '#C45A5A' }}>【禁止事項】</div>
              <div>❌ 虚偽の求人情報の掲載</div>
              <div>❌ 採用確定後の直前条件変更</div>
              <div>❌ 施設都合による直前キャンセルの繰り返し</div>
              <div>❌ 看護師への連絡不履行</div>
              <div style={{ marginTop: '12px', fontWeight: '700', marginBottom: '8px', color: '#C45A5A' }}>【違反した場合】</div>
              <div>求人掲載停止・利用停止の措置を取る場合があります</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
              <input type='checkbox' checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#1A2235', lineHeight: '1.6' }}>上記のキャンセルポリシーおよび禁止事項を確認し、同意します</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowPolicy(false); setAgreed(false) }} style={{ flex: 1, padding: '12px', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>戻る</button>
              <button onClick={handleSubmit} disabled={!agreed || loading} style={{ flex: 2, padding: '12px', background: !agreed || loading ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: !agreed || loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '投稿中...' : '同意して求人を掲載する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', marginBottom: '20px' }}>← 戻る</button>

      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>求人を投稿する</h1>
      {lastForm && (
        <div style={{ fontSize: '13px', color: '#E07070', fontWeight: '600', marginBottom: '20px' }}>
          📋 前回の内容をコピーしました。勤務日を変更して投稿してください
        </div>
      )}
      {!lastForm && <div style={{ marginBottom: '24px' }} />}

      <form onSubmit={handleSubmitClick} style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #EDE0E0' }}>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>勤務日 *</label>
          <input type='date' required value={form.work_date} onChange={e => set('work_date', e.target.value)} style={inp} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>開始時間 *</label>
            <input type='time' required value={form.time_from} onChange={e => set('time_from', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>終了時間 *</label>
            <input type='time' required value={form.time_to} onChange={e => set('time_to', e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '8px' }}>給与タイプ *</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ value: 'daily', label: '日給' }, { value: 'hourly', label: '時給' }].map(opt => (
              <button key={opt.value} type='button' onClick={() => set('wage_type', opt.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: form.wage_type === opt.value ? '#E07070' : '#F1F5F9', color: form.wage_type === opt.value ? '#fff' : '#64748B', border: form.wage_type === opt.value ? 'none' : '1.5px solid #EDE0E0' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>
            {form.wage_type === 'hourly' ? '時給（円・税込） *' : '日給（円・税込） *'}
          </label>
          <input type='number' required placeholder={form.wage_type === 'hourly' ? '2000' : '25000'} value={form.wage_amount} onChange={e => set('wage_amount', e.target.value)} style={inp} />
          {form.wage_type === 'hourly' && estimate && (
            <div style={{ marginTop: '6px', fontSize: '13px', color: '#E07070', fontWeight: '600' }}>
              想定日給：¥{estimate.toLocaleString()}（{form.time_from}〜{form.time_to}の場合）
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>勤務地</label>
          <input type='text' placeholder={facilityAddress || '例：那覇市おもろまち1-2-3'} value={form.address} onChange={e => set('address', e.target.value)} style={inp} />
          {facilityAddress && (
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>空欄の場合は施設住所（{facilityAddress}）が使われます</div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>施設種別 *</label>
          <select required value={form.facility_type} onChange={e => set('facility_type', e.target.value)} style={{ ...inp, background: '#fff' }}>
            <option value=''>選択してください</option>
            {['病院','クリニック','介護老人保健施設','訪問看護','デイサービス','訪問入浴','グループホーム','特別養護老人ホーム','有料老人ホーム','障害者施設','保育園','その他'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>必要資格 *</label>
          <select required value={form.required_license} onChange={e => set('required_license', e.target.value)} style={{ ...inp, background: '#fff' }}>
            <option value='rn'>正看護師</option>
            <option value='lpn'>准看護師以上</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>業務内容 *</label>
          <textarea required value={form.description} onChange={e => set('description', e.target.value)} placeholder='業務内容、持ち物、注意点など...' style={{ ...inp, height: '100px', resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: '12px', background: '#FBF7F7', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 10 }}>追加情報（任意）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'items_to_bring', label: '持ち物・準備物', placeholder: '白衣・ナースシューズ・印鑑など' },
              { key: 'dress_code', label: '服装・身だしなみ', placeholder: 'スクラブ支給・私服可など' },
              { key: 'parking', label: '駐車場', placeholder: '無料駐車場あり・近隣コインパーキングなど' },
              { key: 'lunch', label: '昼食', placeholder: '食堂あり・持参・近隣コンビニあり' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>{label}</label>
                <input type='text' value={(form as any)[key]} onChange={e => set(key as any, e.target.value)} placeholder={placeholder} style={{ ...inp, fontSize: 13 }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '6px' }}>タグ（スペース区切り）</label>
          <input type='text' placeholder='夜勤なし 駅徒歩3分 交通費支給' value={form.tags} onChange={e => set('tags', e.target.value)} style={inp} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>募集人数</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type='number' min='1' max='99' value={form.required_count} onChange={e => set('required_count', parseInt(e.target.value))} style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1.5px solid #EDE0E0', fontSize: '14px' }} />
            <span style={{ color: '#64748B', fontSize: '14px' }}>名</span>
          </div>
        </div>

        <button type='submit' disabled={loading || !isSubscribed} onClick={!isSubscribed ? (e) => { e.preventDefault(); setShowPlanModal(true) } : undefined} style={{ width: '100%', padding: '14px', background: loading ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '投稿中...' : '求人を投稿する'}
        </button>
        <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginTop: '12px' }}>
          投稿後すぐに公開されます。月額プランに含まれます。
        </div>
      </form>
    </div>
    )
  </div>
  )
}
