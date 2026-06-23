'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Nurse = {
  id: string
  name: string
  license: string
  experience_years: number
  areas: string[]
  skills: string[]
  license_url: string | null
  job_status: string | null
}

type Job = { id: string; work_date: string; time_from: string; time_to: string; wage_amount: number }

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  looking_for_part: { label: 'バイト探し中', color: '#065F46', bg: '#D1FAE5' },
  looking_for_job: { label: '転職活動中', color: '#1E40AF', bg: '#DBEAFE' },
  looking_for_both: { label: 'どちらも検討中', color: '#92400E', bg: '#FEF3C7' },
  not_looking: { label: '募集停止中', color: '#64748B', bg: '#F1F5F9' },
}

const AREAS = ['那覇市', '浦添市', '宜野湾市', '沖縄市', 'うるま市', '名護市', '糸満市', '豊見城市', 'その他']
const STATUSES = ['looking_for_part', 'looking_for_job', 'looking_for_both']

export default function NursesPage() {
  const router = useRouter()
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [plan, setPlan] = useState('none')
  const [scoutCount, setScoutCount] = useState(0)
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [scoutModal, setScoutModal] = useState<Nurse | null>(null)
  const [scoutMessage, setScoutMessage] = useState('')
  const [scoutJobId, setScoutJobId] = useState('')
  const [sending, setSending] = useState(false)
  const [sentDone, setSentDone] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: facility } = await supabase.from('facilities').select('plan_status, is_subscribed, subscription_plan').eq('id', user.id).maybeSingle()
      const planStatus = facility?.plan_status
      const subPlan = facility?.subscription_plan ?? 'ume'
      if (planStatus === 'active') {
        setPlan(subPlan)
      }

      // 今月のスカウト数
      const thisMonth = new Date()
      const monthStr = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`
      const { count } = await supabase.from('scouts').select('id', { count: 'exact' }).eq('facility_id', user.id).gte('created_at', `${monthStr}-01`)
      setScoutCount(count ?? 0)

      // 看護師一覧
      const { data: nurseData } = await supabase.from('nurse_profiles').select('id, name, license, experience_years, areas, skills, license_url, job_status').not('name', 'is', null)
      setNurses((nurseData ?? []).filter((n: any) => n.job_status !== 'not_looking'))

      // 自分の求人
      const { data: jobData } = await supabase.from('jobs').select('id, work_date, time_from, time_to, wage_amount').eq('facility_id', user.id).eq('status', 'open').order('work_date', { ascending: true })
      setJobs(jobData ?? [])

      setLoading(false)
    }
    init()
  }, [])

  const canScout = plan !== 'none' && plan !== 'ume'
  const scoutLimit = plan === 'take' ? 5 : plan === 'matsu_monthly' || plan === 'matsu_initial' ? Infinity : 0
  const remainingScouts = scoutLimit === Infinity ? Infinity : scoutLimit - scoutCount

  const sendScout = async () => {
    if (!scoutModal || !scoutMessage.trim()) return
    setSending(true)
    await supabase.from('scouts').insert({
      facility_id: userId,
      nurse_id: scoutModal.id,
      job_id: scoutJobId || null,
      message: scoutMessage,
      status: 'pending',
    })

    // メール通知
    await fetch('/api/scout-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nurseId: scoutModal.id,
        nurseName: scoutModal.name,
        message: scoutMessage,
        jobId: scoutJobId || null,
      }),
    })

    setScoutCount(c => c + 1)
    setSending(false)
    setSentDone(true)
    setTimeout(() => { setSentDone(false); setScoutModal(null); setScoutMessage(''); setScoutJobId('') }, 2000)
  }

  const filtered = nurses.filter(n => {
    if (selectedArea && !n.areas?.includes(selectedArea)) return false
    if (selectedStatus && n.job_status !== selectedStatus) return false
    return true
  })

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400, background: active ? '#E07070' : '#fff', color: active ? '#fff' : '#64748B', border: `1px solid ${active ? '#E07070' : '#EDE0E0'}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )

  if (loading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>読み込み中...</div>

  return (
    <div style={{ background: '#FBF7F7', minHeight: '100vh', paddingBottom: 60, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A2235', marginBottom: 4 }}>看護師を探す</h1>
            <div style={{ fontSize: 13, color: '#64748B' }}>スカウトを送って直接アプローチできます</div>
          </div>
          {canScout && (
            <div style={{ background: '#fff', border: '1px solid #EDE0E0', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>今月のスカウト残数</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#E07070' }}>{scoutLimit === Infinity ? '無制限' : `${remainingScouts}件`}</div>
            </div>
          )}
        </div>

        {/* プラン制限バナー */}
        {!canScout && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>スカウト機能はスタンダード以上のプランで利用できます</div>
            <div style={{ fontSize: 12, color: '#854F0B' }}>看護師の一覧は閲覧できますが、スカウトの送信にはプランのアップグレードが必要です</div>
          </div>
        )}

        {/* フィルター */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>📍 エリア</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {chip('すべて', !selectedArea, () => setSelectedArea(''))}
            {AREAS.map(a => chip(a, selectedArea === a, () => setSelectedArea(selectedArea === a ? '' : a)))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>🙋 ステータス</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {chip('すべて', !selectedStatus, () => setSelectedStatus(''))}
            {STATUSES.map(s => chip(STATUS_MAP[s]?.label ?? s, selectedStatus === s, () => setSelectedStatus(selectedStatus === s ? '' : s)))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>{filtered.length}名の看護師</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(nurse => {
            const st = STATUS_MAP[nurse.job_status ?? ''] ?? STATUS_MAP.looking_for_part
            return (
              <div key={nurse.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FDF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#E07070', flexShrink: 0 }}>
                    {canScout ? (nurse.name?.charAt(0) ?? '?') : '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{canScout ? nurse.name : '――'}</span>
                      <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                      {nurse.license === 'rn' ? '正看護師' : '准看護師'}
                      {nurse.experience_years ? ` · 経験${nurse.experience_years}年` : ''}
                      {canScout && nurse.areas?.length ? ` · ${nurse.areas.join('・')}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {nurse.license_url && <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>免許証提出済み</span>}
                      {(nurse.skills ?? []).map(s => <span key={s} style={{ background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{s}</span>)}
                    </div>
                  </div>
                  <button
                    onClick={() => { if (canScout && remainingScouts > 0) setScoutModal(nurse) }}
                    disabled={!canScout || remainingScouts <= 0}
                    style={{ padding: '8px 16px', background: canScout && remainingScouts > 0 ? '#E07070' : '#F1F5F9', color: canScout && remainingScouts > 0 ? '#fff' : '#94A3B8', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canScout && remainingScouts > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    スカウト
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* スカウト送信モーダル */}
      {scoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{scoutModal.name}さんにスカウト</div>
              <button onClick={() => setScoutModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>メッセージと求人を添えて送りましょう</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>求人を添付（任意）</label>
              <select value={scoutJobId} onChange={e => setScoutJobId(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #EDE0E0', borderRadius: 8, fontSize: 13, background: '#fff', fontFamily: 'inherit' }}>
                <option value="">求人を選択しない</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.work_date} {j.time_from}〜{j.time_to} 日給¥{j.wage_amount.toLocaleString()}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>メッセージ *</label>
              <textarea value={scoutMessage} onChange={e => setScoutMessage(e.target.value)} placeholder="ぜひ一度お話しできればと思います..." style={{ width: '100%', height: 100, padding: '9px 12px', border: '1.5px solid #EDE0E0', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setScoutModal(null)} style={{ flex: 1, padding: '11px', background: '#fff', color: '#64748B', border: '1px solid #EDE0E0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>キャンセル</button>
              <button onClick={sendScout} disabled={sending || !scoutMessage.trim()} style={{ flex: 2, padding: '11px', background: sentDone ? '#6BAF92' : '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {sending ? '送信中...' : sentDone ? '送信しました！' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
