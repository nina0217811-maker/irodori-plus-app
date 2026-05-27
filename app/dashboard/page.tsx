'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Application = {
  id: string
  nurse_id: string
  status: string
}

type Job = {
  id: string
  work_date: string
  time_from: string
  time_to: string
  wage_amount: number
  facility_type: string
  status: string
  is_urgent: boolean
  required_count: number
  applications: Application[]
}

type NurseProfile = {
  nurseId: string
  name: string
  license: string
  experience_years: number
  areas: string[]
  skills: string[]
  age?: number
  gender?: string
  avg_rating?: number
  review_count?: number
  direct_cancel_count?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [facilityName, setFacilityName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<{ jobId: string, nurseId: string, nurseName: string } | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviews, setReviews] = useState<{ nurse_id: string, job_id: string }[]>([])
  const [nurseNames, setNurseNames] = useState<{ [key: string]: string }>({})
  const [renotifying, setRenotifying] = useState<string | null>(null)
  const [profileModal, setProfileModal] = useState<NurseProfile | null>(null)
  const [reportModal, setReportModal] = useState<{ nurseId: string; nurseName: string } | null>(null)
  const [editJobModal, setEditJobModal] = useState<Job | null>(null)
  const [editJobForm, setEditJobForm] = useState({ work_date: '', time_from: '', time_to: '', wage_amount: '', address: '', facility_type: '', description: '' })
  const [savingJob, setSavingJob] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId: user.id, facilityName, email: user.email }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("この求人を削除しますか？")) return
    const { data: apps } = await supabase.from("applications").select("id").eq("job_id", jobId)
    if (apps) {
      for (const app of apps) {
        await supabase.from("messages").delete().eq("application_id", app.id)
      }
    }
    await supabase.from("applications").delete().eq("job_id", jobId)
    await supabase.from("favorites").delete().eq("job_id", jobId)
    await supabase.from("reviews").delete().eq("job_id", jobId)
    await supabase.from("jobs").delete().eq("id", jobId)
    fetchData()
  }

  const handleRenotify = async (job: Job) => {
    setRenotifying(job.id)
    await fetch('/api/line-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `【再募集】キャンセルが出ました！\n📅 ${job.work_date}\n⏰ ${job.time_from}〜${job.time_to}\n🏥 ${job.facility_type}\n💰 日給 ¥${job.wage_amount?.toLocaleString()}\n\n急募！求人を見る👇\nhttps://irodori0305.jp/jobs`,
      }),
    })
    setRenotifying(null)
    alert('再募集通知を送りました！')
  }

  const handleViewProfile = async (nurseId: string) => {
    const { data: np } = await supabase
      .from('nurse_profiles')
      .select('name, license, experience_years, areas, skills, age, gender')
      .eq('id', nurseId)
      .single()

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('nurse_id', nurseId)

    const { data: cancelData } = await supabase
      .from('cancel_history')
      .select('cancel_type')
      .eq('nurse_id', nurseId)

    const avgRating = reviewData && reviewData.length > 0
      ? Math.round(reviewData.reduce((s: number, r: any) => s + r.rating, 0) / reviewData.length * 10) / 10
      : undefined

    const directCancelCount = (cancelData ?? []).filter((c: any) => c.cancel_type === 'direct' || c.cancel_type === 'absent').length

    setProfileModal({
      ...(np as NurseProfile),
      nurseId,
      avg_rating: avgRating,
      review_count: reviewData?.length ?? 0,
      direct_cancel_count: directCancelCount,
    })
  }

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    setUserId(userData.user.id)

    const { data: facility } = await supabase
      .from('facilities')
      .select('facility_name')
      .eq('id', userData.user.id)
      .single()
    if (facility) setFacilityName(facility.facility_name)

    const { data: jobData } = await supabase
      .from('jobs')
      .select(`*, applications (id, nurse_id, status)`)
      .eq('facility_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (jobData) {
      setJobs(jobData)
      const nurseIds = [...new Set(jobData.flatMap((j: any) => j.applications.map((a: any) => a.nurse_id)))]
      if (nurseIds.length > 0) {
        const { data: profiles } = await supabase
          .from('nurse_profiles').select('id, name').in('id', nurseIds)
        if (profiles) {
          const nameMap: { [key: string]: string } = {}
          profiles.forEach((p: any) => { nameMap[p.id] = p.name })
          setNurseNames(nameMap)
        }
      }
    }

    const { data: reviewData } = await supabase
      .from('reviews').select('nurse_id, job_id').eq('facility_id', userData.user.id)
    if (reviewData) setReviews(reviewData)

    setLoading(false)
  }

  const closeJob = async (jobId: string) => {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId)
    fetchData()
  }

  const acceptNurse = async (applicationId: string, nurseId: string, jobId: string) => {
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', applicationId)

    await fetch('/api/notify-accepted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nurseId, jobId, facilityId: userId }),
    })

    const { data: jobData } = await supabase.from('jobs').select('required_count, applications(id, status, nurse_id)').eq('id', jobId).single()
    if (jobData) {
      const acceptedCount = (jobData.applications as any[]).filter((a: any) => a.id === applicationId || a.status === 'accepted').length
      if (acceptedCount >= jobData.required_count) {
        await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId)
        const pendingNurseIds = (jobData.applications as any[])
          .filter((a: any) => a.status === 'pending' && a.id !== applicationId)
          .map((a: any) => a.nurse_id)
        if (pendingNurseIds.length > 0) {
          await fetch('/api/notify-rejected', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nurseIds: pendingNurseIds, facilityName, jobId }),
          })
        }
      }
    }

    fetchData()
  }

  const submitReview = async () => {
    if (!reviewModal || !userId || rating === 0) return
    setSubmitting(true)

    await supabase.from('reviews').insert({
      job_id: reviewModal.jobId,
      facility_id: userId,
      nurse_id: reviewModal.nurseId,
      rating,
      comment,
    })

    const { data: application } = await supabase
      .from('applications').select('id')
      .eq('job_id', reviewModal.jobId).eq('nurse_id', reviewModal.nurseId).single()

    if (application) {
      const stars = '⭐'.repeat(rating)
      const message = `${stars} 評価が届きました！\n評価：${rating} / 5${comment ? `\nコメント：${comment}` : ''}`
      await supabase.from('messages').insert({
        application_id: application.id, sender_id: userId, body: message,
      })
    }
    await fetch('/api/notify-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nurseId: reviewModal.nurseId, rating, comment, facilityName }) })
    setReviewModal(null)
    setRating(0)
    setComment('')
    setSubmitting(false)
    fetchData()
  }

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applications?.length || 0), 0)
  const openJobs = jobs.filter(j => j.status === 'open')

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>

      {/* 求人編集モーダル */}
      {editJobModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>求人を編集</h2>
              <button onClick={() => setEditJobModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>勤務日</label>
              <input type='date' value={editJobForm.work_date} onChange={e => setEditJobForm(f => ({ ...f, work_date: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>開始時間</label>
                <input type='time' value={editJobForm.time_from} onChange={e => setEditJobForm(f => ({ ...f, time_from: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>終了時間</label>
                <input type='time' value={editJobForm.time_to} onChange={e => setEditJobForm(f => ({ ...f, time_to: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>日給（円）</label>
              <input type='number' value={editJobForm.wage_amount} onChange={e => setEditJobForm(f => ({ ...f, wage_amount: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>勤務地</label>
              <input type='text' value={editJobForm.address} onChange={e => setEditJobForm(f => ({ ...f, address: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>施設種別</label>
              <select value={editJobForm.facility_type} onChange={e => setEditJobForm(f => ({ ...f, facility_type: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' as const }}>
                <option value=''>選択してください</option>
                <option>病院</option><option>クリニック</option><option>介護老人保健施設</option>
                <option>訪問看護</option><option>デイサービス</option><option>訪問入浴</option>
                <option>グループホーム</option><option>特別養護老人ホーム</option><option>有料老人ホーム</option>
                <option>障害者施設</option><option>保育園</option><option>その他</option>
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>業務内容</label>
              <textarea value={editJobForm.description} onChange={e => setEditJobForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', height: '100px', resize: 'vertical', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditJobModal(null)}
                style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748B' }}>
                キャンセル
              </button>
              <button onClick={async () => {
                setSavingJob(true)
                const { error } = await supabase.from('jobs').update({
                  work_date: editJobForm.work_date,
                  time_from: editJobForm.time_from,
                  time_to: editJobForm.time_to,
                  wage_amount: parseInt(editJobForm.wage_amount),
                  address: editJobForm.address,
                  facility_type: editJobForm.facility_type,
                  description: editJobForm.description,
                }).eq('id', editJobModal.id)
                setSavingJob(false)
                if (!error) { setEditJobModal(null); fetchData() }
                else alert('保存に失敗しました: ' + error.message)
              }} disabled={savingJob}
                style={{ flex: 2, padding: '10px', background: savingJob ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                {savingJob ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通報モーダル */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>⚠️ 通報する</h2>
              <button onClick={() => { setReportModal(null); setReportReason(''); setReportDetail('') }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>{reportModal.nurseName} さんを通報します</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>通報理由 *</label>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' as const }}>
                <option value=''>選択してください</option>
                <option value='無断欠勤'>無断欠勤</option>
                <option value='虚偽情報'>虚偽情報</option>
                <option value='不適切な言動'>不適切な言動</option>
                <option value='その他'>その他</option>
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>詳細</label>
              <textarea value={reportDetail} onChange={e => setReportDetail(e.target.value)}
                placeholder='詳しい状況を記入してください'
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', height: '100px', resize: 'vertical', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setReportModal(null); setReportReason(''); setReportDetail('') }}
                style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748B' }}>
                キャンセル
              </button>
              <button onClick={async () => {
                if (!reportReason) { alert('通報理由を選択してください'); return }
                setReporting(true)
                await supabase.from('reports').insert({
                  facility_id: userId,
                  nurse_id: reportModal.nurseId,
                  reason: reportReason,
                  detail: reportDetail,
                })
                setReporting(false)
                setReportModal(null)
                setReportReason('')
                setReportDetail('')
                alert('通報を受け付けました。運営が確認します。')
              }} disabled={!reportReason || reporting}
                style={{ flex: 2, padding: '10px', background: !reportReason || reporting ? '#ccc' : '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: !reportReason || reporting ? 'not-allowed' : 'pointer' }}>
                {reporting ? '送信中...' : '通報する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 看護師プロフィールモーダル */}
      {profileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>看護師プロフィール</h2>
              <button onClick={() => setProfileModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: 'linear-gradient(135deg, #E07070, #C0727A)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                {profileModal.name?.charAt(0) ?? '?'}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{profileModal.name ?? '未設定'}</div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  {profileModal.license === 'rn' ? '正看護師' : '准看護師'}
                  {profileModal.age ? ` · ${profileModal.age}歳` : ''}
                  {profileModal.gender ? ` · ${profileModal.gender}` : ''}
                </div>
              </div>
            </div>

            <div style={{ background: '#FBF7F7', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  ['経験年数', profileModal.experience_years ? `${profileModal.experience_years}年` : '未設定'],
                  ['活動エリア', profileModal.areas?.join('・') || '未設定'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {profileModal.skills?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>スキル・経験</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {profileModal.skills.map(s => (
                    <span key={s} style={{ background: '#FDF0F0', color: '#C45A5A', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const cancel = profileModal.direct_cancel_count ?? 0
              const rating = profileModal.avg_rating ?? 0
              const reviews = profileModal.review_count ?? 0
              let rank = { label: '🔰 ブロンズ', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' }
              if (cancel >= 2) rank = { label: '⚠️ 要注意', bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' }
              else if (cancel === 0 && rating >= 4.0 && reviews >= 3) rank = { label: '🏅 ゴールド', bg: 'linear-gradient(135deg, #FEF9C3, #FDE68A)', color: '#92400E', border: '#F59E0B' }
              else if (cancel <= 1 && rating >= 3.0) rank = { label: '⭐ シルバー', bg: '#F1F5F9', color: '#475569', border: '#94A3B8' }
              return (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: rank.bg, border: `1.5px solid ${rank.border}`, borderRadius: '20px', padding: '6px 16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: rank.color }}>信頼ランク：{rank.label}</span>
                  </div>
                </div>
              )
            })()}
            {(!profileModal.direct_cancel_count || profileModal.direct_cancel_count === 0) && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', border: '1.5px solid #34D399', borderRadius: '20px', padding: '6px 16px' }}>
                  <span style={{ fontSize: '14px' }}>✅</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#065F46' }}>直前キャンセルなし</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#065F46' }}>
                  {profileModal.avg_rating ? `⭐ ${profileModal.avg_rating}` : '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  平均評価（{profileModal.review_count}件）
                </div>
              </div>
              <div style={{ background: profileModal.direct_cancel_count && profileModal.direct_cancel_count > 0 ? '#FEF2F2' : '#F0FDF4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: profileModal.direct_cancel_count && profileModal.direct_cancel_count > 0 ? '#991B1B' : '#065F46' }}>
                  {profileModal.direct_cancel_count ?? 0}回
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>直前キャンセル履歴</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => {
                const name = profileModal.name ?? '不明'
                const nurseId = profileModal.nurseId ?? ''
                setProfileModal(null)
                setReportModal({ nurseId, nurseName: name })
              }} style={{ flex: 1, padding: '12px', background: 'none', border: '1.5px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                ⚠️ 通報
              </button>
              <button onClick={() => setProfileModal(null)} style={{ flex: 2, padding: '12px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 評価モーダル */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>看護師を評価する</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>{reviewModal.nurseName}</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} onClick={() => setRating(s)} style={{ fontSize: '36px', cursor: 'pointer', opacity: s <= rating ? 1 : 0.3 }}>⭐</span>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="コメント（任意）"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', height: '80px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setReviewModal(null); setRating(0); setComment('') }}
                style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748B' }}>
                キャンセル
              </button>
              <button onClick={submitReview} disabled={rating === 0 || submitting}
                style={{ flex: 1, padding: '10px', background: rating === 0 ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: rating === 0 ? 'not-allowed' : 'pointer' }}>
                {submitting ? '送信中...' : '評価する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>施設ダッシュボード</h1>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{facilityName}</div>
        </div>
        <button onClick={() => router.push('/post-job')} style={{ padding: '10px 20px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          ＋ 新規求人を投稿
        </button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #6B2D2D, #C0727A)', borderRadius: '12px', padding: '20px', marginBottom: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ background: '#10B981', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>掲載中</span>
          <button onClick={handleSubscribe} style={{ padding: '8px 16px', background: '#fff', color: '#C45A5A', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            💳 プランを購入
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          ['掲載中の求人', openJobs.length, '📋'],
          ['総応募者数', totalApplicants, '👩‍⚕️'],
          ['総求人数', jobs.length, '✅'],
        ].map(([l, v, ic]) => (
          <div key={String(l)} style={{ background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #EDE0E0' }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{ic}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#E07070' }}>{v}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '15px' }}>掲載中の求人</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>読み込み中...</div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', border: '1px solid #EDE0E0', color: '#64748B' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>まだ求人がありません</div>
          <button onClick={() => router.push('/post-job')} style={{ padding: '10px 24px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
            最初の求人を投稿する
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #EDE0E0' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: job.applications?.length > 0 ? '12px' : '0' }}>
                <button onClick={() => handleDeleteJob(job.id)} style={{ marginLeft: 'auto', padding: '4px 10px', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', color: '#ef4444', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                  削除
                </button>
                <button onClick={() => {
                  setEditJobModal(job)
                  setEditJobForm({
                    work_date: job.work_date,
                    time_from: job.time_from,
                    time_to: job.time_to,
                    wage_amount: String(job.wage_amount),
                    address: (job as any).address ?? '',
                    facility_type: job.facility_type,
                    description: (job as any).description ?? '',
                  })
                }} style={{ padding: '4px 10px', background: 'none', border: '1px solid #93C5FD', borderRadius: '6px', color: '#3B82F6', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                  編集
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '3px' }}>{job.work_date} · {job.time_from}〜{job.time_to}</div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>日給 ¥{job.wage_amount?.toLocaleString()} · {job.facility_type}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ background: job.status === 'open' ? '#D1FAE5' : '#F1F5F9', color: job.status === 'open' ? '#065F46' : '#64748B', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {job.status === 'open' ? '掲載中' : '終了'}
                  </span>
                  <span style={{ background: '#FDF0F0', color: '#C45A5A', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                    応募 {job.applications?.length || 0}名
                  </span>
                  {job.status === 'open' && (
                    <>
                      <button onClick={() => closeJob(job.id)} style={{ padding: '6px 14px', background: 'none', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#64748B' }}>
                        終了する
                      </button>
                      <button onClick={() => handleRenotify(job)} disabled={renotifying === job.id}
                        style={{ padding: '6px 14px', background: renotifying === job.id ? '#ccc' : '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '8px', fontSize: '13px', cursor: renotifying === job.id ? 'not-allowed' : 'pointer', color: '#C2410C', fontWeight: '600' }}>
                        {renotifying === job.id ? '送信中...' : '📢 再募集通知'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {job.applications?.length > 0 && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>応募した看護師</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {job.applications.map(app => {
                      const nurseName = nurseNames[app.nurse_id] || '読み込み中'
                      const alreadyReviewed = reviews.some(r => r.nurse_id === app.nurse_id && r.job_id === job.id)
                      const isAccepted = app.status === 'accepted'

                      return (
                        <div key={app.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button onClick={() => handleViewProfile(app.nurse_id)}
                            style={{ padding: '6px 14px', background: '#F1F5F9', color: '#1A2235', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            👤 {nurseName}
                          </button>
                          {!isAccepted && (
                            <button onClick={() => acceptNurse(app.id, app.nurse_id, job.id)}
                              style={{ padding: '6px 14px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                              ✅ 採用する
                            </button>
                          )}
                          {isAccepted && (
                            <a href={`/chat/${app.id}`} style={{ padding: '6px 14px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                              💬 チャット
                            </a>
                          )}
                          {isAccepted && !alreadyReviewed && (
                            <button onClick={() => setReviewModal({ jobId: job.id, nurseId: app.nurse_id, nurseName })}
                              style={{ padding: '6px 14px', background: '#FDF0F0', color: '#C45A5A', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                              ⭐ 評価する
                            </button>
                          )}
                          {isAccepted && alreadyReviewed && (
                            <span style={{ padding: '6px 14px', background: '#F1F5F9', color: '#64748B', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                              ⭐ 評価済み
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
