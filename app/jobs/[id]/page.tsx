'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type Job = {
  id: string
  work_date: string
  time_from: string
  time_to: string
  wage_amount: number
  wage_type: string
  facility_type: string
  required_license: string
  description: string
  hire_flow?: string
  address: string | null
  items_to_bring: string | null
  dress_code: string | null
  parking: string | null
  lunch: string | null
  is_urgent: boolean
  tags: string[]
  status: string
  facilities: {
    id: string
    facility_name: string
    address: string
  }
}

const C = {
  primary: '#E07070',
  primaryDark: '#C45A5A',
  primaryDeep: '#9B3A3A',
  primaryLight: '#FDF0F0',
  primaryBorder: '#EDE0E0',
  primaryBg: '#FDFAFA',
  primaryMuted: '#8C5A5A',
  primarySub: '#7A6060',
  text: '#1A2235',
  textSub: '#3D3D3D',
  urgent: '#991B1B',
  gold: '#D97706',
}

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<'nurse' | 'facility' | null>(null)
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreedPolicy, setAgreedPolicy] = useState(false)

  useEffect(() => {
    fetchJob()
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    setUserId(data.user.id)
    const { data: facility } = await supabase.from('facilities').select('id').eq('id', data.user.id).maybeSingle()
    const userRole = facility ? 'facility' : 'nurse'
    setRole(userRole)
    if (userRole === 'nurse') checkApplied(data.user.id)
  }

  const checkApplied = async (uid: string) => {
    const { data } = await supabase.from('applications').select('id').eq('job_id', id).eq('nurse_id', uid).single()
    if (data) setApplied(true)
  }

  const fetchJob = async () => {
    const { data, error } = await supabase.from('jobs').select(`*, facilities (id, facility_name, address), hire_flow`).eq('id', id).single()
    if (!error && data) setJob(data)
    setLoading(false)
  }

  const handleApply = async () => {
    if (!userId) { router.push('/login'); return }
    setApplying(true)
    const { data: nurseProfile } = await supabase.from('nurse_profiles').select('is_suspended').eq('id', userId).maybeSingle()
    if (nurseProfile?.is_suspended) {
      alert('アカウントが停止されています。運営にお問い合わせください。')
      setApplying(false)
      return
    }
    const { error } = await supabase.from('applications').insert({ job_id: id, nurse_id: userId })
    if (!error) {
      await fetch('/api/notify-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId: job!.facilities.id, nurseId: userId, jobId: id }),
      })
      setApplied(true)
      setMessage('応募しました！施設からの連絡をお待ちください。')
    } else {
      setMessage('応募に失敗しました。もう一度お試しください。')
    }
    setApplying(false)
  }

  const calcEstimate = () => {
    if (!job || job.wage_type !== 'hourly') return null
    const [fh, fm] = job.time_from.split(':').map(Number)
    const [th, tm] = job.time_to.split(':').map(Number)
    const hours = (th * 60 + tm - fh * 60 - fm) / 60
    if (hours <= 0) return null
    return Math.round(job.wage_amount * hours)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'sans-serif', color: C.primarySub }}>読み込み中...</div>
  )
  if (!job) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'sans-serif', color: C.primarySub }}>求人が見つかりませんでした</div>
  )

  const isFilled = job.status === 'filled'
  const estimate = calcEstimate()
  const displayAddress = job.address || job.facilities?.address || ''

  const renderApplySection = () => {
    if (role === 'facility') {
      return (
        <div style={{ textAlign: 'center', padding: '16px', background: '#F1F5F9', borderRadius: '10px', fontSize: '13px', color: '#64748B' }}>
          施設アカウントでは応募できません
        </div>
      )
    }
    if (isFilled) {
      return (
        <div style={{ textAlign: 'center', padding: '16px', background: '#F1F5F9', borderRadius: '10px' }}>
          <div style={{ fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>募集終了</div>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>この求人は募集人数に達しました</div>
        </div>
      )
    }
    if (applied) {
      return (
        <div style={{ textAlign: 'center', padding: '16px', background: C.primaryLight, borderRadius: '10px' }}>
          <div style={{ fontWeight: '600', color: C.primaryDark, marginBottom: '4px' }}>応募済み</div>
          <div style={{ fontSize: '12px', color: C.primarySub, marginBottom: '12px' }}>施設からの返信をお待ちください</div>
          <button
            onClick={async () => {
              const { data } = await supabase.from('applications').select('id').eq('job_id', id).eq('nurse_id', userId).single()
              if (data) router.push(`/chat/${data.id}`)
            }}
            style={{ width: '100%', padding: '12px', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            施設とチャットする
          </button>
        </div>
      )
    }
    if (showConfirm) {
      return (
        <div style={{ background: C.primaryLight, borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: C.text }}>応募前に確認してください</div>
          {[
            `勤務日：${job.work_date}`,
            `時間：${job.time_from}〜${job.time_to}`,
            `場所：${displayAddress}`,
            `${job.wage_type === 'hourly' ? `時給：¥${job.wage_amount.toLocaleString()}${estimate ? `（想定日給 ¥${estimate.toLocaleString()}）` : ''}` : `日給：¥${job.wage_amount.toLocaleString()}`}`,
          ].map(item => (
            <div key={item} style={{ fontSize: '13px', color: C.text, padding: '6px 0', borderBottom: `1px solid ${C.primaryBorder}` }}>{item}</div>
          ))}
          <div style={{ marginTop: '12px', background: '#FFF7ED', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '12px', lineHeight: '1.8', color: C.text }}>
            <div style={{ fontWeight: '600', color: C.primaryDark, marginBottom: '6px' }}>キャンセルポリシー</div>
            <div>・勤務24時間前までのキャンセルは無料</div>
            <div>・勤務12時間前以降は直前キャンセルとして記録</div>
            <div>・無断欠勤・連絡不履行はアカウント停止</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" checked={agreedPolicy} onChange={e => setAgreedPolicy(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: C.text, lineHeight: '1.6' }}>キャンセルポリシーを確認し、確実に勤務できる場合のみ応募します</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowConfirm(false); setAgreedPolicy(false) }}
              style={{ flex: 1, padding: '11px', background: '#fff', color: C.primarySub, border: `1px solid ${C.primaryBorder}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
            >
              戻る
            </button>
            <button
              onClick={() => { setShowConfirm(false); handleApply() }}
              disabled={applying || !agreedPolicy}
              style={{ flex: 2, padding: '11px', background: applying || !agreedPolicy ? '#ccc' : C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: applying || !agreedPolicy ? 'not-allowed' : 'pointer' }}
            >
              {applying ? '応募中...' : '確認しました・応募する'}
            </button>
          </div>
        </div>
      )
    }
    return (
      <button
        onClick={() => setShowConfirm(true)}
        style={{ width: '100%', padding: '14px', background: C.primary, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
      >
        この求人に応募する
      </button>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', fontFamily: 'sans-serif', background: '#F8F5F5', minHeight: '100vh' }}>

      {/* ヒーロー */}
      <div style={{ background: isFilled ? '#94A3B8' : C.primary, padding: '20px 20px 24px' }}>
        <button
          onClick={() => router.push('/jobs')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '13px', cursor: 'pointer', marginBottom: '14px', padding: 0 }}
        >
          ← 一覧に戻る
        </button>

        {isFilled && (
          <div style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', textAlign: 'center', padding: '8px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: '600' }}>
            募集人数に達しました
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {job.is_urgent && !isFilled && (
            <span style={{ background: C.urgent, color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '99px' }}>急募</span>
          )}
          {job.facility_type && (
            <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '99px' }}>{job.facility_type}</span>
          )}
          {job.tags && job.tags.map(tag => (
            <span key={tag} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '99px' }}>{tag}</span>
          ))}
        </div>

        <div style={{ fontSize: '20px', fontWeight: '600', color: '#FFFFFF', lineHeight: '1.3', marginBottom: '4px' }}>
          {job.facilities?.facility_name}
        </div>
        {displayAddress && (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
            {displayAddress}
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>

        {/* 給与 + 4グリッド */}
        <div style={{ background: C.primaryLight, borderRadius: '14px', padding: '16px 18px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: C.primaryMuted, marginBottom: '2px' }}>
                {job.wage_type === 'hourly' ? '時給（税込・振込）' : '日給（税込・振込）'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: isFilled ? '#94A3B8' : C.primary }}>
                ¥{job.wage_amount.toLocaleString()}
              </div>
              {job.wage_type === 'hourly' && estimate && (
                <div style={{ fontSize: '12px', color: C.primaryMuted, marginTop: '2px' }}>
                  想定日給 ¥{estimate.toLocaleString()}
                </div>
              )}
            </div>
            {!isFilled && !applied && role !== 'facility' && (
              <button
                onClick={() => setShowConfirm(true)}
                style={{ background: C.primary, color: '#fff', fontSize: '13px', fontWeight: '600', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
              >
                応募する
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: '勤務日', value: job.work_date },
              { label: '時間', value: `${job.time_from}〜${job.time_to}` },
              { label: '施設種別', value: job.facility_type },
              { label: '必要資格', value: job.required_license === 'rn' ? '正看護師' : '准看護師以上' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#FFFFFF', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: C.primaryMuted, marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: C.text }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div style={{ background: applied ? '#D1FAE5' : '#FEE2E2', color: applied ? '#065F46' : '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {/* 業務内容 */}
        <div style={{ background: '#FFFFFF', border: `0.5px solid ${C.primaryBorder}`, borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
          {job.hire_flow === 'interview' && (
            <div style={{ background: '#EDE9FB', border: '0.5px solid #7F77DD', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>💬</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#26215C', marginBottom: '3px' }}>面談型の求人です</div>
                <div style={{ fontSize: '12px', color: '#3C3489', lineHeight: '1.7' }}>応募後、施設とチャットで面談日程を調整してから採用が確定します</div>
              </div>
            </div>
          )}
          {(!job.hire_flow || job.hire_flow === 'direct') && (
            <div style={{ background: '#FDF0F0', border: '0.5px solid #E07070', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#7A2A1C', marginBottom: '3px' }}>即採用型の求人です</div>
                <div style={{ fontSize: '12px', color: '#9A4A36', lineHeight: '1.7' }}>施設が採用確定後、チャットで勤務詳細を確認できます</div>
              </div>
            </div>
          )}
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.text, marginBottom: '10px' }}>業務内容</div>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: C.textSub, margin: 0 }}>{job.description}</p>
          {[
            { label: '持ち物・準備物', value: job.items_to_bring },
            { label: '服装・身だしなみ', value: job.dress_code },
            { label: '駐車場', value: job.parking },
            { label: '昼食', value: job.lunch },
          ].filter(item => item.value).map(item => (
            <div key={item.label} style={{ marginTop: '10px', padding: '10px 12px', background: C.primaryLight, borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: C.primaryMuted, marginBottom: '2px' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: C.text }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* 応募エリア */}
        <div style={{ marginBottom: '14px' }}>
          {renderApplySection()}
        </div>

      </div>

      {/* 下部追従バー */}
      {!showConfirm && !applied && !isFilled && role !== 'facility' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#FFFFFF', borderTop: `0.5px solid ${C.primaryBorder}`,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
          zIndex: 50,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: C.primarySub }}>{job.facilities?.facility_name}</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: C.primaryDark }}>
              ¥{job.wage_amount.toLocaleString()} / {job.wage_type === 'hourly' ? '時' : '日'}
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            style={{ background: C.primary, color: '#fff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
          >
            応募する
          </button>
        </div>
      )}

      <div style={{ height: '80px' }} />
    </div>
  )
}
