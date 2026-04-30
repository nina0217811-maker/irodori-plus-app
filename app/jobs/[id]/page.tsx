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
  facility_type: string
  required_license: string
  description: string
  is_urgent: boolean
  tags: string[]
  facilities: {
    id: string
    facility_name: string
    address: string
  }
}

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchJob()
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      setUserId(data.user.id)
      checkApplied(data.user.id)
    }
  }

  const checkApplied = async (uid: string) => {
    const { data } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', id)
      .eq('nurse_id', uid)
      .single()
    if (data) setApplied(true)
  }

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`*, facilities (id, facility_name, address)`)
      .eq('id', id)
      .single()

    if (!error && data) setJob(data)
    setLoading(false)
  }

  const handleApply = async () => {
    if (!userId) {
      router.push('/login')
      return
    }
    setApplying(true)

    const { error } = await supabase
      .from('applications')
      .insert({ job_id: id, nurse_id: userId })

    if (!error) {
      // 施設のメールアドレスを取得してメール通知
      const { data: facilityData } = await supabase
        .from('facilities')
        .select('email, facility_name')
        .eq('id', job!.facilities.id)
        .single()

      if (facilityData) {
        const { data: nurseData } = await supabase
          .from('nurses')
          .select('name')
          .eq('id', userId)
          .single()

        await fetch('/api/notify-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            facilityEmail: facilityData.email,
            facilityName: facilityData.facility_name,
            workDate: job!.work_date,
            timeFrom: job!.time_from,
            timeTo: job!.time_to,
            nurseName: nurseData?.name || '看護師',
          }),
        })
      }

      setApplied(true)
      setMessage('応募しました！施設からの連絡をお待ちください。')
    } else {
      setMessage('応募に失敗しました。もう一度お試しください。')
    }
    setApplying(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'sans-serif', color: '#64748B' }}>
      読み込み中...
    </div>
  )

  if (!job) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'sans-serif', color: '#64748B' }}>
      求人が見つかりませんでした
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>

      <button
        onClick={() => router.push('/jobs')}
        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}
      >
        ← 一覧に戻る
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        <div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                  {job.facilities?.facility_name}
                </h1>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  {job.facilities?.address} · {job.facility_type}
                </div>
              </div>
              {job.is_urgent && (
                <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  急募
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#FBF7F7', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              {[
                ['📅 勤務日', job.work_date],
                ['⏰ 時間', `${job.time_from}〜${job.time_to}`],
                ['🏥 施設種別', job.facility_type],
                ['👩‍⚕️ 必要資格', job.required_license === 'rn' ? '正看護師' : '准看護師以上'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>業務内容</div>
              <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#1A2235' }}>{job.description}</p>
            </div>

            {job.tags && job.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {job.tags.map(tag => (
                  <span key={tag} style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#E07070' }}>
                ¥{job.wage_amount.toLocaleString()}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>日給（税込・振込）</div>
            </div>

            {message && (
              <div style={{ background: applied ? '#D1FAE5' : '#FEE2E2', color: applied ? '#065F46' : '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {message}
              </div>
            )}

            {applied ? (
              <div style={{ textAlign: 'center', padding: '20px', background: '#FDF0F0', borderRadius: '10px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontWeight: '700', color: '#C45A5A' }}>応募済み</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>施設からの返信をお待ちください</div>
                <button
                  onClick={async () => {
                    const { data } = await supabase
                      .from('applications')
                      .select('id')
                      .eq('job_id', id)
                      .eq('nurse_id', userId)
                      .single()
                    if (data) router.push(`/chat/${data.id}`)
                  }}
                  style={{ width: '100%', padding: '10px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '12px' }}
                >
                  💬 施設とチャットする
                </button>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                style={{ width: '100%', padding: '14px', background: applying ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: applying ? 'not-allowed' : 'pointer' }}
              >
                {applying ? '応募中...' : 'この求人に応募する'}
              </button>
            )}

            <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748B', lineHeight: '1.8' }}>
              ✅ 手数料ゼロ<br />
              ✅ 翌週振込保証<br />
              ✅ キャンセル保険あり
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}